import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions} from '../server/game.js';
import {CURATED_RULES_VERSION,makeCharacter} from '../shared/curated-rules.js';
import {projectTactical} from '../server/tactical.js';
import {resolveOpportunity} from '../server/opportunity.js';
function battle(){let s=createSave({name:'Help QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});for(const id of ['enter','ledge','fight'])s=applyAction(s,id,n=>n);s.tactical!.grid={width:9,height:9,blocked:[],difficult:[]};s.tactical!.cells={hero:[4,4],mira:[1,1],oren:[5,4],'guard-1':[4,5],'guard-2':[8,8]};for(const c of Object.values(s.tactical!.actors))c.hp=c.maxHp=100;turn(s,'hero');return s;}
function turn(s:ReturnType<typeof createSave>,id:string){s.turn!.actorId=id;s.turnIndex=s.turn!.order.indexOf(id);s.tactical!.takeover=id==='hero'?null:id;s.tactical!.actors[id].economy={action:true,bonus:true,reaction:true,movementFeet:30};projectTactical(s);}
const miss=()=>1;
test('Help requires nearby visible foe and spends only a main action',()=>{
 let s=battle();assert.ok(legalActions(s).some(a=>a.id==='tactical:help:guard-1'));
 assert.throws(()=>applyAction(s,'tactical:help:guard-2',miss));s=applyAction(s,'tactical:help:guard-1',miss);
 assert.equal(s.tactical!.actors.hero.economy.action,false);assert.equal(s.tactical!.actors.hero.economy.bonus,true);assert.equal(s.tactical!.actors.hero.economy.reaction,true);
 assert.throws(()=>applyAction(s,'tactical:help:guard-1',miss));
});
test('saved Help benefits only the next ally attack roll, even on a miss',()=>{
 let s=applyAction(battle(),'tactical:help:guard-1',miss);s=JSON.parse(JSON.stringify(s));turn(s,'oren');
 s=applyAction(s,'tactical:attack:guard-1',miss);assert.equal(s.logs.at(-1)!.rolls[0].values.length,2);
 turn(s,'oren');s=applyAction(s,'tactical:attack:guard-1',miss);assert.equal(s.logs.at(-1)!.rolls[0].values.length,1);
});
test('own attacks do not consume Help and it expires when the helper turn begins',()=>{
 let s=applyAction(battle(),'tactical:help:guard-1',miss);turn(s,'hero');s=applyAction(s,'tactical:attack:guard-1',miss);assert.equal(s.logs.at(-1)!.rolls[0].values.length,1);
 turn(s,'oren');s.turn!.order=['oren','hero','mira','guard-1','guard-2'];s.turnIndex=0;s=applyAction(s,'tactical:end',miss);turn(s,'oren');
 s=applyAction(s,'tactical:attack:guard-1',miss);assert.equal(s.logs.at(-1)!.rolls[0].values.length,1);
});
test('Help cancels Dodge disadvantage and works on opportunity attack rolls',()=>{
 let s=applyAction(battle(),'tactical:help:guard-1',miss);s.enemies[0].guard=true;turn(s,'oren');
 const result=resolveOpportunity(s,'oren','guard-1',miss);assert.equal(result.rolls[0].values.length,1);
 s.enemies[0].guard=false;s.tactical!.actors.oren.economy.reaction=true;const next=resolveOpportunity(s,'oren','guard-1',miss);assert.equal(next.rolls[0].values.length,1);
});
test('automatic-hit spells do not consume Help',()=>{
 let s=applyAction(battle(),'tactical:help:guard-1',miss);s.tactical!.actors.mira=makeCharacter('wizard',1);turn(s,'mira');s=applyAction(s,'tactical:missile:guard-1',miss);turn(s,'oren');s=applyAction(s,'tactical:attack:guard-1',miss);assert.equal(s.logs.at(-1)!.rolls[0].values.length,2);
});

test('Help advantage can enable Sneak Attack after the helper moves away',()=>{
 let s=applyAction(battle(),'tactical:help:guard-1',miss);s.tactical!.cells.hero=[0,0];s.tactical!.cells.oren=[0,1];turn(s,'mira');
 s=applyAction(s,'tactical:attack:guard-1',n=>n===20?15:1);
 assert.ok(s.logs.at(-1)!.rolls.some(r=>r.purpose==='Sneak Attack'));
});
test('multiple helpers affect one roll and expired dead helpers leave no permanent benefit',()=>{
 let s=applyAction(battle(),'tactical:help:guard-1',miss);turn(s,'oren');s=applyAction(s,'tactical:help:guard-1',miss);turn(s,'mira');s=applyAction(s,'tactical:attack:guard-1',miss);assert.equal(s.logs.at(-1)!.rolls[0].values.length,2);assert.equal(s.tactical!.attackHelp!.length,0);
 s=applyAction(battle(),'tactical:help:guard-1',miss);s.tactical!.actors.hero.hp=0;s.tactical!.actors.hero.dead=true;turn(s,'oren');s.turn!.order=['oren','hero','mira','guard-1','guard-2'];s.turnIndex=0;s=applyAction(s,'tactical:end',miss);assert.equal(s.tactical!.attackHelp!.length,0);
});
