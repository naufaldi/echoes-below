import {FORK_ROOMS,type BarkBeat,type BarkMember} from '../shared/companion-barks.js';
import type {Actor,PublicSave} from '../shared/types.js';
import {playbackSteps} from './playback-steps.js';

const members=(actors:Actor[]):BarkMember[]=>actors.filter(a=>a.side==='party').map(({id,hp,maxHp})=>({id,hp,maxHp}));
/**
 * One committed turn as bark beats: one per playback step (as TurnPlayback shows them), so `step` matches its step index.
 * Fight won and fork entry come from the before/after pair, because the engine records no frame for either: a won fight
 * joins the last step, and a fork arrival joins the last step only when that step already stands in the new room.
 * Otherwise it is a settled beat (`step: null`) shown once playback ends.
 */
export function barkBeats(before:PublicSave,after:PublicSave):BarkBeat[]{
 const frames=after.presentation??[];
 const beats:BarkBeat[]=playbackSteps(frames).map(([index,last],step)=>{
  const previous=index?frames[index-1]:null,room=previous?.sceneId??before.scene.id,group=frames.slice(index,last+1);
  return {key:frames[index]!.log.id,step,before:members(previous?.party??before.party),after:members(frames[last]!.party),sameRoom:group.every(f=>f.sceneId===room),checks:group.flatMap(f=>f.log.check?[f.log.check]:[])};
 });
 const won=before.mode==='combat'&&after.mode==='explore'&&before.scene.id===after.scene.id&&after.enemies.length>0&&after.enemies.every(e=>e.hp<=0);
 const fork=after.scene.id!==before.scene.id&&FORK_ROOMS.includes(after.scene.id)?after.scene.id:undefined;
 const tail=beats.at(-1);
 if(won&&tail)tail.won=true;
 if(fork&&tail&&frames.at(-1)!.sceneId===fork)tail.fork=fork;
 else if(fork||won&&!tail){const party=members(after.party);beats.push({key:after.logs.at(-1)?.id??`${after.id}:${after.scene.id}`,step:null,before:party,after:party,sameRoom:false,checks:[],...(fork?{fork}:{}),...(won&&!tail?{won}:{})});}
 return beats;
}
