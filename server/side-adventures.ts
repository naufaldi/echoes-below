import type {ActionOption,Entity,SceneId} from '../shared/types.js';
import {GameError,log,type Save} from './game.js';

interface SideAdventure {
 id:string;questId:string;name:string;start:SceneId;investigate:SceneId;finish:SceneId;
 introduction:string;investigation:string;request:string;
 choices:{label:string;result:string;potions?:number;preparation?:string}[];
}
// Authored scenes remain server-side. Public projection includes only the current meeting.
export const SIDE_ADVENTURES:SideAdventure[]=[
 {id:'water-names',questId:'chapter-2-side-1',name:'Elian, the ferry clerk',start:'archive-1',investigate:'archive-2',finish:'archive-3',
  introduction:'Elian holds a water-stained passenger register beside the ferry. Two families have paid him to search for the same child under different names. He asks you to compare the register with the living pages in the Ink Garden before he sends either family an answer.',
  request:'Help Elian identify the passenger',
  investigation:'A reed records a correction in the child’s own handwriting: the second name was chosen after adoption. Both families were looking for the same person. You copy the correction without tearing the living page.',
  choices:[
   {label:'Return a private letter to both families',result:'Elian writes to both families and leaves the child’s chosen name out of the public register. The families send three healing potions for the search. The council will not receive this testimony.',potions:3},
   {label:'Authenticate the correction for the public inquiry',result:'Elian asks the librarian to seal a copy while protecting the child’s address. The verified adoption record exposes how the council counted missing people twice. Presenting the public accounting in the Ash Market will be easier.',preparation:'market-7'},
  ]},
 {id:'borrowed-memory',questId:'chapter-2-side-2',name:'Sera, the witness keeper',start:'archive-5',investigate:'archive-6',finish:'archive-7',
  introduction:'Sera carries a witness mask that calls her daughter’s name. She knows it is a recording, but fears destroying it would mean choosing to forget. A repair note points to a playback switch beneath the Glass Causeway. She asks you to find out whether the voice can be made silent without erasing it.',
  request:'Investigate Sera’s witness mask',
  investigation:'The causeway service panel separates playback from storage. You copy the shutdown sequence: turning the brass spindle silences the mask while keeping its record intact. The same service stamp authenticates the archive’s original contracts.',
  choices:[
   {label:'Help Sera keep a silent recording',result:'Sera turns the spindle herself. The voice stops; the record remains. She can decide when, or whether, to hear it again. She gives the party three healing potions that she had saved for another rescue.',potions:3},
   {label:'With Sera’s agreement, lodge the record as testimony',result:'Sera silences the mask and signs a statement explaining exactly what it contains. The service stamp proves that Sel altered his contracts. His contract challenge is easier; Sera retains the right to reclaim the recording.',preparation:'archive-7'},
  ]},
];
const key=(a:SideAdventure,suffix:string)=>`side:${a.id}:${suffix}`;
const eligible=(s:Save,a:SideAdventure)=>!['declined','missed','completed'].includes(s.quests?.find(q=>q.id===a.questId)?.status??'active');
export function sideEntities(s:Save):Entity[]{
 if(!s.tactical||s.mode!=='explore')return[];
 return SIDE_ADVENTURES.filter(a=>eligible(s,a)&&!s.flags[key(a,'done')]&&[a.start,a.investigate,a.finish].includes(s.sceneId)&&(s.sceneId===a.start||s.flags[key(a,'accepted')])).map((a,i)=>({
  id:`side:${a.id}`,name:s.sceneId===a.investigate?'Service records · '+a.name.split(',')[0]:a.name,kind:s.sceneId===a.investigate?'clue':'npc',modelClassId:'cleric',position:[2.7,1.8+i],
  description:s.sceneId===a.start?a.introduction:s.sceneId===a.investigate?'Compare the records for the request you accepted.':'Return with the evidence and decide how to help.',
 }));
}
export function sideActions(s:Save):ActionOption[]{
 if(!s.tactical||s.mode!=='explore'||s.companionStoryId)return[];
 return SIDE_ADVENTURES.flatMap(a=>{
  if(!eligible(s,a)||s.flags[key(a,'done')])return[];
  const make=(phase:string,label:string,description:string):ActionOption=>({id:`side:${a.id}:${phase}`,label,description,kind:'interact',targetId:`side:${a.id}`});
  if(s.sceneId===a.start&&!s.flags[key(a,'accepted')])return[make('accept',a.request,a.introduction)];
  if(!s.flags[key(a,'accepted')])return[];
  if(s.sceneId===a.investigate&&!s.flags[key(a,'evidence')])return[make('investigate','Compare the records for '+a.name.split(',')[0],'Read the relevant records and bring back a verified account. No check is needed to read accessible records.')];
  if(s.sceneId===a.finish&&s.flags[key(a,'evidence')])return a.choices.map((choice,i)=>make(`choose-${i}`,choice.label,choice.potions?'Complete this optional request. Receive three shared healing potions; the record stays private.':'Complete this optional request. Verified testimony reduces the related future check by 3; it grants no extra potions.'));
  return[];
 });
}
export function resolveSide(original:Save,id:string):Save{
 if(!sideActions(original).some(a=>a.id===id))throw new GameError(422,'SIDE_UNAVAILABLE','That meeting or decision is no longer available.');
 const s=structuredClone(original);s.presentation=[];const[,adventureId,phase]=id.split(':');const a=SIDE_ADVENTURES.find(a=>a.id===adventureId)!;
 if(phase==='accept'){s.flags[key(a,'accepted')]=true;log(s,a.introduction,a.name,[],'authored');}
 else if(phase==='investigate'){s.flags[key(a,'evidence')]=true;s.facts.push({id:key(a,'evidence'),text:a.investigation});log(s,a.investigation,'dm',[],'authored');}
 else{const i=Number(phase.slice('choose-'.length)),choice=a.choices[i];s.flags[key(a,'done')]=true;s.flags[key(a,`choice:${i}`)]=true;if(choice.potions)s.party.forEach((p,j)=>p.potions+=Math.floor(choice.potions!/s.party.length)+(j<choice.potions!%s.party.length?1:0));s.facts.push({id:key(a,'outcome'),text:choice.result});log(s,choice.result,a.name,[],'authored');}
 s.revision++;s.updatedAt=new Date().toISOString();return s;
}
export function sidePreparation(sceneId:string,flags:Record<string,boolean>){return SIDE_ADVENTURES.some(a=>a.choices.some((c,i)=>c.preparation===sceneId&&flags[key(a,`choice:${i}`)]))?3:0;}
