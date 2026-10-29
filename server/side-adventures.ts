import {EXPEDITION} from '../shared/campaign.js';
import type {ActionOption,Entity,SceneId} from '../shared/types.js';
import {resolveOffered,log,type Save} from './game.js';
import {gainPotions,leftBehind} from './expedition-supplies.js';

interface SideAdventure {
 id:string;questId:string;name:string;start:SceneId;investigate:SceneId;finish:SceneId;
 introduction:string;investigation:string;request:string;investigationLabel?:string;
 choices:{label:string;result:string;potions?:number;rations?:number;costRations?:number;preparation?:string}[];
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
 {id:'water-tally',questId:'chapter-3-side-1',name:'Nima, the water carrier',start:'market-1',investigate:'market-2',finish:'market-3',
  request:'Check Nima’s disputed water tokens',introduction:'Nima has been accused of stealing water tokens. Her tally has a second set of marks she cannot read. She asks you to compare them with the glassblower’s old measuring weights before the auction bailiff takes her cart.',
  investigationLabel:'Weigh Nima’s tokens against the glassblower’s measure',investigation:'The old weight is hollow. Its concealed insert makes a full delivery appear short. Nima’s marks record the actual volume; the council’s receipt records the altered weight.',
  choices:[{label:'Give Nima supplies to restart her deliveries',costRations:1,potions:3,result:'You share a ration while Nima arranges an honest measure. She trades three sealed healing draughts from her delivery cart. Her work can continue without a public hearing.'},{label:'Submit both measures to the council hearing',preparation:'market-7',result:'Nima keeps the cart and signs her testimony. Comparing the two measures makes the council’s false accounting harder to deny at the coming hearing.'}]},
 {id:'stolen-play',questId:'chapter-3-side-2',name:'Joss, the stage carpenter',start:'market-5',investigate:'market-6',finish:'market-7',
  request:'Find the missing stage workers',introduction:'Joss has found the theatre’s payroll replaced by a council pamphlet. Two carpenters were reassigned to the furnace without wages. Their signed work orders should still be in the furnace dispatch box. Joss wants to know whether they chose to leave.',
  investigationLabel:'Compare the furnace work orders',investigation:'The workers signed a one-day repair order. Someone extended it by a month in different ink. The carbon copy records their original agreement and the unpaid hours.',
  choices:[{label:'Help the workers organise a public reading',preparation:'market-7',result:'Joss reads the original agreement with the workers beside him. Their evidence joins the council inquiry, making a public accounting easier.'},{label:'Negotiate back pay directly with the theatre',rations:3,result:'The theatre pays the missing wages and supplies three travel meals. The workers return on a new written agreement. The council escapes this particular public charge.'}]},
 {id:'echo-child',questId:'chapter-4-side-1',name:'Leth, the clay mender',start:'roots-1',investigate:'roots-2',finish:'roots-3',
  request:'Find out why Leth’s figure calls for help',introduction:'Leth carries a clay figure that cries whenever the irrigation wheel turns. He fears a child is trapped inside it. He will not break it until someone checks the nursery’s mould records.',
  investigationLabel:'Match the figure to its nursery mould',investigation:'The mould record identifies a copied alarm phrase, not a captive consciousness. A crack lets the irrigation wheel trigger the recording. The repair diagram also marks the nursery’s maintenance route.',
  choices:[{label:'Repair the figure and explain the recording',potions:3,result:'Leth repairs the crack and labels the figure as a recording. He gives you three healing potions from his mending kit, relieved that no child had to be freed by breaking it.'},{label:'Use the repair route to help the evacuation',preparation:'roots-7',result:'Leth marks the maintenance route for the prisoners. The route joins the hanging bridge beyond its locked approach, giving the party a stronger position when demanding passage.'}]},
 {id:'evacuation-list',questId:'chapter-4-side-2',name:'Dara, the lift runner',start:'roots-5',investigate:'roots-6',finish:'roots-7',
  request:'Check Dara’s evacuation count',introduction:'Dara’s lift list has one more name than there are beds. She refuses to leave someone behind or carry an empty bed while an injured prisoner waits. The prison’s root ledger should show who occupied the disputed cell.',
  investigationLabel:'Trace the disputed cell in the root ledger',investigation:'The ledger lists the same prisoner under a birth name and a work number. The spare bed is real. A handwritten note describes how to brace it as a stretcher.',
  choices:[{label:'Give a meal to the stretcher team',costRations:1,preparation:'roots-7',result:'The rested stretcher team carries the injured prisoner to the bridge. Their orderly arrival supports your demand that the gate guard release the entire group.'},{label:'Send the corrected list ahead with Dara',rations:3,result:'Dara corrects the count and arranges an earlier lift. Supplies reserved for the nonexistent extra passenger become three travel rations. Every actual prisoner remains on the list.'}]},
 {id:'novice-name',questId:'chapter-5-side-1',name:'Pell, the slate keeper',start:'choir-1',investigate:'choir-2',finish:'choir-3',
  request:'Find the novice’s erased name',introduction:'Pell has a novice’s slate with a name scraped away after a failed singing trial. She wants it restored but will not guess at the letters. An admission score in the Resonance Library contains the original signature.',
  investigationLabel:'Compare the admission score with Pell’s slate',investigation:'The signature reads Ryn. Beside it, the first teacher wrote that breath is sufficient for admission. The erased name records an exclusion the original trial never required.',
  choices:[{label:'Restore the slate privately for Ryn',potions:3,result:'Pell returns the slate to Ryn without making the novice perform gratitude. Ryn shares three healing potions packed for the journey home that is no longer necessary.'},{label:'Ask Pell to challenge the admission rule',preparation:'choir-4',result:'Pell posts the teacher’s original note with Ryn’s permission. The choir has already seen one false requirement overturned when you challenge the keeper sacrifice.'}]},
 {id:'unpaid-oath',questId:'chapter-5-side-2',name:'Hale, the memorial mason',start:'choir-5',investigate:'choir-6',finish:'choir-7',
  request:'Recover the masons’ release agreement',introduction:'Hale has maintained the memorial for forty years under an oath he was told could not end. A singer remembers a release clause sealed with the descent keys. Hale asks you to read it before he lays down his tools.',
  investigationLabel:'Read the oath beside the descent keys',investigation:'The oath ends when the named work is complete. The memorial has been finished for thirty years; later repairs were freely paid work. Hale can leave without breaking his promise.',
  choices:[{label:'Help Hale pack for the surface',rations:3,result:'Hale closes his workshop and shares three meals from its stores. He keeps one small chisel for work he may choose to do later.'},{label:'Ask Hale to speak to the conductor',preparation:'choir-7',result:'Hale tells Aras how a duty can end without making the years spent on it meaningless. His presence helps you persuade the conductor to leave the cage.'}]},
 {id:'shelter-plan',questId:'chapter-6-side-1',name:'Venn, the refuge surveyor',start:'depth-1',investigate:'depth-2',finish:'depth-3',
  request:'Verify Venn’s emergency shelter map',introduction:'Venn’s map sends evacuees through a room now used as a goblin watch post. He needs the original door-width measurements before promising that the injured can pass through on stretchers.',
  investigationLabel:'Measure the watch-post evacuation doors',investigation:'The emergency doors open outward after their lower bolts are removed. The passage is wide enough for stretchers. The maintenance sketch shows a safer approach to the fracture bridges.',
  choices:[{label:'Give the survey crew a meal for the road',costRations:1,preparation:'depth-5',result:'Venn’s crew removes the bolts and marks the safe bridge approach. Their measurements make the maintenance-anchor crossing easier.'},{label:'Copy the map for the waiting families',rations:3,result:'Families receive a route that has actually been measured. They share three spare meals with the party and arrange their own guides to the widened doors.'}]},
 {id:'keeper-keepsake',questId:'chapter-6-side-2',name:'Iven, the last courier',start:'depth-5',investigate:'depth-6',finish:'depth-7',
  request:'Identify the keeper’s unclaimed parcel',introduction:'Iven has carried an unclaimed parcel for so long that its wax seal has become stone. Its recipient is listed only by a keeper number. A register beside the sixth stone can identify the intended owner without opening it.',
  investigationLabel:'Match the parcel number to the keeper register',investigation:'The register matches the parcel to Neris. It contains seeds ordered before her watch began, with instructions for growing them in ordinary sunlight. The delivery route includes the founders’ circuit-inspection procedure.',
  choices:[{label:'Give Neris her unopened parcel',potions:3,result:'Iven places the parcel with Neris’s travelling things. She has something to plant after the descent. Iven shares three healing potions kept for a delivery emergency.'},{label:'Ask Iven to help inspect the final circuit first',preparation:'depth-7',result:'Iven checks the circuit using the delivery register’s inspection procedure, then places the parcel with Neris’s things. The final closure is easier with a second verified reading.'}]},
];
const key=(a:SideAdventure,suffix:string)=>`side:${a.id}:${suffix}`;
export function sideNextMeeting(s:Save,a:SideAdventure){return !s.flags[key(a,'accepted')]?a.start:!s.flags[key(a,'evidence')]?a.investigate:a.finish;}
const eligible=(s:Save,a:SideAdventure)=>!['declined','missed','completed'].includes(s.quests?.find(q=>q.id===a.questId)?.status??'active')&&EXPEDITION.findIndex(r=>r.id===s.sceneId)<=EXPEDITION.findIndex(r=>r.id===sideNextMeeting(s,a));
export function sideEntities(s:Save):Entity[]{
 if(!s.tactical||s.mode!=='explore')return[];
 return SIDE_ADVENTURES.filter(a=>eligible(s,a)&&!s.flags[key(a,'done')]&&[a.start,a.investigate,a.finish].includes(s.sceneId)&&(s.sceneId===a.start||s.flags[key(a,'accepted')])).map((a,i)=>({
  id:`side:${a.id}`,name:s.sceneId===a.investigate?a.investigationLabel??('Service records · '+a.name.split(',')[0]):a.name,kind:s.sceneId===a.investigate?'clue':'npc',modelClassId:'cleric',position:[2.7,1.8+i],
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
  if(s.sceneId===a.investigate&&!s.flags[key(a,'evidence')])return[make('investigate',a.investigationLabel??('Compare the records for '+a.name.split(',')[0]),'Read the relevant records and bring back a verified account. No check is needed to read accessible records.')];
  if(s.sceneId===a.finish&&s.flags[key(a,'evidence')])return a.choices.flatMap((choice,i)=>{if(choice.preparation&&s.flags[`${choice.preparation}:resolved`])return[];if((choice.costRations??0)>s.party.reduce((n,p)=>n+p.rations,0))return[];const effects=[choice.costRations?`Spend ${choice.costRations} shared ration.`:'',choice.potions?`Receive ${choice.potions} shared healing potions.`:'',choice.rations?`Receive ${choice.rations} shared rations.`:'',choice.preparation?'Your preparation reduces the related check by 3.':''].filter(Boolean).join(' ');return[make(`choose-${i}`,choice.label,`Complete this optional request. ${effects}`)];});
  return[];
 });
}
export function resolveSide(original:Save,id:string):Save{
 return resolveOffered(original,id,sideActions,'SIDE_UNAVAILABLE','That meeting or decision is no longer available.',s=>{
 const[,adventureId,phase]=id.split(':');const a=SIDE_ADVENTURES.find(a=>a.id===adventureId)!;
 if(phase==='accept'){s.flags[key(a,'accepted')]=true;log(s,a.introduction,a.name,[],'authored');}
 else if(phase==='investigate'){s.flags[key(a,'evidence')]=true;s.facts.push({id:key(a,'evidence'),text:a.investigation});log(s,a.investigation,'dm',[],'authored');}
 else{const i=Number(phase.slice('choose-'.length)),choice=a.choices[i];s.flags[key(a,'done')]=true;s.flags[key(a,`choice:${i}`)]=true;let cost=choice.costRations??0;for(const member of s.party){const spent=Math.min(cost,member.rations);member.rations-=spent;cost-=spent;}if(choice.rations)s.party[0].rations+=choice.rations;const supplies=choice.potions?gainPotions(s,choice.potions):undefined;s.facts.push({id:key(a,'outcome'),text:choice.result});log(s,choice.result,a.name,[],'authored');if(supplies?.left)log(s,leftBehind(supplies.given));}
 });
}
export function sidePreparation(sceneId:string,flags:Record<string,boolean>){return SIDE_ADVENTURES.some(a=>a.choices.some((c,i)=>c.preparation===sceneId&&flags[key(a,`choice:${i}`)]))?3:0;}
