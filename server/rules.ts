import { randomInt } from "node:crypto";
import type { Actor, Roll } from "../shared/types.js";
export type Dice = (sides: number) => number;
export const cryptoDice: Dice = (sides) => randomInt(1, sides + 1);
export function rollD20(
  dice: Dice,
  modifier: number,
  purpose: string,
  advantage = false,
  disadvantage = false,
): Roll {
  const values = [dice(20)];
  if (advantage !== disadvantage) values.push(dice(20));
  const kept =
    advantage && !disadvantage
      ? Math.max(...values)
      : disadvantage && !advantage
        ? Math.min(...values)
        : values[0]!;
  return { sides: 20, values, kept, modifier, total: kept + modifier, purpose };
}
export function damageRoll(
  dice: Dice,
  sides: number,
  modifier: number,
  purpose: string,
  critical = false,
): Roll {
  const values = [dice(sides)];
  if (critical) values.push(dice(sides));
  const kept = values.reduce((a, b) => a + b, 0);
  return {
    sides,
    values,
    kept,
    modifier,
    total: Math.max(0, kept + modifier),
    purpose,
  };
}
export function attackRoll(
  dice: Dice,
  modifier: number,
  defense: number,
  sides: number,
  advantage = false,
  damageModifier = modifier,
) {
  const attack = rollD20(dice, modifier, "Attack", advantage);
  const hit =
    attack.kept === 20 || (attack.kept !== 1 && attack.total >= defense);
  const damage = hit
    ? damageRoll(dice, sides, damageModifier, "Damage", attack.kept === 20)
    : null;
  return {
    hit,
    damage: damage?.total ?? 0,
    rolls: damage ? [attack, damage] : [attack],
  };
}
export const distance = (a: Actor, b: Actor) =>
  Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1]);
