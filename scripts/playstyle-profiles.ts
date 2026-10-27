import {createSave,applyAction,legalActions,publicSave,type Save} from '../server/game.js';
import {CURATED_ENCOUNTERS} from '../server/encounters.js';
import {ROOM_FORKS,playstyleLedger,roomFork,selectEnding,type PlaystyleLedger} from '../server/playstyle.js';
import {EXPEDITION} from '../shared/campaign.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import type {ClassId} from '../shared/types.js';

/** Playstyle A (diplomatic): feed Scrit, negotiate, avoid fights, take each room's first option. Playstyle B (aggressive): fight every offered battle, force gates, then take the second option. */
export type Profile = 'diplomatic'|'aggressive';
export type Rules = 'echo-v1'|typeof CURATED_RULES_VERSION;
export interface ForkSighting {room:string;variant:string;title:string;description:string;choices:string[];ledger:PlaystyleLedger;}
export interface ProfileRun {profile:Profile;rules:Rules;classId:ClassId;mode:string;ending:string|null;endingId:string;finalLedger:PlaystyleLedger;forks:ForkSighting[];fights:number;actions:number;seed?:number;}

/** Seeds tried in order for the aggressive run. Curated starts with the attrition audit's seed. Echo Rules fights three defenders in every room and only some seeds survive all 42 fights (733 and 1466 fall in Chapter II); this audit is about routes and endings, not balance, so a later seed may stand in when a rules or XP change moves the survivable one. */
const SEEDS:Record<Rules,number[]>={'echo-v1':[2199,3665,733,1466,2932,4398],[CURATED_RULES_VERSION]:[733,1466,2199,2932,3665]};
export function runProfile(profile:Profile,rules:Rules,classId:ClassId='guardian'):ProfileRun{
 if(profile==='diplomatic')return playProfile(profile,rules,classId);
 const failures:string[]=[];
 for(const seed of SEEDS[rules]){try{return playProfile(profile,rules,classId,seed);}catch(e){failures.push(`seed ${seed}: ${e instanceof Error?e.message:String(e)}`);}}
 throw Error(failures.join('; '));
}
function playProfile(profile:Profile,rules:Rules,classId:ClassId,seed?:number):ProfileRun{
 let rng=seed??0;const seeded=(sides:number)=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return 1+Math.floor(rng/4294967296*sides);};
 // The diplomatic run rolls high so its checks succeed; the aggressive run uses seeded dice for honest combat.
 const dice=profile==='diplomatic'?(n:number)=>n:seeded;
 let s=createSave({name:`${profile} audit`,classId,backgroundId:'envoy',appearanceId:'moon',rulesVersion:rules});
 const tactical=rules===CURATED_RULES_VERSION;let actions=0,fights=0;const forks:ForkSighting[]=[];
 const act=(id:string)=>{s=applyAction(s,id,dice);s=JSON.parse(JSON.stringify(s)) as Save;actions++;};
 const has=(id:string)=>legalActions(s).some(a=>a.id===id);
 const advance=()=>{for(let i=0;i<12;i++){const option=legalActions(s).find(a=>a.id.startsWith('advance:'));if(!option)return;act(option.id);}throw Error('Advancement loop did not terminate');};
 function fight(){
  fights++;
  for(let step=0;step<400&&s.mode==='combat';step++){
   const options=legalActions(s);let choice;
   if(tactical){const t=s.tactical!;choice=options.find(a=>a.id==='tactical:auto')??options.find(a=>a.id==='tactical:death');
    choice??=options.filter(a=>a.kind==='heal'&&a.targetId).find(a=>t.actors[a.targetId!].hp<t.actors[a.targetId!].maxHp/2);
    choice??=options.find(a=>a.id.startsWith('tactical:missile:'));
    choice??=options.filter(a=>a.kind==='attack').sort((a,b)=>t.actors[a.targetId!].hp-t.actors[b.targetId!].hp)[0];
    if(!choice&&t.actors.hero.economy.action){const foes=s.enemies.filter(e=>e.hp>0);choice=options.filter(a=>a.kind==='move').sort((a,b)=>{const distance=(id:string)=>{const [x,y]=id.split(':')[2].split(',').map(Number);return Math.min(...foes.map(e=>Math.max(Math.abs(x-t.cells[e.id][0]),Math.abs(y-t.cells[e.id][1]))));};return distance(a.id)-distance(b.id);})[0];}
    choice??=options.find(a=>a.id==='tactical:end');
   }else choice=options.filter(a=>a.kind==='heal'&&a.targetId).find(a=>{const m=s.party.find(p=>p.id===a.targetId);return !!m&&m.hp<m.maxHp/3;})??options.filter(a=>a.kind==='attack').sort((a,b)=>(s.enemies.find(e=>e.id===a.targetId)?.hp??0)-(s.enemies.find(e=>e.id===b.targetId)?.hp??0))[0]??options.find(a=>a.id==='move:center')??options.find(a=>a.id==='end_turn')??options.find(a=>a.id==='continue');
   if(!choice)throw Error(`No legal combat progress in ${s.sceneId}`);act(choice.id);
  }
  if(s.mode!=='explore'&&s.mode!=='complete')throw Error(`${profile} ${rules} combat ended in ${s.mode} at ${s.sceneId}`);
 }
 const recover=()=>{for(let step=0;step<30;step++){advance();const options=legalActions(s);const injured=s.party.some(a=>a.hp<a.maxHp&&!s.tactical?.actors[a.id].dead);const choice=injured?options.find(a=>a.id==='camp:short')??options.find(a=>a.id.startsWith('camp:hitdie:'))??options.find(a=>a.id==='camp:long'):undefined;if(!choice)return;act(choice.id);}};
 if(profile==='diplomatic'){
  for(const id of tactical?['enter','counterweight:read','counterweight:pawl','counterweight:weight','counterweight:pin','quick']:['enter','ledge'])act(id);
  for(const id of ['offer','prison','unlock','ledger','bell','negotiate','entrust','continue_campaign'])act(id);
 }else{
  for(const id of tactical?['enter','counterweight:read','counterweight:pawl','counterweight:weight','counterweight:pin','quick']:['enter','ledge'])act(id);
  act('fight');fight();act('prison');act('force');act('ledger');if(tactical)recover();act('bell');act('fight');fight();act('secure');act('continue_campaign');
 }
 for(const room of EXPEDITION){
  if(s.sceneId!==room.id)throw Error(`${profile} ${rules} expected ${room.id}, found ${s.sceneId}`);
  advance();
  const fork=roomFork(s,room.id);
  if(fork){const view=publicSave(s);forks.push({room:room.id,variant:fork.key,title:view.scene.title,description:view.scene.description,choices:view.actions.filter(a=>a.id.startsWith('exp_choice')).map(a=>a.label),ledger:playstyleLedger(s,room.id)});}
  for(const id of ['exp_evidence','exp_talk','exp_supplies'])if(has(id))act(id);
  if(profile==='aggressive'){if(has('exp_fight')&&(!tactical||CURATED_ENCOUNTERS[room.id])){act('exp_fight');fight();}act('exp_choice:1');}
  else{if(has('exp_choice:0'))act('exp_choice:0');if(!s.flags[`${room.id}:resolved`])act('exp_choice:1');}
  if(has('exp_rest'))act('exp_rest');if(tactical)recover();advance();
  act('exp_next');
 }
 return {profile,rules,classId,mode:s.mode,ending:s.ending,endingId:selectEnding(s).id,finalLedger:playstyleLedger(s),forks,fights,actions,seed};
}
export const FORK_ROOMS=ROOM_FORKS.map(f=>f.room);
