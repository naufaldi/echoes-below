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
test('only labels pushed out of their home slot are marked as offset, so leader lines stay rare',()=>{
 const [home]=placeLabels([{id:'home',x:400,y:300,width:120,height:24,priority:20}],view,[]);
 assert.equal(home.offset,false);assert.ok(home.y+home.height<=300);
 const [moved]=placeLabels([{id:'moved',x:400,y:300,width:120,height:24,priority:20}],view,[],[{x:330,y:240,width:140,height:60}]);
 assert.equal(moved.offset,true);
});
test('compact labels still reach clear of the character they name',()=>{
 const party=[{x:470,y:220,width:90,height:170},{x:540,y:225,width:90,height:170},{x:610,y:220,width:90,height:170}];
 const [placed]=placeLabels([{id:'mira',x:585,y:262,width:56,height:24,priority:100}],view,[],party);
 assert.ok(placed,'selected label was dropped');assert.ok(!party.some(p=>overlaps(placed,p)));assert.equal(placed.offset,true);
});
test('every focused actor in a packed melee keeps a label, clear of bodies, HUD and other labels when room exists',()=>{
 // A party of three in melee with three skeletons, seen from the orbit camera: six overlapping bodies, anchors bunched over the heads.
 const bodies=[{x:420,y:200,width:160,height:260},{x:540,y:170,width:160,height:290},{x:660,y:160,width:160,height:300},{x:780,y:170,width:160,height:290},{x:600,y:150,width:160,height:200},{x:700,y:155,width:160,height:200}];
 const hud=[{x:0,y:0,width:1280,height:68},{x:0,y:600,width:1280,height:120}];
 const labels=[{id:'actor:hero',x:670,y:236,width:135,height:24,priority:100},{id:'actor:oren',x:640,y:246,width:57,height:24,priority:100},{id:'actor:mira',x:700,y:240,width:57,height:24,priority:100},{id:'actor:exp-1',x:710,y:186,width:150,height:24,priority:60}];
 const placed=placeLabels(labels,view,hud,bodies);
 assert.deepEqual(placed.map(x=>x.id).sort(),labels.map(x=>x.id).sort());
 for(const a of placed){assert.ok(![...bodies,...hud].some(b=>overlaps(a,b)),a.id+' covers a body or the HUD');assert.ok(!placed.some(b=>a!==b&&overlaps(a,b)));}
});
test('a focused label boxed in by bodies on every side still shows, over a body rather than nowhere',()=>{
 const bodies=[{x:0,y:68,width:1280,height:532}];const hud=[{x:0,y:0,width:1280,height:68},{x:0,y:600,width:1280,height:120}];
 const placed=placeLabels([{id:'actor:oren',x:640,y:300,width:57,height:24,priority:100},{id:'actor:exp-0',x:660,y:310,width:150,height:24,priority:60},{id:'entity:gate',x:650,y:300,width:100,height:24,priority:20}],view,hud,bodies);
 assert.deepEqual(placed.map(x=>x.id),['actor:oren','actor:exp-0']);
 for(const a of placed){assert.ok(!hud.some(b=>overlaps(a,b)));assert.ok(!placed.some(b=>a!==b&&overlaps(a,b)));}
});
test('the selected skeleton in a live market-3 melee keeps its label clear of the cluster',()=>{
 // Captured at 1440×900 after orbiting: the hero's label takes the left slot and every nearby slot for the skeleton overlaps a body.
 const screen={x:0,y:0,width:1440,height:900};
 const hud=[{x:0,y:0,width:1440,height:68},{x:360,y:148,width:720,height:45},{x:24,y:145,width:222,height:483},{x:336,y:80,width:768,height:55},{x:1146,y:145,width:270,height:472},{x:270,y:728,width:850,height:100},{x:26,y:851,width:1388,height:49}];
 const bodies=[{x:505,y:379,width:138,height:150},{x:520,y:365,width:198,height:187},{x:533,y:407,width:157,height:143},{x:552,y:419,width:133,height:160},{x:523,y:378,width:135,height:148},{x:511,y:347,width:111,height:129}];
 const placed=placeLabels([{id:'actor:hero',x:570,y:379,width:135,height:24,priority:100},{id:'actor:exp-0',x:615,y:418,width:128,height:24,priority:100}],screen,hud,bodies);
 const skeleton=placed.find(x=>x.id==='actor:exp-0');
 assert.ok(skeleton,'selected skeleton was dropped');assert.equal(placed.length,2);assert.equal(skeleton.offset,true);
 for(const a of placed)assert.ok(![...bodies,...hud].some(b=>overlaps(a,b))&&!placed.some(b=>a!==b&&overlaps(a,b)));
});
test('unfocused labels keep the short search, so quiet scenery labels never wander far from what they name',()=>{
 const bodies=[{x:500,y:150,width:280,height:300}];
 assert.deepEqual(placeLabels([{id:'entity:gate',x:640,y:300,width:100,height:24,priority:20}],view,[],bodies),[]);
 assert.equal(placeLabels([{id:'actor:mira',x:640,y:300,width:100,height:24,priority:60}],view,[],bodies).length,1);
});
