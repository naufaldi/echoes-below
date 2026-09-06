import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
for(const [classId,action,cue] of [['adept','tactical:missile:guard-1','spell'],['cleric','tactical:attack:guard-1','spell'],['cleric','tactical:bless','spell'],['scout','tactical:attack:guard-1','ranged'],['guardian','tactical:dodge','dodge']] as const)test(`${action} records ${cue} independently from narration`,()=>{
 let s=createSave({name:'Animation QA',classId,backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});
 s.sceneId='cookfire';s=applyAction(s,'fight',n=>n);s.turn!.actorId='hero';s.turnIndex=s.turn!.order.indexOf('hero');
 s=applyAction(s,action,()=>1);
 assert.equal(s.logs.at(-1)!.animation,cue);
 assert.equal(s.presentation!.at(-1)!.log.animation,cue);
 assert.equal(JSON.parse(JSON.stringify(s)).logs.at(-1).animation,cue);
});

import {readFileSync} from 'node:fs';
import {CHARACTER_ASSETS} from '../shared/visual-identity.js';
import {animationClip,latestAnimation} from '../shared/animation-cues.js';
import type {GameLog,Actor} from '../shared/types.js';
test('all shipped models resolve exact locomotion, death and attack clips',()=>{
 for(const [assetId,path] of Object.entries(CHARACTER_ASSETS)){
  const bytes=readFileSync(new URL('../public'+path,import.meta.url));const size=bytes.readUInt32LE(12);const doc=JSON.parse(bytes.subarray(20,20+size).toString());const names=doc.animations.map((a:{name:string})=>a.name);
  const actor={classId:'guardian',assetId} as Actor;
  for(const state of ['idle','walk','death','melee','ranged'] as const)assert.ok(animationClip(names,state,actor),`${assetId} ${state}`);
  if(['knight','mage','rogue'].includes(assetId)){
   assert.equal(animationClip(names,'spell',actor),'Spellcast_Shoot');
   assert.equal(animationClip(names,'ranged',actor),'1H_Ranged_Shoot');
  }
 }
});
test('AI prose cannot trigger a visual action and structured cues survive wording changes',()=>{
 const actor={id:'hero',classId:'scout'} as const;
 const log={id:'old',speaker:'hero',source:'rules',text:'Hero attacks a guard.'} as GameLog;
 assert.deepEqual(latestAnimation([log],actor),{id:'old',cue:'ranged'});
 const cue={...log,id:'cue',animation:'spell' as const,text:'A silver light.'};
 assert.deepEqual(latestAnimation([log,cue,{...cue,id:'ai',source:'ai'}],actor),{id:'cue',cue:'spell'});
 assert.equal(latestAnimation([{...log,speaker:'mira'}],actor),undefined);
});
