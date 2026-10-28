import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSave,legalActions,publicSave,type Save} from '../server/game.js';
import {Storage} from '../server/storage.js';
import {ROOM_FORKS,playedRoom,playstyleLedger,roomFork,type PlaystyleLedger} from '../server/playstyle.js';
import {CAMPAIGN_CONSEQUENCES} from '../server/campaign-consequences.js';
import {EXPEDITION,expeditionRoom} from '../shared/campaign.js';
import {CHAPTER_PAGES,type ChapterRecap} from '../shared/chapter-pages.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {runProfile,type ProfileRun} from '../scripts/playstyle-profiles.js';

/** The Chapter I option each profile takes (scripts/playstyle-profiles.ts), by scene. */
const CHAPTER_ONE_IDS={diplomatic:{cookfire:'offer',prison:'unlock',bell:'negotiate',aftermath:'entrust'},aggressive:{cookfire:'fight',prison:'force',bell:'fight',aftermath:'secure'}} as const;
const XP_LINE=/^The party gains (\d+) XP\.$/;
const chapterOf=(sceneId:string)=>expeditionRoom(sceneId)?.chapter??1;
const firstSentence=(text:string)=>text.match(/^.*?[.!?](?=\s|$)/)?.[0]??text;

interface Observed {run:ProfileRun;xp:number[];labels:Record<string,Record<string,string>>;ledgers:Record<number,PlaystyleLedger>;shown:Record<number,string>;counts:number[];xpLines:{text:string;xp?:number}[];}
/** Plays a profile and records, independently of the recap code, what the player was offered, the XP each chapter earned, the ledger as each chapter began, and each recap the first time it appeared. */
const observed=new Map<string,Observed>();
function observe(profile:'diplomatic'|'aggressive',rules:'echo-v1'|typeof CURATED_RULES_VERSION):Observed{
 const cached=observed.get(profile+rules);if(cached)return cached;
 let o:Omit<Observed,'run'>,seen:Set<string>,lastXp=0,saveId='';
 const look=(s:Save)=>{
  // The aggressive profile retries with another seed when a party falls; only the finished attempt counts.
  if(s.id!==saveId){saveId=s.id;o={xp:[0,0,0,0,0,0,0],labels:{},ledgers:{},shown:{},counts:[],xpLines:[]};seen=new Set();lastXp=0;}
  const {xp,labels,ledgers,shown,counts,xpLines}=o;
  xp[chapterOf(s.sceneId)]+=(s.xp??0)-lastXp;lastXp=s.xp??0;
  for(const a of legalActions(s))(labels[s.sceneId]??={})[a.id]=a.label;
  const room=expeditionRoom(s.sceneId);if(room&&EXPEDITION.find(r=>r.chapter===room.chapter)===room&&!ledgers[room.chapter-1])ledgers[room.chapter-1]=playstyleLedger(s);
  const view=publicSave(s);counts.push(view.chapterRecaps?.length??0);
  for(const recap of view.chapterRecaps??[])shown[recap.chapter]??=JSON.stringify(recap);
  for(const l of s.logs)if(!seen.has(l.id)){seen.add(l.id);if(XP_LINE.test(l.text))xpLines.push({text:l.text,xp:l.xp});}
 };
 const run=runProfile(profile,rules,'guardian',look);
 o!.ledgers[6]=run.finalLedger;
 const result={run,...o!};observed.set(profile+rules,result);return result;
}
const strings=(recaps:ChapterRecap[])=>recaps.flatMap(r=>[...r.changes,...r.choices.map(c=>c.choice)]);

for(const rules of ['echo-v1',CURATED_RULES_VERSION] as const)for(const profile of ['diplomatic','aggressive'] as const)
 test(`#66: a ${profile} ${rules} run ends with six chapter recaps that match its choices, ledger and XP`,()=>{
  const o=observe(profile,rules),s=o.run.save,recaps=publicSave(s).chapterRecaps!;
  assert.equal(o.run.mode,'complete');
  assert.deepEqual(recaps.map(r=>[r.chapter,r.title]),CHAPTER_PAGES.map(p=>[p.chapter,p.name]));
  // Recaps appear one chapter at a time, and a recap never changes once shown.
  assert.deepEqual([...new Set(o.counts)],[0,1,2,3,4,5,6]);
  for(const r of recaps)assert.equal(JSON.stringify(r),o.shown[r.chapter],`Chapter ${r.chapter} changed after it was shown`);
  // Choices: the label offered for the option the profile took.
  const one=CHAPTER_ONE_IDS[profile];
  assert.deepEqual(recaps[0]!.choices.map(c=>[c.room,c.choice]),Object.entries(one).map(([scene,id])=>[scene,o.labels[scene]![id]]));
  for(const r of recaps.slice(1)){
   assert.deepEqual(r.choices.map(c=>c.room),EXPEDITION.filter(room=>room.chapter===r.chapter).map(room=>room.id));
   for(const c of r.choices){const i=s.flags[`${c.room}:choice:0`]?0:1;if(profile==='aggressive')assert.equal(i,1);assert.equal(c.choice,o.labels[c.room]![`exp_choice:${i}`],c.room);}
  }
  // Trust, mercy and force: running totals match the ledger as each next chapter began, and the deltas add up to the final ledger.
  for(const r of recaps){const l=o.ledgers[r.chapter]!;assert.deepEqual(r.trust,{mira:l.mira,oren:l.oren},`Chapter ${r.chapter} trust`);}
  const sum=(k:'mercy'|'force')=>recaps.reduce((n,r)=>n+r[k],0),delta=(k:'mira'|'oren')=>recaps.reduce((n,r)=>n+r.trustDelta[k],0);
  assert.deepEqual({mercy:sum('mercy'),force:sum('force'),mira:delta('mira'),oren:delta('oren')},{mercy:o.run.finalLedger.mercy,force:o.run.finalLedger.force,mira:o.run.finalLedger.mira,oren:o.run.finalLedger.oren});
  assert.ok(profile==='diplomatic'?sum('force')===0&&sum('mercy')>0:sum('mercy')===0&&sum('force')>0);
  // XP: each chapter's share as the run earned it.
  assert.deepEqual(recaps.map(r=>r.xp),o.xp.slice(1));
  assert.equal(recaps.reduce((n,r)=>n+r.xp,0),s.xp);
  // XP log lines carry the amount they state.
  assert.ok(o.xpLines.length>0);
  for(const l of o.xpLines)assert.equal(l.xp,Number(XP_LINE.exec(l.text)![1]),l.text);
 });

test('#66: a recap holds only what the player has read: no clue, companion line, unchosen outcome or unplayed fork',()=>{
 for(const rules of ['echo-v1',CURATED_RULES_VERSION] as const)for(const profile of ['diplomatic','aggressive'] as const){
  const s=observe(profile,rules).run.save,recaps=publicSave(s).chapterRecaps!,all=strings(recaps);
  const seen=s.facts.map(f=>f.text);
  for(const r of recaps.slice(1))for(const line of r.changes)assert.ok(seen.some(text=>text.startsWith(line)),`${profile} ${rules}: "${line}" is not in the journal`);
  for(const room of EXPEDITION){
   const i=s.flags[`${room.id}:choice:0`]?0:1,played=playedRoom(s,room.id)!;
   const hidden=[room.clue,room.voice,firstSentence(room.clue),played.outcomes[1-i]!,firstSentence(played.outcomes[1-i]!)].filter(t=>t!==firstSentence(played.outcomes[i]!));
   const fork=roomFork(s,room.id);
   if(fork)for(const [key,v] of Object.entries(ROOM_FORKS.find(f=>f.room===room.id)!.variants))if(key!==fork.key)hidden.push(...v.choice.filter(c=>!played.choice.includes(c)),...v.outcomes.map(firstSentence).filter(t=>!played.outcomes.map(firstSentence).includes(t)));
   for(const text of all)for(const secret of hidden)assert.ok(!text.includes(secret)&&!secret.includes(text),`${profile} ${rules} ${room.id}: "${text}" reveals "${secret}"`);
  }
  // A returning ally is never credited before the chapter it arrives in.
  for(const r of recaps)for(const help of CAMPAIGN_CONSEQUENCES.filter(c=>expeditionRoom(c.target)!.chapter!==r.chapter))assert.ok(!r.changes.includes(firstSentence(help.result)));
 }
});

test('#66: an older save without the new flags still loads; what it cannot account for is left out',()=>{
 const run=observe('diplomatic','echo-v1').run,storage=new Storage(':memory:');
 const old=structuredClone(run.save);
 for(const key of Object.keys(old.flags))if(/^(rescue|vark):/.test(key))delete old.flags[key];
 for(const l of old.logs)delete l.xp;
 storage.put(old);
 const loaded=publicSave(storage.read(old.id)),recaps=loaded.chapterRecaps!;
 assert.equal(recaps.length,6);
 assert.deepEqual(recaps[0]!.choices.map(c=>c.room),['cookfire','bell','aftermath'],'the gate option was never recorded, so it is left out');
 assert.deepEqual(recaps.slice(1),publicSave(run.save).chapterRecaps!.slice(1));
 // A room with no recorded decision drops its chapter, and the later chapters keep their own deltas.
 const gap=structuredClone(old);delete gap.flags['archive-3:choice:0'];delete gap.flags['archive-3:choice:1'];
 const partial=publicSave(gap).chapterRecaps!;
 assert.deepEqual(partial.map(r=>r.chapter),[1,3,4,5,6]);
 const withoutTotals=(list:ChapterRecap[])=>list.map(({trust,...rest})=>rest);
 assert.deepEqual(withoutTotals(partial.slice(1)),withoutTotals(recaps.slice(2)));
 // XP the flags cannot account for: no recap rather than an invented split.
 const drift=structuredClone(old);drift.xp=(drift.xp??0)+5;
 assert.equal(publicSave(drift).chapterRecaps,undefined);
 storage.close();
 // A fresh save has no finished chapter.
 assert.equal(publicSave(createSave({name:'Aria',classId:'guardian',backgroundId:'envoy',appearanceId:'moon'})).chapterRecaps,undefined);
});

test('#66: chapter title pages use public text the party reads on the way in',()=>{
 assert.doesNotMatch(readFileSync(new URL('../shared/chapter-pages.ts',import.meta.url),'utf8'),/^import /m,'the client imports this file, so it must not pull in clues or outcomes');
 const opening=publicSave(createSave({name:'Aria',classId:'guardian',backgroundId:'envoy',appearanceId:'moon'})).scene;
 assert.equal(CHAPTER_PAGES[0]!.name.toUpperCase(),opening.subtitle);
 for(const line of CHAPTER_PAGES[0]!.prologue)assert.ok(opening.description.includes(line),line);
 const aftermath=(unhurt:boolean)=>{const s=createSave({name:'Aria',classId:'guardian',backgroundId:'envoy',appearanceId:'moon'});s.sceneId='aftermath';if(unhurt)s.flags.aftermathUnhurt=true;return publicSave(s).scene.description;};
 const afterChapterOne=[aftermath(false),aftermath(true)];
 for(const page of CHAPTER_PAGES){
  assert.ok(page.prologue.length>=2&&page.prologue.length<=3);
  if(page.chapter===1)continue;
  const rooms=EXPEDITION.filter(r=>r.chapter===page.chapter),first=rooms[0]!,leadIn=EXPEDITION[EXPEDITION.indexOf(first)-1];
  assert.equal(page.name,first.chapterName);
  const fork=ROOM_FORKS.find(f=>f.room===first.id),firstTexts=fork?Object.values(fork.variants).map(v=>v.description):[first.description];
  for(const line of page.prologue)assert.ok(firstTexts.every(t=>t.includes(line))||(leadIn?[leadIn.description]:afterChapterOne).every(t=>t.includes(line)),`Chapter ${page.chapter}: "${line}"`);
  for(const room of EXPEDITION)for(const line of page.prologue)assert.ok(![room.clue,room.voice,...room.outcomes].some(t=>t.includes(line)),`Chapter ${page.chapter} prologue reveals ${room.id}`);
 }
});
