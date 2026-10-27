import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BARKS,COOLDOWN_BEATS,FORK_ROOMS,INITIAL_BARK_STATE,selectBarks,type BarkBeat,type BarkMember,type BarkMoment,type Companion,type Trust} from '../shared/companion-barks.js';
import {ROOM_FORKS} from '../server/playstyle.js';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {barkBeats} from '../client/bark-beats.js';
import {playbackSteps} from '../client/playback-steps.js';

const party=(hp:Partial<Record<'hero'|Companion,number>>={}):BarkMember[]=>(['hero','mira','oren'] as const).map(id=>({id,hp:hp[id]??10,maxHp:10}));
const beat=(key:string,extra:Partial<BarkBeat>={}):BarkBeat=>({key,step:0,before:party(),after:party(),sameRoom:true,checks:[],...extra});
const nat=(key:string,actorId:string,natural:number,extra:Partial<BarkBeat>={})=>beat(key,{checks:[{actorId,natural,sides:20}],...extra});
const even:Trust={mira:0,oren:0},miraFirst:Trust={mira:5,oren:1};
const run=(beats:BarkBeat[],trust:Trust=even,state=INITIAL_BARK_STATE)=>selectBarks(beats,state,trust);
const mid=(sides:number)=>sides===20?15:Math.ceil(sides/2);

test('every companion has two to four short, in-voice lines for every moment',()=>{
 const moments:BarkMoment[]=['natural20','natural1','down','heal','fork','victory'];
 for(const who of ['mira','oren'] as const){
  assert.deepEqual(Object.keys(BARKS[who]).sort(),[...moments].sort());
  for(const m of moments){const lines=BARKS[who][m];assert.ok(lines.length>=2&&lines.length<=4,`${who}.${m} has ${lines.length} lines`);assert.equal(new Set(lines).size,lines.length);
   for(const line of lines){assert.ok(line.length<=90,`too long: ${line}`);assert.doesNotMatch(line,/\d/);assert.doesNotMatch(line,/\b(AI|engine|saved?|presentation|server|authored|charge|rolls?|dice|DC|XP)\b/i,line);}}
 }
 // A fork line must fit both variants of every fork room, so it names nobody the room may withhold.
 for(const line of [...BARKS.mira.fork,...BARKS.oren.fork])assert.doesNotMatch(line,/Tavin|Scrit|ferryman|novice|goblin|brother/i);
});
test('the fork rooms match the server fork list',()=>{assert.deepEqual([...FORK_ROOMS].sort(),ROOM_FORKS.map(f=>f.room).sort());});

test('a party natural 20 or 1 draws a bark; an enemy roll or a damage die does not',()=>{
 const [hit]=run([nat('l1','hero',20)]).barks;assert.equal(hit!.moment,'natural20');assert.ok(BARKS[hit!.speaker].natural20.includes(hit!.text));assert.equal(hit!.lineId,`${hit!.speaker}.natural20.${BARKS[hit!.speaker].natural20.indexOf(hit!.text)}`);
 assert.equal(run([nat('l2','hero',1)]).barks[0]!.moment,'natural1');
 assert.deepEqual(run([nat('l3','goblin-1',20)]).barks,[]);
 assert.deepEqual(run([beat('l4',{checks:[{actorId:'hero',natural:20,sides:12}]})]).barks,[]);
 assert.deepEqual(run([nat('l5','hero',14)]).barks,[]);
});
test('selection is deterministic for the same beats and state, so a replay shows the same lines',()=>{
 const beats=Array.from({length:30},(_,i)=>i%2?beat(`k${i}`,{won:true}):nat(`k${i}`,'hero',20));
 assert.deepEqual(run(beats),run(beats));
 const texts=new Set(Array.from({length:40},(_,i)=>run([nat(`seed-${i}`,'hero',20)],miraFirst).barks[0]!.text));assert.ok(texts.size>1,'different log ids reach different lines');
});
test('a companion never repeats a line back to back',()=>{
 const {barks}=run(Array.from({length:60},(_,i)=>beat(`v${i}`,{won:true})),miraFirst);
 assert.equal(barks.length,60);assert.ok(barks.every(b=>b.speaker==='mira'));
 for(let i=1;i<barks.length;i++)assert.notEqual(barks[i]!.text,barks[i-1]!.text);
 // The repeat check carries across turns through the state.
 const first=run([beat('same',{won:true})],miraFirst),again=run([beat('same',{won:true})],miraFirst,first.state);assert.notEqual(again.barks[0]!.text,first.barks[0]!.text);
});
test(`ordinary barks wait ${COOLDOWN_BEATS} beats; one beat never holds two barks`,()=>{
 const {barks,state}=run(Array.from({length:8},(_,i)=>nat(`c${i}`,'hero',20,{step:i})));
 assert.deepEqual(barks.map(b=>b.step),[0,3,6]);assert.equal(state.beat,8);
 const crowded=run([beat('busy',{won:true,before:party(),after:party({hero:0}),checks:[{actorId:'mira',natural:20,sides:20}]})]).barks;assert.equal(crowded.length,1);assert.equal(crowded[0]!.moment,'victory');
 // The cooldown also carries into the next turn.
 assert.deepEqual(run([nat('next',"hero",20)],even,run([nat('prev','hero',20)]).state).barks,[]);
});
test('fork entry and a fight won ignore the cooldown, and each fork room speaks once',()=>{
 const {barks,state}=run([nat('a','hero',20),beat('b',{fork:'roots-4',step:null}),beat('c',{won:true})]);
 assert.deepEqual(barks.map(b=>b.moment),['natural20','fork','victory']);
 assert.deepEqual(run([beat('again',{fork:'roots-4'})],even,state).barks,[]);
 assert.deepEqual(run([beat('plain',{fork:'archive-2'})]).barks,[],'a room without a fork stays quiet');
});
test('the speaker stands in the party, and a downed companion never barks about itself',()=>{
 const down=run([beat('d1',{after:party({mira:0})})],miraFirst).barks[0]!;assert.equal(down.moment,'down');assert.equal(down.speaker,'oren');
 assert.equal(run([beat('d2',{after:party({hero:0})})],miraFirst).barks[0]!.speaker,'mira');
 assert.deepEqual(run([beat('d3',{before:party({oren:0}),after:party({mira:0,oren:0})})]).barks,[],'nobody left standing to speak');
 assert.equal(run([nat('d4','hero',20,{before:party({mira:0}),after:party({mira:0})})],miraFirst).barks[0]!.speaker,'oren');
 assert.equal(run([nat('d5','oren',20)],{mira:0,oren:9}).barks[0]!.speaker,'mira','the roller does not cheer itself');
 assert.deepEqual(run([beat('d6',{after:party().filter(m=>m.id==='hero')})]).barks.length,0);
 assert.deepEqual(run([nat('d7','hero',20,{before:party().filter(m=>m.id!=='oren'),after:party({mira:0}).filter(m=>m.id!=='oren')})]).barks,[],'a companion outside the party never speaks');
});
test('higher trust speaks first; a tie alternates',()=>{
 assert.equal(run([beat('t1',{won:true})],{mira:1,oren:4}).barks[0]!.speaker,'oren');
 const {barks}=run(Array.from({length:6},(_,i)=>beat(`t${i}`,{won:true})));
 for(let i=1;i<barks.length;i++)assert.notEqual(barks[i]!.speaker,barks[i-1]!.speaker);
});
test('a heal is a rise in health inside one room, never a raised maximum or an arrival',()=>{
 assert.equal(run([beat('h1',{before:party({hero:4}),after:party()})]).barks[0]!.moment,'heal');
 assert.equal(run([beat('h2',{before:party({hero:0}),after:party({hero:6})})]).barks[0]!.moment,'heal');
 assert.deepEqual(run([beat('h3',{before:party({hero:4}),after:party().map(m=>m.id==='hero'?{...m,maxHp:16,hp:16}:m)})]).barks,[]);
 assert.deepEqual(run([beat('h4',{before:party({hero:4}),after:party(),sameRoom:false})]).barks,[]);
});

test('a real Echo fight becomes one beat per playback step, and the winning step carries the fight won',()=>{
 let s=createSave({name:'Ash',classId:'guardian',backgroundId:'delver',appearanceId:'moon'});
 for(const a of ['enter','ledge','fight'])s=applyAction(s,a,mid);
 let won:BarkBeat[]=[];
 for(let turn=0;s.mode==='combat'&&turn<100;turn++){
  const actions=legalActions(s),action=actions.find(a=>a.id.startsWith('attack:'))??actions.find(a=>a.id==='end_turn')??actions.find(a=>a.id==='continue')!;
  const before=publicSave(s);s=applyAction(s,action.id,mid);const after=publicSave(s),beats=barkBeats(before,after);
  assert.deepEqual(beats.map(b=>b.step),playbackSteps(after.presentation??[]).map((_,i)=>i));
  assert.deepEqual(beats.map(b=>b.key),playbackSteps(after.presentation??[]).map(([i])=>after.presentation![i]!.log.id));
  if(beats.some(b=>b.won))won=beats;
 }
 assert.equal(s.mode,'explore');assert.ok(won.at(-1)?.won,'the last step of the winning turn');
 assert.equal(selectBarks(won,{...INITIAL_BARK_STATE,beat:1,lastBarkBeat:0},s.relationships).barks.at(-1)?.moment,'victory','even inside the cooldown');
});
test('entering a fork room records no frame, so the arrival is a settled beat with its own bark',()=>{
 let s=createSave({name:'Ash',classId:'guardian',backgroundId:'delver',appearanceId:'moon'});s.sceneId='aftermath';s.mode='complete';
 const before=publicSave(s);s=applyAction(s,'continue_campaign',mid);const after=publicSave(s);
 assert.equal(after.scene.id,'archive-1');assert.equal(after.presentation?.length??0,0);
 const beats=barkBeats(before,after);assert.equal(beats.length,1);assert.equal(beats[0]!.step,null);assert.equal(beats[0]!.fork,'archive-1');
 const [bark]=selectBarks(beats,INITIAL_BARK_STATE,after.relationships).barks;assert.equal(bark?.moment,'fork');assert.equal(bark?.step,null);
 assert.deepEqual(barkBeats(after,after),[],'staying in the room is not an arrival');
});
