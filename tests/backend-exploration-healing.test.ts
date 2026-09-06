import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION,classResources} from '../shared/curated-rules.js';
const fresh=()=>createSave({name:'Healing QA',classId:'cleric',backgroundId:'envoy',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
test('exploration Cure Wounds spends spell slots rather than legacy focus and preserves projected health',()=>{
 let s=fresh();s.party[1].hp=s.tactical!.actors.mira.hp=1;const focus=s.party[0].focus;
 s=applyAction(s,'recover:cure:hero:mira',n=>n);assert.equal(s.party[1].hp,10);assert.equal(s.tactical!.actors.hero.slots[0],1);assert.equal(s.party[0].focus,focus);assert.equal(s.presentation?.at(-1)?.party[1].hp,10);assert.deepEqual(publicSave(JSON.parse(JSON.stringify(s))),publicSave(s));
});
test('Fighter can use only limited self Second Wind, never legacy healing magic',()=>{
 let s=fresh();s.party[2].hp=s.tactical!.actors.oren.hp=1;
 assert.ok(!legalActions(s).some(a=>a.id.startsWith('campheal:')));assert.throws(()=>applyAction(s,'recover:cure:oren:oren',n=>n));
 s=applyAction(s,'recover:wind:oren:oren',n=>n);assert.equal(s.party[2].hp,12);assert.equal(classResources(s.tactical!.actors.oren).secondWind,1);assert.throws(()=>applyAction(s,'recover:wind:oren:hero',n=>n));
});
test('potions use 2d4 + 2, can revive downed allies but cannot revive dead actors',()=>{
 let s=fresh();s.party[1].hp=s.tactical!.actors.mira.hp=0;s=applyAction(s,'recover:potion:oren:mira',()=>1);assert.equal(s.party[1].hp,4);assert.equal(s.party[2].potions,1);assert.equal(s.logs.at(-1)?.rolls[0].values.length,2);
 s.party[1].hp=s.tactical!.actors.mira.hp=0;s.tactical!.actors.mira.dead=true;assert.throws(()=>applyAction(s,'recover:potion:oren:mira',()=>1));
});
test('empty slots, no potions, downed caster and combat reject exploration recovery without mutations',()=>{
 const s=fresh();s.party[1].hp=s.tactical!.actors.mira.hp=1;s.tactical!.actors.hero.slots[0]=0;s.party[0].potions=0;const before=JSON.stringify(s);assert.throws(()=>applyAction(s,'recover:cure:hero:mira',n=>n));assert.throws(()=>applyAction(s,'recover:potion:hero:mira',n=>n));assert.equal(JSON.stringify(s),before);
 s.party[0].hp=s.tactical!.actors.hero.hp=0;s.tactical!.actors.hero.slots[0]=1;assert.throws(()=>applyAction(s,'recover:cure:hero:mira',n=>n));s.mode='combat';assert.ok(!legalActions(s).some(a=>a.id.startsWith('recover:')));
});
