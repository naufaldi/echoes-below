import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findPath,lineOfSight,areaTargets} from '../shared/tactical-grid.js';
const grid={width:6,height:6,blocked:[[2,0],[2,1],[2,2]] as [number,number][],difficult:[[1,0]] as [number,number][]};
test('movement accounts for walls and difficult terrain without corner cutting',()=>{
 const path=findPath(grid,[0,0],[3,0],100);assert.ok(path);assert.ok(path.costFeet>15);assert.ok(!path.cells.some(p=>grid.blocked.some(b=>b[0]===p[0]&&b[1]===p[1])));
 assert.equal(findPath(grid,[0,0],[3,0],10),null);
 assert.equal(findPath({width:2,height:2,blocked:[[1,0],[0,1]]},[0,0],[1,1],30),null);
 assert.equal(findPath({width:2,height:1,blocked:[],difficult:[[1,0]]},[0,0],[1,0],10)?.costFeet,10);
});
test('invalid destinations and blocked starts cannot create movement',()=>{
 for(const target of [[-1,0],[6,1],[NaN,0],[1.5,1],[2,1]] as [number,number][]){assert.equal(findPath(grid,[0,0],target,30),null);}
 assert.equal(findPath(grid,[2,0],[1,0],30),null);assert.equal(findPath(grid,[0,0],[0,0],0)?.costFeet,0);
});
test('line of sight cannot pass solid cells or diagonal wall seams',()=>{
 assert.equal(lineOfSight(grid,[0,0],[3,0]),false);assert.equal(lineOfSight(grid,[0,4],[5,4]),true);
 assert.equal(lineOfSight({width:2,height:2,blocked:[[1,0]]},[0,0],[1,1]),false);
});
test('area previews include allies and exclude targets behind walls',()=>{
 const actors=[{id:'ally',position:[1,0] as [number,number]},{id:'hidden',position:[3,0] as [number,number]},{id:'far',position:[5,5] as [number,number]}];
 assert.deepEqual(areaTargets(grid,[0,0],15,actors),['ally']);
});
