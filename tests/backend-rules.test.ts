import { test } from "node:test";
import assert from "node:assert/strict";
import { rollD20, attackRoll } from "../server/rules.js";
test("advantage cancels disadvantage and equality succeeds", () => {
  const r = rollD20(() => 10, 3, "check", true, true);
  assert.equal(r.total, 13);
  assert.deepEqual(r.values, [10]);
});
test("critical doubles dice but not modifier and natural one misses", () => {
  const values = [20, 4, 5];
  const result = attackRoll(() => values.shift()!, 3, 30, 8);
  assert.equal(result.hit, true);
  assert.equal(result.damage, 12);
  assert.equal(attackRoll(() => 1, 30, 10, 8).hit, false);
});
