import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
const hero={name:'Formation QA',classId:'guardian' as const,backgroundId:'delver' as const,appearanceId:'ember' as const};
function separated(s:ReturnType<typeof createSave>){for(let i=0;i<s.party.length;i++)for(let j=i+1;j<s.party.length;j++)assert.ok(Math.hypot(s.party[i].position[0]-s.party[j].position[0],s.party[i].position[1]-s.party[j].position[1])>=1.5,'party bodies need separation');}
test('curated room arrivals and gate interactions retain a readable exploration formation',()=>{
 let s=createSave({...hero,rulesVersion:CURATED_RULES_VERSION});separated(s);
 for(const id of ['enter','ledge','offer','prison','unlock']){s=applyAction(s,id,n=>n);separated(s);}
 const positions=s.party.map(a=>a.position);s=JSON.parse(JSON.stringify(s));assert.deepEqual(s.party.map(a=>a.position),positions);
});
test('formation stays behind the live pressure plate and inside the approach area',()=>{
 let s=createSave({...hero,rulesVersion:CURATED_RULES_VERSION});s=applyAction(s,'enter',n=>n);
 const option=legalActions(s).find(a=>a.targetId==='chain')!;assert.ok(option);s=applyAction(s,option.id,n=>n);separated(s);
 assert.ok(s.party.every(a=>a.position[1]<=-1.2&&Math.abs(a.position[0])<=3&&a.position[1]>=-4));
});

test('legacy initial formation remains compatible',()=>{assert.deepEqual(createSave(hero).party.map(a=>a.position),[[0,-2],[-1,-2],[1,-2]]);});
