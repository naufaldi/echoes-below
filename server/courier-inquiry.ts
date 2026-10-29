import type {ActionOption} from '../shared/types.js';
import {resolveOffered,log,type Save} from './game.js';
const exchanges={
 account:{label:'Ask the courier why Vark detained them',text:'“I counted flour sacks under spear racks and called it a raiding store,” the courier says. “Vark asked who I had told. When I said nobody yet, he locked the gate.” They flex the fingers beneath their bandage. “I tried to stop it closing. That is how this happened. Whatever he is keeping beneath the bell, he chose to keep me here too.”',fact:'The courier says Vark detained them after they mistook stored supplies for preparations for a raid. Their hand was injured while trying to stop the gate closing.'},
 ward:{label:'Ask what the courier actually saw at the bell',text:'“Before the gate, I saw his sentry change watch. One hand stayed on a metal brace until another took its place. When both let go for a moment, the ring lifted and the sound came through the floor.” The courier pauses. “Vark shoved it down. The sound stopped. I cannot tell you what made it. I can tell you the ring must stay seated.” They point toward the desk. “His stores clerk wrote down every replacement brace. Let me show you once I am out.”',fact:'The courier witnessed a watch transfer: releasing the brace let the ring rise and a sound emerge from below; reseating it stopped the sound. They have not seen the force beneath it.'},
 corroborate:{label:'Compare the courier’s account with the supply ledger',text:'The freed courier turns the ledger so you can read alongside them. “There. Replacement braces, lamp oil, watch rations. The same deliveries every seventh day. Those are maintenance stores.” They trace a note in the margin: keep ring seated during relief. “It matches what I saw. The seal contains something; it is not a bell calling troops.” They close the book. “You can take that to Vark. You can also ask why keeping a watch required keeping a prisoner.”',fact:'The freed courier matched their witnessed brace transfer to the ledger’s maintenance deliveries and instruction to keep the ring seated. Together these establish that the resonance seal contains a force below and must remain supported during transfer.'},
};
export function courierActions(s:Save):ActionOption[]{
 if(!s.tactical||s.sceneId!=='prison'||s.mode!=='explore'||s.party[0].hp<=0||s.companionStoryId)return[];
 return (Object.keys(exchanges) as (keyof typeof exchanges)[])
  .filter(key=>!s.flags[`courier:${key}`]&&(key==='account'||s.flags['courier:account'])&&(key!=='corroborate'||s.flags['courier:ward']&&s.flags.rescued&&s.inventory.ledger))
  .map(key=>({id:`courier:${key}`,label:exchanges[key].label,description:key==='corroborate'?'Match witnessed events with a document you have read. Establish a safe-transfer lead without a roll.':'Hear a witnessed account. No roll or resource cost; this does not open the gate.',kind:'talk',targetId:'courier'}));
}
export function resolveCourier(original:Save,id:string):Save{
 return resolveOffered(original,id,courierActions,'COURIER_UNAVAILABLE','That courier conversation is unavailable.',s=>{
 const key=id.split(':')[1] as keyof typeof exchanges,exchange=exchanges[key];s.flags[id]=true;
 s.facts.push({id,text:exchange.fact});
 if(key==='corroborate'){s.flags.sealKnowledge=true;if(!s.facts.some(f=>f.id==='seal-purpose'))s.facts.push({id:'seal-purpose',text:exchange.fact});}
 let text=exchange.text;
 if(key==='ward'&&s.flags.rescued)text=text.replace('Let me show you once I am out.','We can check it together.');
 log(s,text,'courier',[],'authored');
 });
}
