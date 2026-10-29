import type {Actor} from './types.js';
export const companionAttackReach=(a:Pick<Actor,'classId'>)=>6+(a.classId==='scout'?8:1.5);
export const companionHealReach=7.5;
export function companionOptions(party:Actor[],enemies:Actor[]){const distance=(a:Actor,b:Actor)=>Math.hypot(a.position[0]-b.position[0],a.position[1]-b.position[1]);return Object.fromEntries(party.filter(a=>a.id!=='hero'&&a.hp>0).map(a=>{const attacks=enemies.filter(e=>e.hp>0&&distance(a,e)<=companionAttackReach(a)).map(e=>`attack:${e.id}`);const heals=a.classId==='guardian'&&a.focus>0?party.filter(e=>e.hp<e.maxHp/2&&distance(a,e)<=companionHealReach).map(e=>`heal:${e.id}`):[];return[a.id,[...attacks,...heals,...attacks.length?[]:['guard']]];}));}
