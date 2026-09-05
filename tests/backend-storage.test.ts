import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Storage } from "../server/storage.js";
import { createSave } from "../server/game.js";
import { buildApp } from "../server/app.js";
import type { AIProvider } from "../server/ai.js";
const hero = {
  name: "Ash",
  classId: "guardian" as const,
  backgroundId: "envoy" as const,
  appearanceId: "moss" as const,
};
test("restart preserves outcome and duplicate command; checkpoint restore creates an independent branch", async () => {
  const dir = await mkdtemp(join(tmpdir(), "echoes-test-"));
  const database = join(dir, "save.sqlite");
  let app = await buildApp({
    database,
    ai: false,
    dice: (s) => Math.min(s, 15),
  });
  let token = (await app.inject({ url: "/api/session" })).json().csrfToken;
  const post = (url: string, payload: object) =>
    app.inject({
      method: "POST",
      url,
      headers: { "x-csrf-token": token },
      payload,
    });
  const initial = (await post("/api/saves", hero)).json();
  const body = {
    commandId: randomUUID(),
    expectedRevision: 0,
    actionId: "tracks:hero",
  };
  const result = (await post(`/api/saves/${initial.id}/actions`, body)).json();
  await app.close();
  app = await buildApp({
    database,
    ai: false,
    dice: () => {
      throw Error("Retry must not roll");
    },
  });
  token = (await app.inject({ url: "/api/session" })).json().csrfToken;
  assert.deepEqual(
    (await post(`/api/saves/${initial.id}/actions`, body)).json(),
    result,
  );
  const branch = (
    await post(
      `/api/saves/${initial.id}/checkpoints/${initial.checkpoints[0].id}/restore`,
      {},
    )
  ).json();
  assert.notEqual(branch.id, initial.id);
  assert.equal(branch.revision, 0);
  assert.equal(branch.facts.length, 0);
  assert.equal(
    (await app.inject({ url: `/api/saves/${initial.id}` })).json().revision,
    1,
  );
  await app.close();
  await rm(dir, { recursive: true, force: true });
});
test("reservations enforce hourly and campaign caps and survive checkpoint branching", () => {
  const storage = new Storage(":memory:");
  const s = createSave(hero);
  storage.checkpoint(s, "Start");
  storage.put(s);
  const reservation = storage.reserve(s.id, 1.9, "test");
  assert.throws(() => storage.reserve(s.id, 0.11, "test"), /spending limit/);
  storage.settle(reservation, 0.1);
  assert.equal(storage.usage(s.id).campaignUsd, 0.1);
  storage.db.prepare("UPDATE usage SET created_ms=0,cost=24.99").run();
  assert.throws(() => storage.reserve(s.id, 0.02, "test"), /spending limit/);
  const branch = storage.restore(s.id, s.checkpointIds[0]!.id);
  assert.equal(storage.usage(branch.id).campaignUsd, 24.99);
  assert.throws(
    () => storage.reserve(branch.id, 0.02, "test"),
    /spending limit/,
  );
  storage.close();
});
test("same in-flight command shares AI work, stale AI work cannot overwrite newer state", async () => {
  let release!: () => void;
  let plansCalls = 0;
  const barrier = new Promise<void>((resolve) => (release = resolve));
  const ai = {
    configured: true,
    plans: async () => {
      plansCalls++;
      await barrier;
      return { mira: "guard", oren: "guard" };
    },
  } as unknown as AIProvider;
  const app = await buildApp({
    database: ":memory:",
    ai,
    dice: (s) => Math.min(s, 15),
  });
  const token = (await app.inject({ url: "/api/session" })).json().csrfToken;
  const post = (url: string, payload: object) =>
    app.inject({
      method: "POST",
      url,
      headers: { "x-csrf-token": token },
      payload,
    });
  let s = (await post("/api/saves", hero)).json();
  for (const actionId of ["enter", "ledge", "fight"])
    s = (
      await post(`/api/saves/${s.id}/actions`, {
        commandId: randomUUID(),
        expectedRevision: s.revision,
        actionId,
      })
    ).json();
  const body = {
    commandId: randomUUID(),
    expectedRevision: s.revision,
    actionId: "end_turn",
  };
  const url = `/api/saves/${s.id}/actions`;
  const first = post(url, body);
  const second = post(url, body);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(plansCalls, 1);
  const changed = await post(url, {
    commandId: randomUUID(),
    expectedRevision: s.revision,
    actionId: "guard",
  });
  assert.equal(changed.statusCode, 200);
  release();
  assert.equal((await first).statusCode, 409);
  assert.equal((await second).statusCode, 409);
  assert.equal(
    (await app.inject({ url: `/api/saves/${s.id}` })).json().revision,
    s.revision + 1,
  );
  await app.close();
});
test("preview rolls no dice and fails cleanly when another action advances the revision", async () => {
  let rolls = 0;
  const app = await buildApp({
    database: ":memory:",
    ai: false,
    dice: () => {
      rolls++;
      return 10;
    },
  });
  const token = (await app.inject({ url: "/api/session" })).json().csrfToken;
  const post = (url: string, payload: object) =>
    app.inject({
      method: "POST",
      url,
      headers: { "x-csrf-token": token },
      payload,
    });
  const s = (await post("/api/saves", hero)).json();
  const p = (
    await post("/api/actions/preview", {
      saveId: s.id,
      expectedRevision: 0,
      actionId: "tracks:hero",
    })
  ).json();
  assert.equal(rolls, 0);
  await post(`/api/saves/${s.id}/actions`, {
    commandId: randomUUID(),
    expectedRevision: 0,
    actionId: "enter",
  });
  const result = await post("/api/actions/commit", {
    commandId: randomUUID(),
    previewId: p.previewId,
  });
  assert.equal(result.statusCode, 409);
  assert.equal(rolls, 0);
  await app.close();
});
test("production static assets and API routes coexist without exposing parent files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "echoes-static-"));
  await writeFile(join(dir, "index.html"), "<main>Echoes Below</main>");
  const app = await buildApp({
    database: ":memory:",
    ai: false,
    staticRoot: dir,
  });
  assert.equal((await app.inject({ url: "/" })).statusCode, 200);
  assert.equal((await app.inject({ url: "/api/health" })).json().ok, true);
  assert.equal((await app.inject({ url: "/api/unknown" })).statusCode, 404);
  const traversal = await app.inject({ url: "/%2e%2e/.env" });
  assert.equal(traversal.body.includes("OPENAI_API_KEY"), false);
  assert.equal(
    (
      await app.inject({
        url: "/api/session",
        headers: { host: "evil.example" },
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (
      await app.inject({
        url: "/api/session",
        headers: { origin: "https://evil.example" },
      })
    ).statusCode,
    403,
  );
  await app.close();
  await rm(dir, { recursive: true, force: true });
});
