import {z} from 'zod';
import {Store,hash,type Database} from './db.js';
import {applyAction,createSave,GameError,legalActions,log,publicSave,type Save} from '../server/game.js';
import {cryptoDice} from '../server/rules.js';
import {dialogue,plans,provider,structured,type AIEnv} from './ai.js';
import {narrativeContext} from '../shared/ai-context.js';
import type {Preview} from '../shared/types.js';
interface Env extends AIEnv{DB:Database;ASSETS:{fetch(request:Request):Promise<Response>}}
const uuid=z.string().uuid(),commandSchema=z.object({companionPlans:z.record(z.string().max(40),z.string().max(100)).optional(),commandId:uuid,expectedRevision:z.number().int().min(0),actionId:z.string().min(1).max(100)}).strict();
const creation=z.object({name:z.string().trim().min(1).max(40).regex(/^[\p{L}\p{N} .'-]+$/u),classId:z.enum(['guardian','scout','adept','cleric']),raceId:z.enum(['human','elf','dwarf','halfling']).default('human'),backgroundId:z.enum(['delver','envoy','survivor']),appearanceId:z.enum(['ember','moss','moon'])}).strict();
const say=z.object({speaker:z.enum(['dm','mira','oren']),text:z.string().trim().min(1).max(1000)}).strict();
function json(value:unknown,status=200,headers:Record<string,string>={}){return Response.json(value,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...headers}});}
async function readBody(request:Request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw new GameError(415,'TYPE','JSON is required.');const max=1450000;if(Number(request.headers.get('content-length')??0)>max)throw new GameError(413,'SIZE','The request is too large.');const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let total=0;if(reader)while(true){const part=await reader.read();if(part.done)break;total+=part.value.length;if(total>max){await reader.cancel();throw new GameError(413,'SIZE','The request is too large.');}chunks.push(part.value);}const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}const text=new TextDecoder().decode(bytes);try{return JSON.parse(text);}catch{throw new GameError(400,'JSON','The request could not be read.');}}
async function execute(env:Env,store:Store,id:string,input:unknown){
 const body=commandSchema.parse(input),digest=await hash(JSON.stringify({id,...body})),duplicate=await store.duplicate(body.commandId,digest);if(duplicate)return duplicate;
 const before=await store.read(id);if(before.revision!==body.expectedRevision)throw new GameError(409,'STALE','Reload the latest saved adventure.');
 if(!legalActions(before).some(a=>a.id===body.actionId))throw new GameError(422,'ACTION','That action is not available.');
 if(body.companionPlans)before.plans=body.companionPlans;
 if(!body.companionPlans&&env.OPENAI_API_KEY&&before.mode==='combat'&&!before.flags.retreatRequested&&['end_turn','continue'].includes(body.actionId))try{before.plans=await plans(env,store,before);}catch{log(before,'Companion AI is unavailable. The party uses protective tactical rules.');}
 const after=applyAction(before,body.actionId,cryptoDice);delete after.plans;return store.commit(before,after,body.commandId,digest);
}
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
 try{
  if(request.headers.get('sec-fetch-site')==='cross-site'||request.headers.get('origin')&&request.headers.get('origin')!==url.origin)throw new GameError(403,'ORIGIN','Open this adventure from its own page.');
  const raw=request.headers.get('cookie')?.split(';').map(c=>c.trim()).find(c=>c.startsWith('__Host-echo='))?.slice(12);
  const token=raw&&/^[a-f0-9-]{36}$/.test(raw)?raw:null;
  if(path==='/api/session'&&request.method==='GET'){const session=token??crypto.randomUUID();return json({csrfToken:await hash('csrf:'+session)},200,{'Set-Cookie':`__Host-echo=${session}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`});}
  if(path==='/api/health')return json({ok:true,aiConfigured:!!env.OPENAI_API_KEY,hosted:true});
  if(!token)throw new GameError(403,'SESSION','Refresh the page to establish your private save session.');
  if(request.method==='POST'&&request.headers.get('x-csrf-token')!==await hash('csrf:'+token))throw new GameError(403,'CSRF','Refresh your adventure before retrying.');
  const store=new Store(env.DB,await hash('owner:'+token));
  const body=request.method==='POST'?await readBody(request):null;
  if(path==='/api/saves'&&request.method==='GET'){const rows=await env.DB.prepare('SELECT body FROM saves WHERE owner=? ORDER BY updated_at DESC LIMIT 30').bind(store.owner).all<{body:string}>();return json({saves:rows.results.map(row=>{const s=JSON.parse(row.body) as Save;return{id:s.id,name:s.name,sceneTitle:publicSave(s).scene.title,mode:s.mode};})});}
  if(path==='/api/saves'&&request.method==='POST'){const count=await env.DB.prepare('SELECT count(*) AS n FROM saves WHERE owner=?').bind(store.owner).first<{n:number}>();if((count?.n??0)>=30)throw new GameError(429,'SAVE_LIMIT','This device has reached 30 adventures. Continue an existing adventure.');return json(await store.create(createSave(creation.parse(body))));}
  const match=path.match(/^\/api\/saves\/([^/]+)(?:\/(.*))?$/);
  if(match){const id=uuid.parse(match[1]),suffix=match[2];if(suffix==='actions'&&request.method==='POST')return json(await execute(env,store,id,body));const save=await store.read(id);
   if(!suffix&&request.method==='GET')return json(publicSave(save));
   if(suffix==='dialogue'&&request.method==='POST'){const b=say.parse(body);return json(await dialogue(env,store,save,b.speaker,b.text));}
   if(suffix==='dialogue/local'&&request.method==='POST'){const b=say.extend({reply:z.string().trim().min(1).max(1200)}).parse(body);return json(await store.dialogue(id,b.speaker,b.text,b.reply));}
   if((suffix==='dialogues'||suffix==='dialogue')&&request.method==='GET')return json({history:await store.history(id)});
   const restore=suffix?.match(/^checkpoints\/([^/]+)\/restore$/);if(restore&&request.method==='POST'){const checkpoint=await env.DB.prepare('SELECT body FROM checkpoints WHERE id=? AND owner=? AND save_id=?').bind(uuid.parse(restore[1]),store.owner,id).first<{body:string}>();if(!checkpoint)throw new GameError(404,'CHECKPOINT','Checkpoint unavailable.');const branch=JSON.parse(checkpoint.body) as Save;branch.id=crypto.randomUUID();branch.campaignId=save.campaignId??save.id;branch.name=save.name+' · restored';branch.checkpointIds=[];branch.revision=0;branch.presentation=[];branch.updatedAt=new Date().toISOString();return json(await store.create(branch));}
  }
  if(path==='/api/actions/preview'&&request.method==='POST'){
   const b=z.object({saveId:uuid,expectedRevision:z.number().int(),actionId:z.string().max(100).optional(),text:z.string().min(1).max(1000).optional()}).strict().parse(body),s=await store.read(b.saveId);if(s.revision!==b.expectedRevision)throw new GameError(409,'STALE','Reload before trying that action.');
   let actionId=b.actionId;if(!actionId){const value=await structured(env,store,'Map the player request to one offered action. Return null when unsupported. Never resolve the action.',{context:narrativeContext(publicSave(s)),actions:legalActions(s),text:b.text},{type:'object',properties:{actionId:{type:['string','null']}},required:['actionId'],additionalProperties:false});actionId=value.actionId;}
   const action=legalActions(s).find(a=>a.id===actionId);if(!action)throw new GameError(422,'UNSUPPORTED','That request does not match an available action. Try a contextual option.');
   const p:Preview={previewId:crypto.randomUUID(),saveId:s.id,revision:s.revision,action,expiresAt:new Date(Date.now()+120000).toISOString()};await env.DB.prepare('INSERT INTO previews(id,owner,body) VALUES(?,?,?)').bind(p.previewId,store.owner,JSON.stringify(p)).run();return json(p);
  }
  if(path==='/api/actions/commit'&&request.method==='POST'){
   const b=z.object({previewId:uuid,commandId:uuid}).strict().parse(body),row=await env.DB.prepare('SELECT body FROM previews WHERE id=? AND owner=?').bind(b.previewId,store.owner).first<{body:string}>();if(!row)throw new GameError(404,'PREVIEW','Preview unavailable.');const p=JSON.parse(row.body) as Preview;
   const action={commandId:b.commandId,expectedRevision:p.revision,actionId:p.action.id};const duplicate=await store.duplicate(b.commandId,await hash(JSON.stringify({id:p.saveId,...action})));if(duplicate)return json(duplicate);
   if(Date.parse(p.expiresAt)<Date.now())throw new GameError(409,'EXPIRED','Prepare your action again.');return json(await execute(env,store,p.saveId,action));
  }
  const audio=path.match(/^\/api\/narrations\/([^/]+)\/audio$/);
  if(audio&&request.method==='POST'){const row=await env.DB.prepare('SELECT reply_text,speaker FROM dialogues WHERE id=? AND owner=?').bind(uuid.parse(audio[1]),store.owner).first<{reply_text:string;speaker:string}>();if(!row)throw new GameError(404,'AUDIO','Dialogue unavailable.');const response=await provider(env,store,'audio/speech',{model:'gpt-4o-mini-tts-2025-12-15',voice:row.speaker==='mira'?'coral':row.speaker==='oren'?'onyx':'ash',input:row.reply_text.slice(0,1200),response_format:'mp3'},.12);return new Response(response.body,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});}
  if(path==='/api/transcriptions'&&request.method==='POST'){
   const b=z.object({saveId:uuid,audioBase64:z.string().min(4).max(1300000),mimeType:z.literal('audio/wav'),durationSeconds:z.number().positive().max(30)}).strict().parse(body);await store.read(b.saveId);const bytes=Uint8Array.from(atob(b.audioBase64),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);
   const text=(a:number,n:number)=>new TextDecoder().decode(bytes.slice(a,a+n));
   if(bytes.length<44||text(0,4)!=='RIFF'||text(8,4)!=='WAVE'||text(12,4)!=='fmt '||view.getUint32(16,true)!==16||view.getUint16(20,true)!==1||view.getUint16(22,true)!==1||view.getUint32(24,true)!==16000||view.getUint16(34,true)!==16||text(36,4)!=='data'||view.getUint32(40,true)!==bytes.length-44||bytes.length>960044)throw new GameError(400,'AUDIO','Use a recording of at most 30 seconds.');
   const form=new FormData();form.set('model','whisper-1');form.set('file',new Blob([bytes],{type:'audio/wav'}),'speech.wav');const response=await provider(env,store,'audio/transcriptions',form,.003);const value=await response.json() as {text:string};return json({text:value.text});
  }
  if(path==='/api/usage'){await store.read(uuid.parse(url.searchParams.get('saveId')));const day=new Date().toISOString().slice(0,10);const row=await env.DB.prepare('SELECT reserved FROM budgets WHERE id=?').bind(`visitor:${store.owner}:${day}`).first<{reserved:number}>();return json({campaignUsd:row?.reserved??0,limits:{visitorDailyUsd:.30,globalDailyUsd:2,globalLifetimeUsd:25},accounting:'conservative reservations, not invoice charges'});}
  throw new GameError(404,'NOT_FOUND','Endpoint not found.');
 }catch(error){if(error instanceof z.ZodError)return json({error:'VALIDATION',message:'Some request details were invalid. Check your input and retry.'},400);if(error instanceof GameError)return json({error:error.code,message:error.message},error.status);return json({error:'UNAVAILABLE',message:'This request could not finish. Your last confirmed save is safe.'},503);}
}};
