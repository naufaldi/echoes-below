import type {Actor,Entity} from '../shared/types.js';
import {characterAsset} from '../shared/visual-identity.js';
/** Portrait rules from CHARACTERS.md §6: one rendered snapshot per look, with optional painted overrides for named characters. */
export const PORTRAIT_EXPRESSIONS=['neutral','smile','worried','angry','hurt'] as const;
export type PortraitExpression=typeof PORTRAIT_EXPRESSIONS[number];
export type PortraitSubject=Pick<Actor,'id'|'classId'|'appearanceId'>&Partial<Pick<Actor,'raceId'|'assetId'>>;
/** Everything that changes how the model looks, and nothing else: hp, name and position never trigger a new snapshot. */
export interface PortraitLook{asset:string;classId:Actor['classId'];raceId:string;appearanceId:string;assetId:string}
export function portraitLook(s:PortraitSubject):PortraitLook{return {asset:characterAsset(s),classId:s.classId,raceId:s.raceId??'human',appearanceId:s.appearanceId,assetId:s.assetId??''};}
export function portraitKey(look:PortraitLook,expression:PortraitExpression='neutral'){return [look.asset,look.classId,look.raceId,look.appearanceId,look.assetId,expression].join('|');}
/** Engine ids that are the same named character in §6.2. */
const CHARACTER_IDS:Record<string,string>={'index-librarian':'ilyra',apprentice:'ilyra'};
export const portraitCharacterId=(id:string)=>CHARACTER_IDS[id]??id;
export const overrideFile=(characterId:string,expression:PortraitExpression)=>`${characterId}-${expression}.png`;
/** A painted override replaces only that character and expression; a missing expression falls back to neutral, then to the render (null). The hero is customised by the player, so it always renders. */
export function resolveOverride(id:string,expression:PortraitExpression,files:ReadonlySet<string>|readonly string[]):string|null{
 const characterId=portraitCharacterId(id);if(characterId==='hero')return null;const has=(f:string)=>Array.isArray(files)?files.includes(f):(files as ReadonlySet<string>).has(f);
 for(const e of expression==='neutral'?['neutral' as const]:[expression,'neutral' as const]){const file=overrideFile(characterId,e);if(has(file))return '/assets/portraits/'+file;}
 return null;
}
/** Manifest entries name files relative to public/assets/portraits/. Anything malformed is ignored rather than probed. */
export function manifestFiles(manifest:unknown):Set<string>{const files=(manifest as {files?:unknown})?.files;return new Set(Array.isArray(files)?files.map(f=>typeof f==='string'?f:(f as {file?:unknown})?.file).filter((f):f is string=>typeof f==='string'&&/^[a-z0-9-]+-(neutral|smile|worried|angry|hurt)\.png$/.test(f)):[]);}
/** Dialogue clip that poses each expression (§4.4); other expressions fall back to the neutral snapshot when the model lacks their clip. Neutral uses Idle, not Talk: a looping Talk clip can start on any gesture, and the Imp's first Talk frame holds its mace over its face. */
const EXPRESSION_CLIPS:Record<PortraitExpression,string[]>={neutral:[],smile:['Victory','Nod'],worried:['Worried'],angry:['Shake'],hurt:['Hit']};
export function expressionClip(names:string[],expression:PortraitExpression):string|undefined{for(const c of EXPRESSION_CLIPS[expression]){const match=names.find(n=>n.split('|').some(part=>part.toLowerCase()===c.toLowerCase()));if(match)return match;}}
/** The look of whoever is speaking: a party member or enemy by id, otherwise a scene NPC with the same model rule the world uses. */
export function portraitSubjectFor(id:string,save:{party:Actor[];enemies:Actor[];scene:{entities:Entity[]}}):PortraitSubject|null{
 const actor=[...save.party,...save.enemies].find(a=>a.id===id);if(actor)return actor;
 const npc=save.scene.entities.find(e=>e.kind==='npc'&&e.id===id);return npc?{id:npc.id,classId:npcModelClass(npc),appearanceId:npc.appearanceId??'moss'}:null;
}
export function npcModelClass(e:Pick<Entity,'id'|'modelClassId'>):Actor['classId']{return e.modelClassId??(e.id==='courier'?'scout':e.id==='vark'?'vark':'goblin');}
