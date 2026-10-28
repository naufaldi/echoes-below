// #97 Reduced motion: the player's own choice in Settings wins; until they make one, the game follows the OS setting, live.
export type MotionChoice='reduced'|'full'|null;
export const MOTION_KEY='echoes-motion-choice',LEGACY_MOTION_KEY='echoes-motion';
/** The stored choice. The old key was written on every visit (always "full" unless toggled), so only its "reduced" was ever a real choice. */
export function storedMotion(choice:string|null,legacy:string|null):MotionChoice{return choice==='reduced'||choice==='full'?choice:legacy==='reduced'?'reduced':null;}
export const reducedMotion=(choice:MotionChoice,os:boolean)=>choice?choice==='reduced':os;
/** Storage can be unreachable (blocked cookies); the game then follows the OS for this visit. */
export function readMotion(store:Pick<Storage,'getItem'>):MotionChoice{try{return storedMotion(store.getItem(MOTION_KEY),store.getItem(LEGACY_MOTION_KEY));}catch{return null;}}
