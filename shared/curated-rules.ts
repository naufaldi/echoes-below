/** Core mechanics adapted from SRD 5.2.1; attribution: public/SRD-NOTICE.txt.
 * This module is isolated from echo-v1. Combat/content adapters must opt in explicitly.
 */
export const CURATED_RULES_VERSION='curated-srd-5.2.1-v1' as const;
export const CURATED_CLASS_IDS={guardian:'fighter',scout:'rogue',adept:'wizard',cleric:'cleric'} as const;
export type CuratedClass='fighter'|'rogue'|'wizard'|'cleric';
export type Ability='strength'|'dexterity'|'constitution'|'intelligence'|'wisdom'|'charisma';
export type Abilities=Record<Ability,number>;
export interface ClassResources {secondWind:number;actionSurge:number;attacksRemaining:number;sneakUsed:boolean;slotSpent:boolean;disengaged:boolean}
export interface CuratedCharacter {
 features?:ClassResources;
 rulesVersion:typeof CURATED_RULES_VERSION;classId:CuratedClass;level:number;abilities:Abilities;proficiency:number;
 hp:number;maxHp:number;temporaryHp:number;armorClass:number;hitDice:number;hitDie:number;speedFeet:number;
 slots:number[];maxSlots:number[];concentration:string|null;dead:boolean;
 death:{successes:number;failures:number;stable:boolean};
 economy:{action:boolean;bonus:boolean;reaction:boolean;movementFeet:number};
}
function integer(value:number,min:number,max=Number.MAX_SAFE_INTEGER){if(!Number.isSafeInteger(value)||value<min||value>max)throw new Error(`Value must be an integer between ${min} and ${max}.`);}
export function modifier(score:number){integer(score,1,30);return Math.floor((score-10)/2);}
export function proficiency(level:number){integer(level,1,8);return level<5?2:3;}
const PRESETS:Record<CuratedClass,{abilities:Abilities;hitDie:number;armorClass:number}>={
 fighter:{abilities:{strength:16,dexterity:12,constitution:14,intelligence:10,wisdom:13,charisma:10},hitDie:10,armorClass:18},
 rogue:{abilities:{strength:10,dexterity:16,constitution:14,intelligence:13,wisdom:12,charisma:10},hitDie:8,armorClass:14},
 wizard:{abilities:{strength:8,dexterity:14,constitution:14,intelligence:16,wisdom:12,charisma:10},hitDie:6,armorClass:12},
 cleric:{abilities:{strength:14,dexterity:12,constitution:14,intelligence:10,wisdom:16,charisma:8},hitDie:8,armorClass:18},
};
const SLOTS=[[2,0,0,0],[3,0,0,0],[4,2,0,0],[4,3,0,0],[4,3,2,0],[4,3,3,0],[4,3,3,1],[4,3,3,2]];
const cleanDeath=()=>({successes:0,failures:0,stable:false});
export function makeCharacter(classId:CuratedClass,level=1):CuratedCharacter{
 integer(level,1,8);const preset=PRESETS[classId];if(!preset)throw new Error('Unknown class.');
 const con=modifier(preset.abilities.constitution);const hp=preset.hitDie+con+(level-1)*(preset.hitDie/2+1+con);const slots=classId==='wizard'||classId==='cleric'?[...SLOTS[level-1]]:[];
 return{rulesVersion:CURATED_RULES_VERSION,classId,level,abilities:{...preset.abilities},proficiency:proficiency(level),hp,maxHp:hp,temporaryHp:0,armorClass:preset.armorClass,hitDice:level,hitDie:preset.hitDie,speedFeet:30,slots,maxSlots:[...slots],concentration:null,dead:false,death:cleanDeath(),economy:{action:true,bonus:true,reaction:true,movementFeet:30}};
}
export function spendAction(original:CuratedCharacter,resource:'action'|'bonus'|'reaction'){
 if(original.dead||original.hp<=0||!original.economy[resource])throw new Error('That action is unavailable.');
 return{...original,economy:{...original.economy,[resource]:false}};
}
export function spendSlot(original:CuratedCharacter,rank:number){integer(rank,1,4);if(original.dead||original.hp<=0||!(original.slots[rank-1]>0))throw new Error('No spell slot is available at that rank.');const slots=[...original.slots];slots[rank-1]--;return{...original,slots};}
export function concentrationDC(damage:number){integer(damage,0);return Math.min(30,Math.max(10,Math.floor(damage/2)));}
export function takeDamage(original:CuratedCharacter,damage:number,critical=false,constitutionSaveTotal?:number):CuratedCharacter{
 integer(damage,0);if(constitutionSaveTotal!==undefined&&!Number.isFinite(constitutionSaveTotal))throw new Error('Invalid saving throw.');
 const a={...original,death:{...original.death}};if(a.dead||damage===0)return a;
 const absorbed=Math.min(damage,a.temporaryHp);a.temporaryHp-=absorbed;const remaining=damage-absorbed;
 if(a.hp===0&&damage>0){a.death.stable=false;a.death.failures+=critical?2:1;if(remaining>=a.maxHp||a.death.failures>=3)a.dead=true;}
 else if(remaining>=a.hp){if(remaining-a.hp>=a.maxHp)a.dead=true;a.death=cleanDeath();}
 a.hp=Math.max(0,a.hp-remaining);
 if(a.hp===0||a.dead)a.concentration=null;
 else if(a.concentration){if(constitutionSaveTotal===undefined)throw new Error('A concentration saving throw is required.');if(constitutionSaveTotal<concentrationDC(damage))a.concentration=null;}
 return a;
}
export function heal(original:CuratedCharacter,amount:number):CuratedCharacter{integer(amount,0);if(original.dead||amount===0)return{...original};return{...original,hp:Math.min(original.maxHp,original.hp+amount),death:cleanDeath()};}
export function deathSave(original:CuratedCharacter,d20:number):CuratedCharacter{
 integer(d20,1,20);if(original.dead||original.hp>0||original.death.stable)return{...original};
 if(d20===20)return heal(original,1);const a={...original,death:{...original.death}};
 if(d20===1)a.death.failures+=2;else if(d20>=10)a.death.successes++;else a.death.failures++;
 if(a.death.failures>=3)a.dead=true;else if(a.death.successes>=3)a.death={successes:0,failures:0,stable:true};return a;
}

export function classResources(c:CuratedCharacter):ClassResources{return c.features??{secondWind:c.classId==='fighter'?(c.level>=4?3:2):0,actionSurge:c.classId==='fighter'&&c.level>=2?1:0,attacksRemaining:0,sneakUsed:false,slotSpent:false,disengaged:false};}
export function resetTurnResources(c:CuratedCharacter){c.features={...classResources(c),attacksRemaining:0,sneakUsed:false,slotSpent:false,disengaged:false};}
export function restoreClassResources(c:CuratedCharacter){c.features=undefined;c.features={...classResources(c)};}
