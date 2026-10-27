export interface Rect {x:number;y:number;width:number;height:number}
export interface LabelCandidate extends Rect{id:string;priority:number}
export function overlaps(a:Rect,b:Rect){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}
/** Selected (100) and hovered (60) labels register at or above this. They are never dropped while any slot clear of the HUD and other labels remains. */
export const focusPriority=50;
const nearby=[[0,-1],[0,0],[-1,-1],[1,-1],[0,-2],[-1,0],[1,0],[0,1],[-1,-2],[1,-2]];
/** Further slots for focused labels, nearest first: a packed melee can cover every nearby slot with bodies or other labels. */
const reach=[...nearby,...[-6,-5,-4,-3,-2,-1,0,1,2,3].flatMap(dy=>[0,-1,1,-2,2].map(dx=>[dx,dy])).filter(([dx,dy])=>!nearby.some(o=>o[0]===dx&&o[1]===dy)).sort((a,b)=>Math.hypot(a[0]*126,a[1]*46)-Math.hypot(b[0]*126,b[1]*46))];
/** Stable, bounded displacement. Hidden labels remain available in the target menu. `offset` marks a label pushed out of its home slot (just above or on its anchor), the only case that needs a leader line. */
export interface PlacedLabel extends LabelCandidate {anchorX:number;anchorY:number;offset:boolean}
export function placeLabels(labels:LabelCandidate[],viewport:Rect,blocked:Rect[],silhouettes:Rect[]=[]):PlacedLabel[]{
 const placed:PlacedLabel[]=[];const padding=6;
 for(const label of [...labels].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))){
  if(label.width<=0||label.height<=0||![label.x,label.y,label.width,label.height].every(Number.isFinite)||label.x<viewport.x||label.y<viewport.y||label.x>viewport.x+viewport.width||label.y>viewport.y+viewport.height)continue;
  if(blocked.some(b=>label.x>=b.x&&label.x<=b.x+b.width&&label.y>=b.y&&label.y<=b.y+b.height))continue;
  // Compact pills still step as far as a 120×40 box would, so a small label can clear the silhouette of the character it names.
  const stepX=Math.max(label.width,120)+padding,stepY=Math.max(label.height,40)+padding,focused=label.priority>=focusPriority;
  const slot=(dx:number,dy:number)=>({...label,x:label.x-label.width/2+dx*stepX,y:dy<0?label.y-label.height-padding+(dy+1)*stepY:label.y+dy*stepY});
  const fits=(box:Rect,avoid:Rect[])=>{const padded={x:box.x-padding,y:box.y-padding,width:box.width+padding*2,height:box.height+padding*2};return !(padded.x<viewport.x||padded.y<viewport.y||padded.x+padded.width>viewport.x+viewport.width||padded.y+padded.height>viewport.y+viewport.height)&&!avoid.some(other=>overlaps(padded,other));};
  // Clear of bodies first; a focused label boxed in on every side goes over a body rather than vanishing, still never over the HUD or another label.
  const passes:[number[][],Rect[]][]=focused?[[reach,[...blocked,...silhouettes,...placed]],[reach,[...blocked,...placed]]]:[[nearby,[...blocked,...silhouettes,...placed]]];
  for(const [offsets,avoid] of passes){const hit=offsets.find(([dx,dy])=>fits(slot(dx,dy),avoid));if(hit){const [dx,dy]=hit;placed.push({...slot(dx,dy),anchorX:label.x,anchorY:label.y,offset:dx!==0||dy<-1||dy>0});break;}}
 }
 return placed;
}
