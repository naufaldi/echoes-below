import {tacticalRequest,tacticalPrompt,checkedTacticalPlan} from '../shared/tactical-planning';
import {getAIMode,isPaidEndpoint} from './ai-mode';
import {companionOptions} from '../shared/companion-options';
import {ownKeyConfigured,ownDialogue,ownStructured,ownRequest} from './own-ai';
import {narrativeContext} from '../shared/ai-context';
import type {PublicSave,Speaker} from '../shared/types';
const planCache=new Map<string,Record<string,string>>();
let csrf='',session:Promise<void>|null=null;
export class ApiFailure extends Error {constructor(message:string,public status:number,public code=''){super(message);}}
/** #94: story-safe copy. After a dropped connection the same command id is retried, so a choice that did land is never applied twice; a stale revision means another tab acted first. */
export const OFFLINE_COPY="The connection dropped. Your choice wasn't sent. Try again.",MOVED_ON_COPY='This adventure moved on in another tab.';
export const offline=(e:unknown)=>e instanceof ApiFailure&&e.code==='OFFLINE';
export const movedOn=(e:unknown)=>e instanceof ApiFailure&&e.status===409&&['STALE_REVISION','STALE'].includes(e.code);
const dropped=()=>new ApiFailure(OFFLINE_COPY,0,'OFFLINE');
const reach=(path:string,init?:RequestInit)=>fetch(path,init).catch(()=>{throw dropped();});
async function establish(){if(csrf)return;if(!session)session=reach('/api/session').then(async r=>{if(!r.ok)throw dropped();csrf=(await r.json()).csrfToken;}).finally(()=>{session=null;});await session;}
async function raw<T>(path:string,body?:unknown):Promise<T>{await establish();const r=await reach(path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json','x-csrf-token':csrf,'x-echoes-ai-mode':getAIMode()},body:body===undefined?undefined:JSON.stringify(body)});if(r.ok&&r.headers.get('content-type')?.startsWith('audio/'))return {url:URL.createObjectURL(await r.blob())} as T;const d=await r.json().catch(()=>{throw r.ok||r.status>=500?dropped():new ApiFailure('The request could not finish.',r.status);});if(!r.ok){if(r.status===403)csrf='';const code=typeof d.error==='string'?d.error:'';throw new ApiFailure(movedOn(new ApiFailure('',r.status,code))?MOVED_ON_COPY:d.message||'The request could not finish.',r.status,code);}return d;}
export async function api<T>(path:string,body?:unknown):Promise<T>{
 if(isPaidEndpoint(path,body)&&(getAIMode()==='off'||getAIMode()==='personal'&&!ownKeyConfigured()))throw new Error('Choose an AI mode in settings first. Free story mode makes no paid AI calls.');
 if(getAIMode()==='personal'&&ownKeyConfigured()&&body&&typeof body==='object'){
  const b=body as Record<string,unknown>,match=path.match(/^\/api\/saves\/([^/]+)\/dialogue$/);
  if(match){const s=await raw<PublicSave>('/api/saves/'+match[1]);const history=await raw<{history:unknown[]}>('/api/saves/'+s.id+'/dialogue?speaker='+b.speaker);const reply=await ownDialogue(s,b.speaker as Speaker,b.text as string,history.history);return raw<T>(`/api/saves/${s.id}/dialogue/local`,{...b,reply});}
  if(path==='/api/actions/preview'&&b.text){const s=await raw<PublicSave>('/api/saves/'+b.saveId);const value=await ownStructured('Choose one offered action matching the request, or null when unsupported. Never resolve an action.',{context:narrativeContext(s),options:s.actions,text:b.text},{type:'object',properties:{actionId:{type:['string','null']}},required:['actionId'],additionalProperties:false});if(!s.actions.some(a=>a.id===value.actionId))throw new Error('That request does not match a supported action. Choose a contextual option.');return raw<T>(path,{saveId:s.id,expectedRevision:b.expectedRevision,actionId:value.actionId});}
  if(/\/saves\/[^/]+\/actions$/.test(path)&&b.actionId==='tactical:auto'){
   const s=await raw<PublicSave>(path.replace(/\/actions$/,'')),request=tacticalRequest(s);
   if(request){try{const companionPlans=planCache.get(b.commandId as string)??checkedTacticalPlan(s,await ownStructured(tacticalPrompt,request.context,request.schema));planCache.set(b.commandId as string,companionPlans);if(planCache.size>30)planCache.delete(planCache.keys().next().value!);return raw<T>(path,{...b,companionPlans});}catch{return raw<T>(path,b);}}
  }
  if(/\/saves\/[^/]+\/actions$/.test(path)&&['end_turn','continue'].includes(b.actionId as string)){
   const s=await raw<PublicSave>(path.replace(/\/actions$/,'')),choices=companionOptions(s.party,s.enemies);
   if(Object.keys(choices).length){try{const companionPlans=planCache.get(b.commandId as string)??await ownStructured('Choose one offered action per companion. Oren heals downed allies first, otherwise attacks; Mira attacks vulnerable targets. Never invent targets or outcomes.',{party:s.party,enemies:s.enemies,choices},{type:'object',properties:Object.fromEntries(Object.entries(choices).map(([id,legal])=>[id,{type:'string',enum:legal}])),required:Object.keys(choices),additionalProperties:false});planCache.set(b.commandId as string,companionPlans);if(planCache.size>30)planCache.delete(planCache.keys().next().value!);return raw<T>(path,{...b,companionPlans});}catch{/* The authoritative engine has protective fallback tactics. */}}
  }
  if(path==='/api/transcriptions'){const bytes=Uint8Array.from(atob(b.audioBase64 as string),c=>c.charCodeAt(0)),form=new FormData();form.set('model','whisper-1');form.set('file',new Blob([bytes],{type:'audio/wav'}),'speech.wav');return await(await ownRequest('audio/transcriptions',form)).json() as T;}
 }
 return raw<T>(path,body);
}
