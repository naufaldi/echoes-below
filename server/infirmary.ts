import {resolveOffered,log,type Save} from './game.js';
import type {ActionOption,Scene} from '../shared/types.js';
export const PREPARED_RESCUE='The braced cot settles gently as you guide the medic out. His medicine remains dry in its secured case. He thanks you for making a place for him before opening the water, and keeps the medicine for his patients.';
/** The rescue option's label once the cot is braced; the chapter recap repeats it. */
export const PREPARED_RESCUE_LABEL='Help the medic from the lowered cot';
export function infirmaryPrepared(s:Save){return !!s.tactical&&s.sceneId==='archive-4'&&!!s.flags['infirmary:drain'];}
export function infirmaryActions(s:Save):ActionOption[]{
 if(!s.tactical||s.sceneId!=='archive-4'||s.mode!=='explore'||s.party[0].hp<=0||s.companionStoryId||s.flags['archive-4:resolved'])return[];
 const f=s.flags,result:ActionOption[]=[];
 const add=(id:string,label:string,description:string,targetId='infirmary-valve')=>result.push({id:'infirmary:'+id,label,description,kind:'interact',targetId,actorId:'hero'});
 if(!f['infirmary:inspect'])add('inspect','Inspect the infirmary release mechanism','Read the safety marks. Preparation consumes no resource and does not release the medic.');
 if(!f['infirmary:signal']&&!f['infirmary:drain'])add('signal','Signal to the trapped medic','Read his reply through the glassy water.','field-medic');
 if(f['infirmary:inspect']&&!f['infirmary:brace'])add('brace','Brace the floating cot','Secure the cot to its existing floor anchors before draining the pocket.','infirmary-cot');
 if(f['infirmary:brace']&&!f['infirmary:drain'])add('drain','Slowly drain the braced pocket','Lower the cot and its medicine safely. You still choose when to help the medic out.');
 return result;
}
export function resolveInfirmary(original:Save,id:string):Save{
 return resolveOffered(original,id,infirmaryActions,'INFIRMARY_UNAVAILABLE','That infirmary action is unavailable.',s=>{
 const part=id.split(':')[1];s.flags[id]=true;
 const texts:Record<string,string>={
 inspect:'The release plate shows a cot above two floor anchors. A red stroke crosses the open drain; beneath it, a second drawing shows the cot tethered before the valve turns. The medicine case is strapped to the cot. You can brace the cot, drain slowly, and guide the medic out without a risky catch.',
 signal:'The medic presses a slate against the water: “Still breathing. The pocket holds air around the cot.” He points to its straps, then the floor anchors. Under that he writes: “Those vials are for whoever needs them. Leave the case with me.” His breathing remains steady as you study the mechanism.',
 brace:'You pull the cot’s tether through the floor anchors and lock its existing cleat. The slack tether tightens as the cot stops drifting. The medicine case remains strapped shut. The valve can now lower the cot without dropping it.',
 drain:'You turn the valve a little at a time. Water runs into the maintenance channel while the tether lowers the cot. The medic waits at its edge, coughing but able to breathe. His medicine is dry. He reaches toward you, waiting for a steady hand before he tries to stand.'
 };
 const text=texts[part];s.facts.push({id:'infirmary-'+part,text});log(s,text,'dm',[],'authored');
 });
}
export function projectInfirmary(s:Save,scene:Scene){
 if(!s.tactical||s.sceneId!=='archive-4'||s.mode==='combat')return;
 const resolved=!!s.flags['archive-4:resolved'],prepared=infirmaryPrepared(s),drained=resolved||prepared;
 scene.infirmary={braced:!!s.flags['infirmary:brace'],drained,rescued:resolved};
 if(prepared)scene.description=resolved?PREPARED_RESCUE:'The pocket has drained into its channel. A braced cot and its dry medicine case rest beside the floor anchors. The medic waits at the cot’s edge for help out.';
 scene.entities.push(
  {id:'field-medic',name:resolved?'Rescued field medic':drained?'Waiting field medic':'Trapped field medic',kind:'npc',modelClassId:'cleric',position:drained?[-3,.6]:[-3,2],elevation:drained?0:2.1,description:resolved?'The medic has escaped the inverted water.':drained?'The medic waits beside the lowered cot for help.':'A medic waits on the cot inside the inverted pocket.'},
  {id:'infirmary-cot',name:drained?'Lowered cot':scene.infirmary.braced?'Braced cot':'Floating cot',kind:'clue',position:[-3,2],description:'An anchored cot carries the medic’s medicine.'},
  {id:'infirmary-valve',name:drained?'Open maintenance drain':'Maintenance valve',kind:'clue',position:[-1,1.7],description:'The valve controls the inverted water pocket.'}
 );
}
