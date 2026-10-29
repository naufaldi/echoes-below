import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,publicSave,legalActions,type Save} from '../server/game.js';
import {feetFromMetres} from '../shared/movement.js';
import {combatLines,tagText} from '../client/story-pages.js';
import {npcAppearance,portraitSubjectFor} from '../client/portrait-look.js';
import {centreScroll} from '../client/turn-order.js';

test('turn order keeps an already centred entry at its offset (#112)',()=>{assert.equal(centreScroll(440,120,600,1000),200);});
test('turn order clamps the first entry to the start (#112)',()=>{assert.equal(centreScroll(0,120,600,1000),0);});
test('turn order clamps the last entry to the end (#112)',()=>{assert.equal(centreScroll(880,120,600,1000),400);});
test('turn order does not scroll content narrower than its view (#112)',()=>{assert.equal(centreScroll(200,120,600,400),0);});
test('turn order centres an entry within overflowing content (#112)',()=>{assert.equal(centreScroll(400,120,600,1000),160);});

const make=()=>createSave({name:'Aria',classId:'scout',backgroundId:'envoy',appearanceId:'moon',raceId:'elf'});
/** An Echo fight at the cookfire that lasts: everyone has 200 health. */
function fight(){let s:Save=make();s.sceneId='cookfire';s=applyAction(s,'fight',()=>10);s.enemies.forEach(e=>{e.hp=e.maxHp=200;});s.party.forEach(a=>{a.hp=a.maxHp=200;});return s;}

test('Echo metres read as feet, rounded to 5 ft steps, and remaining movement never reads 0 ft (#98 U11)',()=>{
 assert.deepEqual([6,12,1.5,3,9].map(feetFromMetres),[20,40,5,10,30]);
 assert.equal(feetFromMetres(0),0);assert.equal(feetFromMetres(-1),0);
 assert.equal(feetFromMetres(.3),5);assert.equal(feetFromMetres(.76),5);
});

test('Echo combat offers Run and moves in feet, and the run log says feet (#98 U11)',()=>{
 let s=fight();assert.equal(s.turn!.actorId,'hero');
 const actions=legalActions(s),run=actions.find(a=>a.id==='run');
 assert.equal(run?.description,'Spend your action to gain 20 ft of movement.');
 const moves=actions.filter(a=>a.kind==='move');assert.ok(moves.length>0);
 for(const m of moves)assert.match(m.description,/^Move \d+ ft\. Movement does not use your action\.$/);
 for(const a of actions)assert.doesNotMatch(a.description,/\d(\.\d)?m\b/,a.id);
 s=applyAction(s,'run',()=>10);
 assert.ok(s.logs.some(l=>l.text===`Aria runs: 20 ft of extra movement.`),JSON.stringify(s.logs.slice(-3).map(l=>l.text)));
});

test('combat lines keep tags short: no name the line already gives, damage as dmg (#98 L1)',()=>{
 let s=fight(),checked=0,leads=0;
 for(let round=0;round<4;round++){
  const target=s.enemies.find(e=>legalActions(s).some(a=>a.id===`attack:${e.id}`));if(!target)break;
  s=applyAction(s,`attack:${target.id}`,()=>15);s=applyAction(s,'end_turn',()=>15);
  for(const l of combatLines(publicSave(s),6)){
   if(!l.tag)continue;const text=tagText(l.tag);checked++;if(l.lead)leads++;
   assert.doesNotMatch(text,/damage/,text);
   if(l.lead)assert.notEqual(l.tag[0]!.text,l.lead,text);
   if(/\byour?\b/i.test(l.text))assert.ok(!text.startsWith('Aria'),text);
  }
 }
 assert.ok(checked>0&&leads>0,`checked ${checked} tagged lines, ${leads} with a lead`);
 // A miss is told to the hero ("…evades your attack"), so its tag drops the hero's name too.
 const miss=fight(),target=miss.enemies.find(e=>legalActions(miss).some(a=>a.id===`attack:${e.id}`))!;
 const line=combatLines(publicSave(applyAction(miss,`attack:${target.id}`,()=>2))).find(l=>/your attack/.test(l.text));
 assert.ok(line?.tag,JSON.stringify(line));assert.match(tagText(line!.tag!),/^Attack · \d+ vs AC \d+$/);
});

test('NPCs on a party model wear the ash palette; authored looks and creature models keep theirs (#98 U10)',()=>{
 assert.equal(npcAppearance({id:'courier'}),'ash');
 assert.equal(npcAppearance({id:'ferryman',modelClassId:'scout'}),'ash');
 assert.equal(npcAppearance({id:'ink-apprentice',modelClassId:'adept',appearanceId:'moon'}),'moon');
 assert.equal(npcAppearance({id:'index-librarian',modelClassId:'guardian',appearanceId:'bronze'}),'bronze');
 assert.equal(npcAppearance({id:'guards'}),'moss');
 // The portrait uses the same look as the world model.
 const cast={party:[],enemies:[],scene:{entities:[{id:'courier',name:'Courier',kind:'npc' as const,position:[0,0] as [number,number],description:''}]}};
 assert.equal(portraitSubjectFor('courier',cast as never)?.appearanceId,'ash');
});
