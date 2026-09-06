import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
function opening(){let s=createSave({name:'Parley QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});for(const id of ['enter','ledge','offer','prison','unlock','ledger','bell'])s=applyAction(s,id,n=>n);return s;}
test('Vark answers are once-only, saved, grounded and do not grant farming XP',()=>{
 let s=opening();const xp=s.xp,revision=s.revision;
 for(const id of ['parley:prisoner','parley:ward','parley:evidence'])s=applyAction(s,id,()=>{assert.fail('Conversation must not roll');});
 assert.equal(s.xp,xp);assert.equal(s.revision,revision+3);assert.equal(s.mode,'explore');
 s=JSON.parse(JSON.stringify(s));assert.equal(s.facts.filter(f=>f.id.startsWith('parley:')).length,3);
 assert.throws(()=>applyAction(s,'parley:evidence',()=>1));
 assert.equal(legalActions(s).find(a=>a.id==='negotiate')!.check!.dc,13);
});
test('prepared evidence changes the resolved roll threshold, not just its label',()=>{
 let s=opening();for(const id of ['parley:prisoner','parley:ward','parley:evidence'])s=applyAction(s,id,()=>1);
 s=applyAction(s,'negotiate',()=>13);assert.equal(s.sceneId,'aftermath');assert.equal(s.flags.negotiated,true);
 const unprepared=applyAction(opening(),'negotiate',()=>13);assert.equal(unprepared.mode,'combat');
});
test('missing proof cannot be invented through a parley request',()=>{
 const s=opening();s.flags.rescued=false;
 for(const id of ['parley:prisoner','parley:ward'])assert.ok(legalActions(s).some(a=>a.id===id));
 assert.throws(()=>applyAction(s,'parley:evidence',()=>1));
 assert.ok(!legalActions(s).some(a=>a.id==='negotiate'));
});
test('questions cannot run during combat, in another scene or for an unconscious hero',()=>{
 for(const change of [(s:ReturnType<typeof opening>)=>{s.mode='combat';},(s:ReturnType<typeof opening>)=>{s.sceneId='prison';},(s:ReturnType<typeof opening>)=>{s.party[0].hp=0;}]){const s=opening();change(s);assert.throws(()=>applyAction(s,'parley:ward',()=>1));}
 assert.throws(()=>applyAction(opening(),'parley:ward:extra',()=>1));
});
