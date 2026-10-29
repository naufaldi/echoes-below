import type {ActionOption} from '../shared/types.js';
import {resolveOffered,log,type Save} from './game.js';
const fact=(s:Save,id:string,text:string)=>{if(!s.facts.some(f=>f.id===id))s.facts.push({id,text});};
const questions={
 supplies:{label:'Ask Scrit who stopped the supply carts',text:'Scrit lifts the lid of an almost empty pot. “The last driver would not cross the ridge after dark. Said the road hummed through his teeth.” He points at sacks patched with three different merchants’ marks. “We bought what we could. Vark took the rest on credit nobody agreed to give him. Hunger explains the theft. It does not turn it into a gift.”',fact:'Scrit says frightened drivers stopped crossing the ridge, and Vark took supplies without the merchants’ consent. Scrit does not excuse the theft.'},
 captive:{label:'Ask what Scrit knows about the prisoner',text:'“A courier counted the sacks and called them raid supplies,” Scrit says. “Vark ordered the gate locked. I brought water. I should have brought a key.” One guard looks into the fire. “That guard carries the key now. Feed the camp and I can persuade him to give it up. The alarm is another matter: he fears Vark will punish him for ignoring it.”',fact:'Scrit witnessed Vark ordering the courier imprisoned. He brought the prisoner water and says the guards fear punishment for disregarding an alarm.'},
 ward:{label:'Ask why Vark refuses to leave the bell',text:'Scrit lowers his voice. “He took the night watch when the old keeper vanished. Something below presses against the seal. You can hear it when the brace shakes.” He draws a ring in the ash, then keeps his finger inside it. “Do not pull it out. Find someone who can keep it seated. Vark knows the work, but that does not give him the right to lock people away.”',fact:'Scrit explains that the seated resonance seal restrains a force beneath the relay. A keeper must support it; removing it carelessly risks releasing the force.'},
};
// Old curated saves recorded the attempt, not its result. A peaceful transfer
// of the key or food distinguishes negotiated passage from slipping away.
export function canSpeakToScrit(s:Save):boolean{
 const distracted=s.flags.guardsDistracted??Boolean(s.flags.distractTried&&s.flags.passage&&!s.flags.fed&&!s.inventory.guardKey);
 return !s.flags.guardsDefeated&&!distracted;
}
export function scritActions(s:Save):ActionOption[]{
 if(!s.tactical||s.mode!=='explore'||s.sceneId!=='cookfire'||s.party[0].hp<=0||s.companionStoryId||!s.flags.scritTalk||!canSpeakToScrit(s))return[];
 const options=(Object.keys(questions) as (keyof typeof questions)[]).filter(key=>!s.flags[`scrit:${key}`]&&(key!=='ward'||s.flags['scrit:supplies']&&s.flags['scrit:captive'])).map(key=>({id:`scrit:${key}`,label:questions[key].label,description:'Hear a witnessed account. This question does not promise passage or spend supplies.',kind:'talk',targetId:'scrit'}));
 if(s.flags.fed&&s.flags.alarm&&s.flags['scrit:captive']&&!s.flags['scrit:standdown']&&s.party.some(a=>a.rations>0))options.push({id:'scrit:standdown',label:'Share another ration and ask the guards to stand down',description:'Spend one additional party ration. Scrit persuades the guards to cancel the current alarm, preventing its extra scout at Vark’s confrontation. A later alarm can still be raised.',kind:'offer',targetId:'scrit'});
 return options;
}
export function resolveScrit(original:Save,id:string):Save{
 return resolveOffered(original,id,scritActions,'SCRIT_UNAVAILABLE','That conversation or offer is unavailable.',s=>{
 s.flags[id]=true;
 if(id==='scrit:standdown'){
  s.party.find(a=>a.rations>0)!.rations--;s.flags.alarm=false;
  fact(s,id,'The party shared an additional ration. Scrit persuaded the guards to cancel the current alarm; later disturbances can still raise a new alarm.');
  log(s,'Scrit divides the ration between the guards before speaking. “They have given us more than they took. Tell the runner it was the old chain, not a raid.” The guard with the whistle hesitates, then calls the scout back. The current alarm is cancelled. Vark still waits at the bell.','scrit',[],'authored');
 }else{
  const key=id.split(':')[1] as keyof typeof questions,question=questions[key];
  fact(s,id,question.fact);if(key==='ward'){s.flags.sealKnowledge=true;fact(s,'seal-purpose',question.fact);}
  const text=key==='captive'&&s.inventory.guardKey?'“Vark ordered the gate locked,” Scrit says. “I brought the prisoner water. I should have brought that key sooner.” He glances at the key now in your keeping. “You can open it. The guards still fear punishment for disregarding an alarm.”':question.text;
  log(s,text,'scrit',[],'authored');
 }
 });
}
