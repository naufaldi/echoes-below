import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
function setup(){const s=createSave({name:'Courier QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});s.sceneId='prison';return s;}
test('courier can speak through bars but corroboration requires freedom and the ledger',()=>{
 let s=setup();assert.ok(legalActions(s).some(a=>a.id==='courier:account'));
 assert.throws(()=>applyAction(s,'courier:corroborate',()=>1));
 s=applyAction(s,'courier:account',()=>1);s=applyAction(s,'courier:ward',()=>1);
 assert.equal(s.flags.sealKnowledge,undefined);assert.equal(s.flags.rescued,undefined);
 s=applyAction(s,'ledger',()=>1);assert.throws(()=>applyAction(s,'courier:corroborate',()=>1));
 s=applyAction(s,'force',()=>1);s=applyAction(s,'courier:corroborate',()=>1);
 assert.equal(s.flags.sealKnowledge,true);assert.ok(s.facts.some(f=>f.id==='seal-purpose'));
 const view=publicSave(s);assert.equal(view.logs.at(-1)!.speakerName,'Courier');
});
test('courier evidence opens an alternative negotiation without inventing a Scrit conversation',()=>{
 let s=setup();for(const id of ['courier:account','courier:ward','ledger','force','courier:corroborate','bell','parley:prisoner','parley:ward'])s=applyAction(s,id,n=>n);
 assert.equal(s.flags.scritTalk,undefined);
 const option=legalActions(s).find(a=>a.id==='parley:evidence')!;assert.ok(option);assert.doesNotMatch(option.label,/Scrit/);
 s=applyAction(s,'parley:evidence',()=>1);assert.doesNotMatch(s.logs.at(-1)!.text,/Scrit/);
 assert.equal(legalActions(s).find(a=>a.id==='negotiate')!.check!.dc,13);
});
test('courier questions persist, grant no repeat XP, and reject unavailable speakers',()=>{
 let s=setup();const xp=s.xp;s=applyAction(s,'courier:account',()=>1);s=JSON.parse(JSON.stringify(s));
 assert.equal(s.xp,xp);assert.throws(()=>applyAction(s,'courier:account',()=>1));
 for(const variant of [ {...s,mode:'combat' as const},{...s,sceneId:'bell' as const},{...s,tactical:undefined}])assert.throws(()=>applyAction(variant,'courier:ward',()=>1));
 s.party[0].hp=0;assert.throws(()=>applyAction(s,'courier:ward',()=>1));
});
