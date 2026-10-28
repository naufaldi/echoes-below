import {CURATED_ENCOUNTERS} from './encounters.js';
import {log,type Save} from './game.js';
/** #95: each living member carries at most two healing potions, so the pack holds two per living member. Gains clamp; an older, fuller pack is never reduced. */
export const POTION_CAP=2;
const carriers=(s:Save)=>s.party.filter(a=>!s.tactical?.actors[a.id]?.dead);
export const packFull=(s:Save)=>carriers(s).every(a=>a.potions>=POTION_CAP);
/** Adds up to `count` potions. `each` gives one to every living member with room; otherwise each potion goes to the member carrying the least (`first` is served first while it has room). Returns how many were added and how many were left behind. */
export function gainPotions(s:Save,count:number,{each=false,first}:{each?:boolean;first?:string}={}){
 let given=0;
 if(each)for(const a of carriers(s)){if(given>=count)break;if(a.potions<POTION_CAP){a.potions++;given++;}}
 else for(;given<count;given++){
  const lead=carriers(s).find(a=>a.id===first&&a.potions<POTION_CAP);
  const recipient=lead??carriers(s).filter(a=>a.potions<POTION_CAP).sort((a,b)=>a.potions-b.potions||s.party.indexOf(a)-s.party.indexOf(b))[0];
  if(!recipient)break;recipient.potions++;
 }
 return{given,left:count-given};
}
/** The story line for potions that did not fit. */
export const leftBehind=(given:number,one=false)=>given?'Your packs are full now; you leave the rest for whoever comes next.':`Your packs are already full; you leave ${one?'it':'them'} for whoever comes next.`;
export function expeditionSupplyReward(s:Save){
 const full=packFull(s)?' Your packs are already full.':'';
 if(!s.tactical)return{potions:3,rations:0,description:'Recover one potion for each party member. One cache per location.'+full};
 const rations=s.sceneId.endsWith('-8')?3:0,potions=rations?0:CURATED_ENCOUNTERS[s.sceneId]?2:1;
 return{potions,rations,description:`Recover ${rations?'3 camp rations':`${potions} healing potion${potions===1?'':'s'}`}. Distributed to party members carrying the least. This cache can be collected once.${rations?'':full}`};
}
export function collectExpeditionSupplies(s:Save){
 const reward=expeditionSupplyReward(s);
 if(!s.tactical){const {given,left}=gainPotions(s,s.party.length,{each:true});log(s,left?`The cache contains three healing potions. ${leftBehind(given)}`:'The cache contains three healing potions. Each party member takes one.');return;}
 for(let i=0;i<reward.rations;i++){
  const recipient=s.party.filter(a=>!s.tactical!.actors[a.id].dead).sort((a,b)=>a.rations-b.rations||s.party.indexOf(a)-s.party.indexOf(b))[0];recipient.rations++;
 }
 const {given,left}=gainPotions(s,reward.potions);
 log(s,reward.rations?'The landing’s sealed food chest contains three camp rations, enough for one meal and long rest for the living party.':'The cache contains '+reward.potions+' healing potion'+(reward.potions===1?'':'s')+'. '+(left?leftBehind(given,reward.potions===1):'You divide the medicine among those carrying the least.'));
}
