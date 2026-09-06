import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
function garden(){const s=createSave({name:'Garden QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});s.sceneId='archive-2';return s;}
const noDice=()=>{assert.fail('Prepared route should not roll');return 1;};
test('Ink Garden preparation requires witnessed clues and commits rescue separately',()=>{
 let s=garden();const xp=s.xp;assert.throws(()=>applyAction(s,'ink:sleeve',noDice));
 for(const id of ['ink:inspect','ink:ask','ink:sleeve','ink:wick'])s=applyAction(s,id,noDice);
 assert.equal(s.xp,xp);assert.equal(s.flags['archive-2:resolved'],undefined);assert.equal(publicSave(s).scene.inkGarden?.ready,true);
 s=JSON.parse(JSON.stringify(s));assert.equal(legalActions(s).find(a=>a.id==='exp_choice:0')!.check,undefined);
 s=applyAction(s,'exp_choice:0',noDice);assert.equal(s.flags['archive-2:choice:0'],true);
 assert.ok(!publicSave(s).scene.entities.some(e=>e.id==='ink-lantern'||e.id==='ink-apprentice'));assert.equal(publicSave(s).scene.inkGarden!.lanternTaken,true);
 assert.match(s.facts.find(f=>f.id==='decision:archive-2')!.text,/pages remain intact/);
 const earned=s.xp;assert.throws(()=>applyAction(s,'exp_choice:0',noDice));assert.equal(s.xp,earned);
});
test('preparation recovers a failed rushed attempt and keeps alternatives available beforehand',()=>{
 let s=garden();assert.ok(legalActions(s).some(a=>a.id==='exp_choice:1'));
 s=applyAction(s,'exp_choice:0',()=>1);assert.equal(s.flags['archive-2:tried'],true);
 for(const id of ['ink:ask','ink:inspect','ink:sleeve','ink:wick'])s=applyAction(s,id,noDice);
 s=applyAction(s,'exp_choice:0',noDice);assert.equal(s.flags['archive-2:resolved'],true);
 s.sceneId='archive-7';assert.ok(legalActions(s).some(a=>a.id==='exp_ally:apprentice-testimony'));
});
test('garden controls reject repeats, combat, completed rooms and legacy saves',()=>{
 let s=applyAction(garden(),'ink:ask',noDice);assert.throws(()=>applyAction(s,'ink:ask',noDice));
 for(const variant of [{...s,mode:'combat' as const},{...s,tactical:undefined},{...s,flags:{...s.flags,'archive-2:resolved':true}}])assert.throws(()=>applyAction(variant,'ink:inspect',noDice));
 assert.ok(publicSave(garden()).scene.entities.some(e=>e.id==='ink-apprentice'&&e.kind==='npc'));
});
