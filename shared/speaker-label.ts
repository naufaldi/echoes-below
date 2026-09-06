import type {Actor,GameLog} from './types.js';
import {actorDisplayName} from './visual-identity.js';
export function speakerLabel(entry:Pick<GameLog,'speaker'|'speakerName'|'source'>,party:Actor[],enemies:Actor[]=[]){
 if(entry.speakerName)return entry.speakerName;
 const actor=[...party,...enemies].find(a=>a.id===entry.speaker);if(actor)return actorDisplayName(actor,enemies);
 if(entry.speaker==='dm')return'Dungeon Master';
 if(entry.speaker==='scrit')return'Scrit';
 if(entry.speaker==='courier')return'Courier';
 if(entry.speaker==='vark')return'Commander Vark';
 if(/^sentry-\d+$/.test(entry.speaker))return'Goblin sentry';
 if(entry.speaker==='hero')return'You';
 if(entry.speaker==='mira')return'Mira';if(entry.speaker==='oren')return'Oren';
 return entry.source==='authored'?entry.speaker:'Creature';
}
