import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave,type Save} from '../server/game.js';
import {CURATED_RULES_VERSION,makeCharacter} from '../shared/curated-rules.js';
import {projectTactical} from '../server/tactical.js';
import {resolveOpportunity} from '../server/opportunity.js';
import {EXPEDITION} from '../shared/campaign.js';
import type {GameLog} from '../shared/types.js';
const echo=(classId:'guardian'|'scout'|'adept'|'cleric'='scout')=>createSave({name:'Aria',classId,backgroundId:'envoy',appearanceId:'moon',raceId:'elf'});
const curated=(classId:'guardian'|'scout'|'adept'|'cleric'='guardian')=>createSave({name:'Aria',classId,backgroundId:'envoy',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
const fresh=(before:Save,after:Save)=>{const old=new Set(before.logs.map(l=>l.id));return after.logs.filter(l=>!old.has(l.id));};
const rolled=(before:Save,after:Save)=>fresh(before,after).filter(l=>l.check);
/** Prose is story: no roll against a DC, no verdict, no XP, no numbers at all. */
function storyOnly(entry:GameLog){
 assert.ok(entry.prose,`prose missing on: ${entry.text}`);
 assert.doesNotMatch(entry.prose!,/\d+\s*vs\s*DC/i);assert.doesNotMatch(entry.prose!,/XP/);assert.doesNotMatch(entry.prose!,/succeeded|failed/);assert.doesNotMatch(entry.prose!,/\d/);
}
/** Presentation frames are copies; they must carry the same record as the journal entry. */
function framed(s:Save,entry:GameLog){const frame=s.presentation!.find(f=>f.log.id===entry.id);assert.ok(frame,'frame missing');assert.deepEqual(frame!.log.check,entry.check);assert.equal(frame!.log.prose,entry.prose);}

test('a successful companion check records the consequence as prose and the numbers as a check',()=>{
 const s=echo(),mira=s.party.find(a=>a.id==='mira')!;const next=applyAction(s,'tracks:mira',n=>n===20?15:1);
 const [entry]=rolled(s,next);
 assert.equal(entry.text,`Mira: Read the tracks succeeded (${15+mira.attributes.insight} vs DC 10).`);
 assert.equal(entry.prose,'The tracks show captives were marched alive into the relay.');
 assert.deepEqual(entry.check,{kind:'check',actorId:'mira',skill:'insight',sides:20,natural:15,modifier:mira.attributes.insight,total:15+mira.attributes.insight,dc:10,success:true,xp:35});
 storyOnly(entry);framed(next,entry);
 assert.equal(JSON.parse(JSON.stringify(next)).logs.find((l:GameLog)=>l.id===entry.id).check.xp,35);
 assert.deepEqual(publicSave(next).logs.find(l=>l.id===entry.id)!.check,entry.check);
});
test('a failed check gets number-free prose and never the unearned clue',()=>{
 const tracks=echo(),missed=applyAction(tracks,'tracks:hero',()=>1),[miss]=rolled(tracks,missed);
 assert.equal(miss.check!.success,false);assert.equal(miss.check!.xp,undefined);storyOnly(miss);
 assert.ok(!miss.prose!.includes('captives'));assert.ok(!missed.facts.some(f=>f.id==='captives'));
 const s=echo();s.sceneId='prison';const h=s.party[0];const next=applyAction(s,'pick',()=>1),[entry]=rolled(s,next);
 assert.equal(entry.text,`Aria: Pick the gate failed (${1+h.attributes.agility} vs DC 13).`);
 assert.equal(entry.prose,'The lock jams. You can still break the gate.');
 assert.deepEqual(entry.check,{kind:'check',actorId:'hero',skill:'agility',sides:20,natural:1,modifier:h.attributes.agility,total:1+h.attributes.agility,dc:13,success:false});
 storyOnly(entry);framed(next,entry);
});
test('a natural 20 keeps the natural die separate from the total',()=>{
 const s=echo(),h=s.party[0];const next=applyAction(s,'tracks:hero',()=>20),[entry]=rolled(s,next);
 assert.equal(entry.check!.natural,20);assert.equal(entry.check!.total,20+h.attributes.insight);assert.equal(entry.check!.success,true);storyOnly(entry);
});
test('a trap failure strips the damage number from prose but keeps it in text',()=>{
 const s=echo();s.sceneId='hall';s.flags.plate=true;const next=applyAction(s,'disarm:hero',()=>1),[entry]=rolled(s,next);
 assert.equal(entry.check!.success,false);storyOnly(entry);
 assert.ok(fresh(s,next).some(l=>/A dart strikes Aria for \d+ damage/.test(l.text)));assert.equal(entry.prose,'The plate drops. A dart strikes you. The chain crashes; the mechanism is spent.');
});
test('expedition room checks record the challenge and evidence advantage',()=>{
 const room=EXPEDITION[0];let s=echo();s.sceneId=room.id;s=applyAction(s,'exp_evidence',()=>20);
 const next=applyAction(s,'exp_choice:0',n=>n===20?18:1),[entry]=rolled(s,next);
 assert.equal(entry.check!.kind,'check');assert.equal(entry.check!.skill,room.challenge);assert.equal(entry.check!.advantage,true);assert.equal(entry.check!.natural,18);
 const decision=next.facts.find(x=>x.id===`decision:${room.id}`)!.text;assert.equal(entry.check!.success,true);assert.equal(entry.prose,decision);assert.ok(entry.check!.xp!>0);storyOnly(entry);framed(next,entry);
 let f=echo();f.sceneId=room.id;const failed=applyAction(f,'exp_choice:0',()=>1),[miss]=rolled(f,failed);
 assert.equal(miss.check!.success,false);assert.equal(miss.check!.advantage,undefined);assert.ok(!miss.prose!.includes(decision));assert.ok(!failed.facts.some(x=>x.id===`decision:${room.id}`));storyOnly(miss);
});
function legacyFight(dice:(n:number)=>number){let s=echo('scout');s.sceneId='cookfire';s=applyAction(s,'fight',dice);s.enemies.forEach(e=>{e.hp=e.maxHp=200;});s.party.forEach(a=>{a.hp=a.maxHp=200;});return s;}
test('legacy attacks record a hit and a miss against armor class',()=>{
 const s=legacyFight(()=>10);assert.equal(s.turn!.actorId,'hero');
 const target=s.enemies.find(e=>legalActions(s).some(a=>a.id===`attack:${e.id}`))!;
 const hit=applyAction(s,`attack:${target.id}`,()=>20),entry=rolled(s,hit).find(l=>l.check!.actorId==='hero')!;
 assert.match(entry.text,new RegExp(`^Aria attacks ${target.name}: \\d+ damage\\.$`));
 assert.deepEqual({...entry.check,modifier:0,total:0},{kind:'attack',actorId:'hero',targetId:target.id,skill:'attack',sides:20,natural:20,modifier:0,total:0,dc:target.defense+(target.guard?2:0),success:true,critical:true});
 assert.equal(entry.prose,`You land a blow on ${target.name}.`);storyOnly(entry);framed(hit,entry);
 const missed=applyAction(s,`attack:${target.id}`,()=>1),miss=rolled(s,missed).find(l=>l.check!.actorId==='hero')!;
 assert.equal(miss.text,`Aria attacks ${target.name}: miss.`);assert.equal(miss.check!.success,false);assert.equal(miss.check!.critical,undefined);assert.equal(miss.prose,`${target.name} evades your attack.`);storyOnly(miss);
});
function battle(classId:'guardian'|'cleric'='guardian'){let s=curated(classId);for(const id of ['enter','ledge','fight'])s=applyAction(s,id,n=>n);s.turn!.actorId='hero';s.turnIndex=s.turn!.order.indexOf('hero');s.tactical!.actors.hero=makeCharacter(classId==='cleric'?'cleric':'fighter',1);s.tactical!.cells.hero=[4,3];s.tactical!.cells['guard-1']=[4,4];for(const e of s.enemies){e.hp=e.maxHp=200;s.tactical!.actors[e.id].hp=s.tactical!.actors[e.id].maxHp=200;}projectTactical(s);return s;}
test('curated attacks record hit, critical and miss with the armor class as the target number',()=>{
 const s=battle(),guard=s.enemies.find(e=>e.id==='guard-1')!;
 const hit=applyAction(s,'tactical:attack:guard-1',n=>n),[entry]=rolled(s,hit);
 assert.equal(entry.check!.kind,'attack');assert.equal(entry.check!.targetId,'guard-1');assert.equal(entry.check!.dc,guard.defense);
 assert.equal(entry.check!.natural,20);assert.equal(entry.check!.success,true);assert.equal(entry.check!.critical,true);assert.equal(entry.check!.total,entry.rolls[0].total);
 assert.match(entry.text,/^Aria attacks .+: \d+ damage\.$/);storyOnly(entry);framed(hit,entry);
 const missed=applyAction(s,'tactical:attack:guard-1',()=>1),[miss]=rolled(s,missed);
 assert.equal(miss.check!.success,false);assert.match(miss.text,/: miss\.$/);storyOnly(miss);
});
test('a curated skill check outside combat uses the same record',()=>{
 const s=curated(),h=s.party[0];const next=applyAction(s,'tracks:hero',n=>n===20?12:1),[entry]=rolled(s,next);
 assert.equal(next.rulesVersion,CURATED_RULES_VERSION);
 assert.deepEqual(entry.check,{kind:'check',actorId:'hero',skill:'insight',sides:20,natural:12,modifier:h.attributes.insight,total:12+h.attributes.insight,dc:10,success:12+h.attributes.insight>=10,...(12+h.attributes.insight>=10?{xp:35}:{})});
 storyOnly(entry);
});
test('Sacred Flame records the target saving throw against the spell DC',()=>{
 const s=battle('cleric'),failed=applyAction(s,'tactical:attack:guard-1',()=>1),[entry]=rolled(s,failed);
 const dc=Number(/vs DC (\d+)/.exec(entry.text)![1]);
 assert.deepEqual({kind:entry.check!.kind,actorId:entry.check!.actorId,skill:entry.check!.skill,dc:entry.check!.dc,success:entry.check!.success,natural:entry.check!.natural},{kind:'save',actorId:'guard-1',skill:'dexterity',dc,success:false,natural:1});
 storyOnly(entry);
 const saved=applyAction(s,'tactical:attack:guard-1',n=>n),[save]=rolled(s,saved);assert.equal(save.check!.success,true);storyOnly(save);
});
test('opportunity attacks carry the record through to the reaction log',()=>{
 const s=battle();s.tactical!.grid={width:9,height:9,blocked:[],difficult:[]};s.tactical!.cells={hero:[4,4],mira:[1,1],oren:[5,4],'guard-1':[4,5],'guard-2':[8,8]};projectTactical(s);
 const result=resolveOpportunity(s,'oren','guard-1',n=>n);
 assert.equal(result.check.kind,'attack');assert.equal(result.check.actorId,'oren');assert.equal(result.check.targetId,'guard-1');assert.equal(result.check.success,true);assert.ok(result.prose&&!/\d/.test(result.prose));
});
test('old saves without prose or check still load, project and advance',()=>{
 const played=applyAction(echo(),'tracks:mira',n=>n===20?15:1);
 const old=JSON.parse(JSON.stringify(played,(key,value)=>key==='prose'||key==='check'&&value?.kind?undefined:value)) as Save;
 assert.ok(old.logs.every(l=>l.prose===undefined&&l.check===undefined));assert.ok(old.logs.some(l=>l.text.startsWith('Mira: Read the tracks succeeded')));
 const view=publicSave(old);assert.equal(view.logs.length,old.logs.length);
 const next=applyAction(old,'enter',()=>10);assert.equal(next.sceneId,'hall');
});
