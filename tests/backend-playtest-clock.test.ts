import {test} from 'node:test';import assert from 'node:assert/strict';
import {PlayClock,activeMilliseconds,emptyTiming,sumTiming,validTiming} from '../client/playtest-clock.js';
const state={visible:true,focused:true,playing:true,phase:'exploration' as const};
test('clock separates active phases from waiting at the exact transition',()=>{const c=new PlayClock(0,state);c.transition(1000,{...state,phase:'combat'});c.transition(3000,{...state,phase:'waiting'});c.transition(4000,{...state,phase:'conversation'});c.tick(5000);assert.deepEqual(c.timing,{exploration:1000,combat:2000,waiting:1000,conversation:1000,excluded:0});assert.equal(activeMilliseconds(c.timing),4000);});
test('hidden, unfocused, completed and suspended intervals never inflate playtime',()=>{const c=new PlayClock(0,state);c.transition(1000,{...state,visible:false});c.transition(3000,{...state,focused:false});c.transition(4000,{...state,playing:false});c.transition(5000,state);c.tick(65000);assert.equal(activeMilliseconds(c.timing),1000);assert.equal(c.timing.excluded,64000);c.activity(65000);c.tick(66000);assert.equal(activeMilliseconds(c.timing),2000);});
test('idle cutoff is clipped precisely, and a new input does not backfill idle time',()=>{const c=new PlayClock(0,state);for(let t=4000;t<=124000;t+=4000)c.tick(t);assert.equal(activeMilliseconds(c.timing),120000);assert.equal(c.timing.excluded,4000);c.activity(125000);c.tick(126000);assert.equal(activeMilliseconds(c.timing),121000);assert.equal(c.timing.excluded,5000);});
test('persisted measurements reject malformed or nonfinite counters and aggregate independent visits',()=>{assert.ok(validTiming(emptyTiming()));assert.ok(!validTiming({...emptyTiming(),combat:-1}));assert.ok(!validTiming({...emptyTiming(),waiting:Infinity}));assert.ok(!validTiming({exploration:1}));assert.deepEqual(sumTiming([{...emptyTiming(),combat:100},{...emptyTiming(),combat:200,waiting:20}]),{...emptyTiming(),combat:300,waiting:20});});

test('room changes attribute the interval to the previous room and preserve revisits',()=>{
 const c=new PlayClock(0,{...state,sceneId:'approach'});
 c.transition(1000,{...state,sceneId:'hall'});c.transition(3000,{...state,sceneId:'approach'});c.tick(4000);
 assert.equal(c.sceneTimings.approach.exploration,2000);assert.equal(c.sceneTimings.hall.exploration,2000);
 assert.deepEqual(sumTiming(Object.values(c.sceneTimings)),c.timing);
});
test('room timing excludes waiting and hidden intervals from active play',()=>{
 const c=new PlayClock(0,{...state,sceneId:'bell'});c.transition(1000,{...state,sceneId:'bell',phase:'waiting'});c.transition(2000,{...state,sceneId:'bell',visible:false});c.tick(3000);
 assert.equal(activeMilliseconds(c.sceneTimings.bell),1000);assert.equal(c.sceneTimings.bell.waiting,1000);assert.equal(c.sceneTimings.bell.excluded,1000);
});
