import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findPath,reachable,type Cell} from '../shared/tactical-grid.js';
import {encounterTerrain} from '../shared/encounter-terrain.js';
import {CURATED_ENCOUNTERS} from '../server/encounters.js';
const layouts=new Map<string,string>();for(const scene of ['approach','cookfire','bell',...Object.keys(CURATED_ENCOUNTERS)])layouts.set(JSON.stringify(encounterTerrain(scene)),scene);
for(const scene of layouts.values())for(const occupied of [false,true])test(`reachability ${scene}, occupants=${occupied}`,()=>{
 const grid=encounterTerrain(scene);if(occupied)grid.blocked.push([3,1],[4,1],[5,1],[3,6],[4,6]);
 for(let sx=0;sx<grid.width;sx++)for(let sy=0;sy<grid.height;sy++)for(const budget of [5,10,30,60]){
  const start:Cell=[sx,sy],paths=reachable(grid,start,budget);
  for(let x=0;x<grid.width;x++)for(let y=0;y<grid.height;y++){const path=findPath(grid,start,[x,y],budget),key=`${x},${y}`;if(path)assert.deepEqual(paths.get(key),path,`${start} -> ${key}, budget ${budget}`);else assert.equal(paths.has(key),false);}
 }
});
test('invalid budgets and starts yield no reachable cells; zero budget retains a valid start',()=>{
 const grid=encounterTerrain('bell');for(const budget of [-1,NaN,Infinity])assert.equal(reachable(grid,[3,1],budget).size,0);
 for(const start of [[0,0],[-1,0],[9,0],[1.5,1],[NaN,1]] as Cell[])assert.equal(reachable(grid,start,30).size,0);
 assert.deepEqual([...reachable(grid,[3,1],0)], [['3,1',{cells:[[3,1]],costFeet:0}]]);
});
