export interface Rect {x:number;y:number;width:number;height:number}
export interface LabelCandidate extends Rect{id:string;priority:number}
export function overlaps(a:Rect,b:Rect){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}
/** Stable, bounded displacement. Hidden labels remain available in the target menu. `offset` marks a label pushed out of its home slot (just above or on its anchor), the only case that needs a leader line. */
export interface PlacedLabel extends LabelCandidate {anchorX:number;anchorY:number;offset:boolean}
export function placeLabels(labels:LabelCandidate[],viewport:Rect,blocked:Rect[],silhouettes:Rect[]=[]):PlacedLabel[]{
 const placed:PlacedLabel[]=[];const padding=6;
 for(const label of [...labels].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))){
  if(label.width<=0||label.height<=0||![label.x,label.y,label.width,label.height].every(Number.isFinite)||label.x<viewport.x||label.y<viewport.y||label.x>viewport.x+viewport.width||label.y>viewport.y+viewport.height)continue;
  if(blocked.some(b=>label.x>=b.x&&label.x<=b.x+b.width&&label.y>=b.y&&label.y<=b.y+b.height))continue;
  const offsets=[[0,-1],[0,0],[-1,-1],[1,-1],[0,-2],[-1,0],[1,0],[0,1],[-1,-2],[1,-2]];
  // Compact pills still step as far as a 120×40 box would, so a small label can clear the silhouette of the character it names.
  const stepX=Math.max(label.width,120)+padding,stepY=Math.max(label.height,40)+padding;
  for(const [dx,dy] of offsets){const box={...label,x:label.x-label.width/2+dx*stepX,y:dy<0?label.y-label.height-padding+(dy+1)*stepY:label.y+dy*stepY};const padded={x:box.x-padding,y:box.y-padding,width:box.width+padding*2,height:box.height+padding*2};
   if(padded.x<viewport.x||padded.y<viewport.y||padded.x+padded.width>viewport.x+viewport.width||padded.y+padded.height>viewport.y+viewport.height)continue;
   if([...blocked,...silhouettes,...placed].some(other=>overlaps(padded,other)))continue;
   placed.push({...box,anchorX:label.x,anchorY:label.y,offset:dx!==0||dy<-1||dy>0});break;
  }
 }
 return placed;
}
