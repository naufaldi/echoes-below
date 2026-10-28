import {revealedScene} from './playback-scene.js';
import type {PublicSave,PresentationFrame} from '../shared/types.js';
type Turn=PublicSave['turn'];
/** A turn may only name someone who fights: the narrator's closing line (#94) carries no turn, and tactical controls need the actor's record. */
const combatant=(save:Pick<PublicSave,'tactical'|'party'|'enemies'>,id?:string)=>!!id&&[...save.party,...save.enemies].some(a=>a.id===id)&&(!save.tactical||!!save.tactical.actors[id]);
function turnFor(save:Pick<PublicSave,'tactical'|'party'|'enemies'>,turn:Turn|undefined,actorId?:string):Turn{
 if(!turn)return null;if(combatant(save,actorId))return {...turn,actorId:actorId!};return combatant(save,turn.actorId)?turn:null;
}
/** The visible save while a step's dice are in the air. Its frames are committed outcomes; nothing here rolls or writes game state. */
export function playbackStartSave(before:PublicSave,after:PublicSave,frames:PresentationFrame[],index:number):PublicSave{
 const frame=frames[index],previous=index?frames[index-1]:null,room=frame.sceneId===before.scene.id?before:after;
 const visible={...room,activeReaction:frame.log.actionKind==='reaction'?frame.actorId:undefined,mode:frame.mode??room.mode,actions:[],party:previous?.party??before.party,enemies:previous?.enemies.length?previous.enemies:frame.enemies,logs:before.logs};
 // A frame without a turn keeps none, unless a combatant speaks it (initiative is rolled before the first turn opens).
 const turn=frame.turn??(combatant(after,frame.actorId)?after.turn:null);
 return {...visible,turn:turnFor(visible,turn,frame.actorId)};
}
/** The visible save once a step (one frame, or a run of initiative rolls) has landed. */
export function playbackRevealSave(before:PublicSave,after:PublicSave,frames:PresentationFrame[],index:number,last:number):PublicSave{
 const start=playbackStartSave(before,after,frames,index),frame=frames[index],final=frames[last],group=frames.slice(index,last+1);
 const visible={...start,scene:revealedScene(before,after,final,last===frames.length-1),tactical:final.tactical??start.tactical,party:final.party,enemies:final.enemies,logs:[...before.logs,...group.map(f=>f.log)]};
 const turn=frame.turn??(combatant(after,frame.actorId)?after.turn:null);
 return {...visible,turn:turnFor(visible,turn,group.length>1?(final.turn??after.turn)?.actorId??final.actorId:final.actorId)};
}
