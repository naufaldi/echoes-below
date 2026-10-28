import type {CampaignRecap} from '../shared/endings.js';
import {descentMap,roomSettled,type MapDepth} from './descent-map.js';
// #69 The ending page's words, from the public save and its end-only recap. Mechanics read as tags without verbs; the lines are the narrator's (ROADMAP §6).
export interface RecapRow {key:string;tag:string;line:string;}
interface EndingSave {ending:string|null;mode:string;scene:{id:string};actions:{id:string}[];facts:{id:string;text:string}[];}

/** The ending in two paragraphs: the ending itself, then how the final room closed it. The final room's outcome is the public `decision:depth-8` fact. */
export function endingParagraphs(save:EndingSave,title:string):string[]{
 const prose=(save.ending??'').replace(`${title}. `,'').trim(),last=save.facts.find(f=>f.id===`decision:${save.scene.id}`)?.text;
 return last&&prose.endsWith(last)&&prose.length>last.length?[prose.slice(0,-last.length).trim(),last]:[prose];
}
const SCRIT:Record<CampaignRecap['scrit'],string>={guardian:'Scrit keeps the relay’s watch, and the cookfire burns for whoever comes up the stairs.',friend:'Scrit shared his fire with you, and remembers who shared theirs.',scattered:'Scrit fled when the guards fell, and no one below has seen him since.',stranger:'Scrit never learned your names, and you never learned his side.'};
const name=(who:'mira'|'oren')=>who==='mira'?'Mira':'Oren';
/** The path the run took, from the descent map: every room behind the party, plus the final one once its choice is made. */
export function pathTaken(save:EndingSave):{depths:MapDepth[];cleared:number;total:number}{
 const depths=descentMap(save.scene.id,roomSettled(save)),rooms=depths.flatMap(d=>d.rooms);
 return {depths,cleared:rooms.filter(r=>r.state==='cleared'||r.settled).length,total:rooms.length};
}
export function recapRows(save:EndingSave,recap:CampaignRecap):RecapRow[]{
 const choices=save.facts.filter(f=>f.id.startsWith('decision:')).length,{cleared,total}=pathTaken(save),other=recap.companion==='mira'?'oren':'mira';
 return [
  {key:'choices',tag:`Choices · ${choices}`,line:'Each one is written in your journal.'},
  {key:'trust',tag:`Trust · Mira ${recap.mira} · Oren ${recap.oren}`,line:recap.mira===recap.oren?'Mira and Oren trusted you alike.':`${name(recap.companion)} trusted you most. ${name(other)} followed anyway.`},
  {key:'stance',tag:`Mercy ${recap.spared} · Force ${recap.fought}`,line:recap.stance==='mercy'?'You chose talk over steel.':'You let steel decide.'},
  {key:'scrit',tag:'Scrit',line:SCRIT[recap.scrit]},
  {key:'rooms',tag:`Rooms cleared · ${cleared} of ${total}`,line:'Six depths, from the bell to the first morning.'},
 ];
}
