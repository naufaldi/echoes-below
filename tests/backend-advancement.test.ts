import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,fact,publicSave} from '../server/game.js';
import {pendingLevelUps} from '../client/level-up.js';
import {makeCharacter,CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {projectTactical} from '../server/tactical.js';
function prepare(level=4){
 const s=createSave({name:'Advancement QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});
 s.level=level;s.xp=2700;for(const a of s.party)s.tactical!.actors[a.id]=makeCharacter(a.id==='mira'?'rogue':'fighter',level);
 projectTactical(s,false);return s;
}
test('ability choices apply to companions, persist after reload and cannot be spent twice',()=>{
 const s=prepare();assert.ok(legalActions(s).some(a=>a.id==='advance:mira:4:dexterity:dexterity'));
 const next=applyAction(s,'advance:mira:4:dexterity:dexterity',()=>{assert.fail('Advancement must not roll');});
 assert.equal(next.party[1].attributes.agility,4);assert.equal(next.party[1].defense,15);
 assert.equal(next.revision,s.revision+1);assert.equal(s.tactical!.actors.mira.abilities.dexterity,16);
 const restored=JSON.parse(JSON.stringify(next));assert.equal(restored.tactical.actors.mira.abilities.dexterity,18);
 assert.throws(()=>applyAction(restored,'advance:mira:4:strength:strength',()=>1));
});
test('Constitution improvements adjust HP without restoring spent resources',()=>{
 const s=prepare();const c=s.tactical!.actors.hero;c.hp=10;c.hitDice=1;c.features={secondWind:0,actionSurge:0,attacksRemaining:0,sneakUsed:false,slotSpent:false,disengaged:false};
 const next=applyAction(s,'advance:hero:4:constitution:constitution',()=>1);const n=next.tactical!.actors.hero;
 assert.equal(n.maxHp,40);assert.equal(n.hp,14);assert.equal(n.hitDice,1);assert.equal(n.features!.secondWind,0);assert.equal(n.features!.actionSurge,0);
});
test('split improvements retain both choices through a subsequent XP level-up',()=>{
 let s=prepare();s=applyAction(s,'advance:hero:4:strength:wisdom',()=>1);s=JSON.parse(JSON.stringify(s));s.xp=6465;
 fact(s,'advancement-fixture','A new discovery.');
 assert.equal(s.level,5);assert.equal(s.tactical!.actors.hero.abilities.strength,17);assert.equal(s.tactical!.actors.hero.abilities.wisdom,14);
 assert.equal(s.party[0].attributes.insight,2);
});
test('Fighter additional milestone and ability cap remain enforced',()=>{
 let s=prepare(8);s=applyAction(s,'advance:hero:4:strength:strength',()=>1);s=applyAction(s,'advance:hero:6:strength:strength',()=>1);
 assert.equal(s.tactical!.actors.hero.abilities.strength,20);
 assert.ok(!legalActions(s).some(a=>a.id.startsWith('advance:hero:8:strength')));
 assert.throws(()=>applyAction(s,'advance:hero:8:strength:strength',()=>1));
 assert.throws(()=>applyAction(s,'advance:mira:6:dexterity:dexterity',()=>1));
 s=applyAction(s,'advance:hero:8:wisdom:charisma',()=>1);assert.equal(s.tactical!.actors.hero.abilities.wisdom,14);
});
test('advancement rejects ineligible states and malformed choices before mutation',()=>{
 for(const change of [(s:ReturnType<typeof prepare>)=>{s.mode='combat';},(s:ReturnType<typeof prepare>)=>{s.tactical!.actors.hero.hp=0;},(s:ReturnType<typeof prepare>)=>{s.tactical!.actors.hero.dead=true;},(s:ReturnType<typeof prepare>)=>{s.companionStoryId='test';}]){
  const s=prepare();change(s);assert.throws(()=>applyAction(s,'advance:hero:4:strength:strength',()=>1));
 }
 const s=prepare();for(const id of ['advance:hero:3:strength:strength','advance:hero:4:nope:strength','advance:hero:4:strength:strength:extra','advance:enemy:4:strength:strength'])assert.throws(()=>applyAction(s,id,()=>1));
 const low=prepare(3);assert.ok(!legalActions(low).some(a=>a.id.startsWith('advance:')));
});
test('XP level-up preserves a downed state and equipped defenses',()=>{
 const s=prepare();s.tactical!.actors.hero.hp=0;s.tactical!.actors.hero.death={successes:1,failures:2,stable:false};
 s.logistics!.equipped.oren.cloak=true;s.logistics!.owned.ward_cloak=1;projectTactical(s,false);s.xp=6465;
 fact(s,'advancement-downed-fixture','The companions make a discovery.');
 assert.equal(s.party[0].hp,0);assert.deepEqual(s.tactical!.actors.hero.death,{successes:1,failures:2,stable:false});
 assert.equal(s.party[2].defense,19);assert.equal(s.tactical!.actors.oren.armorClass,19);
});

test('pending level-ups show each eligible member once in party order and leave after improvement',()=>{
 const s=prepare(),view=publicSave(s);
 assert.deepEqual(pendingLevelUps(view.actions,view.party),view.party.map(m=>({id:m.id,name:m.name,level:4})));
 const advances=view.actions.filter(a=>a.id.startsWith('advance:'));assert.ok(advances.length>view.party.length);assert.ok(advances.every(a=>a.kind==='inventory'));
 const next=publicSave(applyAction(s,'advance:mira:4:dexterity:dexterity',()=>{assert.fail('Advancement must not roll');}));
 assert.deepEqual(pendingLevelUps(next.actions,next.party),next.party.filter(m=>m.id!=='mira').map(m=>({id:m.id,name:m.name,level:4})));
});
test('pending level-ups are absent in combat, companion stories and Echo',()=>{
 const combat=prepare();combat.mode='combat';assert.deepEqual(pendingLevelUps(legalActions(combat),combat.party),[]);
 const story=prepare();story.companionStoryId='test';assert.deepEqual(pendingLevelUps(legalActions(story),story.party),[]);
 const echo=createSave({name:'Echo advancement QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember'});
 assert.deepEqual(pendingLevelUps(legalActions(echo),echo.party),[]);
});
