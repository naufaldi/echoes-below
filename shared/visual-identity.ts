import type {Actor} from './types.js';
export const CHARACTER_ASSETS={knight:'/assets/kaykit/Knight.glb',mage:'/assets/kaykit/Mage.glb',rogue:'/assets/kaykit/Rogue_Hooded.glb',imp:'/assets/quaternius/Imp-animated.glb',skeleton:'/assets/expansion/skeleton.glb',slime:'/assets/expansion/slime.glb',spider:'/assets/expansion/Spider_yRYJiAJyiM.glb'} as const;
export type CharacterAssetId=keyof typeof CHARACTER_ASSETS;
const byClass:Record<Actor['classId'],CharacterAssetId>={guardian:'knight',cleric:'knight',adept:'mage',scout:'rogue',goblin:'imp',vark:'imp',skeleton:'skeleton',slime:'slime',spider:'spider'};
export function characterAsset(actor:Pick<Actor,'classId'|'assetId'>){return CHARACTER_ASSETS[actor.assetId??byClass[actor.classId]];}
export function actorDisplayName(actor:Pick<Actor,'id'|'name'|'side'>,peers:Pick<Actor,'id'|'name'|'side'>[]=[]){const same=peers.filter(a=>a.side==='enemy'&&a.name===actor.name).sort((a,b)=>a.id.localeCompare(b.id));return actor.side==='enemy'&&same.length>1?`${actor.name} ${same.findIndex(a=>a.id===actor.id)+1}`:actor.name;}
export function actorHeight(actor:Pick<Actor,'classId'|'raceId'>){return actor.classId==='goblin'?1.25:actor.classId==='vark'?2.35:actor.classId==='slime'?.85:actor.classId==='spider'?.7:actor.raceId==='halfling'?1.15:actor.raceId==='dwarf'?1.45:actor.raceId==='elf'?2.05:1.8;}
