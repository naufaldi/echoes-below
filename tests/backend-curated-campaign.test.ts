import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
const input={name:'Tactics QA',classId:'guardian' as const,backgroundId:'delver' as const,appearanceId:'ember' as const};
test('new tactical campaigns opt in; legacy campaigns preserve their original health and rules',()=>{
 const legacy=createSave(input),tactical=createSave({...input,rulesVersion:CURATED_RULES_VERSION});
 assert.equal(legacy.rulesVersion,'echo-v1');assert.equal(legacy.party[0].hp,24);assert.equal(legacy.tactical,undefined);
 assert.equal(tactical.rulesVersion,CURATED_RULES_VERSION);assert.equal(tactical.party[0].hp,12);assert.equal(tactical.tactical?.actors.hero.hp,12);
 assert.deepEqual(publicSave(JSON.parse(JSON.stringify(tactical))),publicSave(tactical));
});
function combat(){let s=createSave({...input,rulesVersion:CURATED_RULES_VERSION});for(const id of ['enter','ledge','fight'])s=applyAction(s,id,n=>n);return s;}
test('combat pauses before each automated actor and supports one-turn companion takeover',()=>{
 let s=combat();assert.equal(s.mode,'combat');assert.ok(s.tactical);let iterations=0;
 while(s.turn?.actorId==='hero'&&iterations++<5)s=applyAction(s,'tactical:end',n=>n);
 assert.ok(s.turn);if(['mira','oren'].includes(s.turn.actorId)){
  const actor=s.turn.actorId;s=applyAction(s,'tactical:takeover',n=>n);assert.equal(s.tactical?.takeover,actor);
  assert.ok(legalActions(s).some(a=>a.id==='tactical:end'));s=applyAction(s,'tactical:end',n=>n);assert.equal(s.tactical?.takeover,null);
 }else assert.ok(legalActions(s).some(a=>a.id==='tactical:auto'));
});
test('a tactical encounter can resolve with legal individual turns and persist every step',()=>{
 let s=combat();for(let i=0;i<220&&s.mode==='combat';i++){
  const options=legalActions(s);const action=options.find(a=>a.id==='tactical:auto')??options.find(a=>a.id==='tactical:death')??options.find(a=>a.kind==='attack')??options.find(a=>a.kind==='move')??options.find(a=>a.id==='tactical:end');assert.ok(action,JSON.stringify(options));
  const old=JSON.stringify(s);s=applyAction(s,action.id,n=>n);assert.notEqual(JSON.stringify(s),old);s=JSON.parse(JSON.stringify(s));
 }
 assert.notEqual(s.mode,'combat');assert.ok(s.mode==='explore'||s.mode==='defeat');
});
test('tactical campaign persists through the public API and duplicate command retries',async()=>{
 const {buildApp}=await import('../server/app.js');const {randomUUID}=await import('node:crypto');const app=await buildApp({database:':memory:',ai:false,dice:n=>n});
 try{const token=(await app.inject({url:'/api/session'})).json().csrfToken;const post=(url:string,payload:unknown)=>app.inject({url,method:'POST',headers:{'x-csrf-token':token},payload:payload as object});
 const made=await post('/api/saves',{...input,rulesVersion:CURATED_RULES_VERSION});assert.equal(made.statusCode,200,made.body);const s=made.json();
 const read=await app.inject({url:'/api/saves/'+s.id});assert.equal(read.statusCode,200,read.body);assert.equal(read.json().rulesVersion,CURATED_RULES_VERSION);
 const command={commandId:randomUUID(),expectedRevision:s.revision,actionId:'enter'};const action=await post('/api/saves/'+s.id+'/actions',command);assert.equal(action.statusCode,200,action.body);assert.deepEqual((await post('/api/saves/'+s.id+'/actions',command)).json(),action.json());
 }finally{await app.close();}
});
test('movement playback records the resolved position and remaining budget, not the prior state',()=>{
 let s=combat();for(let i=0;i<10&&s.enemies.some(a=>a.id===s.turn!.actorId);i++)s=applyAction(s,'tactical:auto',()=>1);assert.ok(s.party.some(a=>a.id===s.turn!.actorId));if(s.turn!.actorId!=='hero')s=applyAction(s,'tactical:takeover',n=>n);
 const move=legalActions(s).find(a=>a.kind==='move')!;const before=s.tactical!.actors[s.turn!.actorId].economy.movementFeet;const next=applyAction(s,move.id,n=>n);const frame=next.presentation!.at(-1)!;
 assert.ok(frame.party.find(a=>a.id===frame.actorId)?.motion?.points.length);assert.ok(frame.tactical);assert.ok(frame.tactical.actors[frame.actorId].economy.movementFeet<before);assert.deepEqual(frame.party.find(a=>a.id===frame.actorId)?.position,next.party.find(a=>a.id===frame.actorId)?.position);
});
test('a tactical victory unlocks the prison and never repeats encounter XP',()=>{
 let s=createSave({...input,classId:'adept',rulesVersion:CURATED_RULES_VERSION});for(const id of ['enter','ledge','fight'])s=applyAction(s,id,n=>n);
 for(let i=0;i<60&&s.mode==='combat';i++){
  const options=legalActions(s);const action=options.find(a=>a.id==='tactical:auto')??options.find(a=>a.kind==='attack')??options.find(a=>a.id==='tactical:end')!;
  const party=s.party.some(a=>a.id===s.turn!.actorId);s=applyAction(s,action.id,n=>party?n:1);
 }
 assert.equal(s.mode,'explore');assert.equal(s.flags.guardsDefeated,true);assert.equal(s.inventory.guardKey,true);assert.ok(legalActions(s).some(a=>a.id==='prison'));
 const xp=s.xp;assert.throws(()=>applyAction(s,'fight',n=>n));assert.equal(s.xp,xp);s=applyAction(s,'prison',n=>n);assert.equal(s.flags['xp:encounter:cookfire'],true);
});
