/** Curated dungeon geometry: five-foot cells; equal diagonal cost, no corner cutting. */
export type Cell=[number,number];
export interface TacticalGrid {width:number;height:number;blocked:Cell[];difficult?:Cell[]}
const key=([x,y]:Cell)=>`${x},${y}`;
const equal=(a:Cell,b:Cell)=>a[0]===b[0]&&a[1]===b[1];
function valid(grid:TacticalGrid,p:Cell){return p.every(Number.isInteger)&&p[0]>=0&&p[1]>=0&&p[0]<grid.width&&p[1]<grid.height;}
function traversable(grid:TacticalGrid,p:Cell,walls:Set<string>){return valid(grid,p)&&!walls.has(key(p));}
function search(grid:TacticalGrid,start:Cell,budgetFeet:number,end?:Cell){
 const walls=new Set(grid.blocked.map(key));const difficult=new Set((grid.difficult??[]).map(key));
 if(!Number.isFinite(budgetFeet)||budgetFeet<0||!traversable(grid,start,walls)||(end&&!traversable(grid,end,walls)))return null;
 const queue=[{cell:start,cost:0,key:key(start)}];const costs=new Map([[key(start),0]]);const parent=new Map<string,Cell>();
 while(queue.length){queue.sort((a,b)=>a.cost-b.cost||a.key.localeCompare(b.key));const current=queue.shift()!;
  if(current.cost!==costs.get(current.key))continue;
  if(end&&equal(current.cell,end))break;
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
   if(dx===0&&dy===0)continue;const next:Cell=[current.cell[0]+dx,current.cell[1]+dy];if(!traversable(grid,next,walls))continue;
   if(dx&&dy&&(!traversable(grid,[current.cell[0]+dx,current.cell[1]],walls)||!traversable(grid,[current.cell[0],current.cell[1]+dy],walls)))continue;
   const nextKey=key(next),cost=current.cost+(difficult.has(nextKey)?10:5);if(cost>budgetFeet||cost>=(costs.get(nextKey)??Infinity))continue;
   costs.set(nextKey,cost);parent.set(nextKey,current.cell);queue.push({cell:next,cost,key:nextKey});
  }
 }
 return {costs,parent};
}
function rebuild(start:Cell,end:Cell,costFeet:number,parent:Map<string,Cell>){const cells:Cell[]=[end];let cursor=end;while(!equal(cursor,start)){cursor=parent.get(key(cursor))!;cells.unshift(cursor);}return{cells,costFeet};}
export function findPath(grid:TacticalGrid,start:Cell,end:Cell,budgetFeet:number):{cells:Cell[];costFeet:number}|null{
 const result=search(grid,start,budgetFeet,end),cost=result?.costs.get(key(end));return result&&cost!==undefined?rebuild(start,end,cost,result.parent):null;
}
export function reachable(grid:TacticalGrid,start:Cell,budgetFeet:number):Map<string,{cells:Cell[];costFeet:number}>{
 const result=search(grid,start,budgetFeet),paths=new Map<string,{cells:Cell[];costFeet:number}>();if(result)for(const [id,cost] of result.costs)paths.set(id,rebuild(start,id.split(',').map(Number) as Cell,cost,result.parent));return paths;
}
/** Supercover ray: touching a blocked corner counts as blocked in this curated ruleset. */
export function lineOfSight(grid:TacticalGrid,start:Cell,end:Cell):boolean{
 const walls=new Set(grid.blocked.map(key));if(!traversable(grid,start,walls)||!traversable(grid,end,walls))return false;
 let [x,y]=start;const dx=end[0]-x,dy=end[1]-y,nx=Math.abs(dx),ny=Math.abs(dy),sx=Math.sign(dx),sy=Math.sign(dy);let ix=0,iy=0;
 while(ix<nx||iy<ny){const compare=(1+2*ix)*ny-(1+2*iy)*nx;
  if(compare===0){if(!traversable(grid,[x+sx,y],walls)||!traversable(grid,[x,y+sy],walls))return false;x+=sx;y+=sy;ix++;iy++;}
  else if(compare<0){x+=sx;ix++;}else{y+=sy;iy++;}
  if(!traversable(grid,[x,y],walls))return false;
 }
 return true;
}
export function areaTargets(grid:TacticalGrid,origin:Cell,radiusFeet:number,actors:{id:string;position:Cell}[]):string[]{
 if(!Number.isFinite(radiusFeet)||radiusFeet<0)return[];
 return actors.filter(a=>Math.hypot(a.position[0]-origin[0],a.position[1]-origin[1])*5<=radiusFeet&&lineOfSight(grid,origin,a.position)).map(a=>a.id);
}

/** Follow a complete route to a free adjacent attack cell, even when the first
 * step leads away from the target. Occupied targets remain blocked in grid. */
export function approachTarget(grid:TacticalGrid,start:Cell,target:Cell,budgetFeet:number):Cell|null{
 if(!Number.isFinite(budgetFeet)||budgetFeet<0)return null;
 const routes:NonNullable<ReturnType<typeof findPath>>[]=[];
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
  if(!dx&&!dy)continue;
  const end:Cell=[target[0]+dx,target[1]+dy];
  // Ignore target occupancy for the final attack ray, retaining all other walls.
  const sightGrid={...grid,blocked:grid.blocked.filter(p=>!equal(p,target))};
  if(!lineOfSight(sightGrid,end,target))continue;
  const route=findPath(grid,start,end,grid.width*grid.height*10);
  if(route)routes.push(route);
 }
 routes.sort((a,b)=>a.costFeet-b.costFeet);
 const route=routes[0];if(!route||route.costFeet===0)return null;
 const difficult=new Set((grid.difficult??[]).map(key));let cost=0,result:Cell|null=null;
 for(const cell of route.cells.slice(1)){cost+=difficult.has(key(cell))?10:5;if(cost>budgetFeet)break;result=cell;}
 return result;
}
