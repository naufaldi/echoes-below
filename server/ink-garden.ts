import {resolveOffered,log,type Save} from './game.js';
import type {ActionOption,Scene} from '../shared/types.js';
export const INK_RESCUE='The apprentice lifts the repaired lantern while you carry the sleeved reeds clear of its heat. The living pages remain intact. She chooses to leave with you, carrying the light, and offers to witness Sel’s contracts when you reach his desk. No name needs to burn for the road ahead.';
/** The rescue option's label once the lantern is ready; the chapter recap repeats it. */
export const INK_RESCUE_LABEL='Leave with the apprentice and protected pages';
export function inkPrepared(s:Save){return !!s.tactical&&s.sceneId==='archive-2'&&!!s.flags['ink:wick'];}
export function inkActions(s:Save):ActionOption[]{
 if(!s.tactical||s.sceneId!=='archive-2'||s.mode!=='explore'||s.party[0].hp<=0||s.companionStoryId||s.flags['archive-2:resolved'])return[];
 const f=s.flags,result:ActionOption[]=[];
 const add=(id:string,label:string,description:string,targetId='ink-lantern')=>result.push({id:'ink:'+id,label,description,kind:'interact',targetId,actorId:'hero'});
 if(!f['ink:inspect'])add('inspect','Inspect the smoking lantern','Examine its fuel and damaged wick before committing to a rescue.');
 if(!f['ink:ask'])add('ask','Ask the apprentice why she burns the pages','Hear what she fears and what she has already tried.','ink-apprentice');
 if(f['ink:inspect']&&f['ink:ask']&&!f['ink:sleeve'])add('sleeve','Shield the reeds with their clay sleeves','Slide the existing protective sleeves around the living pages. No inventory resource is required.','ink-reeds');
 if(f['ink:sleeve']&&!f['ink:wick'])add('wick','Lower the wick and close the lantern hood','Use the remaining oil efficiently. Preparation does not commit your final choice.');
 return result;
}
export function resolveInk(original:Save,id:string):Save{
 return resolveOffered(original,id,inkActions,'INK_UNAVAILABLE','That garden preparation is unavailable.',s=>{
 s.flags[id]=true;
 const texts:Record<string,string>={
 inspect:'The reservoir still contains oil. A bent wick stands too high above its brass guide, producing smoke instead of a steady flame. Empty clay sleeves lie beneath the reeds; they once protected the pages from heat. Repair is possible, but first you need the apprentice to stop feeding the flame long enough to work.',
 ask:'“The shapes at the shelves stop moving when the lantern is bright,” the apprentice says. “I fed it a blank margin first. Then a date. I told myself nobody would miss a date.” She looks at the cut stems. “I tried turning the wick up. It only made more smoke. If you can keep the light steady, I can stop cutting. Please tell me what you need me to hold.”',
 sleeve:'With the apprentice holding the lantern away, you slide each reed into its open-topped clay sleeve. The writing remains visible through narrow slots. The existing sleeves will keep the leaves clear of the flame while you adjust the wick; no pages are cut.',
 wick:'You straighten the wick guide, lower the flame into the hood, and open its air holes. The oil burns with a steady gold light. The apprentice lowers her shears. “That was all it needed? I wish someone had looked with me.” The lantern can now travel without burning the sleeved pages. She waits for your decision.'
 };
 const text=texts[id.split(':')[1]];s.facts.push({id,text});log(s,text,id==='ink:ask'?'apprentice':'dm',[],'authored');
 });
}
export function projectInk(s:Save,scene:Scene){
 if(!s.tactical||s.sceneId!=='archive-2'||s.mode==='combat')return;
 const resolved=!!s.flags['archive-2:resolved'];scene.inkGarden={sleeved:!!s.flags['ink:sleeve'],ready:inkPrepared(s),departed:resolved,lanternTaken:resolved&&!!s.flags['archive-2:choice:0']};
 scene.entities.push({id:'ink-reeds',name:scene.inkGarden.sleeved?'Protected living pages':'Living pages',kind:'clue',position:[-3,1.5],description:'Written leaves rise from clay reed beds.'},{id:'ink-lantern',name:scene.inkGarden.ready?'Steady lantern':'Smoking lantern',kind:'clue',position:[-1,2],description:'An oil lantern with an adjustable wick and hood.'});
 if(scene.inkGarden.lanternTaken)scene.entities=scene.entities.filter(e=>e.id!=='ink-lantern');
 if(!resolved)scene.entities.push({id:'ink-apprentice',name:'Archive apprentice',kind:'npc',modelClassId:'adept',appearanceId:'moon',position:[-2.5,3],description:'The apprentice watches the flame beside the living pages.'});
 if(resolved){scene.description=inkPrepared(s)&&s.flags['archive-2:choice:0']?INK_RESCUE:s.flags['archive-2:choice:0']?'The apprentice has left with the lantern. Cut reeds mark the names lost to its earlier flame.':'The transplanted pages remain. The apprentice has escaped through the dark shelves.';scene.objective='Continue through the archive. Your journal keeps what happened here.';}
}
