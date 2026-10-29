import {useSyncExternalStore} from 'react';

let frameTime=0;
const listeners=new Set<()=>void>();
export function setFrameTime(ms:number){frameTime=ms;listeners.forEach(l=>l());}
export const getFrameTime=()=>frameTime;
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export function useFrameTime(){return useSyncExternalStore(subscribe,getFrameTime,getFrameTime);}
