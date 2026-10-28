import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave,partialClue,type Save} from '../server/game.js';
import {POTION_CAP} from '../server/expedition-supplies.js';
import {CAMPAIGN_CONSEQUENCES} from '../server/campaign-consequences.js';
import {SIDE_ADVENTURES} from '../server/side-adventures.js';
import {playedRoom} from '../server/playstyle.js';
import {EXPEDITION} from '../shared/campaign.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import type {ClassId} from '../shared/types.js';
// #95: supplies are capped, evidence is a real roll, and the best-placed member makes party checks.
type Rules='echo'|'curated';
const make=(rules:Rules='echo',classId:ClassId='guardian')=>createSave({name:'Balance',classId,backgroundId:'survivor',appearanceId:'moon',...(rules==='curated'?{rulesVersion:CURATED_RULES_VERSION}:{})});
const pack=(s:Save)=>s.party.map(a=>a.potions);
const fresh=(before:Save,after:Save)=>{const ids=new Set(before.logs.map(l=>l.id));return after.logs.filter(l=>!ids.has(l.id));};
const said=(before:Save,after:Save,pattern:RegExp)=>fresh(before,after).some(l=>pattern.test(l.text));
const FULL=/Your packs are (already full|full now); you leave (it|them|the rest) for whoever comes next\./;
const full=[POTION_CAP,POTION_CAP,POTION_CAP];

test('room supply caches stop at two potions per member and say what was left behind',()=>{
 for(const rules of ['echo','curated'] as const){
  let s=make(rules);s.sceneId='archive-2';assert.deepEqual(pack(s),full);
  assert.match(legalActions(s).find(a=>a.id==='exp_supplies')!.description,/Your packs are already full\./);
  let next=applyAction(s,'exp_supplies',()=>1);assert.deepEqual(pack(next),full,rules);assert.ok(said(s,next,/already full/),rules);
  s=make(rules);s.sceneId='archive-1';s.party[1]!.potions=1;
  next=applyAction(s,'exp_supplies',()=>1);assert.deepEqual(pack(next),full,rules);assert.ok(said(s,next,/full now/),rules);
  s=make(rules);s.sceneId='archive-2';s.party.forEach(a=>{a.potions=0;});
  next=applyAction(s,'exp_supplies',()=>1);assert.ok(!said(s,next,FULL),`${rules} has room, so nothing is left`);
 }
});
test('the Chapter I chest, returning allies and side requests respect the same cap',()=>{
 for(const rules of ['echo','curated'] as const){
  let s=make(rules);let next=applyAction(s,'loot_cache',()=>1);assert.deepEqual(pack(next),full);assert.ok(said(s,next,/leave it for whoever comes next/),rules);
  s=make(rules);s.party[0]!.potions=1;s.party[1]!.potions=0;next=applyAction(s,'loot_cache',()=>1);assert.deepEqual(pack(next),[2,0,2],'the hero still takes the chest potion first');
  for(const link of CAMPAIGN_CONSEQUENCES.filter(c=>c.effect==='supplies')){
   s=make(rules);s.sceneId=link.target;s.flags[`${link.source}:choice:${link.choice}`]=true;
   next=applyAction(s,'exp_ally:'+link.id,()=>1);assert.deepEqual(pack(next),full);assert.ok(said(s,next,FULL),link.id);assert.ok(next.facts.some(f=>f.id==='consequence:'+link.id));
  }
 }
 const adventure=SIDE_ADVENTURES.find(a=>a.choices[0]!.potions)!,command=(phase:string)=>`side:${adventure.id}:${phase}`;
 let s=make('curated');s.sceneId=adventure.start;s=applyAction(s,command('accept'),n=>n);s.sceneId=adventure.investigate;s=applyAction(s,command('investigate'),n=>n);s.sceneId=adventure.finish;
 s.party[2]!.potions=1;const next=applyAction(s,command('choose-0'),n=>n);assert.deepEqual(pack(next),full);assert.ok(said(s,next,/full now/));
});
test('older saves keep a fuller pack, and fallen members are not counted',()=>{
 let s=make();s.sceneId='archive-2';s.party.forEach(a=>{a.potions=9;});
 assert.deepEqual(pack(applyAction(s,'exp_supplies',()=>1)),[9,9,9]);
 s=make('curated');s.sceneId='archive-1';s.party.forEach(a=>{a.potions=0;});s.party[1]!.hp=s.tactical!.actors.mira.hp=0;s.tactical!.actors.mira.dead=true;
 s.party[0]!.potions=2;const next=applyAction(s,'exp_supplies',()=>1);assert.deepEqual(pack(next),[2,0,2]);
});

test('examining the evidence is one public Insight check by the sharpest member',()=>{
 for(const rules of ['echo','curated'] as const){
  const s=make(rules);s.sceneId='archive-2';const room=playedRoom(s,s.sceneId)!;
  const option=legalActions(s).find(a=>a.id==='exp_evidence')!,choice=legalActions(s).find(a=>a.id==='exp_choice:0')!;
  assert.equal(option.check!.attribute,'insight');assert.equal(option.check!.dc,Math.max(8,choice.check!.dc-2));assert.equal(choice.check!.advantage,undefined);
  const sharpest=Math.max(...s.party.map(a=>a.attributes.insight)),reader=s.party.find(a=>a.id===option.actorId)!;
  assert.equal(reader.attributes.insight,sharpest,rules);assert.equal(option.check!.modifier,option.check!.parts!.reduce((n,p)=>n+p.value,0));
  const won=applyAction(s,'exp_evidence',n=>n),read=fresh(s,won).find(l=>l.check)!;
  assert.equal(read.check!.actorId,reader.id);assert.equal(read.check!.success,true);assert.equal(read.check!.advantage,undefined);assert.equal(read.prose,room.clue);
  assert.equal(won.facts.find(f=>f.id==='evidence:archive-2')!.text,room.clue);
  assert.equal(legalActions(won).find(a=>a.id==='exp_choice:0')!.check!.advantage,'Evidence');
  const lost=applyAction(s,'exp_evidence',()=>1),missed=fresh(s,lost).find(l=>l.check)!;
  assert.equal(missed.check!.success,false);assert.equal(missed.prose,partialClue(room.clue));assert.notEqual(missed.prose,room.clue);
  assert.ok(!legalActions(lost).some(a=>a.id==='exp_evidence'),'one try');
  assert.equal(legalActions(lost).find(a=>a.id==='exp_choice:0')!.check!.advantage,undefined,`${rules}: a missed reading grants no advantage`);
  const attempt=applyAction(lost,'exp_choice:0',()=>10);assert.equal(fresh(lost,attempt).find(l=>l.check)!.check!.advantage,undefined);
 }
 assert.equal(partialClue('One sentence only.'),'The signs are here, but they will not come together.');
 // Saves from before #95 recorded only that the evidence was examined, which always succeeded.
 const legacy=make();legacy.sceneId='archive-2';legacy.flags['archive-2:evidence']=true;
 assert.equal(legalActions(legacy).find(a=>a.id==='exp_choice:0')!.check!.advantage,'Evidence');
});

test('the best-placed member rolls physical checks; ties and Presence stay with the hero',()=>{
 for(const rules of ['echo','curated'] as const){
  let s=make(rules,'adept');s.sceneId='prison';const pick=legalActions(s).find(a=>a.id==='pick')!;
  assert.equal(pick.actorId,'mira',`${rules}: the rogue picks the lock`);
  const next=applyAction(s,'pick',()=>20),entry=fresh(s,next).find(l=>l.check)!;assert.equal(entry.check!.actorId,'mira');assert.equal(entry.check!.modifier,pick.check!.modifier);
  s=make(rules,'adept');s.sceneId='cookfire';s.flags.tracks=true;
  assert.equal(legalActions(s).find(a=>a.id==='distract')!.actorId,'mira');assert.equal(legalActions(s).find(a=>a.id==='persuade')!.actorId,'hero');
 }
 const tie=make('echo','scout');tie.sceneId='prison';assert.equal(tie.party[0]!.attributes.agility,tie.party[1]!.attributes.agility);
 assert.equal(legalActions(tie).find(a=>a.id==='pick')!.actorId,'hero','a tie keeps the hero');
 const might=EXPEDITION.find(r=>r.challenge==='might')!;let s=make('echo','adept');s.sceneId=might.id;
 const choice=legalActions(s).find(a=>a.id==='exp_choice:0')!,strongest=s.party.reduce((b,a)=>a.attributes.might>b.attributes.might?a:b);
 assert.equal(choice.actorId,strongest.id);
 const hp=s.party.map(a=>a.hp),failed=applyAction(s,'exp_choice:0',()=>1),roll=fresh(s,failed).find(l=>l.check)!;
 assert.equal(roll.check!.actorId,strongest.id);assert.equal(failed.party[0]!.hp,hp[0]);assert.ok(failed.party.find(a=>a.id===strongest.id)!.hp<hp[s.party.indexOf(strongest)]!,'the roller takes the setback');
 const presence=EXPEDITION.find(r=>r.challenge==='presence')!;s=make('echo','guardian');s.sceneId=presence.id;s.party[1]!.attributes.presence=5;
 assert.equal(legalActions(s).find(a=>a.id==='exp_choice:0')!.actorId,'hero','the hero speaks for the party');
});

test('the aftermath calls the party battered only when someone is hurt',()=>{
 const bell=()=>{const s=make();s.sceneId='bell';s.flags.rescued=true;s.flags.sealKnowledge=true;return s;};
 let s=bell();const calm=applyAction(s,'negotiate',()=>20);assert.equal(calm.sceneId,'aftermath');
 assert.match(publicSave(calm).scene.description,/unhurt and watchful/);assert.ok(said(s,calm,/unhurt and watchful/));assert.ok(!said(s,calm,/battered/));
 s=bell();s.party[2]!.hp-=3;const hurt=applyAction(s,'negotiate',()=>20);
 assert.match(publicSave(hurt).scene.description,/battered but alive/);assert.ok(said(s,hurt,/battered but alive/));
 const older=make();older.sceneId='aftermath';assert.match(publicSave(older).scene.description,/battered but alive/);
});
