import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave,type Save} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {playbackSteps} from '../client/playback-steps.js';
import {playbackStartSave,playbackRevealSave} from '../client/playback-save.js';
import type {ActionOption,PublicSave} from '../shared/types.js';

/** #94: the guards' fight ends on the narrator's line with no turn. Every save shown during playback must name only a combatant, or the tactical controls read a missing actor and the page goes blank. */
test('a Curated fight played back to its closing narration never names a non-combatant turn',()=>{
 let rng=733;const dice=(sides:number)=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return 1+Math.floor(rng/4294967296*sides);};
 let s:Save=createSave({name:'Playback audit',classId:'guardian',backgroundId:'envoy',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
 let closing=0,checked=0;
 const check=(save:PublicSave,where:string)=>{checked++;if(!save.turn)return;
  assert.ok(save.tactical?.actors[save.turn.actorId],`${where}: turn names ${save.turn.actorId}, who has no tactical record`);
  assert.ok([...save.party,...save.enemies].some(a=>a.id===save.turn!.actorId),`${where}: turn names ${save.turn.actorId}, who is not in the fight`);};
 const act=(id:string)=>{const before=publicSave(s);s=JSON.parse(JSON.stringify(applyAction(s,id,dice))) as Save;const after=publicSave(s),frames=after.presentation??[];
  for(const [index,last] of playbackSteps(frames)){check(playbackStartSave(before,after,frames,index),`${id} step ${index} start`);check(playbackRevealSave(before,after,frames,index,last),`${id} step ${index}-${last} reveal`);}
  closing+=frames.filter(f=>f.actorId==='dm'&&!f.turn&&f.tactical).length;};
 for(const id of ['enter','counterweight:read','counterweight:pawl','counterweight:weight','counterweight:pin','quick','fight'])act(id);
 assert.equal(s.mode,'combat');
 for(let step=0;step<400&&s.mode==='combat';step++){
  const options=legalActions(s),t=s.tactical!,foes=s.enemies.filter(e=>e.hp>0);
  let choice:ActionOption|undefined=options.find(a=>a.id==='tactical:auto')??options.find(a=>a.id==='tactical:death')??options.filter(a=>a.kind==='attack').sort((a,b)=>t.actors[a.targetId!].hp-t.actors[b.targetId!].hp)[0];
  if(!choice&&t.actors.hero.economy.action){const distance=(id:string)=>{const [x,y]=id.split(':')[2].split(',').map(Number);return Math.min(...foes.map(e=>Math.max(Math.abs(x-t.cells[e.id][0]),Math.abs(y-t.cells[e.id][1]))));};choice=options.filter(a=>a.kind==='move').sort((a,b)=>distance(a.id)-distance(b.id))[0];}
  choice??=options.find(a=>a.id==='tactical:end');
  assert.ok(choice,`no legal combat progress at step ${step}`);act(choice.id);
 }
 assert.equal(s.mode,'explore','the guards fall and the party walks on');
 assert.ok(closing>0,'the fight closes on a narrator line with no turn, the frame that blanked the page');
 assert.ok(checked>10);
});
