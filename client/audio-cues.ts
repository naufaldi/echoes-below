import type {Actor,PublicSave} from '../shared/types.js';

/** Pure audio decisions, kept free of the DOM so they can be tested without a browser. */
export type Sfx='dice-shake'|'die-throw'|'hit'|'miss'|'footstep'|'door-open'|'ui-click';
export type MusicMode='silent'|'explore'|'combat'|'calm';
export interface AudioSettings{master:number;music:number;sfx:number;muted:boolean}
export const DEFAULT_AUDIO_SETTINGS:AudioSettings={master:.8,music:.5,sfx:.8,muted:false};
const unit=(value:unknown,fallback:number)=>typeof value==='number'&&Number.isFinite(value)?Math.min(1,Math.max(0,value)):fallback;
export function parseAudioSettings(raw:string|null):AudioSettings{
 let value:any={};try{value=raw?JSON.parse(raw):{};}catch{}
 const d=DEFAULT_AUDIO_SETTINGS;return{master:unit(value?.master,d.master),music:unit(value?.music,d.music),sfx:unit(value?.sfx,d.sfx),muted:value?.muted===true};
}
/** A revealed frame is a hit when anyone lost health; otherwise a miss when the log says so ("dismiss" is not a miss). */
export function outcomeCue(before:Pick<Actor,'id'|'hp'>[],after:Pick<Actor,'id'|'hp'>[],text:string):'hit'|'miss'|null{
 const hp=new Map(before.map(a=>[a.id,a.hp]));
 if(after.some(a=>a.hp<(hp.get(a.id)??a.hp)))return'hit';
 return /\bmiss(es|ed)?\b/i.test(text)?'miss':null;
}
export function musicModeFor(save:Pick<PublicSave,'mode'>|null):MusicMode{return !save?'silent':save.mode==='combat'?'combat':save.mode==='explore'?'explore':'calm';}
type Room=Pick<PublicSave,'id'|'scene'|'party'|'enemies'>;
/** Entering a room plays a door; within a room, an opened door or any actor that moved plays its cue. A different save plays nothing. */
export function sceneCues(previous:Room|null,next:Room|null):Sfx[]{
 if(!previous||!next||previous.id!==next.id)return[];
 if(previous.scene.id!==next.scene.id)return['door-open'];
 const cues:Sfx[]=[],doors=new Map(previous.scene.entities.map(e=>[e.id,e.open]));
 if(next.scene.entities.some(e=>e.kind==='door'&&e.open&&doors.has(e.id)&&!doors.get(e.id)))cues.push('door-open');
 const was=new Map([...previous.party,...previous.enemies].map(a=>[a.id,a]));
 if([...next.party,...next.enemies].some(a=>{const b=was.get(a.id);return !!b&&(b.position[0]!==a.position[0]||b.position[1]!==a.position[1]||(!!a.motion&&a.motion.id!==b.motion?.id));}))cues.push('footstep');
 return cues;
}
