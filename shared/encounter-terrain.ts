import type {Cell,TacticalGrid} from './tactical-grid.js';
/** Saved encounter geometry is authoritative for both movement and rendering. */
export function encounterTerrain(scene:string):TacticalGrid{
 const layouts:Record<string,{blocked:Cell[];difficult:Cell[]}>= {
  cookfire:{blocked:[[2,3],[6,4]],difficult:[[3,4],[4,4],[5,4]]},
  bell:{blocked:[[2,4],[6,4]],difficult:[[3,5],[4,5],[5,5]]},
  archive:{blocked:[[2,3],[6,3]],difficult:[[1,4],[2,4],[3,4],[5,4],[6,4],[7,4]]},
  market:{blocked:[[1,3],[2,3],[6,3],[7,3]],difficult:[[2,5],[6,5]]},
  roots:{blocked:[[2,2],[2,3],[6,4],[6,5]],difficult:[[3,3],[4,3],[4,4],[5,4]]},
  choir:{blocked:[[2,3],[4,3],[6,3]],difficult:[[1,5],[7,5]]},
  depth:{blocked:[[2,3],[3,3],[5,4],[6,4]],difficult:[[4,3],[4,4],[3,5],[5,3]]},
 };
 const layout=layouts[scene]??layouts[scene.split('-')[0]];
 return {width:9,height:9,blocked:[[0,0],[8,0],[0,8],[8,8],...(layout?.blocked??[]).map(p=>[...p] as Cell)],difficult:(layout?.difficult??[[1,4],[7,4]]).map(p=>[...p] as Cell)};
}
