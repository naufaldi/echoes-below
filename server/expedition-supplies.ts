import {CURATED_ENCOUNTERS} from './encounters.js';
import {log,type Save} from './game.js';
export function expeditionSupplyReward(s:Save){
 if(!s.tactical)return{potions:3,rations:0,description:'Recover one potion for each party member. One cache per location.'};
 const rations=s.sceneId.endsWith('-8')?3:0,potions=rations?0:CURATED_ENCOUNTERS[s.sceneId]?2:1;
 return{potions,rations,description:`Recover ${rations?'3 camp rations':`${potions} healing potion${potions===1?'':'s'}`}. Distributed to party members carrying the least. This cache can be collected once.`};
}
export function collectExpeditionSupplies(s:Save){
 const reward=expeditionSupplyReward(s);
 if(!s.tactical){s.party.forEach(a=>a.potions++);log(s,'The cache contains three healing potions. Each party member takes one.');return;}
 for(const key of ['potions','rations'] as const)for(let i=0;i<reward[key];i++){
  const recipient=s.party.filter(a=>!s.tactical!.actors[a.id].dead).sort((a,b)=>a[key]-b[key]||s.party.indexOf(a)-s.party.indexOf(b))[0];recipient[key]++;
 }
 log(s,reward.rations?'The landing’s sealed food chest contains three camp rations, enough for one meal and long rest for the living party.':'The cache contains '+reward.potions+' healing potion'+(reward.potions===1?'':'s')+'. You divide the medicine among those carrying the least.');
}
