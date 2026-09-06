import {test} from 'node:test';
import assert from 'node:assert/strict';
import {placeLabels,overlaps} from '../client/label-layout.js';
const view={x:0,y:0,width:1280,height:720};
test('labels avoid HUD and each other, preserving selected priority',()=>{const labels=Array.from({length:12},(_,i)=>({id:String(i),x:400,y:300,width:160,height:44,priority:i===7?100:10}));const blocked=[{x:0,y:0,width:280,height:720},{x:900,y:0,width:380,height:720},{x:280,y:520,width:620,height:200}];const placed=placeLabels(labels,view,blocked);assert.equal(placed[0].id,'7');assert.ok(placed.length>1);for(const a of placed){assert.ok(a.x>=0&&a.y>=0&&a.x+a.width<=1280&&a.y+a.height<=720);assert.ok(!blocked.some(b=>overlaps(a,b)));assert.ok(!placed.some(b=>a!==b&&overlaps(a,b)));}});
test('invalid/offscreen labels disappear instead of floating at an unrelated edge',()=>{assert.deepEqual(placeLabels([{id:'behind',x:-100,y:10,width:100,height:40,priority:1},{id:'nan',x:NaN,y:10,width:100,height:40,priority:1}],view,[]),[]);});
test('layout is deterministic across input ordering and hides labels with no available room',()=>{const labels=[{id:'b',x:400,y:300,width:150,height:40,priority:1},{id:'a',x:400,y:300,width:150,height:40,priority:1}];assert.deepEqual(placeLabels(labels,view,[]),placeLabels([...labels].reverse(),view,[]));assert.deepEqual(placeLabels(labels,view,[view]),[]);});
test('labels anchored under the interface cannot relocate beside an unrelated visible object',()=>{
 const anchor={id:'covered',x:400,y:300,width:150,height:40,priority:100};
 assert.deepEqual(placeLabels([anchor],view,[{x:380,y:280,width:40,height:40}]),[]);
});
test('zero-size or invalid label dimensions are never placed',()=>{
 for(const width of [0,-20,Infinity])assert.deepEqual(placeLabels([{id:'invalid',x:400,y:300,width,height:40,priority:1}],view,[]),[]);
});

test('labels move outside character silhouettes even when the anchor is inside one',()=>{
 const actor={x:540,y:250,width:100,height:180};
 const labels=[{id:'gate',x:590,y:330,width:160,height:40,priority:20},{id:'selected',x:590,y:260,width:160,height:48,priority:100}];
 const result=placeLabels(labels,view,[],[actor]);
 assert.ok(result.some(x=>x.id==='selected'));assert.ok(result.length>0);
 for(const label of result)assert.ok(!overlaps(label,actor));
});
test('crowded actor silhouettes never force labels over characters or HUD',()=>{
 const actors=[{x:300,y:180,width:150,height:220},{x:450,y:200,width:150,height:220},{x:600,y:180,width:150,height:220}];
 const hud=[{x:0,y:450,width:1280,height:270}];
 const labels=actors.map((a,i)=>({id:String(i),x:a.x+75,y:300,width:180,height:48,priority:100-i}));
 for(const label of placeLabels(labels,view,hud,actors))assert.ok(![...actors,...hud].some(x=>overlaps(label,x)));
});
