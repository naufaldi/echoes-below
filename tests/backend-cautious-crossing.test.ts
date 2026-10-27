import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
const high=(sides:number)=>sides===20?20:1,low=(sides:number)=>sides===20?1:3,noDice=()=>{throw Error('A marked plate must not roll');};
const RULES=[['echo',undefined],['tactical',CURATED_RULES_VERSION]] as const;
const hall=(rulesVersion?:string)=>applyAction(createSave({name:'Ash',classId:'guardian',backgroundId:'delver',appearanceId:'ember',...(rulesVersion?{rulesVersion}:{})} as Parameters<typeof createSave>[0]),'enter',high);
const assertSafeCrossing=(before:ReturnType<typeof hall>)=>{
 assert.ok(legalActions(before).some(a=>a.id==='cautious'));
 const s=applyAction(before,'cautious',noDice);
 assert.equal(s.sceneId,'cookfire');assert.equal(s.ticks,before.ticks+2);
 assert.deepEqual(s.party.map(a=>a.hp),before.party.map(a=>a.hp));
 assert.ok(!s.flags.alarm);assert.ok(!s.flags.trapSpent);
};
for(const [label,rulesVersion] of RULES){
 test(`${label}: crossing cautiously after inspecting the plate steps around it`,()=>{
  const s=applyAction(hall(rulesVersion),'inspect:hero',high);assert.equal(s.flags.plate,true);assertSafeCrossing(s);
 });
 test(`${label}: a cautious crossing that halts at the plate can then finish safely`,()=>{
  const s=applyAction(hall(rulesVersion),'cautious',high);assert.equal(s.sceneId,'hall');assert.equal(s.flags.plate,true);assertSafeCrossing(s);
 });
 test(`${label}: reading the keeper's plate or the chain diagram does not reveal the floor plate`,()=>{
  for(const step of ['counterweight:read','chain:hero']){
   const s=applyAction(applyAction(hall(rulesVersion),step,high),'cautious',low);
   assert.ok(!s.flags.plate);assert.equal(s.flags.trapSpent,true);assert.equal(s.flags.alarm,true);assert.equal(s.sceneId,'cookfire');
  }
 });
 test(`${label}: quick crossing still springs a marked plate`,()=>{
  const before=applyAction(hall(rulesVersion),'inspect:hero',high),s=applyAction(before,'quick',low);
  assert.equal(s.flags.trapSpent,true);assert.equal(s.flags.alarm,true);assert.ok(s.party[0].hp<before.party[0].hp);
 });
}
