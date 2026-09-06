export interface Rect {x:number;y:number;width:number;height:number}
export interface LabelCandidate extends Rect{id:string;priority:number}
export function overlaps(a:Rect,b:Rect){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}
/** Stable, bounded displacement. Hidden labels remain available in the target menu. */
export interface PlacedLabel extends LabelCandidate {anchorX:number;anchorY:number}
export function placeLabels(labels:LabelCandidate[],viewport:Rect,blocked:Rect[]):PlacedLabel[]{
 const placed:PlacedLabel[]=[];const padding=6;
 for(const label of [...labels].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))){
  if(label.width<=0||label.height<=0||![label.x,label.y,label.width,label.height].every(Number.isFinite)||label.x<viewport.x||label.y<viewport.y||label.x>viewport.x+viewport.width||label.y>viewport.y+viewport.height)continue;
  if(blocked.some(b=>label.x>=b.x&&label.x<=b.x+b.width&&label.y>=b.y&&label.y<=b.y+b.height))continue;
  const offsets=[[0,-1],[0,0],[-1,-1],[1,-1],[0,-2],[-1,0],[1,0],[0,1],[-1,-2],[1,-2]];
  for(const [dx,dy] of offsets){const box={...label,x:label.x-label.width/2+dx*(label.width+padding),y:label.y+dy*(label.height+padding)};const padded={x:box.x-padding,y:box.y-padding,width:box.width+padding*2,height:box.height+padding*2};
   if(padded.x<viewport.x||padded.y<viewport.y||padded.x+padded.width>viewport.x+viewport.width||padded.y+padded.height>viewport.y+viewport.height)continue;
   if([...blocked,...placed].some(other=>overlaps(padded,other)))continue;
   placed.push({...box,anchorX:label.x,anchorY:label.y});break;
  }
 }
 return placed;
}
