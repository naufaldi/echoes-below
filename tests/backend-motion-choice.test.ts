import {test} from 'node:test';
import assert from 'node:assert/strict';
import {storedMotion,reducedMotion,readMotion,MOTION_KEY,LEGACY_MOTION_KEY} from '../client/motion-choice.js';

const store=(items:Record<string,string>)=>({getItem:(k:string)=>items[k]??null});
test('with nothing chosen, reduced motion follows the OS setting',()=>{
 assert.equal(storedMotion(null,null),null);
 assert.equal(reducedMotion(null,true),true);
 assert.equal(reducedMotion(null,false),false);
});
test('a choice made in Settings wins over the OS setting either way',()=>{
 assert.equal(reducedMotion('full',true),false);
 assert.equal(reducedMotion('reduced',false),true);
 assert.equal(readMotion(store({[MOTION_KEY]:'full'})),'full');
 assert.equal(readMotion(store({[MOTION_KEY]:'reduced',[LEGACY_MOTION_KEY]:'full'})),'reduced');
});
test('the old key counts only when it says reduced: "full" was written on every visit, chosen or not',()=>{
 assert.equal(readMotion(store({[LEGACY_MOTION_KEY]:'full'})),null);
 assert.equal(readMotion(store({[LEGACY_MOTION_KEY]:'reduced'})),'reduced');
 assert.equal(storedMotion('nonsense','full'),null);
});
test('unreachable storage follows the OS for the visit',()=>{
 assert.equal(readMotion({getItem:()=>{throw new Error('blocked');}}),null);
});
