// #68 Reading settings (ROADMAP D2, §5): text speed, auto-advance and its pause, and text size. Pure, so parsing and migration can be tested without a browser.
export type TextSpeed='slow'|'normal'|'fast'|'instant';
export type ReadingPause='short'|'normal'|'long';
export type TextSize='normal'|'large'|'larger';
export interface ReadingSettings{speed:TextSpeed;autoAdvance:boolean;pause:ReadingPause;size:TextSize}
export const DEFAULT_READING:ReadingSettings={speed:'normal',autoAdvance:false,pause:'normal',size:'normal'};
export const READING_KEY='echoes-reading',LEGACY_AUTO_ADVANCE_KEY='echoes-auto-advance';
export const SPEEDS:readonly TextSpeed[]=['slow','normal','fast','instant'],PAUSES:readonly ReadingPause[]=['short','normal','long'],SIZES:readonly TextSize[]=['normal','large','larger'];
/** Letters a second for the typewriter; normal is the 40 the story box was tuned on. Instant shows each page whole. */
export const SPEED_CPS:Record<TextSpeed,number>={slow:25,normal:40,fast:70,instant:Infinity};
/** How long auto-advance waits, as a share of the normal reading pause. */
export const PAUSE_SCALE:Record<ReadingPause,number>={short:.6,normal:1,long:1.6};
/** Story text and choices grow by this much; the HUD chrome keeps its size. */
export const SIZE_SCALE:Record<TextSize,number>={normal:1,large:1.12,larger:1.25};

const pick=<T extends string>(value:unknown,from:readonly T[],fallback:T)=>from.includes(value as T)?value as T:fallback;
/** A stored value, falling back to the defaults field by field. Before #68 only auto-advance was kept, under its own key ("on"/"off"). */
export function parseReading(raw:string|null,legacyAutoAdvance:string|null=null):ReadingSettings{
 let value:any=null;try{value=raw?JSON.parse(raw):null;}catch{}
 const d=DEFAULT_READING;
 if(!value||typeof value!=='object')return {...d,autoAdvance:legacyAutoAdvance==='on'};
 return {speed:pick(value.speed,SPEEDS,d.speed),autoAdvance:value.autoAdvance===true,pause:pick(value.pause,PAUSES,d.pause),size:pick(value.size,SIZES,d.size)};
}
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
/** Reads the settings and moves the old auto-advance key into the new record once. Blocked storage gives the defaults for this visit. */
export function loadReading(store:Store|null):ReadingSettings{
 try{
  if(!store)return {...DEFAULT_READING};
  const raw=store.getItem(READING_KEY),legacy=store.getItem(LEGACY_AUTO_ADVANCE_KEY),settings=parseReading(raw,legacy);
  if(legacy!==null){if(raw===null)store.setItem(READING_KEY,JSON.stringify(settings));store.removeItem(LEGACY_AUTO_ADVANCE_KEY);}
  return settings;
 }catch{return {...DEFAULT_READING};}
}
export function saveReading(store:Pick<Storage,'setItem'>|null,settings:ReadingSettings){try{store?.setItem(READING_KEY,JSON.stringify(settings));}catch{/* blocked storage: the choice lasts this visit */}}
/** Share of the normal page each size holds: three lines in the narrowest box with a portrait (1100px), long words included (measured). */
export const PAGE_SHARE:Record<TextSize,number>={normal:1,large:.89,larger:.75};
/** Characters a page holds at a text size: the 200 measured at normal, fewer as the letters grow. */
export const pageBudget=(size:TextSize,base=200)=>Math.floor(base*PAGE_SHARE[size]);
/** Auto-advance waits about 22 characters a second, never under 1.8s, scaled by the chosen pause. */
export const readingPause=(text:string,pause:ReadingPause='normal')=>Math.round(Math.max(1800,900+text.length*45)*PAUSE_SCALE[pause]);
