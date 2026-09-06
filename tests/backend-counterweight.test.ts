import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
const fresh=()=>{const s=createSave({name:'Puzzle QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});s.sceneId='hall';return s;};
const act=(s:ReturnType<typeof fresh>,step:string)=>applyAction(s,'counterweight:'+step,()=>{throw Error('Puzzle must not roll dice');});
test('the complete keeper procedure disables the trap and reveals a durable maintenance route',()=>{
 let s=fresh();assert.throws(()=>act(s,'pin'));
 for(const step of ['read','pawl','weight','pin'])s=act(JSON.parse(JSON.stringify(s)),step);
 assert.equal(s.flags.trapSpent,true);assert.equal(s.flags.maintenance,true);
 assert.ok(publicSave(s).facts.some(f=>f.id==='maintenance'));
 assert.ok(!legalActions(s).some(a=>a.id.startsWith('counterweight:')));
 assert.throws(()=>act(s,'pin'));const hp=s.party[0].hp;
 s=applyAction(s,'quick',()=>1);assert.equal(s.party[0].hp,hp);
});
test('wrong order raises alarm, resets progress, and keeps escape routes and retry available',()=>{
 let s=act(fresh(),'read');s=act(s,'pin');assert.equal(s.flags.alarm,true);
 assert.ok(legalActions(s).some(a=>a.id==='ledge'));
 assert.ok(!s.flags.trapSpent);s=act(s,'pawl');s=act(s,'reset');assert.ok(!s.flags['counterweight:pawl']);
 for(const step of ['pawl','weight','pin'])s=act(s,step);
 assert.equal(s.flags.alarm,true);assert.equal(s.flags.trapSpent,true);
 assert.equal(s.facts.filter(f=>f.id==='counterweight-procedure').length,1);
});
test('abandoned or spent mechanisms cannot be manipulated remotely and do not block old saves',()=>{
 const s=fresh();s.flags.trapSpent=true;assert.throws(()=>act(s,'read'));
 assert.ok(legalActions(s).some(a=>a.id==='ledge'));
 const left=act(fresh(),'read');left.sceneId='cookfire';assert.throws(()=>act(left,'pawl'));
 const down=fresh();down.party[0].hp=0;assert.throws(()=>act(down,'read'));
});
