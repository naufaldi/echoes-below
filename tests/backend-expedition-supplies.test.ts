import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
function setup(curated=true){const s=createSave({name:'Supply QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',...(curated?{rulesVersion:CURATED_RULES_VERSION}:{})});s.sceneId='archive-2';return s;}
const total=(s:ReturnType<typeof setup>,key:'potions'|'rations')=>s.party.reduce((n,a)=>n+a[key],0);
test('curated exploration cache gives one potion to the member carrying least',()=>{
 let s=setup();s.party[1].potions=0;const before=total(s,'potions');s=applyAction(s,'exp_supplies',()=>1);
 assert.equal(total(s,'potions'),before+1);assert.equal(s.party[1].potions,1);
 assert.throws(()=>applyAction(JSON.parse(JSON.stringify(s)),'exp_supplies',()=>1));
});
test('combat rooms and chapter landings supply different resources with accurate previews',()=>{
 for(const [scene,potions,rations] of [['archive-1',2,0],['archive-8',0,3]] as const){let s=setup();s.sceneId=scene;const p=total(s,'potions'),r=total(s,'rations');const option=legalActions(s).find(a=>a.id==='exp_supplies')!;assert.match(option.description,potions?/2 healing potions/:/3 camp rations/);s=applyAction(s,'exp_supplies',()=>1);assert.equal(total(s,'potions'),p+potions);assert.equal(total(s,'rations'),r+rations);}
});
test('legacy supply caches retain three healing potions',()=>{let s=setup(false);const p=total(s,'potions');s=applyAction(s,'exp_supplies',()=>1);assert.equal(total(s,'potions'),p+3);});

test('supplies are assigned to surviving carriers rather than dead companions',()=>{
 let s=setup();s.party[1].potions=0;s.tactical!.actors.mira.hp=0;s.tactical!.actors.mira.dead=true;s.party[1].hp=0;
 s=applyAction(s,'exp_supplies',()=>1);assert.equal(s.party[1].potions,0);assert.equal(s.party[0].potions,3);
});
