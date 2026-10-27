import {portraitLook,portraitKey,resolveOverride,manifestFiles,type PortraitSubject,type PortraitExpression,type PortraitLook} from './portrait-look';
/** Portrait cache shared by the DOM (usePortrait) and the in-canvas studio. One entry per look and expression; snapshots are queued and taken one at a time. */
export interface PortraitState{url:string|null;ready:boolean;source:'override'|'render'|null}
export interface PortraitJob{key:string;look:PortraitLook;expression:PortraitExpression;subject:PortraitSubject}
export interface PortraitTiming{key:string;prepareMs:number;compileMs:number;warmMs:number;renderMs:number;readbackMs:number;encodeMs:number;readback:'async'|'sync'}
const EMPTY:PortraitState={url:null,ready:false,source:null};
const rendered=new Map<string,string|null>(),aliases=new Map<string,string>(),queue:PortraitJob[]=[],listeners=new Set<()=>void>(),timings:PortraitTiming[]=[];
const pending:[PortraitSubject,PortraitExpression][]=[];
let files:Set<string>|null=null,manifestRequested=false,version=0;
const emit=()=>{version++;for(const l of listeners)l();};
export const subscribePortraits=(l:()=>void)=>{listeners.add(l);return()=>{listeners.delete(l);};};
export const portraitVersion=()=>version;
/** One request for the override manifest, which always ships (possibly empty), so a missing painted portrait never costs a 404. */
function loadManifest(){if(manifestRequested)return;manifestRequested=true;fetch('/assets/portraits/manifest.json').then(r=>r.ok?r.json():null).catch(()=>null).then(m=>{files=manifestFiles(m);for(const [s,e] of pending.splice(0))requestPortrait(s,e);emit();});}
export function readPortrait(subject:PortraitSubject,expression:PortraitExpression='neutral'):PortraitState{
 if(!files)return EMPTY;const override=resolveOverride(subject.id,expression,files);if(override)return {url:override,ready:true,source:'override'};
 const key=portraitKey(portraitLook(subject),expression),url=rendered.get(aliases.get(key)??key);return url?{url,ready:true,source:'render'}:EMPTY;
}
export function requestPortrait(subject:PortraitSubject,expression:PortraitExpression='neutral'){
 loadManifest();if(!files){pending.push([subject,expression]);return;}if(resolveOverride(subject.id,expression,files))return;enqueue(subject,expression);
}
function enqueue(subject:PortraitSubject,expression:PortraitExpression){const look=portraitLook(subject),key=portraitKey(look,expression);if(rendered.has(key)||aliases.has(key)||queue.some(j=>j.key===key))return;queue.push({key,look,expression,subject});emit();}
/** Studio side: the next look to snapshot, or undefined when the queue is empty. Stable between changes, so it can back useSyncExternalStore. */
export const nextPortraitJob=()=>queue[0];
export function finishPortrait(key:string,url:string|null,timing?:PortraitTiming){const i=queue.findIndex(j=>j.key===key);if(i>=0)queue.splice(i,1);rendered.set(key,url);if(timing)timings.push(timing);emit();}
/** The model has no clip for this expression, so the expression shares the neutral snapshot. */
export function followNeutral(job:PortraitJob){const neutral=portraitKey(job.look,'neutral');aliases.set(job.key,neutral);const i=queue.indexOf(job);if(i>=0)queue.splice(i,1);enqueue(job.subject,'neutral');emit();}
export const portraitTimings=():readonly PortraitTiming[]=>timings;
