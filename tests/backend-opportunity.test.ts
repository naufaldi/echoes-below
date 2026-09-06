import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions} from '../server/game.js';
import {CURATED_RULES_VERSION,makeCharacter,classResources} from '../shared/curated-rules.js';
import {projectTactical} from '../server/tactical.js';
function battle(){let s=createSave({name:'Reaction QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});for(const id of ['enter','ledge','fight'])s=applyAction(s,id,n=>n);const t=s.tactical!;t.grid={width:9,height:9,blocked:[],difficult:[]};s.turn!.actorId='hero';s.turnIndex=s.turn!.order.indexOf('hero');t.cells={hero:[4,4],mira:[0,0],oren:[0,1],'guard-1':[4,5],'guard-2':[8,8]};for(const a of [...s.party,...s.enemies]){t.actors[a.id].hp=t.actors[a.id].maxHp=100;t.actors[a.id].economy.reaction=true;}t.actors.hero.economy={action:true,bonus:true,reaction:true,movementFeet:30};projectTactical(s);return s;}
const misses=(n:number)=>1;
test('leaving reach previews the threat and spends a reaction before the mover leaves',()=>{
 let s=battle();const option=legalActions(s).find(a=>a.id==='tactical:move:4,2')!;assert.match(option.description,/Opportunity attack/i);
 s=applyAction(s,option.id,misses);assert.equal(s.tactical!.actors['guard-1'].economy.reaction,false);assert.deepEqual(s.tactical!.cells.hero,[4,2]);assert.equal(s.tactical!.actors.hero.economy.movementFeet,20);assert.equal(s.tactical!.actors.hero.economy.action,true);
 const reaction=s.presentation!.find(f=>/opportunity attack/i.test(f.log.text))!;assert.ok(reaction);assert.deepEqual(reaction.tactical!.cells.hero,[4,4]);assert.equal(reaction.actorId,'guard-1');assert.equal(reaction.log.animation,'melee');assert.equal(reaction.log.actionKind,'reaction');
 s=JSON.parse(JSON.stringify(s));s=applyAction(s,'tactical:move:4,4',misses);s=applyAction(s,'tactical:move:4,2',()=>{assert.fail('Spent reaction cannot roll again');return 1;});
});
test('a lethal opportunity attack stops movement before departure without spending untraveled distance',()=>{
 let s=battle();s.tactical!.actors.hero.hp=1;projectTactical(s);s=applyAction(s,'tactical:move:4,2',n=>n);
 assert.equal(s.party[0].hp,0);assert.deepEqual(s.tactical!.cells.hero,[4,4]);assert.equal(s.tactical!.actors.hero.economy.movementFeet,30);assert.equal(s.tactical!.actors['guard-2'].economy.reaction,true);
});
test('Disengage and Rogue Cunning Disengage protect movement and consume the right resource',()=>{
 for(const cunning of [false,true]){let s=battle();if(cunning){s.tactical!.actors.hero=makeCharacter('rogue',2);projectTactical(s);}s=applyAction(s,cunning?'tactical:cunning_disengage':'tactical:disengage',misses);
 assert.equal(classResources(s.tactical!.actors.hero).disengaged,true);assert.equal(s.tactical!.actors.hero.economy.action,cunning);assert.equal(s.tactical!.actors.hero.economy.bonus,!cunning);
 s=JSON.parse(JSON.stringify(s));s=applyAction(s,'tactical:move:4,2',()=>{assert.fail('Disengaged movement does not provoke');return 1;});assert.equal(s.tactical!.actors['guard-1'].economy.reaction,true);
 }
});
test('remaining within reach and obscured attackers do not provoke',()=>{
 let s=applyAction(battle(),'tactical:move:3,4',()=>{assert.fail('Movement remains in reach');return 1;});assert.equal(s.tactical!.actors['guard-1'].economy.reaction,true);
 s=battle();s.tactical!.cells['guard-1']=[5,5];s.tactical!.grid.blocked=[[5,4]];s=applyAction(s,'tactical:move:3,4',()=>{assert.fail('Cannot see departing target');return 1;});assert.equal(s.tactical!.actors['guard-1'].economy.reaction,true);
});
test('holding a party reaction persists and prevents automatic attacks on an enemy move',()=>{
 let s=applyAction(battle(),'tactical:reaction:hold',misses);assert.equal(s.tactical!.reactionPolicy?.hero,'hold');s=JSON.parse(JSON.stringify(s));
 s.turn!.actorId='guard-1';s.turnIndex=s.turn!.order.indexOf('guard-1');s.tactical!.takeover='guard-1';s=applyAction(s,'tactical:move:4,7',()=>{assert.fail('Held reaction cannot roll');return 1;});assert.equal(s.tactical!.actors.hero.economy.reaction,true);
});

test('multiple adjacent enemies react separately and only the traveled path is charged',()=>{
 let s=battle();s.tactical!.cells['guard-2']=[5,5];s=applyAction(s,'tactical:move:4,2',misses);
 assert.equal(s.presentation!.filter(f=>/opportunity attack/i.test(f.log.text)).length,2);assert.equal(s.tactical!.actors['guard-1'].economy.reaction,false);assert.equal(s.tactical!.actors['guard-2'].economy.reaction,false);
 s=battle();s.tactical!.cells.hero=[4,6];s.tactical!.cells['guard-1']=[4,4];s.tactical!.actors.hero.hp=1;projectTactical(s);
 // The first step enters reach. The following step leaves it and is interrupted.
 s=applyAction(s,'tactical:move:7,4',n=>n);assert.equal(s.party[0].hp,0);assert.equal(s.tactical!.actors.hero.economy.movementFeet,25);assert.deepEqual(s.tactical!.cells.hero,[5,5]);
});
test('ten-foot weapons react at their own boundary and cannot use their ranged profile',()=>{
 let s=battle();s.enemies[0].enemyRole='bone_warden';s.tactical!.cells.hero=[4,3];s=applyAction(s,'tactical:move:4,2',misses);assert.equal(s.tactical!.actors['guard-1'].economy.reaction,false);
 s=battle();s.enemies[0].enemyRole='goblin_scout';s.tactical!.cells.hero=[4,3];s=applyAction(s,'tactical:move:4,2',()=>{assert.fail('A bow has no 60-foot reaction reach');return 1;});assert.equal(s.tactical!.actors['guard-1'].economy.reaction,true);
});
test('reaction refreshes at its owner turn and disengage clears on the mover next turn',()=>{
 let s=battle();s.tactical!.actors['guard-1'].economy.reaction=false;s.tactical!.actors.hero.features={...classResources(s.tactical!.actors.hero),disengaged:true};
 const order=['hero','guard-1','mira','oren','guard-2'];s.turn!.order=order;s.turnIndex=0;
 s=applyAction(s,'tactical:end',misses);assert.equal(s.turn!.actorId,'guard-1');assert.equal(s.tactical!.actors['guard-1'].economy.reaction,true);assert.equal(classResources(s.tactical!.actors.hero).disengaged,true);
 s.turn!.actorId='guard-2';s.turnIndex=4;s.tactical!.takeover='guard-2';s=applyAction(s,'tactical:end',misses);assert.equal(s.turn!.actorId,'hero');assert.equal(classResources(s.tactical!.actors.hero).disengaged,false);
});

test('wounded ranged companion disengages, withdraws and retains its ranged action',()=>{
 let s=battle();s.turn!.actorId='mira';s.turnIndex=s.turn!.order.indexOf('mira');s.tactical!.cells.hero=[0,0];s.tactical!.cells.mira=[4,4];s.tactical!.actors.mira=makeCharacter('rogue',2);s.tactical!.actors.mira.hp=3;s.party[1].potions=0;projectTactical(s);
 s=applyAction(s,'tactical:auto',misses);assert.equal(classResources(s.tactical!.actors.mira).disengaged,true);
 s=JSON.parse(JSON.stringify(s));s=applyAction(s,'tactical:auto',misses);const [x,y]=s.tactical!.cells.mira;assert.ok(Math.max(Math.abs(x-4),Math.abs(y-5))>1);assert.equal(s.tactical!.actors.mira.economy.action,true);assert.equal(s.tactical!.actors['guard-1'].economy.reaction,true);
 s=applyAction(s,'tactical:auto',misses);assert.equal(s.tactical!.actors.mira.economy.action,false);assert.match(s.logs.at(-1)!.text,/attacks/);
});

test('Rogue can Sneak Attack on a later turn reaction without regaining its spent action',()=>{
 let s=battle();s.tactical!.actors.hero=makeCharacter('rogue',3);s.tactical!.actors.hero.economy.action=false;s.tactical!.actors.hero.features={...classResources(s.tactical!.actors.hero),sneakUsed:true};s.tactical!.cells.oren=[5,5];
 s.turn!.order=['hero','guard-1','mira','oren','guard-2'];s.turnIndex=0;s=applyAction(s,'tactical:end',misses);assert.equal(classResources(s.tactical!.actors.hero).sneakUsed,false);
 s.tactical!.takeover='guard-1';s=applyAction(s,'tactical:move:4,7',n=>n===20?15:n);
 const frame=s.presentation!.find(f=>f.actorId==='hero'&&/opportunity attack/i.test(f.log.text))!;assert.equal(frame.log.rolls.filter(r=>r.purpose==='Sneak Attack').length,2);assert.equal(s.tactical!.actors.hero.economy.action,false);assert.equal(s.tactical!.actors.hero.economy.reaction,false);
});
test('opportunity damage checks concentration and an unconscious attacker cannot react',()=>{
 let s=battle();s.tactical!.actors.hero.concentration='test-concentration';let d20=0;s=applyAction(s,'tactical:move:4,2',n=>n===20?++d20===1?15:1:n);
 assert.equal(s.tactical!.actors.hero.concentration,null);assert.ok(s.logs.some(l=>l.rolls.some(r=>r.purpose.startsWith('Concentration'))));
 s=battle();s.tactical!.actors['guard-1'].hp=0;projectTactical(s);s=applyAction(s,'tactical:move:4,2',()=>{assert.fail('Unconscious creatures cannot react');return 1;});assert.equal(s.tactical!.actors['guard-1'].economy.reaction,true);
});
