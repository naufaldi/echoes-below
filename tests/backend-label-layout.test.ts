import {test} from 'node:test';
import assert from 'node:assert/strict';
import {placeLabels,overlaps} from '../client/label-layout.js';
const view={x:0,y:0,width:1280,height:720};
test('labels avoid HUD and each other, preserving selected priority',()=>{const labels=Array.from({length:12},(_,i)=>({id:String(i),x:400,y:300,width:160,height:44,priority:i===7?100:10}));const blocked=[{x:0,y:0,width:280,height:720},{x:900,y:0,width:380,height:720},{x:280,y:520,width:620,height:200}];const placed=placeLabels(labels,view,blocked);assert.equal(placed[0].id,'7');assert.ok(placed.length>1);for(const a of placed){assert.ok(a.x>=0&&a.y>=0&&a.x+a.width<=1280&&a.y+a.height<=720);assert.ok(!blocked.some(b=>overlaps(a,b)));assert.ok(!placed.some(b=>a!==b&&overlaps(a,b)));}});
test('invalid/offscreen labels disappear instead of floating at an unrelated edge',()=>{assert.deepEqual(placeLabels([{id:'behind',x:-100,y:10,width:100,height:40,priority:1},{id:'nan',x:NaN,y:10,width:100,height:40,priority:1}],view,[]),[]);});
test('layout is deterministic across input ordering and hides labels with no available room',()=>{const labels=[{id:'b',x:400,y:300,width:150,height:40,priority:1},{id:'a',x:400,y:300,width:150,height:40,priority:1}];assert.deepEqual(placeLabels(labels,view,[]),placeLabels([...labels].reverse(),view,[]));assert.deepEqual(placeLabels(labels,view,[view]),[]);});
