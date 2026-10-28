import {useSyncExternalStore} from 'react';
// #97 Below 1000px (200% zoom on a 1440 or 1920 screen: about 720×450 and 960×475) the HUD stacks: the actions become a bottom drawer and the story box spans the width. Keep in step with style.css.
export const NARROW_QUERY='(max-width: 999px)';
const query=typeof matchMedia==='function'?matchMedia(NARROW_QUERY):null;
export function useNarrow(){return useSyncExternalStore(f=>{query?.addEventListener('change',f);return()=>query?.removeEventListener('change',f);},()=>!!query?.matches,()=>false);}
