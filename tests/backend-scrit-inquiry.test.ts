import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
function setup(){let s=createSave({name:'Inquiry QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});s.sceneId='cookfire';return applyAction(s,'scrit-talk',()=>1);}
test('Scrit reveals ward knowledge only after the two grounded opening questions',()=>{
 let s=setup();assert.ok(!legalActions(s).some(a=>a.id==='scrit:ward'));
 s=applyAction(s,'scrit:supplies',()=>1);s=applyAction(s,'scrit:captive',()=>1);
 assert.ok(legalActions(s).some(a=>a.id==='scrit:ward'));
 s=applyAction(s,'scrit:ward',()=>1);assert.equal(s.flags.sealKnowledge,true);assert.equal(s.flags.passage,undefined);
 assert.ok(s.facts.some(f=>f.id==='seal-purpose'));assert.equal(s.logs.at(-1)!.speaker,'scrit');
 assert.throws(()=>applyAction(s,'scrit:ward',()=>1));assert.equal(s.xp,setup().xp);
});
test('calming guards costs exactly one additional ration and removes the boss reinforcement',()=>{
 let s=setup();s.flags.alarm=true;s=applyAction(s,'scrit:captive',()=>1);
 assert.ok(!legalActions(s).some(a=>a.id==='scrit:standdown'));
 s=applyAction(s,'offer',()=>1);const rations=s.party.reduce((n,a)=>n+a.rations,0);
 s=applyAction(s,'scrit:standdown',()=>1);assert.equal(s.flags.alarm,false);assert.equal(s.party.reduce((n,a)=>n+a.rations,0),rations-1);
 s=JSON.parse(JSON.stringify(s));assert.throws(()=>applyAction(s,'scrit:standdown',()=>1));
 s.sceneId='bell';s=applyAction(s,'fight',()=>1);assert.equal(s.enemies.length,2);
});
test('unavailable and hostile conversations never spend supplies or change knowledge',()=>{
 for(const mode of ['combat','defeat'] as const){const s=setup();s.mode=mode;assert.throws(()=>applyAction(s,'scrit:captive',()=>1));}
 const s=setup();s.flags.fed=true;s.flags.alarm=true;s.flags['scrit:captive']=true;for(const a of s.party)a.rations=0;
 assert.throws(()=>applyAction(s,'scrit:standdown',()=>1));assert.equal(s.flags.alarm,true);
 s.flags.guardsDefeated=true;assert.ok(!legalActions(s).some(a=>a.id.startsWith('scrit:')));
});

test('Scrit acknowledges the transferred key and a later alarm can summon the scout again',()=>{
 let s=setup();s=applyAction(s,'offer',()=>1);s=applyAction(s,'scrit:captive',()=>1);
 assert.match(s.logs.at(-1)!.text,/key now in your keeping/);
 s.flags.alarm=true;s=applyAction(s,'scrit:standdown',()=>1);s.flags.alarm=true;
 s.sceneId='bell';s=applyAction(s,'fight',()=>1);assert.equal(s.enemies.length,3);
});

function arrival(){const s=createSave({name:'Peaceful QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});s.sceneId='cookfire';return s;}
test('feeding before introductions preserves Scrit conversation and cannot repeat rewards',()=>{
 let s=applyAction(arrival(),'offer',()=>1);const xp=s.xp,rations=s.party.reduce((n,a)=>n+a.rations,0);
 assert.ok(legalActions(s).some(a=>a.id==='scrit-talk'));
 s=applyAction(JSON.parse(JSON.stringify(s)),'scrit-talk',()=>1);
 assert.doesNotMatch(s.logs.at(-1)!.text,/spare a ration/);
 s=applyAction(s,'scrit:captive',()=>1);
 assert.ok(legalActions(s).some(a=>a.id==='prison'));
 assert.throws(()=>applyAction(s,'offer',()=>1));assert.equal(s.xp,xp);
 assert.equal(s.party.reduce((n,a)=>n+a.rations,0),rations);
});
test('failed distraction followed by peace keeps inquiry and alarm reconciliation available',()=>{
 let s=arrival();s=applyAction(s,'distract',()=>1);assert.equal(s.flags.passage,undefined);
 s=applyAction(s,'offer',()=>1);s=applyAction(s,'scrit-talk',()=>1);
 s=applyAction(s,'scrit:captive',()=>1);s=applyAction(s,'scrit:standdown',()=>1);
 assert.equal(s.flags.alarm,false);
});
test('persuaded guards allow a later gift without narrating a second key',()=>{
 let s=arrival();s.flags.tracks=true;s=applyAction(s,'persuade',()=>20);
 s=applyAction(s,'scrit-talk',()=>1);s=applyAction(s,'scrit:captive',()=>1);
 assert.doesNotMatch(s.logs.at(-1)!.text,/accepting your food/);
 s=applyAction(s,'offer',()=>1);assert.doesNotMatch(s.logs.at(-1)!.text,/offers a key/);
 assert.throws(()=>applyAction(s,'offer',()=>1));
});
test('successful distraction and legacy distracted saves do not reopen the camp conversation',()=>{
 let s=applyAction(setup(),'distract',()=>20);
 const legacy=structuredClone(s);delete legacy.flags.guardsDistracted;
 for(const save of [s,legacy]){
  assert.ok(!legalActions(save).some(a=>a.id==='offer'||a.id==='scrit-talk'||a.id.startsWith('scrit:')));
  assert.ok(legalActions(save).some(a=>a.id==='prison'));
 }
 const oldPeace=setup();oldPeace.flags.distractTried=true;oldPeace.flags.passage=true;oldPeace.inventory.guardKey=true;
 assert.ok(legalActions(oldPeace).some(a=>a.id==='scrit:captive'));
});

test('peaceful cookfire labels and objective reflect the accepted meal',()=>{
 const s=applyAction(arrival(),'offer',()=>1),view=publicSave(s);
 assert.equal(view.scene.entities.find(e=>e.id==='scrit')!.name,'Scrit, camp cook');
 assert.match(view.scene.description,/shared meal/);assert.doesNotMatch(view.scene.objective,/Get past/);
 assert.equal(publicSave(arrival()).scene.entities.find(e=>e.id==='scrit')!.name,'Scrit, hungry cook');
});
