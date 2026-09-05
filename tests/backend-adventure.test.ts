import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyAction,
  createSave,
  legalActions,
  publicSave,
} from "../server/game.js";
import type { ClassId, BackgroundId } from "../shared/types.js";
const mid = (sides: number) => (sides === 20 ? 15 : Math.ceil(sides / 2));
test("all twelve class/background combinations retain documented statistics", () => {
  for (const classId of ["guardian", "scout", "adept", "cleric"] as ClassId[])
    for (const backgroundId of [
      "delver",
      "envoy",
      "survivor",
    ] as BackgroundId[]) {
      const s = createSave({
        name: "Ash",
        classId,
        backgroundId,
        appearanceId: "ember",
      });
      const h = s.party[0]!;
      assert.equal(h.hp, { guardian: 24, scout: 18, adept: 16, cleric:20 }[classId]);
      assert.equal(h.backgroundId, backgroundId);
      assert.equal(h.potions, 2);
      assert.equal(s.party[1]!.classId, "scout");
      assert.equal(s.party[2]!.classId, "guardian");
    }
});
test("failed trap disarm rolls once, consumes plate and raises a single boss reinforcement", () => {
  let s = createSave({
    name: "Ash",
    classId: "scout",
    backgroundId: "survivor",
    appearanceId: "moss",
  });
  s = applyAction(s, "enter", mid);
  s = applyAction(s, "inspect:hero", mid);
  s = applyAction(s, "disarm:hero", () => 1);
  assert.equal(s.party[0]!.hp, 17);
  assert.equal(s.flags.trapSpent, true);
  assert.equal(s.flags.alarm, true);
  assert.equal(
    legalActions(s).some((a) => a.id.startsWith("disarm")),
    false,
  );
  s = applyAction(s, "quick", mid);
  assert.equal(s.party[0]!.hp, 17);
  s = applyAction(s, "offer", mid);
  s = applyAction(s, "prison", mid);
  s = applyAction(s, "force", mid);
  s = applyAction(s, "bell", mid);
  s = applyAction(s, "fight", mid);
  assert.equal(s.enemies.length, 3);
  assert.equal(s.enemies.filter((e) => e.id === "sentry-2").length, 1);
});
test("every class can finish the combat path with autonomous companions", () => {
  for (const classId of ["guardian", "scout", "adept", "cleric"] as ClassId[]) {
    let s = createSave({
      name: "Ash",
      classId,
      backgroundId: "delver",
      appearanceId: "moon",
    });
    for (const a of ["enter", "ledge", "fight"]) s = applyAction(s, a, mid);
    function fight() {
      for (let turn = 0; s.mode === "combat" && turn < 100; turn++) {
        const actions = legalActions(s);
        const action =
          actions.find((a) => a.id.startsWith("attack:")) ??
          actions.find(
            (a) => a.id.startsWith("move:") && a.id !== "move:exit",
          ) ??
          actions.find((a) => a.id === "end_turn") ??
          actions.find((a) => a.id === "continue");
        assert.ok(action, "Battle must offer a legal action");
        s = applyAction(s, action.id, mid);
      }
      assert.notEqual(s.mode, "combat");
      assert.notEqual(
        s.mode,
        "defeat",
        `${classId} should survive the fixed encounter`,
      );
    }
    fight();
    for (const a of ["prison", "unlock", "ledger", "bell", "fight"])
      s = applyAction(s, a, mid);
    fight();
    assert.equal(s.sceneId, "aftermath");
    s = applyAction(s, "secure", mid);
    assert.equal(s.mode, "complete");
    assert.equal(s.inventory.seal, true);
  }
});
test("public save excludes private flags and future secrets", () => {
  const s = createSave({
    name: "Ash",
    classId: "guardian",
    backgroundId: "envoy",
    appearanceId: "moss",
  });
  const p = JSON.stringify(publicSave(s));
  assert.equal(p.includes("sealKnowledge"), false);
  assert.equal(p.includes("resonance seal suppresses"), false);
  assert.equal(p.includes("checkpointIds"), false);
});
test("invalid actions never mutate the input save or consume dice", () => {
  const s = createSave({
    name: "Ash",
    classId: "guardian",
    backgroundId: "envoy",
    appearanceId: "moss",
  });
  const before = structuredClone(s);
  let rolls = 0;
  assert.throws(() =>
    applyAction(s, "attack:vark", () => {
      rolls++;
      return 1;
    }),
  );
  assert.deepEqual(s, before);
  assert.equal(rolls, 0);
});
