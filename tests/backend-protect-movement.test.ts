import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction} from '../server/game.js';
import {projectTactical} from '../server/tactical.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';

for(const heroDown of [true,false])test(`protect companion approaches a distant enemy with hero ${heroDown?'down':'safe'}`,()=>{
 let s=createSave({name:'Protect QA',classId:'adept',backgroundId:'delver',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
 s.sceneId='market-3';s=applyAction(s,'exp_fight',n=>n);
 const t=s.tactical!,foe=s.enemies[1].id;
 t.actors.hero.hp=heroDown?0:t.actors.hero.maxHp;
 t.actors.mira.hp=0;t.actors[s.enemies[0].id].hp=0;
 t.cells.hero=[3,1];t.cells.oren=[2,1];t.cells[foe]=[4,6];
 t.actors.oren.economy={action:true,bonus:true,reaction:true,movementFeet:30};
 s.turn!.actorId='oren';s.turnIndex=s.turn!.order.indexOf('oren');
 for(const actor of s.party)actor.potions=0;
 projectTactical(s);
 const distance=()=>Math.max(...t.cells.oren.map((v,i)=>Math.abs(v-t.cells[foe][i])));
 assert.equal(distance(),5);
 s=applyAction(s,'tactical:auto',()=>1);
 assert.ok(Math.max(...s.tactical!.cells.oren.map((v,i)=>Math.abs(v-s.tactical!.cells[foe][i])))<=1);
 s=applyAction(s,'tactical:auto',()=>1);
 assert.equal(s.tactical!.actors.oren.economy.action,false);
 assert.match(s.logs.at(-1)!.text,/attacks/);
});
