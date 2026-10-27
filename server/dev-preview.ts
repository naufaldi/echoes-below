import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {applyAction,createSave,GameError,legalActions,publicSave,type Save} from './game.js';
import type {Storage} from './storage.js';
import {EXPEDITION} from '../shared/campaign.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';

// Local scene preview (#46): open any Chapter II–VI room straight away while building its environment.
// Registered only by the local Fastify app (server/app.ts). The hosted Worker never imports this module.
const RULES={echo:'echo-v1',curated:CURATED_RULES_VERSION} as const;
export type PreviewRules=keyof typeof RULES;
/** Chapter I without combat: the same route as the expansion tests' opening(). */
const CHAPTER_ONE=['enter','ledge','offer','prison','unlock','ledger','bell','negotiate','secure','continue_campaign'];
// Maximum dice: every check on the way succeeds, so the route never stalls on a roll.
const certain=(sides:number)=>sides;
/** A throwaway save that reached `sceneId` through legal actions only, taking choice `choice` in every earlier room (falling back to the other when it is not offered). */
export function previewSave(sceneId:string,rules:PreviewRules,choice:0|1=1):Save{
 if(!EXPEDITION.some(room=>room.id===sceneId))throw new GameError(404,'UNKNOWN_SCENE',`No Chapter II–VI room is called ${sceneId}.`);
 let s=createSave({name:'Preview '+sceneId,classId:'guardian',backgroundId:'envoy',appearanceId:'moon',rulesVersion:RULES[rules]});
 const act=(id:string)=>{if(!legalActions(s).some(a=>a.id===id))throw new GameError(500,'PREVIEW_ROUTE',`The preview route could not take ${id} in ${s.sceneId}.`);s=applyAction(s,id,certain);};
 for(const id of CHAPTER_ONE)act(id);
 while(s.sceneId!==sceneId){const offered=legalActions(s).some(a=>a.id===`exp_choice:${choice}`);act(`exp_choice:${offered?choice:1-choice}`);act('exp_next');}
 return s;
}
const LOOPBACK=new Set(['127.0.0.1','::1','::ffff:127.0.0.1']);
const query=z.object({rules:z.enum(['echo','curated']).default('echo'),choice:z.enum(['0','1']).default('1')}).strict();
export function registerDevPreview(app:FastifyInstance,storage:Storage){
 // POST, so the app's CSRF token applies: a page on another site cannot create saves with a cross-site GET.
 app.post('/api/dev/preview/:sceneId',async(req)=>{
  // The app already rejects non-local Host and Origin headers; this also refuses a socket that is not loopback.
  if(!LOOPBACK.has(req.socket.remoteAddress??''))throw new GameError(403,'LOCAL_ONLY','Scene preview is available on this computer only.');
  const {sceneId}=z.object({sceneId:z.string().max(20)}).parse(req.params),{rules,choice}=query.parse(req.query);
  z.object({}).strict().parse(req.body??{});
  return storage.transaction(()=>{const s=previewSave(sceneId,rules,Number(choice) as 0|1);storage.checkpoint(s,`Preview: ${publicSave(s).scene.title}`);storage.put(s);return publicSave(s);});
 });
}
