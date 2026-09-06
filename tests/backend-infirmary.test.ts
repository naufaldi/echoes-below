import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
const make=()=>{const s=createSave({name:'Infirmary QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});s.sceneId='archive-4';return s;};
const ids=(s:ReturnType<typeof make>)=>legalActions(s).map(a=>a.id);
const noDice=()=>{assert.fail('Prepared rescue must not roll');return 1;};
test('infirmary preparation survives reload and makes the rescue safe without resolving it early',()=>{
 let s=make();assert.ok(ids(s).includes('infirmary:inspect'));assert.ok(!ids(s).includes('infirmary:drain'));
 const xp=s.xp,hp=s.party.map(a=>a.hp),potions=s.party.map(a=>a.potions);
 for(const step of ['inspect','signal','brace','drain']){s=applyAction(s,'infirmary:'+step,noDice);s=JSON.parse(JSON.stringify(s));}
 assert.equal(s.xp,xp);assert.deepEqual(s.party.map(a=>a.hp),hp);assert.deepEqual(s.party.map(a=>a.potions),potions);
 assert.ok(!s.flags['archive-4:resolved']);assert.equal(legalActions(s).find(a=>a.id==='exp_choice:0')?.check,undefined);
 assert.ok(!ids(s).includes('exp_choice:1'),'already drained water cannot be sold as an unperformed alternative');
 s=applyAction(s,'exp_choice:0',noDice);assert.equal(s.flags['archive-4:choice:0'],true);
 assert.match(s.facts.find(f=>f.id==='decision:archive-4')!.text,/medicine.*dry/i);
 assert.ok(!ids(s).some(id=>id.startsWith('infirmary:')));
 assert.throws(()=>applyAction(s,'exp_choice:0',noDice));
 assert.match(publicSave(s).scene.description,/medicine.*dry/i);
});
test('a failed rushed rescue still permits preparation and never repeats its damage',()=>{
 let s=applyAction(make(),'exp_choice:0',()=>1);assert.ok(s.flags['archive-4:tried']);assert.ok(!ids(s).includes('exp_choice:0'));
 const hp=s.party[0].hp;
 for(const step of ['inspect','brace','drain'])s=applyAction(s,'infirmary:'+step,noDice);
 assert.equal(s.party[0].hp,hp);assert.ok(ids(s).includes('exp_choice:0'));assert.ok(!ids(s).includes('infirmary:signal'));
 s=applyAction(s,'exp_choice:0',noDice);assert.equal(s.flags['archive-4:resolved'],true);
});
test('infirmary rejects skipped, repeated and unavailable steps without changing input',()=>{
 let s=make();const initial=JSON.stringify(s);assert.throws(()=>applyAction(s,'infirmary:drain',noDice));assert.equal(JSON.stringify(s),initial);
 s=applyAction(s,'infirmary:inspect',noDice);const inspected=JSON.stringify(s);assert.throws(()=>applyAction(s,'infirmary:inspect',noDice));assert.equal(JSON.stringify(s),inspected);
 for(const mutate of [(x:typeof s)=>{x.mode='combat';},(x:typeof s)=>{x.sceneId='archive-5';},(x:typeof s)=>{x.party[0].hp=0;},(x:typeof s)=>{x.flags['archive-4:resolved']=true;},(x:typeof s)=>{delete x.tactical;}]){const copy=structuredClone(s);mutate(copy);assert.throws(()=>applyAction(copy,'infirmary:brace',noDice));}
});
test('public infirmary state and medic height agree before drainage and after either ending',()=>{
 let s=make(),view=publicSave(s);assert.equal(view.scene.infirmary?.drained,false);assert.ok((view.scene.entities.find(e=>e.id==='field-medic')?.elevation??0)>0);
 s=applyAction(s,'exp_choice:1',noDice);view=publicSave(s);assert.equal(view.scene.infirmary?.drained,true);assert.equal(view.scene.entities.find(e=>e.id==='field-medic')?.elevation,0);assert.doesNotMatch(view.scene.description,/taps on the glassy/);
 s.mode='combat';assert.ok(!publicSave(s).scene.entities.some(e=>e.id==='field-medic'));
});

test('rescue narration retains the actual outcome when rewards also trigger a level-up',async()=>{
 const {narrationFor}=await import('../client/session.js');
 let s=make();s.xp=175;
 for(const step of ['inspect','brace','drain'])s=applyAction(s,'infirmary:'+step,noDice);
 s=applyAction(s,'exp_choice:0',noDice);const text=narrationFor(publicSave(s));
 assert.match(text,/medicine remains dry/);assert.match(text,/Level 2/);
});
