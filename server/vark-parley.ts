import type {ActionOption} from '../shared/types.js';
import {GameError,log,type Save} from './game.js';
const exchanges={
 prisoner:{label:'Ask Vark why he imprisoned the courier',text:'Vark keeps his hand on the bell’s brace. “The courier saw supplies entering this place and assumed we were arming a raid. I locked the gate before the accusation reached Briarwatch.” He looks toward the prison. “That was my order. The ward does not excuse it.”',fact:'Vark admits he ordered the courier’s imprisonment to prevent an accusation reaching Briarwatch. He accepts responsibility rather than blaming the ward.'},
 ward:{label:'Ask what a safe transfer would require',text:'“Two hands on the brace until the new keeper takes its weight,” Vark says. “No strike against the ring. No lifting the seal to see what lies beneath it.” A low vibration passes through the stone. “I need a keeper who understands the duty. You need to know that I can answer for the prisoner. Those are different questions.”',fact:'Vark describes a safe transfer: keep the brace supported while the new keeper takes its weight, leave the seal seated, and do not strike the ring.'},
 evidence:{label:'Challenge Vark using the courier and the seal evidence',text:'You set the freed courier’s account beside the evidence about the seal. Vark cannot dismiss either. “Then we make two promises,” he says. “You take the brace without breaking the ward. I walk to Briarwatch and answer for the gate I locked.” He eases his grip, but waits for your final terms. Negotiating the transfer is now easier.',fact:'Confronted with the freed courier’s testimony and the evidence about the seal, Vark offers to answer for the imprisonment in Briarwatch if the party takes the brace safely. The final transfer has not yet been agreed.'},
};
export function parleyDC(s:Save){return s.tactical&&s.flags['parley:evidence']?13:16;}
export function parleyActions(s:Save):ActionOption[]{
 if(!s.tactical||s.sceneId!=='bell'||s.mode!=='explore'||s.party[0].hp<=0||s.companionStoryId)return[];
 return (Object.keys(exchanges) as (keyof typeof exchanges)[]).filter(key=>!s.flags[`parley:${key}`]&&(key!=='evidence'||s.flags.rescued&&s.flags.sealKnowledge&&s.flags['parley:prisoner']&&s.flags['parley:ward'])).map(key=>({id:`parley:${key}`,label:exchanges[key].label,description:key==='evidence'?'Present testimony and seal evidence you have actually obtained. Reduce the final negotiation from DC16 to DC13; the transfer still requires a check.':'Hear Vark’s answer without committing to a transfer or beginning combat.',kind:'interact',targetId:'vark'}));
}
export function resolveParley(original:Save,id:string):Save{
 if(!parleyActions(original).some(a=>a.id===id))throw new GameError(422,'PARLEY_UNAVAILABLE','That question or evidence is unavailable.');
 const s=structuredClone(original),key=id.split(':')[1] as keyof typeof exchanges,exchange=exchanges[key];s.presentation=[];
 s.flags[id]=true;s.facts.push({id,text:exchange.fact});log(s,exchange.text,'Vark',[],'authored');
 s.revision++;s.updatedAt=new Date().toISOString();return s;
}
