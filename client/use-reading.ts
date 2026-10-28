import {useSyncExternalStore} from 'react';
import './reading.css';
import {loadReading,saveReading,type ReadingSettings} from './reading-settings';

/** #68 The reading settings, live: the story box, playback and the typewriter read them, so a change in Settings shows at once. Text size sets `data-text-size` on the page root for reading.css. */
const store=()=>{try{return localStorage;}catch{return null;}};
let settings:ReadingSettings=loadReading(store());
const listeners=new Set<()=>void>();
function applySize(){if(typeof document==='undefined')return;const root=document.documentElement;if(settings.size==='normal')delete root.dataset.textSize;else root.dataset.textSize=settings.size;}
applySize();
export function setReading(patch:Partial<ReadingSettings>){settings={...settings,...patch};saveReading(store(),settings);applySize();listeners.forEach(l=>l());}
export function useReading(){return useSyncExternalStore(l=>{listeners.add(l);return()=>listeners.delete(l);},()=>settings,()=>settings);}
