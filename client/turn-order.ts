// #112 The turn order scrolls sideways when a fight is wider than its room between the side panels. Pure, so it can be tested.
/** Scroll offset that centres an entry (`left`, `width`) in a strip `view` wide holding `content`, clamped to the strip's ends. */
export const centreScroll=(left:number,width:number,view:number,content:number)=>Math.max(0,Math.min(content-view,Math.round(left-(view-width)/2)));
