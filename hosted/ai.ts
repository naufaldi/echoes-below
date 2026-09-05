import {GameError,publicSave,type Save} from '../server/game.js';
import {distance} from '../server/rules.js';
import {narrativeContext,voiceInstructions,dialogueSchema} from '../shared/ai-context.js';
import type {Speaker} from '../shared/types.js';
import {Store} from './db.js';
export interface AIEnv{OPENAI_API_KEY?:string}
export async function reserve(store:Store,amount:number){
 const day=new Date().toISOString().slice(0,10),ids=['lifetime',`day:${day}`,`visitor:${store.owner}:${day}`];
 await store.db.batch(ids.map(id=>store.db.prepare('INSERT OR IGNORE INTO budgets(id,reserved) VALUES(?,0)').bind(id)));
 const result=await store.db.prepare('WITH eligible AS MATERIALIZED (SELECT 1 WHERE (SELECT reserved FROM budgets WHERE id=?) + ? <= 25 AND (SELECT reserved FROM budgets WHERE id=?) + ? <= 2 AND (SELECT reserved FROM budgets WHERE id=?) + ? <= 0.30) UPDATE budgets SET reserved=reserved+? WHERE id IN (?,?,?) AND EXISTS(SELECT 1 FROM eligible) RETURNING id').bind(ids[0],amount,ids[1],amount,ids[2],amount,amount,...ids).all();
 if(result.results.length!==3)throw new GameError(429,'SPONSORED_LIMIT','The sponsored allowance is exhausted. Continue the authored adventure or connect your own OpenAI key.');
}
export async function provider(env:AIEnv,store:Store,path:string,body:unknown,cost:number){
 if(!env.OPENAI_API_KEY)throw new GameError(503,'AI_UNAVAILABLE','Connect your own OpenAI key for AI dialogue and voice. The authored game is playable without it.');
 await reserve(store,cost);
 const form=body instanceof FormData;
 const response=await fetch('https://api.openai.com/v1/'+path,{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,...form?{}:{'Content-Type':'application/json'}},body:form?body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw new GameError(503,'AI_UNAVAILABLE','OpenAI could not complete this request. The game state is safe; try later or use your own key.');
 return response;
}
export async function structured(env:AIEnv,store:Store,instructions:string,input:unknown,schema:unknown){
 const response=await provider(env,store,'responses',{model:'gpt-5.6-luna',reasoning:{effort:'none'},instructions,input:JSON.stringify(input),max_output_tokens:700,text:{format:{type:'json_schema',name:'echoes',strict:true,schema}}},.02);
 const data=await response.json() as {output?:{content?:{text?:string}[]}[]};
 const text=data.output?.flatMap(o=>o.content??[]).map(c=>c.text??'').join('')??'';
 try{return JSON.parse(text);}catch{throw new GameError(503,'AI_RESPONSE','The AI response was incomplete. Please try again.');}
}
export async function dialogue(env:AIEnv,store:Store,s:Save,speaker:Speaker,text:string){
 const history=(await store.history(s.id)).filter(h=>h.speaker===speaker).slice(-6);
 const value=await structured(env,store,voiceInstructions(speaker),{context:narrativeContext(publicSave(s)),history,playerText:text},dialogueSchema);
 if(typeof value.text!=='string'||value.text.length>1200||!Array.isArray(value.factIds)||value.factIds.some((id:unknown)=>!s.facts.some(f=>f.id===id)))throw new GameError(503,'AI_RESPONSE','The narrator could not ground its reply in your adventure. Try again.');
 return store.dialogue(s.id,speaker,text,value.text);
}
export async function plans(env:AIEnv,store:Store,s:Save){
 const choices:Record<string,string[]>={};
 for(const a of s.party.filter(a=>a.id!=='hero'&&a.hp>0)){
  const attacks=s.enemies.filter(e=>e.hp>0&&distance(a,e)<=6+(a.classId==='scout'?8:1.5)).map(e=>`attack:${e.id}`);
  const heals=a.classId==='guardian'&&a.focus>0?s.party.filter(e=>e.hp<e.maxHp/2&&distance(a,e)<=7.5).map(e=>`heal:${e.id}`):[];
  choices[a.id]=[...attacks,...heals,...attacks.length?[]:['guard']];
 }
 if(!Object.keys(choices).length)return{};
 const result=await structured(env,store,'Choose one offered legal action for each companion. Mira attacks vulnerable targets. Oren heals downed or badly hurt allies first, otherwise attacks. Attack includes movement. Guard gives only self Defense, never ally protection. Never invent an action or target.',{party:s.party,enemies:s.enemies,choices},{type:'object',properties:Object.fromEntries(Object.entries(choices).map(([id,legal])=>[id,{type:'string',enum:legal}])),required:Object.keys(choices),additionalProperties:false});
 if(Object.entries(choices).some(([id,legal])=>!legal.includes(result[id])))throw new Error('Invalid plan');return result as Record<string,string>;
}
