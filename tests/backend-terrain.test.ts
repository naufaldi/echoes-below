import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encounterTerrain} from '../shared/encounter-terrain.js';
import {approachTarget,findPath} from '../shared/tactical-grid.js';
import {CURATED_ENCOUNTERS} from '../server/encounters.js';
test('every authored battlefield has clear connected spawn cells and disjoint terrain',()=>{
 const layouts=new Set<string>();
 for(const scene of Object.keys(CURATED_ENCOUNTERS)){
  const grid=encounterTerrain(scene);layouts.add(JSON.stringify(grid));
  const blocked=new Set(grid.blocked.map(p=>p.join(',')));
  for(const p of [...grid.blocked,...grid.difficult??[]])assert.ok(p.every(n=>Number.isInteger(n)&&n>=0&&n<9),scene);
  for(const p of grid.difficult??[])assert.ok(!blocked.has(p.join(',')),scene);
  for(let x=3;x<=5;x++)for(const y of [1,6])assert.ok(!blocked.has(`${x},${y}`),scene);
  for(let x=3;x<=5;x++)assert.ok(findPath(grid,[x,1],[4,6],405),scene);
 }
 assert.ok(layouts.size>=6);
 const a=encounterTerrain('bell');a.blocked.push([3,1]);assert.ok(!encounterTerrain('bell').blocked.some(p=>p[0]===3&&p[1]===1));
});
test('automatic approach takes a necessary detour away from a target',()=>{
 const grid={width:7,height:7,blocked:[[2,1],[2,2],[2,3],[2,4],[2,5],[3,3]] as [number,number][]};
 const next=approachTarget(grid,[1,3],[3,3],5);
 assert.ok(next);assert.ok(Math.hypot(next[0]-3,next[1]-3)>2);
 let here:[number,number]=[1,3];
 for(let i=0;i<12;i++){const next=approachTarget(grid,here,[3,3],5);if(!next)break;here=next;}
 assert.ok(Math.max(Math.abs(here[0]-3),Math.abs(here[1]-3))<=1);
});
test('automatic approach respects budget, difficult terrain and sealed targets',()=>{
 assert.equal(approachTarget({width:3,height:1,blocked:[[2,0]],difficult:[[1,0]]},[0,0],[2,0],5),null);
 assert.deepEqual(approachTarget({width:3,height:1,blocked:[[2,0]],difficult:[[1,0]]},[0,0],[2,0],10),[1,0]);
 assert.equal(approachTarget({width:3,height:1,blocked:[[1,0],[2,0]]},[0,0],[2,0],30),null);
});

test('approach refuses invalid movement budgets',()=>{
 for(const budget of [-1,NaN,Infinity])assert.equal(approachTarget({width:3,height:1,blocked:[[2,0]]},[0,0],[2,0],budget),null);
});
