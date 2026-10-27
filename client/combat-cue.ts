import {actorDisplayName} from '../shared/visual-identity.js';
import type {Actor,AnimationCue} from '../shared/types.js';

/** What one revealed playback beat did to the scene. Derived from saved frames; never a new outcome. */
export interface WorldCue {key:string;actorId:string;kind?:AnimationCue;changes:{actorId:string;delta:number}[];missTargetId?:string;}

export function cueFor(key:string,actorId:string,kind:AnimationCue|undefined,text:string,before:Actor[],after:Actor[]):WorldCue{
 const changes=after.flatMap(a=>{const old=before.find(b=>b.id===a.id);return old&&old.hp!==a.hp?[{actorId:a.id,delta:a.hp-old.hp}]:[];});
 // Both rule sets phrase a miss as "<attacker> attacks <target>[ with <attack>]: miss"; other phrasing shows no miss marker.
 const named=/attacks (.+?):\s*miss\b/i.exec(text)?.[1]?.trim().toLowerCase();
 const enemies=after.filter(a=>a.side==='enemy'),names=after.filter(a=>a.id!==actorId).map(a=>({id:a.id,name:actorDisplayName(a,enemies).toLowerCase()}));
 const missTargetId=named?names.filter(n=>named===n.name||named.startsWith(n.name+' with ')).sort((x,y)=>y.name.length-x.name.length)[0]?.id:undefined;
 return {key,actorId,kind,changes,missTargetId};
}
