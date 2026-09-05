import {companionOptions} from '../shared/companion-options';
import {ownKeyConfigured,ownDialogue,ownStructured,ownRequest} from './own-ai';
import {narrativeContext} from '../shared/ai-context';
import type {PublicSave,Speaker} from '../shared/types';
const planCache=new Map<string,Record<string,string>>();
let csrf='',session:Promise<void>|null=null;
export class ApiFailure extends Error {constructor(message:string,public status:number){super(message);}}
async function establish(){if(csrf)return;if(!session)session=fetch('/api/session').then(async r=>{if(!r.ok)throw new Error('The game server is unavailable.');csrf=(await r.json()).csrfToken;}).finally(()=>{session=null;});await session;}
async function raw<T>(path:string,body?:unknown):Promise<T>{await establish();const r=await fetch(path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json','x-csrf-token':csrf},body:body===undefined?undefined:JSON.stringify(body)});if(r.ok&&r.headers.get('content-type')?.startsWith('audio/'))return {url:URL.createObjectURL(await r.blob())} as T;const d=await r.json();if(!r.ok){if(r.status===403)csrf='';throw new ApiFailure(d.message||'The request could not finish.',r.status);}return d;}
export async function api<T>(path:string,body?:unknown):Promise<T>{
 if(ownKeyConfigured()&&body&&typeof body==='object'){
  const b=body as Record<string,unknown>,match=path.match(/^\/api\/saves\/([^/]+)\/dialogue$/);
  if(match){const s=await raw<PublicSave>('/api/saves/'+match[1]);const history=await raw<{history:unknown[]}>('/api/saves/'+s.id+'/dialogue?speaker='+b.speaker);const reply=await ownDialogue(s,b.speaker as Speaker,b.text as string,history.history);return raw<T>(`/api/saves/${s.id}/dialogue/local`,{...b,reply});}
  if(path==='/api/actions/preview'&&b.text){const s=await raw<PublicSave>('/api/saves/'+b.saveId);const value=await ownStructured('Choose one offered action matching the request, or null when unsupported. Never resolve an action.',{context:narrativeContext(s),options:s.actions,text:b.text},{type:'object',properties:{actionId:{type:['string','null']}},required:['actionId'],additionalProperties:false});if(!s.actions.some(a=>a.id===value.actionId))throw new Error('That request does not match a supported action. Choose a contextual option.');return raw<T>(path,{saveId:s.id,expectedRevision:b.expectedRevision,actionId:value.actionId});}
  if(/\/saves\/[^/]+\/actions$/.test(path)&&['end_turn','continue'].includes(b.actionId as string)){
   const s=await raw<PublicSave>(path.replace(/\/actions$/,'')),choices=companionOptions(s.party,s.enemies);
   if(Object.keys(choices).length){try{const companionPlans=planCache.get(b.commandId as string)??await ownStructured('Choose one offered action per companion. Oren heals downed allies first, otherwise attacks; Mira attacks vulnerable targets. Never invent targets or outcomes.',{party:s.party,enemies:s.enemies,choices},{type:'object',properties:Object.fromEntries(Object.entries(choices).map(([id,legal])=>[id,{type:'string',enum:legal}])),required:Object.keys(choices),additionalProperties:false});planCache.set(b.commandId as string,companionPlans);if(planCache.size>30)planCache.delete(planCache.keys().next().value!);return raw<T>(path,{...b,companionPlans});}catch{/* The authoritative engine has protective fallback tactics. */}}
  }
  if(path==='/api/transcriptions'){const bytes=Uint8Array.from(atob(b.audioBase64 as string),c=>c.charCodeAt(0)),form=new FormData();form.set('model','whisper-1');form.set('file',new Blob([bytes],{type:'audio/wav'}),'speech.wav');return await(await ownRequest('audio/transcriptions',form)).json() as T;}
 }
 return raw<T>(path,body);
}
