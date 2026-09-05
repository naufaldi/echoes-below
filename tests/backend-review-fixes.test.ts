import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSave,
  applyAction,
  legalActions,
  publicSave,
} from "../server/game.js";
import { Storage } from "../server/storage.js";
import { OpenAIProvider } from "../server/ai.js";
import { buildApp } from "../server/app.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
const hero = {
  name: "Ash",
  classId: "guardian" as const,
  backgroundId: "envoy" as const,
  appearanceId: "moss" as const,
};
const mid = (sides: number) => (sides === 20 ? 15 : Math.ceil(sides / 2));
test("conversation follow-up remembers both sides only for the same save and speaker", async () => {
  const db = new Storage(":memory:");
  const s = createSave(hero);
  db.put(s);
  const other = createSave(hero);
  db.put(other);
  const fetchBefore = globalThis.fetch;
  const sent: string[] = [];
  globalThis.fetch = async (_url, init) => {
    sent.push(String(init?.body));
    return Response.json({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                text: "I remember the amber kite.",
                factIds: [],
              }),
            },
          ],
        },
      ],
      usage: { input_tokens: 10, output_tokens: 10 },
    });
  };
  try {
    await new OpenAIProvider(db, "fake").dialogue(
      s,
      "mira",
      "My childhood nickname was amber kite",
    );
    await new OpenAIProvider(db, "fake").dialogue(
      s,
      "mira",
      "What was my nickname?",
    );
    assert.ok(sent[1]!.includes("My childhood nickname was amber kite"));
    assert.ok(sent[1]!.includes("I remember the amber kite."));
    await new OpenAIProvider(db, "fake").dialogue(s, "oren", "Hello");
    assert.ok(!sent[2]!.includes("amber kite"));
    await new OpenAIProvider(db, "fake").dialogue(other, "mira", "Hello");
    assert.ok(!sent[3]!.includes("amber kite"));
  } finally {
    globalThis.fetch = fetchBefore;
    db.close();
  }
});
test("companions can regroup for retreat after moving into melee", () => {
  let s = createSave(hero);
  for (const id of ["enter", "ledge", "fight"]) s = applyAction(s, id, mid);
  s = applyAction(s, "end_turn", () => 1);
  assert.ok(s.party[2]!.position[1] > -2);
  assert.ok(!legalActions(s).some((x) => x.id === "retreat"));
  s = applyAction(s, "regroup", () => 1);
  s = applyAction(s, "end_turn", () => 1);
  assert.ok(legalActions(s).some((x) => x.id === "retreat"));
  s = applyAction(s, "retreat", () => 1);
  assert.equal(s.sceneId, "hall");
  assert.equal(s.mode, "explore");
});
test("downed hero cannot pick, persuade, distract or negotiate but companions can heal and lead travel", () => {
  for (const sceneId of ["cookfire", "prison", "bell"] as const) {
    const s = createSave(hero);
    s.sceneId = sceneId;
    s.party[0]!.hp = 0;
    s.flags.tracks = true;
    s.flags.rescued = sceneId === "bell";
    s.flags.sealKnowledge = true;
    const ids = legalActions(s).map((a) => a.id);
    for (const id of ["pick", "persuade", "distract", "negotiate"]) {
      assert.ok(!ids.includes(id), `${sceneId} offered ${id}`);
      assert.throws(() =>
        applyAction(s, id, () => {
          throw Error("Must not roll");
        }),
      );
    }
    assert.ok(ids.some((id) => id.startsWith("campheal:oren:hero")));
  }
});
test("targeted exploration actions move the party without crossing the unresolved plate and transitions reset entry", () => {
  let s = createSave(hero);
  const initial = s.party.map((a) => a.position);
  s = applyAction(s, "tracks:hero", mid);
  assert.notDeepEqual(
    s.party.map((a) => a.position),
    initial,
  );
  assert.equal(publicSave(s).party[0]!.position[0], -2);
  s = applyAction(s, "enter", mid);
  assert.deepEqual(
    s.party.map((a) => a.position),
    initial,
  );
  s = applyAction(s, "chain:hero", mid);
  assert.ok(s.party.every((a) => a.position[1] <= -1.2));
  assert.ok(s.party.every((a) => Math.abs(a.position[0]) <= 3));
  s = applyAction(s, "inspect:hero", mid);
  s = applyAction(s, "disarm:hero", () => 1);
  assert.equal(s.party[0]!.hp, 23);
  assert.ok(s.party.every((a) => a.position[1] <= -1.2));
});
test("configured positive usage limits are enforced and exposed", () => {
  const oldHour = process.env.AI_HOURLY_LIMIT_USD,
    oldCampaign = process.env.AI_CAMPAIGN_LIMIT_USD;
  try {
    process.env.AI_HOURLY_LIMIT_USD = "0.1";
    process.env.AI_CAMPAIGN_LIMIT_USD = "0.5";
    const db = new Storage(":memory:");
    const s = createSave(hero);
    db.put(s);
    assert.deepEqual(db.usage(s.id).limits, { hourUsd: 0.1, campaignUsd: 0.5 });
    db.reserve(s.id, 0.09, "test");
    assert.throws(() => db.reserve(s.id, 0.02, "test"), /spending limit/);
    db.close();
    process.env.AI_HOURLY_LIMIT_USD = "-2";
    process.env.AI_CAMPAIGN_LIMIT_USD = "NaN";
    const fallback = new Storage(":memory:");
    assert.deepEqual(fallback.limits, { hourUsd: 2, campaignUsd: 25 });
    fallback.close();
  } finally {
    if (oldHour === undefined) delete process.env.AI_HOURLY_LIMIT_USD;
    else process.env.AI_HOURLY_LIMIT_USD = oldHour;
    if (oldCampaign === undefined) delete process.env.AI_CAMPAIGN_LIMIT_USD;
    else process.env.AI_CAMPAIGN_LIMIT_USD = oldCampaign;
  }
});
test("journal history survives restart, includes both sides, and restores older reply-only records honestly", async () => {
  const dir = mkdtempSync(join(tmpdir(), "echoes-dialogue-"));
  const database = join(dir, "save.sqlite");
  const db = new Storage(database);
  const s = createSave(hero);
  db.put(s);
  const reply = {
    id: randomUUID(),
    speaker: "mira" as const,
    text: "I remember the amber kite.",
    source: "ai" as const,
    createdAt: new Date().toISOString(),
  };
  db.dialogue(reply, s.id, "My nickname is amber kite");
  const legacy = {
    ...reply,
    id: randomUUID(),
    speaker: "oren",
    text: "An older saved reply.",
  };
  db.db
    .prepare("INSERT INTO dialogues VALUES(?,?,?)")
    .run(legacy.id, s.id, JSON.stringify(legacy));
  db.close();
  const app = await buildApp({ database, ai: false });
  try {
    const result = await app.inject({ url: `/api/saves/${s.id}/dialogues` });
    assert.equal(result.statusCode, 200);
    const history = result.json().history;
    assert.equal(history.length, 2);
    assert.equal(history[0].playerText, "My nickname is amber kite");
    assert.equal(history[0].replyText, reply.text);
    assert.equal(history[0].speaker, "mira");
    assert.equal(history[1].playerText, "");
    assert.equal(history[1].replyText, legacy.text);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("party defeat from an exploration trap is explicit and health never becomes negative", () => {
  let s = createSave(hero);
  s = applyAction(s, "enter", mid);
  s.party[0]!.hp = 1;
  s.party[1]!.hp = 0;
  s.party[2]!.hp = 0;
  s = applyAction(s, "quick", () => 6);
  assert.equal(s.mode, "defeat");
  assert.equal(s.sceneId,"hall");
  assert.ok(s.party.every((a) => a.hp === 0));
  assert.deepEqual(legalActions(s), []);
});
