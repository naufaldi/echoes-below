import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {tacticalRequest,checkedTacticalPlan} from '../shared/tactical-planning.js';
import {OpenAIProvider} from '../server/ai.js';
import {Storage} from '../server/storage.js';
function battle(){let s=createSave({name:'Planner QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});s.sceneId='cookfire';s=applyAction(s,'fight',n=>n);s.turn!.actorId='oren';s.turnIndex=s.turn!.order.indexOf('oren');return s;}
test('only a living automatic companion turn exposes planning choices, without private campaign state',()=>{
 const s=battle(),p=publicSave(s);assert.equal(p.tacticalProposal!.actorId,'oren');
 assert.ok(tacticalRequest(p));assert.equal('flags' in tacticalRequest(p)!.context,false);
 for(const id of ['hero','guard-1']){s.turn!.actorId=id;assert.equal(tacticalRequest(publicSave(s)),null);}
 s.turn!.actorId='oren';s.tactical!.takeover='oren';assert.equal(tacticalRequest(publicSave(s)),null);
});
test('engine executes one validated proposal and ignores illegal or cross-actor proposals',()=>{
 const s=battle();s.plans=checkedTacticalPlan(publicSave(s),{actionId:'tactical:dodge'});
 const next=applyAction(s,'tactical:auto',()=>1);assert.equal(next.party[2].guard,true);assert.equal(next.turn!.actorId,'oren');
 assert.equal(next.tactical!.actors.oren.economy.action,false);
 assert.throws(()=>checkedTacticalPlan(publicSave(battle()),{actionId:'tactical:attack:hero'}));
 const invalid=battle();invalid.plans={oren:'tactical:attack:hero',mira:'tactical:dodge'};
 const fallback=applyAction(invalid,'tactical:auto',()=>1);
 assert.ok(fallback.logs.some(l=>l.text.includes('no longer legal')));assert.equal(fallback.party[0].hp,invalid.party[0].hp);
});
test('OpenAI planner requests one current legal companion decision and validates its response',async()=>{
 const s=battle(),db=new Storage(':memory:');db.put(s);const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async(_url,init)=>{
  calls++;const body=JSON.parse(String(init?.body)),context=JSON.parse(body.input);
  assert.equal(context.proposal.actorId,'oren');assert.equal(context.proposal.directive,'protect');
  assert.ok(context.proposal.actions.some((a:{id:string})=>a.id==='tactical:dodge'));
  return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({actionId:'tactical:dodge'})}]}],usage:{input_tokens:10,output_tokens:5}});
 };
 try{assert.deepEqual(await new OpenAIProvider(db,'test-placeholder').plans(s),{oren:'tactical:dodge'});assert.equal(calls,1);s.turn!.actorId='guard-1';assert.deepEqual(await new OpenAIProvider(db,'test-placeholder').plans(s),{});assert.equal(calls,1);}finally{globalThis.fetch=original;db.close();}
});
