import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const origin='https://echoes-below.naufaldi.chatgpt.site';
const session=await fetch(origin+'/api/session');assert.equal(session.status,200);
const cookie=session.headers.get('set-cookie')!.split(';')[0];
const {csrfToken}=await session.json() as {csrfToken:string};
async function request(path:string,body?:unknown){const res=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{cookie,Origin:origin,'Content-Type':'application/json','x-csrf-token':csrfToken,'x-echoes-ai-mode':'off'},body:body===undefined?undefined:JSON.stringify(body)});const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));return data;}
const results=[];
for(const rulesVersion of ['echo-v1','curated-srd-5.2.1-v1']){
 let s=await request('/api/saves',{name:'Public mechanism regression',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion});
 const action=async(actionId:string)=>{const command={actionId,commandId:crypto.randomUUID(),expectedRevision:s.revision};const next=await request(`/api/saves/${s.id}/actions`,command);assert.deepEqual(await request(`/api/saves/${s.id}/actions`,command),next);s=next;};
 await action('enter');await action('counterweight:read');await action('counterweight:pawl');
 s=await request('/api/saves/'+s.id);assert.equal(s.scene.counterweight.pawlReleased,true);
 await action('counterweight:weight');await action('counterweight:pin');
 assert.equal(s.scene.counterweight.locked,true);assert.equal(s.scene.entities.find((e:{id:string})=>e.id==='floor').name,'Safe floor');
 const hp=s.party[0].hp;await action('quick');assert.equal(s.party[0].hp,hp);assert.equal(s.scene.id,'cookfire');
 results.push({rulesVersion,puzzleSolved:true,reloadPreserved:true,duplicateActionsStable:true,safeCrossing:true,revision:s.revision});
}
writeFileSync('docs/PUBLIC_PUZZLE_VERIFICATION.json',JSON.stringify({origin,checkedAt:new Date().toISOString(),kind:'HTTP integration, not browser or duration evidence',results},null,2)+'\n');
console.log(JSON.stringify(results));
