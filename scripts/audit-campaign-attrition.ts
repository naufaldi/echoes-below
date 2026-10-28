import {writeFileSync} from 'node:fs';
import {createSave,applyAction,legalActions,type Save} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {CURATED_ENCOUNTERS} from '../server/encounters.js';
import {EXPEDITION} from '../shared/campaign.js';
import type {ClassId} from '../shared/types.js';
const seedCount=Number(process.argv[2]??1);if(!Number.isInteger(seedCount)||seedCount<1||seedCount>5)throw Error('Use 1–5 seeds.');
const runs=[];
for(const classId of ['guardian','scout','adept','cleric'] as ClassId[])for(let seed=1;seed<=seedCount;seed++){
 let rng=seed*733;const dice=(sides:number)=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return 1+Math.floor(rng/4294967296*sides);};
 let s=createSave({name:'Attrition audit',classId,backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});let actions=0,peakPotions=0;const rooms:unknown[]=[];let error:string|undefined;
 const act=(id:string)=>{s=applyAction(s,id,dice);actions++;peakPotions=Math.max(peakPotions,...s.party.map(a=>a.potions));};
 const stats=()=>({scene:s.sceneId,mode:s.mode,level:s.level,xp:s.xp,party:s.party.map(a=>({id:a.id,hp:a.hp,maxHp:a.maxHp,potions:a.potions,rations:a.rations,dead:s.tactical!.actors[a.id].dead,slots:s.tactical!.actors[a.id].slots,hitDice:s.tactical!.actors[a.id].hitDice}))});
 function fight(){
  for(let step=0;step<300&&s.mode==='combat';step++){
   const options=legalActions(s),t=s.tactical!;let choice=options.find(a=>a.id==='tactical:auto')??options.find(a=>a.id==='tactical:death');
   const heals=options.filter(a=>a.kind==='heal'&&a.targetId).sort((a,b)=>t.actors[a.targetId!].hp/t.actors[a.targetId!].maxHp-t.actors[b.targetId!].hp/t.actors[b.targetId!].maxHp);
   choice??=heals.find(a=>t.actors[a.targetId!].hp<t.actors[a.targetId!].maxHp/2);
   choice??=options.find(a=>a.id.startsWith('tactical:missile:'));
   choice??=options.filter(a=>a.kind==='attack').sort((a,b)=>t.actors[a.targetId!].hp-t.actors[b.targetId!].hp)[0];
   choice??=options.find(a=>a.id==='tactical:action_surge');
   if(!choice&&t.actors.hero.economy.action){const foes=s.enemies.filter(e=>e.hp>0);choice=options.filter(a=>a.kind==='move').sort((a,b)=>{const distance=(id:string)=>{const [x,y]=id.split(':')[2].split(',').map(Number);return Math.min(...foes.map(e=>Math.max(Math.abs(x-t.cells[e.id][0]),Math.abs(y-t.cells[e.id][1]))));};return distance(a.id)-distance(b.id);})[0];}
   choice??=options.find(a=>a.id==='tactical:end');if(!choice)throw Error('No legal combat progress');act(choice.id);
  }
  if(s.mode==='combat')throw Error('Combat exceeded 300 actions');
  if(s.mode==='defeat')throw Error('Party defeated');
 }
 function recover(){
  for(let step=0;step<30;step++){
   const options=legalActions(s);const advance=options.find(a=>a.id.startsWith('advance:'));if(advance){act(advance.id);continue;}
   const injured=s.party.some(a=>a.hp<a.maxHp&&!s.tactical!.actors[a.id].dead);
   const depleted=s.party.some(a=>{const c=s.tactical!.actors[a.id];return c.maxSlots.some(n=>n>0)&&c.slots.reduce((n,x)=>n+x,0)<=c.maxSlots.reduce((n,x)=>n+x,0)/2;});
   const rest=injured?options.find(a=>a.id==='camp:short'):undefined;
   const extra=injured?options.find(a=>a.id.startsWith('camp:hitdie:')):undefined;
   const long=injured||depleted?options.find(a=>a.id==='camp:long'):undefined;
   const choice=rest??extra??long;if(!choice)return;act(choice.id);
  }throw Error('Recovery exceeded 30 actions');
 }
 try{
  for(const id of ['enter','counterweight:read','counterweight:pawl','counterweight:weight','counterweight:pin','quick','fight'])act(id);fight();rooms.push(stats());
  act('prison');act('force');act('ledger');recover();act('bell');act('fight');fight();rooms.push(stats());act('secure');act('continue_campaign');
  for(const room of EXPEDITION){if(s.sceneId!==room.id)throw Error('Unexpected room');recover();act('exp_evidence');act('exp_talk');act('exp_supplies');if(CURATED_ENCOUNTERS[room.id]){act('exp_fight');fight();}act('exp_choice:1');recover();s=JSON.parse(JSON.stringify(s)) as Save;rooms.push(stats());act('exp_next');}
 }catch(e){error=e instanceof Error?e.message:String(e);}
 const result={classId,seed,actions,peakPotions,error,final:stats(),rooms};runs.push(result);console.log(JSON.stringify({classId,seed,actions,peakPotions,error,final:result.final}));
}
writeFileSync('docs/CAMPAIGN_ATTRITION.json',JSON.stringify({peakPotionsPerMember:Math.max(...runs.map(r=>r.peakPotions)),kind:'Continuous controlled combat-route simulation, not human playtime or balance acceptance',assumptions:'No injected HP, XP, levels, inventory or resources. All authored combats; all room evidence and supply caches; no side quests. Existing Rogue/Fighter companions, greedy legal-action hero policy, automatic companions. Short/extra Hit Dice rests for injuries, long rest for remaining injuries or half-depleted slots when legal. First available ability improvements. JSON save round-trip at room boundaries. Failure stops that run; no retries or checkpoint resets. In-game rest hours are not player hours. No paid AI.',seedCount,runs},null,2)+'\n');
