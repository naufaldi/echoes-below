import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findPath,type Cell,type TacticalGrid} from '../shared/tactical-grid.js';
import {encounterTerrain} from '../shared/encounter-terrain.js';
import {CURATED_ENCOUNTERS} from '../server/encounters.js';
// Commit 1 characterizes main through its existing single-destination API.
function reachable(grid:TacticalGrid,start:Cell,budget:number){const paths=new Map<string,NonNullable<ReturnType<typeof findPath>>>();for(let x=0;x<grid.width;x++)for(let y=0;y<grid.height;y++){const path=findPath(grid,start,[x,y],budget);if(path)paths.set(`${x},${y}`,path);}return paths;}
const layouts=new Map<string,string>();for(const scene of ['approach','cookfire','bell',...Object.keys(CURATED_ENCOUNTERS)])layouts.set(JSON.stringify(encounterTerrain(scene)),scene);
for(const scene of layouts.values())for(const occupied of [false,true])test(`reachability ${scene}, occupants=${occupied}`,()=>{
 const grid=encounterTerrain(scene);if(occupied)grid.blocked.push([3,1],[4,1],[5,1],[3,6],[4,6]);
 for(let sx=0;sx<grid.width;sx++)for(let sy=0;sy<grid.height;sy++)for(const budget of [5,10,30,60]){
  const start:Cell=[sx,sy],paths=reachable(grid,start,budget);
  for(let x=0;x<grid.width;x++)for(let y=0;y<grid.height;y++){const path=findPath(grid,start,[x,y],budget),key=`${x},${y}`;if(path)assert.deepEqual(paths.get(key),path,`${start} -> ${key}, budget ${budget}`);else assert.equal(paths.has(key),false);}
 }
});
