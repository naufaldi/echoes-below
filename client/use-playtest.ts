import {useEffect,useRef,useState} from 'react';
import {PlayClock,activeMilliseconds,emptyTiming,sumTiming,validTiming,type PlayPhase,type PlayTiming} from './playtest-clock';
interface Options{saveId:string|null;phase:PlayPhase;playing:boolean;sceneId:string|null;completed:boolean;frameTime:number;}
interface RecordV1{version:1;timing:PlayTiming;scenes:string[];completed:boolean;latestFrameP95Ms:number;}
const prefix=(id:string)=>'echoes-playtest-v1:'+id+':';
function readRecords(id:string){const rows:RecordV1[]=[];try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key?.startsWith(prefix(id)))continue;try{const r=JSON.parse(localStorage.getItem(key)??'null');if(r?.version===1&&validTiming(r.timing)&&Array.isArray(r.scenes)&&r.scenes.every((s:unknown)=>typeof s==='string')&&typeof r.completed==='boolean')rows.push(r);}catch{}}}catch{}return rows;}
export function usePlaytest(options:Options){
 const latest=useRef(options);latest.current=options;
 const live=useRef<{clock:PlayClock;record:RecordV1;flush:()=>void}|null>(null);
 const[totals,setTotals]=useState(emptyTiming),[storageAvailable,setStorageAvailable]=useState(true);
 useEffect(()=>{
  if(!options.saveId){live.current=null;setTotals(emptyTiming());return;}
  const id=options.saveId,key=prefix(id)+crypto.randomUUID();
  const state=()=>({visible:!document.hidden,focused:document.hasFocus(),playing:latest.current.playing,phase:latest.current.phase});
  const clock=new PlayClock(performance.now(),state());
  const record:RecordV1={version:1,timing:clock.timing,scenes:[],completed:false,latestFrameP95Ms:0};
  const flush=()=>{clock.tick(performance.now());const o=latest.current;if(o.saveId===id){if(o.sceneId&&!record.scenes.includes(o.sceneId))record.scenes.push(o.sceneId);record.completed ||= o.completed;record.latestFrameP95Ms=o.frameTime;}
   try{localStorage.setItem(key,JSON.stringify(record));setTotals(sumTiming(readRecords(id).map(r=>r.timing)));setStorageAvailable(true);}catch{setStorageAvailable(false);setTotals({...clock.timing});}
  };
  live.current={clock,record,flush};
  const activity=()=>clock.activity(performance.now());
  const visibility=()=>{clock.transition(performance.now(),state());if(!document.hidden&&document.hasFocus())clock.activity(performance.now());flush();};
  const tick=setInterval(()=>{clock.transition(performance.now(),state());},1000);
  const persist=setInterval(flush,5000);
  for(const event of ['pointerdown','keydown','wheel'])window.addEventListener(event,activity,{passive:true});
  for(const event of ['focus','blur','pagehide'])window.addEventListener(event,visibility);
  document.addEventListener('visibilitychange',visibility);flush();
  return()=>{flush();clearInterval(tick);clearInterval(persist);for(const event of ['pointerdown','keydown','wheel'])window.removeEventListener(event,activity);for(const event of ['focus','blur','pagehide'])window.removeEventListener(event,visibility);document.removeEventListener('visibilitychange',visibility);live.current=null;};
 },[options.saveId]);
 useEffect(()=>{live.current?.clock.transition(performance.now(),{visible:!document.hidden,focused:document.hasFocus(),playing:options.playing,phase:options.phase});},[options.phase,options.playing]);
 useEffect(()=>{live.current?.flush();},[options.sceneId,options.completed]);
 function download(){
  live.current?.flush();if(!options.saveId)return;
  const records=readRecords(options.saveId);const rows=storageAvailable?records:live.current?[live.current.record]:[];
  const timing=sumTiming(rows.map(r=>r.timing));
  const report={game:'Echoes Below',measurementVersion:1,exportedAt:new Date().toISOString(),scope:'This adventure in this browser only; restored checkpoint branches are separate adventures.',units:'milliseconds',activePlay:activeMilliseconds(timing),timing,measurementSegments:rows.length,visitedScenes:[...new Set(rows.flatMap(r=>r.scenes))],reachedEnding:rows.some(r=>r.completed),latestFrameP95Ms:options.frameTime,method:'Observed focused foreground intervals; idle after 120 seconds without input; gaps over 5 seconds excluded. Waiting is not active play. Long reading/listening may be undercounted. This is an estimate, not independently verified human campaign duration.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='echoes-below-playtest.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return{totals,storageAvailable,download};
}
export const formatPlaytime=(ms:number)=>`${Math.floor(ms/3_600_000)}h ${Math.floor(ms%3_600_000/60_000)}m`;
