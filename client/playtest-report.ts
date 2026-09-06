import {activeMilliseconds,emptyTiming,sumTiming,validTiming,type PlayTiming} from './playtest-clock.js';
export interface TimingRecord{timing:PlayTiming;sceneTimings?:Record<string,PlayTiming>}
function validScenes(record:TimingRecord){
 const rooms=record.sceneTimings;if(!rooms||typeof rooms!=='object'||Array.isArray(rooms)||!Object.values(rooms).every(validTiming))return false;
 const total=sumTiming(Object.values(rooms));return (Object.keys(total) as (keyof PlayTiming)[]).every(key=>total[key]<=record.timing[key]+.001);
}
export function timingBreakdown(records:TimingRecord[]){
 const rooms=new Map<string,PlayTiming>();
 for(const record of records)if(validScenes(record))for(const [id,timing] of Object.entries(record.sceneTimings!))rooms.set(id,sumTiming([rooms.get(id)??emptyTiming(),timing]));
 const chapterOf=(id:string)=>['approach','hall','cookfire','prison','bell','aftermath'].includes(id)?1:/^(archive|market|roots|choir|depth)-[1-8]$/.test(id)?['archive','market','roots','choir','depth'].indexOf(id.split('-')[0])+2:null;
 const scenes=[...rooms].sort(([a],[b])=>a.localeCompare(b)).map(([id,timing])=>({id,chapter:chapterOf(id),activePlay:activeMilliseconds(timing),timing}));
 const chapters=Array.from({length:6},(_,i)=>{const timing=sumTiming(scenes.filter(s=>s.chapter===i+1).map(s=>s.timing));return{chapter:i+1,activePlay:activeMilliseconds(timing),timing};});
 return{scenes,chapters,unattributedActivePlay:Math.max(0,activeMilliseconds(sumTiming(records.map(r=>r.timing)))-scenes.reduce((n,s)=>n+s.activePlay,0))};
}
