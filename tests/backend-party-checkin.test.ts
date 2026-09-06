import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
const fresh=()=>createSave({name:'Party QA',classId:'adept',backgroundId:'delver',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
test('authored check-in records a readable speaker without spending resources, dice or granting rewards',()=>{
 const before=fresh();const after=applyAction(before,'checkin:mira',()=>{throw Error('Conversation must not roll dice');});
 assert.deepEqual(after.party,before.party);assert.equal(after.xp,before.xp);assert.deepEqual(after.relationships,before.relationships);
 assert.equal(after.logs.at(-1)!.source,'authored');assert.equal(after.logs.at(-1)!.speakerName,'Mira');
 assert.ok(publicSave(after).logs.at(-1)!.text.includes('Before we go down'));
 assert.ok(legalActions(before).some(a=>a.id==='checkin:mira'));
 assert.throws(()=>applyAction(JSON.parse(JSON.stringify(after)),'checkin:mira',()=>1));
 assert.ok(legalActions(after).some(a=>a.id==='checkin:oren'));
});
test('chapter reflections cannot repeat in every room and resume only in a new chapter',()=>{
 let s=fresh();s.sceneId='archive-1';s=applyAction(s,'checkin:oren',()=>1);s.sceneId='archive-2';
 assert.ok(!legalActions(s).some(a=>a.id==='checkin:oren'));
 s.sceneId='market-1';assert.ok(legalActions(s).some(a=>a.id==='checkin:oren'));
});
test('downed companions, combat, defeat and unfinished bond conversations cannot start a check-in',()=>{
 const s=fresh();s.party[1].hp=0;assert.throws(()=>applyAction(s,'checkin:mira',()=>1));
 for(const mode of ['combat','defeat','complete'] as const){const copy=fresh();copy.mode=mode;assert.throws(()=>applyAction(copy,'checkin:oren',()=>1));}
 const bond=fresh();bond.companionStoryId='mira-1';assert.throws(()=>applyAction(bond,'checkin:oren',()=>1));
});
