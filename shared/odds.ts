import type {PublicCheck} from './types.js';
/** Odds before committing (#61, ROADMAP D5): computed from public numbers only, the modifier and the DC, with advantage, help and a bonus die when they apply. */
export type OddsBand='Likely'|'Risky'|'Long shot';
export interface Odds {percent:number;band:OddsBand}
/** The band follows the rounded figure the player sees, so "Risky (70%)" can never appear. */
export const bandFor=(percent:number):OddsBand=>percent>=70?'Likely':percent>=35?'Risky':'Long shot';
/** Chance that d20 + modifier (+ bonus die) meets the DC. Checks have no natural rules; attacks (`critOn`) always hit at or above it and always miss on a natural 1. Advantage keeps the higher d20, disadvantage the lower; both cancel. */
export function successChance(c:Pick<PublicCheck,'dc'|'modifier'|'advantage'|'disadvantage'|'bonusDie'|'critOn'>):number{
 const bonuses=c.bonusDie?Array.from({length:c.bonusDie},(_,i)=>i+1):[0];
 const single=(bonus:number)=>{let faces=0;for(let n=1;n<=20;n++)if(c.critOn?n!==1&&(n>=c.critOn||n+(c.modifier??0)+bonus>=c.dc):n+(c.modifier??0)+bonus>=c.dc)faces++;return faces/20;};
 const keep=(p:number)=>!!c.advantage===!!c.disadvantage?p:c.advantage?1-(1-p)**2:p**2;
 return bonuses.reduce((sum,bonus)=>sum+keep(single(bonus)),0)/bonuses.length;
}
/** Null when the option does not advertise a modifier (an older save or an interpreted action): show the DC only. */
export function oddsFor(c:PublicCheck|undefined):Odds|null{
 if(!c||c.modifier===undefined)return null;const percent=Math.round(successChance(c)*100);return{percent,band:bandFor(percent)};
}
/** Signed modifier as the mechanics tag prints it: "+3", "−1", "+0". */
export const signed=(n:number)=>(n<0?'−':'+')+Math.abs(n);
