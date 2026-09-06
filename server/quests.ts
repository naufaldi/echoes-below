import {EXPEDITION} from '../shared/campaign.js';
import type {QuestProgress} from '../shared/quests.js';
import type {ActionOption} from '../shared/types.js';
import {GameError,log,type Save} from './game.js';

const opening=['approach','hall','cookfire','prison','bell','aftermath'];
const position=(s:Save)=>opening.includes(s.sceneId)?opening.indexOf(s.sceneId):6+EXPEDITION.findIndex(r=>r.id===s.sceneId);
type Definition={id:string;title:string;chapter:number;kind:'main'|'side';start:number;end:number;steps:{label:string;test:(s:Save)=>boolean}[]};
const flag=(key:string)=>(s:Save)=>!!s.flags[key];
const reached=(n:number)=>(s:Save)=>position(s)>=n;
const step=(label:string,test:(s:Save)=>boolean)=>({label,test});
const openingQuests:Definition[]=[
 {id:'relay-road',title:'The road beneath Briarwatch',chapter:1,kind:'main',start:0,end:1,steps:[step('Enter the abandoned relay',reached(1)),step('Find a route across the counterweight hall',reached(2))]},
 {id:'relay-courier',title:'A voice behind iron',chapter:1,kind:'main',start:2,end:3,steps:[step('Resolve the goblin passage',s=>!!s.flags.passage||position(s)>2),step('Free the captive courier',flag('rescued'))]},
 {id:'relay-seal',title:'Who keeps the bell?',chapter:1,kind:'main',start:4,end:5,steps:[step('Resolve the confrontation with Vark',reached(5)),step('Decide who will guard the seal',s=>position(s)>5||s.sceneId==='aftermath'&&s.mode==='complete')]},
 {id:'relay-trail',title:'A trail worth following',chapter:1,kind:'side',start:0,end:1,steps:[step('Read the captive tracks outside',flag('tracks')),step('Study the relay maintenance diagram',flag('maintenance'))]},
 {id:'relay-mercy',title:'More than enemies',chapter:1,kind:'side',start:2,end:3,steps:[step('Hear Scrit’s account',flag('scritTalk')),step('Share a ration with Scrit',flag('fed')),step('Free the courier',flag('rescued'))]},
];
const arcTitles=[
 ['Recover the lost index','Follow the witnesses','Settle the archive’s debt'],
 ['A city under pressure','The price of its warmth','Hold the council to account'],
 ['Find the living prisoners','Break the roots’ hold','Bring the captives home'],
 ['Listen beneath the song','Refuse another sacrifice','Open the final descent'],
 ['Remember why it was built','Reach the last keeper','End the hungry bargain'],
];
const sideTitles=[['Names beneath the water','The cost of remembrance'],['What the market hides','A stage for the truth'],['Voices are not people','A way home for everyone'],['Permission to be heard','Promises freely chosen'],['The founders’ intention','No one remains']];
export const QUESTS:Definition[]=[...openingQuests,...arcTitles.flatMap((titles,c)=>{
 const rooms=EXPEDITION.filter(r=>r.chapter===c+2),offset=6+c*8;
 const mains=titles.map((title,i):Definition=>{const from=[0,3,6][i],to=[2,5,7][i];return{id:`chapter-${c+2}-main-${i+1}`,title,chapter:c+2,kind:'main',start:offset+from,end:offset+to,steps:rooms.slice(from,to+1).map(r=>step(`Resolve ${r.title}`,flag(`${r.id}:resolved`)))};});
 const sides=sideTitles[c].map((title,i):Definition=>{const selected=rooms.slice(i*4,i*4+4);return{id:`chapter-${c+2}-side-${i+1}`,title,chapter:c+2,kind:'side',start:offset+i*4,end:offset+i*4+3,steps:selected.flatMap(r=>[step(`Record evidence in ${r.title}`,flag(`${r.id}:evidence`)),step(`Hear your companions in ${r.title}`,flag(`${r.id}:talk`))])};});
 return [...mains,...sides];
})];

// Read-only projection also supports saves written before quest tracking existed.
// Only encountered arcs are exposed; hidden definitions never enter AI/browser context.
export function questProgress(s:Save):QuestProgress[]{
 const current=position(s);
 return QUESTS.filter(q=>q.start<=current||s.quests?.some(old=>old.id===q.id)).map(q=>{
  const old=s.quests?.find(old=>old.id===q.id);
  const steps=q.steps.map((task,i)=>({label:task.label,done:!!old?.steps[i]?.done||task.test(s)}));
  let status:QuestProgress['status']=old?.status==='declined'?'declined':steps.every(task=>task.done)?'completed':(current>q.end||current===q.end&&s.mode==='complete')&&q.kind==='side'?'missed':'active';
  if(old?.status==='completed'||old?.status==='missed')status=old.status;
  return{id:q.id,title:q.title,chapter:q.chapter,kind:q.kind,status,steps,reward:q.kind==='side'?'2 camp rations · awarded once':'Story XP is awarded by discoveries and encounters.'};
 });
}
export function updateQuests(s:Save,previous:Save){
 if(!s.tactical)return;
 const before=questProgress(previous);s.quests=questProgress(s);
 for(const q of s.quests){
  if(q.status!=='completed'||before.find(old=>old.id===q.id)?.status==='completed')continue;
  if(q.kind==='side'&&!s.flags[`quest-reward:${q.id}`]){s.flags[`quest-reward:${q.id}`]=true;s.party[0].rations+=2;log(s,`Quest complete: ${q.title}. The party secures two camp rations.`);}
  else if(q.kind==='main')log(s,`Quest complete: ${q.title}.`);
 }
}
export function questActions(s:Save):ActionOption[]{
 if(!s.tactical||s.mode!=='explore'||s.companionStoryId)return[];
 return questProgress(s).filter(q=>q.kind==='side'&&q.status==='active').map(q=>({id:`quest:decline:${q.id}`,label:`Leave aside: ${q.title}`,kind:'quest',description:'Leave this optional objective aside for this save. The main story remains available; this quest will not grant its bonus supplies.'}));
}
export function declineQuest(original:Save,id:string):Save{
 if(!questActions(original).some(a=>a.id===id))throw new GameError(422,'QUEST_UNAVAILABLE','That optional quest can no longer be declined.');
 const s=structuredClone(original);s.presentation=[];s.quests=questProgress(s);const q=s.quests.find(q=>q.id===id.slice('quest:decline:'.length))!;q.status='declined';log(s,`You leave aside ${q.title}. The main descent remains open.`);s.revision++;s.updatedAt=new Date().toISOString();return s;
}
