import {INDEX_PLATES,bellIndexState,type IndexPlate} from '../shared/bell-index.js';
import {resolveOffered,log,type Save} from './game.js';
import type {ActionOption} from '../shared/types.js';
export function indexActions(s:Save):ActionOption[]{
 if(!s.tactical||s.sceneId!=='archive-3'||s.mode!=='explore'||s.party[0].hp<=0||s.companionStoryId||s.flags['archive-3:resolved'])return[];
 const state=bellIndexState(s.flags);if(state.solved)return[];
 const action=(id:string,label:string,description:string):ActionOption=>({id:'index:'+id,label,description,kind:'interact',targetId:'index-console',actorId:'hero'});
 if(!state.read)return[action('read','Read the three catalogue rubbings','Read the ordering clue and the three plate meanings. The clue remains in your journal.')];
 const result=INDEX_PLATES.filter(part=>!state.sequence.includes(part)).map(part=>action(part,`Place ${part} in slot ${state.sequence.length+1}`,'Add this unused plate to the next slot. The catalogue responds only after all three are submitted.'));
 if(state.sequence.length)result.push(action('reset','Clear the catalogue slots','Return all plates without a penalty.'));
 if(state.sequence.length===3)result.push(action('submit','Read the completed catalogue','Test the three-plate order. A wrong order clears the slots; the main route remains available.'));
 return result;
}
export function resolveIndex(original:Save,id:string):Save{
 return resolveOffered(original,id,indexActions,'INDEX_UNAVAILABLE','That catalogue control is unavailable.',s=>{
 const state=bellIndexState(s.flags),part=id.split(':')[1];
 const clear=()=>{for(let slot=0;slot<3;slot++)for(const plate of INDEX_PLATES)delete s.flags[`index:${slot}:${plate}`];};
 if(part==='read'){
  s.flags['index:read']=true;
  const text='Three rubbings explain the catalogue: Witness is the person who saw and remembered; Keeper is the duty freely accepted; Vessel is the bronze body imposed afterward. The margin reads: “First the life that witnessed. Then the work it chose. Last the shell that confined it.”';
  if(!s.facts.some(f=>f.id==='index-order'))s.facts.push({id:'index-order',text});log(s,text,'dm',[],'authored');
 }else if(part==='reset'){clear();log(s,'You lift the plates from their slots. The catalogue waits without judgment.');}
 else if(part==='submit'){
  if(state.sequence.join(',')===INDEX_PLATES.join(',')){
   s.flags['index:solved']=true;const text='The catalogue names the witness Ilyra, then records her oath as keeper, then the order binding her into bronze. You now have the sequence that can restore her name. The drawer remains shut until you decide what to do.';
   if(!s.facts.some(f=>f.id==='index-name'))s.facts.push({id:'index-name',text});log(s,text,'dm',[],'authored');
  }else{clear();log(s,'The catalogue gives a hollow note and returns the plates. It rejects an order that puts duty or a vessel before the person. Review the rubbings and try again, or choose another approach.','dm',[],'authored');}
 }else{s.flags[`index:${state.sequence.length}:${part as IndexPlate}`]=true;log(s,`The ${part} plate settles into slot ${state.sequence.length+1}. ${3-state.sequence.length-1} ${state.sequence.length===1?'slot remains':'slots remain'}.`);}
 });
}
