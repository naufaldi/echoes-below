import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freeRegion} from '../client/free-region.js';
const box=(left:number,top:number,right:number,bottom:number)=>({left,top,right,bottom});
test('the scene centre moves to the middle of the space between HUD panels',()=>{
 // 1440x900 play layout measured in the browser: party panel, action panel, heading and story panel.
 assert.deepEqual(freeRegion(1440,900,{left:box(24,145,234,835),right:box(1146,145,1416,639),top:box(360,88,1080,176),bottom:box(270,613,1120,828)}),{x:-30,y:-55.5});
});
test('missing panels leave the scene centred and oversized panels are capped',()=>{
 assert.deepEqual(freeRegion(1000,800,{}),{x:0,y:0});
 // A left panel reaching 900px is capped at 45% of the width; a story panel starting at 100px is capped at 55% of the height.
 const capped=freeRegion(1000,800,{left:box(0,0,900,800),bottom:box(0,100,1000,800)});
 assert.deepEqual({x:Math.round(capped.x),y:Math.round(capped.y)},{x:225,y:-180});
});
