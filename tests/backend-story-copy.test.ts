import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,publicSave,type Save} from '../server/game.js';
import {EXPEDITION} from '../shared/campaign.js';
import type {GameLog,OutcomeCheck} from '../shared/types.js';
import {paginate,storyLines,storyPages,tagText} from '../client/story-pages.js';

/** #64 part 2: the story box's copy. U1 (a speaker named twice) and U4 (level-ups and XP inside the prose). */
const make=()=>createSave({name:'Aria',classId:'scout',backgroundId:'envoy',appearanceId:'moon',raceId:'elf'});
const view=(s:Save)=>publicSave(s);
const cast=view(make());
let n=0;const entry=(text:string,extra:Partial<GameLog>={}):GameLog=>({id:`l${n++}`,revision:1,speaker:'dm',source:'rules',text,rolls:[],...extra});
const xp=(amount:number)=>entry(`The party gains ${amount} XP.`);
const level2=entry('Level 2! Everyone gains 6 maximum health and 1 focus.',{levelUp:{level:2,maxHp:6,focus:1}});
const pagesOf=(logs:GameLog[])=>paginate(storyLines(logs,cast));
const tags=(logs:GameLog[])=>pagesOf(logs).flatMap(p=>p.tags).map(tagText);

test('U1: “Hear your companions” shows the plate once, not “Mira: …” under a Mira plate',()=>{
 const room=EXPEDITION[0]!,s=make();s.sceneId=room.id;
 const next=applyAction(s,'exp_talk',()=>10),pages=storyPages(view(next));
 const speaker=room.voice.startsWith('Mira')?'Mira':'Oren';
 assert.equal(pages[0]!.voice,'character');assert.equal(pages[0]!.name,speaker);
 assert.equal(pages.map(p=>p.text).join(' '),room.voice.slice(speaker.length+1).trim());
 assert.ok(!pages.some(p=>p.text.startsWith(speaker+':')));
});
test('U1: a prefix is stripped only when it names the plate’s own speaker',()=>{
 const [spaced]=storyLines([entry('Mira : Stay close.',{speaker:'mira',source:'authored'})],cast);
 assert.deepEqual([spaced!.name,spaced!.text],['Mira','Stay close.']);
 // Another name in a character line is part of what they say.
 const [quoted]=storyLines([entry('Oren: that is what he said.',{speaker:'mira',source:'authored'})],cast);
 assert.deepEqual([quoted!.name,quoted!.text],['Mira','Oren: that is what he said.']);
 // A rules line that opens with a name is narration, and keeps it (older saves read this way).
 const [rules]=storyLines([entry('Mira: Read the tracks succeeded (14 vs DC 10).',{speaker:'mira'})],cast);
 assert.deepEqual([rules!.voice,rules!.text],['narrator','Mira: Read the tracks succeeded (14 vs DC 10).']);
});
test('U1: an unscripted DM line in a party member’s name reads as their dialogue; any other name stays narration',()=>{
 const [oren]=storyLines([entry('Oren: Orders tell us who to fight.',{source:'authored'})],cast);
 assert.deepEqual([oren!.voice,oren!.speakerId,oren!.name,oren!.text],['character','oren','Oren','Orders tell us who to fight.']);
 const [hero]=storyLines([entry('Aria: I will go first.',{source:'ai'})],cast);
 assert.deepEqual([hero!.speakerId,hero!.text],['hero','I will go first.']);
 for(const text of ['Scrit: The ration, please.','Commander Vark: Kneel.','Miranda: Not a party name.']){
  const [l]=storyLines([entry(text,{source:'authored'})],cast);assert.deepEqual([l!.voice,l!.speakerId,l!.text],['narrator',null,text]);
 }
 // DM rules text is never re-voiced, even with a party name.
 const [rules]=storyLines([entry('Mira: Hidden.')],cast);assert.equal(rules!.voice,'narrator');
});
test('U4: a level-up is a tag on its page, not a sentence in the prose; the journal keeps the sentence',()=>{
 const logs=[entry('The ledger names the missing captives.'),xp(90),level2];
 const [page,...rest]=pagesOf(logs);
 assert.equal(rest.length,0);assert.equal(page!.text,'The ledger names the missing captives.');
 assert.deepEqual(page!.tags.map(tagText),['+90 XP','Level 2 · +6 max HP · +1 focus']);
 assert.equal(storyLines(logs,cast,{rollTags:true}).at(-1)!.text,level2.text);
 // Curated gains vary by class: the tag names the level only.
 assert.deepEqual(tags([entry('Level 3! Your class health and spell slot capacity increase.',{levelUp:{level:3}})]),['Level 3']);
});
test('U4: the engine’s level-up leaves the prose and becomes a tag',()=>{
 const room=EXPEDITION.find(r=>r.id==='market-3')!;const s=make();s.sceneId=room.id;s.xp=250;
 const next=applyAction(s,'exp_choice:0',()=>20),saved=view(next),up=saved.logs.find(l=>l.levelUp&&l.revision===next.revision);
 assert.ok(up,'this action levels the party');
 const pages=storyPages(saved),text=pages.map(p=>p.text).join(' ');
 assert.doesNotMatch(text,/Level 2|maximum health/);
 assert.ok(pages.flatMap(p=>p.tags).map(tagText).includes('Level 2 · +6 max HP · +1 focus'));
 assert.equal(pages.flatMap(p=>p.tags).filter(t=>/XP/.test(tagText(t))).length,1,'one XP figure: check.xp');
});
test('U4: two XP amounts on one page sum, even with the level tag between them',()=>{
 assert.deepEqual(tags([entry('The seal gives way.'),xp(90),level2,xp(35)]),['+125 XP','Level 2 · +6 max HP · +1 focus']);
 // Different pages keep their own amounts.
 assert.deepEqual(pagesOf([entry('A.'),xp(90),entry('B.',{speaker:'mira',source:'authored'}),xp(35)]).map(p=>p.tags.map(tagText)),[['+90 XP'],['+35 XP']]);
});
test('#60: XP comes from check.xp when the check carries it, counted once; older saves still read the XP lines',()=>{
 const check:OutcomeCheck={kind:'check',actorId:'mira',skill:'insight',sides:20,natural:15,modifier:3,total:18,dc:13,success:true,xp:125};
 const checked=entry('Mira: Read succeeded (18 vs DC 13).',{speaker:'mira',prose:'The ink is still wet.',check});
 assert.deepEqual(tags([checked,xp(90),level2,xp(35)]),['Mira · Insight · 18 vs DC 13 · +125 XP','Level 2 · +6 max HP · +1 focus']);
 // An older save: no prose, no check, no levelUp. The XP lines sum on the page; nothing is dropped.
 const {prose:_p,check:_c,...old}=checked,{levelUp:_l,...oldLevel}=level2;
 const pages=pagesOf([old,xp(90),oldLevel,xp(35)]);
 assert.equal(pages.map(p=>p.text).join(' '),`${old.text} ${level2.text}`);
 assert.deepEqual(pages.flatMap(p=>p.tags).map(tagText),['+125 XP']);
});
