import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cueFor} from '../client/combat-cue.js';
import type {Actor} from '../shared/types.js';
const actor=(id:string,name:string,hp:number,side='enemy')=>({id,name,hp,side,maxHp:10,position:[0,0]} as unknown as Actor);
test('a revealed beat reports hit point changes from saved frames only',()=>{
 const cue=cueFor('log-1','hero','melee','Alden attacks Goblin sentry: 4 damage.',[actor('hero','Alden',16,'party'),actor('g1','Goblin sentry',8)],[actor('hero','Alden',16,'party'),actor('g1','Goblin sentry',4)]);
 assert.deepEqual(cue.changes,[{actorId:'g1',delta:-4}]);assert.equal(cue.missTargetId,undefined);
});
test('a miss marks the named target and never the attacker',()=>{
 const before=[actor('hero','Alden',16,'party'),actor('g1','Goblin sentry',8)];
 const cue=cueFor('log-2','hero','spell','Alden attacks Goblin sentry: miss.',before,before);
 assert.equal(cue.missTargetId,'g1');assert.deepEqual(cue.changes,[]);
});
test('unrecognised phrasing shows no miss marker and healing is positive',()=>{
 const cue=cueFor('log-3','oren','item','Oren drinks a potion.',[actor('oren','Oren',10,'party')],[actor('oren','Oren',16,'party')]);
 assert.equal(cue.missTargetId,undefined);assert.deepEqual(cue.changes,[{actorId:'oren',delta:6}]);
});
test('echo enemy attacks name their weapon and duplicate enemies keep their numbered labels',()=>{
 const party=actor('hero','Alden',16,'party'),a=actor('g-a','Goblin guard',8),b=actor('g-b','Goblin guard',8);
 assert.equal(cueFor('log-4','g-b','melee','Goblin guard 2 attacks Alden with rusty blade: miss.',[party,a,b],[party,a,b]).missTargetId,'hero');
 assert.equal(cueFor('log-5','hero','melee','Alden attacks Goblin guard 2: miss.',[party,a,b],[party,a,b]).missTargetId,'g-b');
});
