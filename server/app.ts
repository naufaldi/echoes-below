import {creation} from '../shared/character-creation.js';
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import {
  applyAction,
  createSave,
  GameError,
  legalActions,
  log,
  publicSave,
} from "./game.js";
import { cryptoDice, type Dice } from "./rules.js";
import { Storage } from "./storage.js";
import { OpenAIProvider, type AIProvider } from "./ai.js";
import type { Preview, PublicSave } from "../shared/types.js";
const id = z.string().uuid();
const actionSchema = z
  .object({
    companionPlans: z.record(z.string().max(40),z.string().max(100)).optional(),
    commandId: id,
    expectedRevision: z.number().int().min(0),
    actionId: z.string().min(1).max(100),
  })
  .strict();
const previewSchema = z.union([
  z
    .object({
      saveId: id,
      expectedRevision: z.number().int().min(0),
      actionId: z.string().max(100),
    })
    .strict(),
  z
    .object({
      saveId: id,
      expectedRevision: z.number().int().min(0),
      text: z.string().trim().min(1).max(1000),
    })
    .strict(),
]);
export async function buildApp(
  options: {
    database?: string;
    dice?: Dice;
    ai?: AIProvider | false;
    staticRoot?: string;
  } = {},
) {
  const app = Fastify({ logger: false, bodyLimit: 32000 });
  const storage = new Storage(
    options.database ?? resolve("data/echoes.sqlite"),
  );
  const dice = options.dice ?? cryptoDice;
  const ai =
    options.ai === false
      ? new OpenAIProvider(storage, "")
      : (options.ai ?? new OpenAIProvider(storage));
  function requireSponsored(req:{headers:Record<string,unknown>}){if(req.headers['x-echoes-ai-mode']!=='sponsored')throw new GameError(403,'AI_MODE','Choose sponsored AI explicitly before using the server’s AI allowance.');}
  const csrf = randomUUID();
  const inflight = new Map<
    string,
    { hash: string; promise: Promise<PublicSave> }
  >();
  app.addHook("onClose", async () => storage.close());
  app.addHook("onRequest", async (req, reply) => {
    const host = req.headers.host ?? "";
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host))
      return reply.code(403).send({
        error: "LOCAL_ONLY",
        message: "This game accepts local requests only.",
      });
    const origin = req.headers.origin;
    if (origin) {
      let u: URL;
      try {
        u = new URL(origin);
      } catch {
        return reply
          .code(403)
          .send({ error: "ORIGIN", message: "Invalid origin." });
      }
      if (
        !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname) ||
        u.protocol !== "http:"
      )
        return reply.code(403).send({
          error: "ORIGIN",
          message: "Only local browser origins are accepted.",
        });
    }
    if (req.method === "POST") {
      const value = req.headers["x-csrf-token"];
      if (
        typeof value !== "string" ||
        value.length !== csrf.length ||
        !timingSafeEqual(Buffer.from(value), Buffer.from(csrf))
      )
        return reply.code(403).send({
          error: "CSRF",
          message: "Refresh the local session and retry.",
        });
    }
  });
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof z.ZodError)
      return reply.code(400).send({
        error: "VALIDATION",
        message: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    if (error instanceof GameError)
      return reply
        .code(error.status)
        .send({ error: error.code, message: error.message });
    const status =
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 500;
    return reply.code(status).send({
      error: "SERVER_ERROR",
      message:
        status === 500
          ? "The operation could not be saved. Reload the last confirmed state before retrying."
          : "The request could not be accepted.",
    });
  });
  const saveId = (req: { params: unknown }) =>
    id.parse((req.params as { id: string }).id);
  const stale = (expected: number, actual: number) => {
    if (expected !== actual)
      throw new GameError(
        409,
        "STALE_REVISION",
        `This save is now revision ${actual}. Reload before choosing another action.`,
      );
  };
  async function execute(saveId: string, body: z.infer<typeof actionSchema>, allowAI=false) {
    const duplicate = storage.duplicate(body.commandId, saveId, body);
    if (duplicate) return duplicate;
    const hash = storage.hash({ saveId, ...body });
    const running = inflight.get(body.commandId);
    if (running) {
      if (running.hash !== hash)
        throw new GameError(
          409,
          "COMMAND_REUSED",
          "A different request is already using that command ID.",
        );
      return running.promise;
    }
    const promise = (async () => {
      const before = storage.read(saveId);
      stale(body.expectedRevision, before.revision);
      if (!legalActions(before).some((a) => a.id === body.actionId))
        throw new GameError(
          422,
          "ILLEGAL_ACTION",
          "That action is no longer available.",
        );
      let plans: Record<string, string> | undefined = body.companionPlans;
      let aiFailed = false;
      if (
        allowAI && !plans && ai.configured &&
        before.mode === "combat" &&
        !before.flags.retreatRequested &&
        ["end_turn", "continue", "tactical:auto"].includes(body.actionId)
      ) {
        try {
          plans = await ai.plans(before);
        } catch {
          aiFailed = true;
        }
      }
      return storage.transaction(() => {
        const prior = storage.duplicate(body.commandId, saveId, body);
        if (prior) return prior;
        const current = storage.read(saveId);
        stale(body.expectedRevision, current.revision);
        if (plans) current.plans = plans;
        if (aiFailed)
          log(
            current,
            "Companion AI planning is unavailable. Companions use the displayed rules and deterministic protective tactics.",
          );
        const after = applyAction(current, body.actionId, dice);
        delete after.plans;
        if (after.sceneId !== current.sceneId && after.mode === "explore")
          storage.checkpoint(
            after,
            `Arrival: ${publicSave(after).scene.title}`,
          );
        const result = publicSave(after);
        storage.commit(body.commandId, after, body, result);
        return result;
      });
    })();
    inflight.set(body.commandId, { hash, promise });
    try {
      return await promise;
    } finally {
      inflight.delete(body.commandId);
    }
  }
  app.get("/api/health", async () => ({
    ok: true,
    aiConfigured: ai.configured,
  }));
  app.get("/api/session", async () => ({ csrfToken: csrf }));
  app.get("/api/saves", async () => ({ saves: storage.list() }));
  app.post("/api/saves", async (req) => {
    const input = creation.parse(req.body);
    return storage.transaction(() => {
      const s = createSave(input);
      storage.checkpoint(s, "Broken Approach camp");
      storage.put(s);
      return publicSave(s);
    });
  });
  app.get("/api/saves/:id", async (req) =>
    publicSave(storage.read(saveId(req))),
  );
  app.post("/api/saves/:id/actions", async (req) =>
    execute(saveId(req), actionSchema.parse(req.body),req.headers['x-echoes-ai-mode']==='sponsored'),
  );
  app.post("/api/actions/preview", async (req) => {
    const input = previewSchema.parse(req.body);
    const s = storage.read(input.saveId);
    stale(input.expectedRevision, s.revision);
    const actionId =
      "actionId" in input ? input.actionId : (requireSponsored(req), await ai.interpret(s, input.text));
    const current = storage.read(s.id);
    stale(s.revision, current.revision);
    const action = legalActions(current).find((a) => a.id === actionId);
    if (!action)
      throw new GameError(422, "ILLEGAL_ACTION", "That action is unavailable.");
    const p: Preview = {
      previewId: randomUUID(),
      saveId: s.id,
      revision: s.revision,
      action,
      expiresAt: new Date(Date.now() + 120000).toISOString(),
    };
    storage.addPreview(p);
    return p;
  });
  app.post("/api/actions/commit", async (req) => {
    const body = z
      .object({ previewId: id, commandId: id })
      .strict()
      .parse(req.body);
    const p = storage.preview(body.previewId);
    const request = {
      commandId: body.commandId,
      expectedRevision: p.revision,
      actionId: p.action.id,
    };
    const duplicate = storage.duplicate(body.commandId, p.saveId, request);
    if (duplicate) return duplicate;
    if (Date.parse(p.expiresAt) < Date.now())
      throw new GameError(
        409,
        "PREVIEW_EXPIRED",
        "That preview expired. Prepare the action again.",
      );
    return execute(p.saveId, request,req.headers['x-echoes-ai-mode']==='sponsored');
  });
  app.post("/api/saves/:id/dialogue", async (req) => {
    requireSponsored(req);
    const body = z
      .object({
        speaker: z.enum(["dm", "mira", "oren"]),
        text: z.string().trim().min(1).max(1000),
      })
      .strict()
      .parse(req.body);
    return ai.dialogue(storage.read(saveId(req)), body.speaker, body.text);
  });
  app.post('/api/saves/:id/dialogue/local',async(req)=>{
    const body=z.object({speaker:z.enum(['dm','mira','oren']),text:z.string().min(1).max(1000),reply:z.string().min(1).max(1200)}).strict().parse(req.body);
    const s=storage.read(saveId(req));
    const id=randomUUID(),createdAt=new Date().toISOString();
    storage.dialogue({id,speaker:body.speaker,text:body.reply,source:'ai',createdAt},s.id,body.text);
    return{id,speaker:body.speaker,text:body.reply,source:'ai',createdAt};
  });
  app.get("/api/saves/:id/dialogue", async (req) => {
    const query = z
      .object({ speaker: z.enum(["dm", "mira", "oren"]) })
      .strict()
      .parse(req.query);
    const s = storage.read(saveId(req));
    return { history: storage.conversation(s.id, query.speaker) };
  });
  app.get("/api/saves/:id/dialogues", async (req) => {
    const s = storage.read(saveId(req));
    return { history: storage.dialogueHistory(s.id) };
  });
  app.post("/api/narrations/:id/audio", async (req) => {
    requireSponsored(req);
    const audioId = saveId(req);
    z.object({})
      .strict()
      .parse(req.body ?? {});
    await ai.audio(audioId);
    return { url: `/api/audio/${audioId}` };
  });
  app.get("/api/audio/:id", async (req, reply) => {
    const audioId = saveId(req);
    const row = storage.db
      .prepare("SELECT bytes FROM audio WHERE id=?")
      .get(audioId);
    if (!row)
      throw new GameError(404, "NOT_FOUND", "Audio has not been generated.");
    return reply
      .type("audio/mpeg")
      .header("Cache-Control", "private, max-age=31536000, immutable")
      .send(Buffer.from(row.bytes as Uint8Array));
  });
  app.post("/api/transcriptions", { bodyLimit: 14500000 }, async (req) => {
    requireSponsored(req);
    const body = z
      .object({
        saveId: id,
        audioBase64: z
          .string()
          .min(4)
          .max(14000000)
          .regex(/^[A-Za-z0-9+/]*={0,2}$/),
        mimeType: z.enum(["audio/webm", "audio/mp4", "audio/wav", "audio/ogg"]),
        durationSeconds: z.number().positive().max(30),
      })
      .strict()
      .parse(req.body);
    const bytes = Buffer.from(body.audioBase64, "base64");
    if (bytes.length > 10000000)
      throw new GameError(
        400,
        "AUDIO_TOO_LARGE",
        "Recording is larger than 10MB.",
      );
    return {
      text: await ai.transcribe(
        body.saveId,
        bytes,
        body.mimeType,
        body.durationSeconds,
      ),
    };
  });
  app.get("/api/usage", async (req) => {
    const query = z.object({ saveId: id }).strict().parse(req.query);
    storage.read(query.saveId);
    return storage.usage(query.saveId);
  });
  app.post("/api/saves/:id/checkpoints/:checkpointId/restore", async (req) => {
    const params = z.object({ id, checkpointId: id }).parse(req.params);
    z.object({})
      .strict()
      .parse(req.body ?? {});
    return storage.restore(params.id, params.checkpointId);
  });
  const staticRoot = options.staticRoot ?? resolve("dist/client");
  if (existsSync(resolve(staticRoot, "index.html"))) {
    await app.register(fastifyStatic, {
      root: staticRoot,
      index: "index.html",
    });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api/"))
        return reply
          .code(404)
          .send({ error: "NOT_FOUND", message: "Endpoint not found." });
      return reply.sendFile("index.html");
    });
  }
  await app.ready();
  return app;
}
