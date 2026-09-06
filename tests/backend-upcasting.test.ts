import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions} from '../server/game.js';
import {makeCharacter,CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {projectTactical} from '../server/tactical.js';
function prepare(classId:'adept'|'cleric',combat=true){
 let s=createSave({name:'Upcast QA',classId,backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});
 if(combat){s.sceneId='cookfire';s=applyAction(s,'fight',n=>n);s.turn!.actorId='hero';s.turnIndex=s.turn!.order.indexOf('hero');}
 s.tactical!.actors.hero=makeCharacter(classId==='adept'?'wizard':'cleric',8);
 s.tactical!.actors.mira=makeCharacter('rogue',8);s.tactical!.actors.mira.hp=1;
 if(combat){s.tactical!.cells.hero=[3,3];s.tactical!.cells.mira=[3,4];for(const e of s.enemies){s.tactical!.actors[e.id].hp=s.tactical!.actors[e.id].maxHp=200;}}
 projectTactical(s,combat);return s;
}
test('Magic Missile spends the selected rank and increases its dart count at each rank',()=>{
 for(let rank=1;rank<=4;rank++){
  const s=prepare('adept');const slots=[...s.tactical!.actors.hero.slots];
  const id='tactical:missile:guard-1'+(rank>1?':'+rank:'');
  const next=applyAction(s,id,()=>1);slots[rank-1]--;
  assert.deepEqual(next.tactical!.actors.hero.slots,slots);
  assert.equal(next.enemies[0].hp,200-(rank+2)*2);
  assert.equal(next.logs.at(-1)!.rolls.filter(r=>r.purpose==='Magic Missile dart').length,rank+2);
  assert.throws(()=>applyAction(next,id,()=>1));
 }
});
test('higher healing ranks scale dice and Life healing while retaining action economy',()=>{
 for(const kind of ['cure','healing_word'])for(let rank=2;rank<=4;rank++){
  const s=prepare('cleric');s.tactical!.actors.hero.hp-=10;projectTactical(s);
  const next=applyAction(s,`tactical:${kind}:mira:${rank}`,()=>1);
  assert.equal(next.party[1].hp,1+rank*2+3+2+rank);
  assert.equal(next.party[0].hp,s.party[0].hp+2+rank);
  assert.equal(next.logs.at(-1)!.rolls[0].values.length,rank*2);
  assert.equal(next.tactical!.actors.hero.economy[kind==='cure'?'action':'bonus'],false);
  assert.ok(!legalActions(next).some(a=>/tactical:(cure|healing_word|bless)/.test(a.id)));
 }
});
test('depleted first-rank slots do not hide available higher casting ranks, and invalid ranks roll no dice',()=>{
 const s=prepare('adept');s.tactical!.actors.hero.slots[0]=0;
 assert.ok(!legalActions(s).some(a=>a.id==='tactical:missile:guard-1'));
 assert.ok(legalActions(s).some(a=>a.id==='tactical:missile:guard-1:2'));
 for(const suffix of ['0','1','5','NaN','2:extra'])assert.throws(()=>applyAction(s,'tactical:missile:guard-1:'+suffix,()=>{assert.fail('Invalid request rolled dice');}));
 assert.deepEqual(s.tactical!.actors.hero.slots,[0,3,3,2]);
});
test('Bless can use a higher slot after first-rank depletion and retains its three-person effect',()=>{
 const s=prepare('cleric');s.tactical!.actors.hero.slots[0]=0;
 const next=applyAction(s,'tactical:bless:3',()=>1);
 assert.deepEqual(next.tactical!.actors.hero.slots,[0,3,2,2]);
 assert.equal(next.tactical!.effects![0].targets.length,3);
 assert.ok(next.tactical!.actors.hero.concentration);
});
test('exploration upcasting survives save serialization and cannot spend an empty rank',()=>{
 let s=prepare('cleric',false);s.tactical!.actors.hero.slots=[0,1,0,0];
 s=applyAction(s,'recover:cure:hero:mira:2',()=>1);
 assert.equal(s.party[1].hp,12);
 s=JSON.parse(JSON.stringify(s));assert.deepEqual(s.tactical!.actors.hero.slots,[0,0,0,0]);
 assert.throws(()=>applyAction(s,'recover:cure:hero:mira:2',()=>1));
});
