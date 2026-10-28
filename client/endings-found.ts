import {ENDING_IDS,type EndingId} from '../shared/endings.js';
// #69 Endings found, per browser. Only endings this browser has reached carry a title; the rest stay locked with no hint of which way they lie.
export const ENDINGS_FOUND_KEY='echoes-endings-found';
export interface FoundEnding {id:EndingId;title:string;}
export type EndingSlot={found:true;id:EndingId;title:string}|{found:false};
type Store=Pick<Storage,'getItem'|'setItem'>;

/** Found endings in the fixed ending order. Unknown ids, untitled entries and unreadable storage count as nothing found. */
export function readFound(store:Store):FoundEnding[]{
 let raw:unknown;try{raw=JSON.parse(store.getItem(ENDINGS_FOUND_KEY)??'[]');}catch{return [];}
 const list=Array.isArray(raw)?raw as Partial<FoundEnding>[]:[];
 return ENDING_IDS.flatMap(id=>{const e=list.find(x=>x?.id===id&&typeof x.title==='string'&&!!x.title);return e?[{id,title:e.title!}]:[];});
}
/** Records an ending and returns the full list. A browser that refuses storage still shows this visit's ending. */
export function recordFound(store:Store,ending:FoundEnding):FoundEnding[]{
 const found=readFound(store).filter(f=>f.id!==ending.id),next=ENDING_IDS.flatMap(id=>id===ending.id?[ending]:found.filter(f=>f.id===id));
 try{store.setItem(ENDINGS_FOUND_KEY,JSON.stringify(next));}catch{/* private mode or full storage */}
 return next;
}
/** One slot per ending, in a fixed order; a locked slot carries nothing. */
export const endingSlots=(found:FoundEnding[]):EndingSlot[]=>ENDING_IDS.map(id=>{const f=found.find(x=>x.id===id);return f?{found:true,id,title:f.title}:{found:false};});
