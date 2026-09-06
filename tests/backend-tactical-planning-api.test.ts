import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {buildApp} from '../server/app.js';
import type {AIProvider} from '../server/ai.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import type {PublicSave} from '../shared/types.js';

async function setup(fail=false){
 let calls=0;
 const unused=async()=>{throw Error('Unexpected paid endpoint');};
 const ai:AIProvider={configured:true,dialogue:unused,interpret:unused,audio:unused,transcribe:unused,plans:async s=>{
  calls++;await new Promise(r=>setTimeout(r,20));if(fail)throw Error('Provider unavailable');return {[s.turn!.actorId]:'tactical:dodge'};
 }};
 const app=await buildApp({database:':memory:',ai,dice:()=>1});
 const csrf=(await app.inject({url:'/api/session'})).json().csrfToken;
 const post=(url:string,payload:object,mode='off')=>app.inject({url,method:'POST',headers:{'x-csrf-token':csrf,'x-echoes-ai-mode':mode},payload});
 let s=(await post('/api/saves',{name:'Billing QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION})).json() as PublicSave;
 const act=async(id:string,mode='off')=>{const res=await post('/api/saves/'+s.id+'/actions',{commandId:randomUUID(),expectedRevision:s.revision,actionId:id},mode);assert.equal(res.statusCode,200,res.body);s=res.json();};
 for(const id of ['enter','ledge','fight'])await act(id);
 for(let i=0;i<30&&!s.tacticalProposal;i++)await act(s.turn?.actorId==='hero'?'tactical:end':'tactical:auto','sponsored');
 assert.ok(s.tacticalProposal,'Must reach a living companion turn');assert.equal(calls,0,'No planner call for enemy or hero turns');
 return {app,post,act,state:()=>s,calls:()=>calls};
}
test('sponsored companion retries share one provider decision and commit one revision',async()=>{
 const q=await setup();try{
  const s=q.state(),body={commandId:randomUUID(),expectedRevision:s.revision,actionId:'tactical:auto'},url='/api/saves/'+s.id+'/actions';
  const [a,b]=await Promise.all([q.post(url,body,'sponsored'),q.post(url,body,'sponsored')]);
  assert.equal(a.statusCode,200,a.body);assert.equal(b.statusCode,200,b.body);assert.deepEqual(a.json(),b.json());
  assert.equal(q.calls(),1);assert.equal(a.json().revision,s.revision+1);
  assert.equal(a.json().party.find((p:{id:string})=>p.id===s.turn!.actorId).guard,true);
  const repeat=await q.post(url,body,'sponsored');assert.deepEqual(repeat.json(),a.json());assert.equal(q.calls(),1);
 }finally{await q.app.close();}
});
test('free mode never invokes planner and provider failure still resolves a legal step',async()=>{
 const free=await setup();try{await free.act('tactical:auto');assert.equal(free.calls(),0);}finally{await free.app.close();}
 const failed=await setup(true);try{const revision=failed.state().revision;await failed.act('tactical:auto','sponsored');assert.equal(failed.calls(),1);assert.equal(failed.state().revision,revision+1);assert.ok(failed.state().logs.some(l=>l.text.includes('planning is unavailable')));}finally{await failed.app.close();}
});
