import {useSyncExternalStore} from 'react';
// #97 Below this width (200% zoom on a 1440 or 1920 screen) the HUD stacks: the actions become a bottom drawer and the story box spans the width. Keep in step with style.css.
export const NARROW_QUERY='(max-width: 899px)';
const query=typeof matchMedia==='function'?matchMedia(NARROW_QUERY):null;
export function useNarrow(){return useSyncExternalStore(f=>{query?.addEventListener('change',f);return()=>query?.removeEventListener('change',f);},()=>!!query?.matches,()=>false);}
