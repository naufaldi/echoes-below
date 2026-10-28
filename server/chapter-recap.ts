import {EXPEDITION,expeditionRoom} from '../shared/campaign.js';
import {CHAPTER_PAGES,type ChapterRecap} from '../shared/chapter-pages.js';
import type {SceneId} from '../shared/types.js';
import {CAMPAIGN_CONSEQUENCES} from './campaign-consequences.js';
import {chapterOneDone,playedRoom,playstyleLedger} from './playstyle.js';
import {INK_RESCUE,INK_RESCUE_LABEL} from './ink-garden.js';
import {PREPARED_RESCUE,PREPARED_RESCUE_LABEL} from './infirmary.js';
import {heroNamed,sceneTitle,type Save} from './game.js';

/** #66: the recap of each finished chapter, derived from flags and journal facts every save already records; nothing here is persisted. Logs are capped, so they are never read. */
const ROOM_ENCOUNTER_XP=100;
const CHAPTER_ONE:SceneId[]=['approach','hall','cookfire','prison','bell','aftermath'];
/** Chapter I's journal facts that award XP. A fact id outside this list and the room-scoped ids cannot be placed in a chapter. */
const CHAPTER_ONE_FACTS=['counterweight-procedure','maintenance','courier','plate','captives','ledger','seal-purpose'];
const sceneChapter=(id:string)=>CHAPTER_ONE.includes(id as SceneId)?1:expeditionRoom(id)?.chapter;
/** Every XP award, by the key game.ts records as its `xp:<key>` flag: the amount, and the chapter that earned it. */
export function experienceAward(key:string):{amount:number;chapter?:number}|undefined{
 const [kind,id='',sub]=key.split(':');
 if(kind==='entered')return {amount:50,chapter:sceneChapter(id)};
 if(kind==='encounter')return {amount:id==='bell'?250:ROOM_ENCOUNTER_XP,chapter:sceneChapter(id)};
 if(kind==='room'){const room=expeditionRoom(id);return room&&{amount:room.xp,chapter:room.chapter};}
 if(kind==='resolution')return {amount:ROOM_ENCOUNTER_XP,chapter:expeditionRoom(id)?.chapter};
 if(kind==='fact')return {amount:35,chapter:sub===undefined?(CHAPTER_ONE_FACTS.includes(id)?1:undefined):id==='consequence'?sceneChapter(CAMPAIGN_CONSEQUENCES.find(c=>c.id===sub)?.target??''):['evidence','decision','victory'].includes(id)?sceneChapter(sub):undefined};
}
/** XP per chapter (index 1–6), or nothing when an award cannot be placed or the awards do not add up to the save's XP. */
function chapterXp(s:Save){
 const xp=[0,0,0,0,0,0,0];let total=0;
 for(const [flag,on] of Object.entries(s.flags))if(on&&flag.startsWith('xp:')){const award=experienceAward(flag.slice(3));if(!award?.chapter)return;xp[award.chapter]+=award.amount;total+=award.amount;}
 return total===(s.xp??0)?xp:undefined;
}
/** A chapter is finished once the party has left it; the last one once the descent is complete. */
function finishedChapters(s:Save){
 if(!chapterOneDone(s))return 0;
 const room=expeditionRoom(s.sceneId);
 return !room?1:room.id===EXPEDITION.at(-1)!.id&&s.mode==='complete'?6:room.chapter-1;
}
/** The ledger's running totals at the end of a chapter: everything before the next chapter's first room. */
const ledgerAt=(s:Save,chapter:number)=>playstyleLedger(s,EXPEDITION.find(r=>r.chapter===chapter+1)?.id);
/** Chapter I's decisions as the labels game.ts offers. A decision older saves did not record is left out. */
const CHAPTER_ONE_CHOICES:[SceneId,(s:Save)=>string|undefined][]=[
 ['cookfire',({flags:f})=>f.guardsDefeated?'Attack the guards':f.fed?'Offer a ration':f.guardsDistracted?'Distract the guards':f.passage?'Mention the captive tracks':undefined],
 ['prison',({flags:f})=>f['rescue:unlock']?'Use the guard key':f['rescue:pick']?'Pick the gate lock':f['rescue:force']?'Break open the gate':undefined],
 ['bell',({flags:f})=>f.negotiated||f['vark:negotiate']?'Negotiate a seal transfer':f['vark:maintenance']?'Use the maintenance entrance':f['vark:fight']?'Fight Vark':undefined],
 ['aftermath',s=>s.inventory.seal?'Secure the seal':'Entrust Scrit with its guard'],
];
const SCRIT_LINE={guardian:'Scrit guards the relay.',friend:'Scrit shares his cookfire with you.',scattered:'Scrit has fled deeper into the relay.',stranger:undefined};
function chapterOne(s:Save){
 const choices=CHAPTER_ONE_CHOICES.flatMap(([room,label])=>{const choice=label(s);return choice?[{room,title:sceneTitle(room),choice}]:[];});
 const changes=[s.flags.rescued&&'The courier is free.',s.flags.negotiated?'Vark gives up the seal without a fight.':'Vark falls to one knee and yields the seal.',SCRIT_LINE[playstyleLedger(s,'archive-1').scrit],s.inventory.seal&&'You carry the resonance seal.'].filter((line):line is string=>!!line);
 return {choices,changes};
}
const firstSentence=(text:string)=>text.match(/^.*?[.!?](?=\s|$)/)?.[0]??text;
/** A later chapter: each room's decision and its first sentence as the journal recorded it, with any returning ally's help before it. Nothing when a room's decision is missing. */
function expeditionChapter(s:Save,chapter:number){
 const choices:ChapterRecap['choices']=[],changes:string[]=[];
 for(const room of EXPEDITION.filter(r=>r.chapter===chapter)){
  const i=s.flags[`${room.id}:choice:0`]?0:s.flags[`${room.id}:choice:1`]?1:undefined;if(i===undefined)return;
  const decision=s.facts.find(x=>x.id===`decision:${room.id}`)?.text;
  choices.push({room:room.id,title:room.title,choice:i===0&&decision===INK_RESCUE?INK_RESCUE_LABEL:i===0&&decision===PREPARED_RESCUE?PREPARED_RESCUE_LABEL:playedRoom(s,room.id)!.choice[i]});
  for(const help of CAMPAIGN_CONSEQUENCES.filter(c=>c.target===room.id)){const text=s.facts.find(x=>x.id===`consequence:${help.id}`)?.text;if(text)changes.push(firstSentence(heroNamed(s,text)));}
  if(decision)changes.push(firstSentence(heroNamed(s,decision)));
 }
 return {choices,changes};
}
export function chapterRecaps(s:Save):ChapterRecap[]|undefined{
 const done=finishedChapters(s);if(!done)return;
 const xp=chapterXp(s);if(!xp)return;
 const recaps:ChapterRecap[]=[];let before={mira:0,oren:0,mercy:0,force:0};
 for(let chapter=1;chapter<=done;chapter++){
  const l=ledgerAt(s,chapter),story=chapter===1?chapterOne(s):expeditionChapter(s,chapter);
  if(story)recaps.push({chapter,title:CHAPTER_PAGES[chapter-1]!.name,choices:story.choices,trust:{mira:l.mira,oren:l.oren},trustDelta:{mira:l.mira-before.mira,oren:l.oren-before.oren},mercy:l.mercy-before.mercy,force:l.force-before.force,xp:xp[chapter]!,changes:story.changes});
  before=l;
 }
 return recaps;
}
