import {resolveOffered,fact,log,type Save} from './game.js';
import type {ActionOption} from '../shared/types.js';
const controls=[['pawl','Release the pawl'],['weight','Seat the counterweight'],['pin','Lock the safety pin']] as const;
function stage(s:Save){return s.flags['counterweight:weight']?2:s.flags['counterweight:pawl']?1:0;}
export function counterweightActions(s:Save):ActionOption[]{
 if(s.sceneId!=='hall'||s.mode!=='explore'||s.companionStoryId||s.party[0].hp<=0||s.flags.trapSpent)return[];
 const result:ActionOption[]=[];
 const add=(id:string,label:string,description:string)=>result.push({id:'counterweight:'+id,label,description,kind:'interact',targetId:'chain',actorId:'hero'});
 if(!s.flags['counterweight:read'])add('read','Read the keeper’s maintenance plate','Read the engraved safety procedure. No roll; the instructions remain in your journal.');
 else{
  for(const [id,label] of controls)add(id,label,'Operate this control. A wrong sequence resets the controls and raises the alarm once. You can still use the ledge or cross the hall.');
  if(stage(s)>0)add('reset','Reset the controls safely','Return to the start without raising the alarm.');
 }
 return result;
}
export function resolveCounterweight(original:Save,id:string):Save{
 return resolveOffered(original,id,counterweightActions,'PUZZLE_ACTION','That control is not available now.',s=>{
 const choice=id.split(':')[1];
 if(choice==='read'){
  s.flags['counterweight:read']=true;
  fact(s,'counterweight-procedure','The keeper’s plate instructs: release the pawl before seating the counterweight; seat the weight before locking the safety pin. The wrong order rings the warning chain.');
  log(s,'Three controls sit beside the chain: a toothed pawl, a counterweight handle, and a brass safety pin. All are at rest.','dm',[],'authored');
 }else if(choice==='reset'){
  s.flags['counterweight:pawl']=false;s.flags['counterweight:weight']=false;
  log(s,'You ease the handle back. The pawl catches, the weight rises, and the safety pin is free. The controls are reset without ringing the chain.');
 }else if(choice!==controls[stage(s)][0]){
  s.flags['counterweight:pawl']=false;s.flags['counterweight:weight']=false;
  const first=!s.flags['counterweight:mistake'];s.flags['counterweight:mistake']=true;s.flags.alarm=true;
  log(s,first?'The warning chain rings. The controls spring back to rest; someone below may have heard. The plate’s procedure is still in your journal.':'The controls spring back to rest. The alarm was already raised. Review the plate’s procedure or choose another route.');
 }else if(choice==='pawl'){
  s.flags['counterweight:pawl']=true;log(s,'The pawl lifts clear of the teeth. The counterweight handle can now lower the weight. The safety pin remains loose.');
 }else if(choice==='weight'){
  s.flags['counterweight:weight']=true;log(s,'The weight settles into its cradle. A brass hole aligns with the safety pin; the pawl is still released.');
 }else{
  s.flags.trapSpent=true;s.flags.maintenance=true;s.flags['counterweight:solved']=true;
  fact(s,'maintenance','A relay diagram marks a maintenance entrance into the bell chamber.');
  log(s,'The safety pin slides home. The chain slackens and the pressure plate locks safely in place. Behind the handle, a service diagram shows another entrance to the bell chamber.');
 }
 });
}
