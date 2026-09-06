import {test} from 'node:test';import assert from 'node:assert/strict';
import {timingBreakdown} from '../client/playtest-report.js';
import {emptyTiming} from '../client/playtest-clock.js';
const time=(n:number)=>({...emptyTiming(),exploration:n});
test('chapter reports combine revisits without assigning legacy totals to a guessed scene',()=>{
 const r=timingBreakdown([{timing:time(1000),sceneTimings:{hall:time(1000)}},{timing:time(2000),sceneTimings:{hall:time(500),'archive-2':time(1500)}},{timing:time(9000)}]);
 assert.equal(r.chapters[0].activePlay,1500);assert.equal(r.chapters[1].activePlay,1500);assert.equal(r.unattributedActivePlay,9000);
});
test('corrupt scene subtotals are excluded rather than inflating campaign measurements',()=>{
 const r=timingBreakdown([{timing:time(100),sceneTimings:{hall:time(200)}}]);assert.equal(r.scenes.length,0);assert.equal(r.unattributedActivePlay,100);
});
