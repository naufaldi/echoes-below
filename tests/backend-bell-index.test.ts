import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
const make=()=>{const s=createSave({name:'Index QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});s.sceneId='archive-3';return s;};
test('index clues, ordering, reload and final decision remain separate',()=>{
 let s=make();assert.ok(!legalActions(s).some(a=>a.id==='index:witness'));
 s=applyAction(s,'index:read',()=>1);s=applyAction(s,'index:witness',()=>1);s=JSON.parse(JSON.stringify(s));
 assert.deepEqual(publicSave(s).scene.bellIndex?.sequence,['witness']);
 assert.throws(()=>applyAction(s,'index:witness',()=>1));
 s=applyAction(s,'index:keeper',()=>1);s=applyAction(s,'index:vessel',()=>1);s=applyAction(s,'index:submit',()=>1);
 assert.equal(publicSave(s).scene.bellIndex?.solved,true);assert.equal(legalActions(s).find(a=>a.id==='exp_choice:0')?.check,undefined);assert.ok(!s.flags['archive-3:resolved']);
 s=applyAction(s,'exp_choice:0',()=>{assert.fail('Restored name requires no random check');return 1;});
 assert.equal(s.flags['archive-3:resolved'],true);assert.ok(s.facts.some(f=>f.id==='decision:archive-3'));
});
test('wrong order resets without damage or blocking alternate routes',()=>{
 let s=applyAction(make(),'index:read',()=>1);const hp=s.party.map(a=>a.hp);
 for(const part of ['vessel','keeper','witness'])s=applyAction(s,'index:'+part,()=>1);
 s=applyAction(s,'index:submit',()=>1);assert.deepEqual(publicSave(s).scene.bellIndex?.sequence,[]);assert.deepEqual(s.party.map(a=>a.hp),hp);
 assert.ok(legalActions(s).some(a=>a.id==='exp_choice:1'));assert.ok(legalActions(s).some(a=>a.id==='exp_fight'));
});
test('index controls reject combat, other scenes and completed decisions',()=>{
 for(const change of [(s:ReturnType<typeof make>)=>{s.mode='combat';},(s:ReturnType<typeof make>)=>{s.sceneId='archive-2';},(s:ReturnType<typeof make>)=>{s.flags['archive-3:resolved']=true;}]){const s=make();change(s);assert.throws(()=>applyAction(s,'index:read',()=>1));}
});
