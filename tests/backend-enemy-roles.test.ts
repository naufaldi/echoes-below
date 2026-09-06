import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {CURATED_ENCOUNTERS} from '../server/encounters.js';
import {ENEMY_ROLES} from '../shared/enemy-roles.js';
import type {SceneId} from '../shared/types.js';
const fresh=()=>createSave({name:'Role QA',classId:'adept',backgroundId:'delver',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
test('curated roster has 24 authored encounters, six bosses and coverage for twelve roles',()=>{
 assert.equal(Object.keys(CURATED_ENCOUNTERS).length,24);assert.equal(Object.values(CURATED_ENCOUNTERS).filter(e=>e.boss).length,6);assert.equal(new Set(Object.values(CURATED_ENCOUNTERS).flatMap(e=>e.roles)).size,12);
 for(const [scene,definition] of Object.entries(CURATED_ENCOUNTERS)){let s=fresh();s.sceneId=scene as SceneId;s=applyAction(s,scene==='cookfire'?'fight':scene==='bell'?'fight':'exp_fight',n=>n);assert.equal(s.enemies.length,definition.roles.length);for(const enemy of s.enemies){const role=ENEMY_ROLES[enemy.enemyRole!];assert.equal(s.tactical!.actors[enemy.id].speedFeet,role.speed);assert.equal(enemy.defense,role.ac);assert.ok(enemy.hp>0);}}
});
test('rooms without an authored combat retain peaceful progression instead of manufacturing defenders',()=>{
 let s=fresh();s.sceneId='archive-2';assert.ok(!legalActions(s).some(a=>a.id==='exp_fight'));assert.throws(()=>applyAction(s,'exp_fight',n=>n));s=applyAction(s,'exp_choice:1',n=>n);assert.ok(legalActions(s).some(a=>a.id==='exp_next'));
});
test('ranged scout attacks from its starting distance without first walking into melee',()=>{
 let s=fresh();s.sceneId='cookfire';s=applyAction(s,'fight',n=>n);assert.equal(s.turn!.actorId,'guard-2');const before=[...s.enemies[1].position];s=applyAction(s,'tactical:auto',()=>1);assert.deepEqual(s.enemies[1].position,before);assert.ok(s.logs.at(-1)!.text.includes('Shortbow'));assert.equal(s.tactical!.actors['guard-2'].economy.action,false);assert.equal(s.tactical!.actors['guard-2'].economy.movementFeet,35);
});
test('existing combat without role data continues using its recorded actors',()=>{
 let s=fresh();s.sceneId='cookfire';s=applyAction(s,'fight',n=>n);s.enemies.forEach(e=>delete e.enemyRole);const names=s.enemies.map(e=>e.name);s=applyAction(JSON.parse(JSON.stringify(s)),'tactical:auto',()=>1);assert.deepEqual(s.enemies.map(e=>e.name),names);
});

test('every authored encounter has a bounded winning route and durable completion state',()=>{
 for(const scene of Object.keys(CURATED_ENCOUNTERS)){let s=fresh();s.sceneId=scene as SceneId;s=applyAction(s,scene==='cookfire'?'fight':scene==='bell'?'fight':'exp_fight',n=>n);for(let i=0;i<200&&s.mode==='combat';i++){const options=legalActions(s),action=options.find(a=>a.id==='tactical:auto')??options.find(a=>a.kind==='attack')??options.find(a=>a.id==='tactical:end');assert.ok(action,scene);const party=s.party.some(a=>a.id===s.turn!.actorId);s=applyAction(s,action.id,n=>party?n:1);}assert.equal(s.mode,'explore',scene);if(scene.startsWith('archive')||scene.startsWith('market')||scene.startsWith('roots')||scene.startsWith('choir')||scene.startsWith('depth')){assert.ok(s.flags[`${scene}:defendersDefeated`]);assert.ok(!legalActions(s).some(a=>a.id==='exp_fight'));s=applyAction(JSON.parse(JSON.stringify(s)),'exp_choice:1',n=>n);assert.ok(legalActions(s).some(a=>a.id==='exp_next'));}}
});
