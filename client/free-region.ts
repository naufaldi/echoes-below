type Edges={left:number;right:number;top:number;bottom:number};
/** Offset from the viewport centre to the centre of the space the HUD panels leave open, in CSS pixels. Each panel may claim at most part of the screen, so a misplaced panel cannot push the scene off-screen. */
export function freeRegion(width:number,height:number,rects:{left?:Edges|null;right?:Edges|null;top?:Edges|null;bottom?:Edges|null}){
 const left=rects.left?Math.min(rects.left.right,width*.45):0,right=rects.right?Math.max(rects.right.left,width*.55):width;
 const top=rects.top?Math.min(rects.top.bottom,height*.4):0,bottom=rects.bottom?Math.max(rects.bottom.top,height*.55):height;
 return {x:(left+right)/2-width/2,y:(top+bottom)/2-height/2};
}
