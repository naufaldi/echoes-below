import { test } from "node:test";
import assert from "node:assert/strict";
import { createSave, applyAction, log } from "../server/game.js";
import { Storage } from "../server/storage.js";
import { OpenAIProvider } from "../server/ai.js";
const mid = (sides: number) => (sides === 20 ? 15 : Math.ceil(sides / 2));
test("companion planning explains self-only Guard and prioritizes useful attacks, excluding repeated guards", async () => {
  let s = createSave({
    name: "Ash",
    classId: "guardian",
    backgroundId: "envoy",
    appearanceId: "moss",
  });
  for (const id of ["enter", "ledge", "fight"]) s = applyAction(s, id, mid);
  s.party[2]!.focus = 0;
  log(s, "Oren chooses to guard.", "oren", [], "ai");
  log(s, "Oren followed an AI-selected legal action.", "oren");
  log(s, "Oren chooses to guard.", "oren", [], "ai");
  log(s, "Oren followed an AI-selected legal action.", "oren");
  const db = new Storage(":memory:");
  db.put(s);
  const original = globalThis.fetch;
  const calls: any[] = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    const input = JSON.parse(body.input);
    calls.push({ body, input });
    return Response.json({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                actionId: input.legal.find((x: string) =>
                  x.startsWith("attack:"),
                ),
              }),
            },
          ],
        },
      ],
      usage: { input_tokens: 10, output_tokens: 10 },
    });
  };
  try {
    const plans = await new OpenAIProvider(db, "fake").plans(s);
    assert.ok(plans.oren!.startsWith("attack:"));
    const oren = calls.find((x) => x.input.actor.id === "oren");
    assert.ok(oren);
    assert.equal(oren.input.actor.focus, 0);
    assert.equal(oren.input.legal.includes("guard"), false);
    assert.equal(
      oren.input.legal.some((id: string) => id.startsWith("heal:")),
      false,
    );
    assert.equal(oren.input.consecutiveGuards, 2);
    assert.match(oren.body.instructions, /never protects.*allies/i);
    assert.match(oren.body.instructions, /attack/i);
    assert.match(oren.input.actionEffects.guard, /\+2 Defense/);
    assert.match(oren.input.actionEffects.attack, /6m/);
    const mira = calls.find((x) => x.input.actor.id === "mira");
    assert.ok(mira.input.legal.includes("guard"));
    assert.match(mira.body.instructions, /Mira.*attack/i);
  } finally {
    globalThis.fetch = original;
    db.close();
  }
});
test("a resolved attack resets the guard streak, while Guard stays available with no reachable enemy", async () => {
  let s = createSave({
    name: "Ash",
    classId: "guardian",
    backgroundId: "envoy",
    appearanceId: "moss",
  });
  for (const id of ["enter", "ledge", "fight"]) s = applyAction(s, id, mid);
  for (const actor of ["Mira", "Oren"])
    for (let i = 0; i < 3; i++)
      log(s, `${actor} chooses to guard.`, actor.toLowerCase(), [], "ai");
  log(s, "Oren attacks Goblin guard: miss.", "oren");
  const db = new Storage(":memory:");
  db.put(s);
  const original = globalThis.fetch;
  const calls: any[] = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body)),
      input = JSON.parse(body.input);
    calls.push(input);
    return Response.json({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({ actionId: input.legal[0] }),
            },
          ],
        },
      ],
      usage: { input_tokens: 10, output_tokens: 10 },
    });
  };
  try {
    const provider = new OpenAIProvider(db, "fake");
    await provider.plans(s);
    assert.ok(calls.find((x) => x.actor.id === "oren").legal.includes("guard"));
    assert.equal(calls.find((x) => x.actor.id === "oren").consecutiveGuards, 0);
    s.enemies.forEach((e) => (e.position = [100, 100]));
    calls.length = 0;
    await provider.plans(s);
    assert.ok(calls.find((x) => x.actor.id === "mira").legal.includes("guard"));
  } finally {
    globalThis.fetch = original;
    db.close();
  }
});
