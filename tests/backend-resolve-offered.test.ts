import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,GameError,legalActions,log,resolveOffered} from '../server/game.js';
test('offered resolution rejects unavailable actions without applying or changing the save',()=>{
 const original=createSave({name:'Offered QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember'}),before=structuredClone(original);
 assert.throws(()=>resolveOffered(original,'unavailable',legalActions,'CUSTOM_UNAVAILABLE','That choice is unavailable.',()=>assert.fail('must not apply')),error=>error instanceof GameError&&error.status===422&&error.code==='CUSTOM_UNAVAILABLE'&&error.message==='That choice is unavailable.');
 assert.deepEqual(original,before);
});
test('offered resolution isolates changes, replaces playback and stamps after applying',()=>{
 const original=createSave({name:'Offered QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember'});original.presentation=[];log(original,'The party guards the entrance.');
 original.updatedAt='2000-01-01T00:00:00.000Z';const before=structuredClone(original);
 assert.ok(original.presentation?.length);
 const result=resolveOffered(original,'enter',legalActions,'CUSTOM_UNAVAILABLE','That choice is unavailable.',s=>{
  assert.equal(s.presentation?.length,0);assert.equal(s.revision,original.revision);assert.equal(s.updatedAt,original.updatedAt);
  s.flags['offered-test']=true;s.party[0].hp--;s.presentation!.push(structuredClone(original.presentation![0]));
 });
 assert.deepEqual(original,before);assert.equal(result.flags['offered-test'],true);assert.equal(result.party[0].hp,original.party[0].hp-1);
 assert.equal(result.presentation?.length,1);assert.equal(result.revision,original.revision+1);assert.notEqual(result.updatedAt,original.updatedAt);assert.ok(Number.isFinite(Date.parse(result.updatedAt)));
});
