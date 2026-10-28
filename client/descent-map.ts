import {CAMPAIGN_MAP} from '../shared/campaign-map.js';
import {FORK_ROOMS} from '../shared/companion-barks.js';

// #63 Descent map: the six chapters as depths, their rooms as nodes. Built only from public ids, titles and the scene the save stands in.
/** Chapter I lives outside the generated campaign map: its scene ids (server/game.ts) and the names the room strip shows. */
export const CHAPTER_ONE=[{id:'approach',title:'Approach'},{id:'hall',title:'Counterweight hall'},{id:'cookfire',title:'Goblin camp'},{id:'prison',title:'Prison alcove'},{id:'bell',title:'Bell chamber'},{id:'aftermath',title:'Aftermath'}] as const;
export const CHAPTER_ONE_NAME='The Bell Beneath Briarwatch';
/** Fork rooms (FORK_ROOMS: ids only; the variants stay in server/playstyle.ts) say this and nothing about either way. */
export const FORK_LINE='The way here depends on you';
const NUMERALS=['I','II','III','IV','V','VI'];

/** `cleared` rooms are behind the party, `current` is where it stands, `ahead` is the rest of this chapter (the strip already names them), `unlit` is any later chapter, shown without titles. */
export type RoomState='cleared'|'current'|'ahead'|'unlit';
export interface MapRoom {id:string;number:number;title:string|null;state:RoomState;/** On the path taken: every cleared room and the current one. */path:boolean;/** The current room's choice is made. */settled:boolean;fork:boolean;label:string;}
export interface MapDepth {chapter:number;numeral:string;name:string;state:'past'|'current'|'ahead';rooms:MapRoom[];label:string;}

const ROUTE=[...CHAPTER_ONE.map(r=>({id:r.id as string,title:r.title as string,chapter:1,chapterName:CHAPTER_ONE_NAME})),...CAMPAIGN_MAP.map(r=>({id:r.id as string,title:r.title as string,chapter:r.chapter as number,chapterName:r.chapterName as string}))];
const status:Record<RoomState,string>={cleared:'behind you',current:'you are here',ahead:'ahead',unlit:'not yet reached'};

/** The current room is settled once its choice is made: the way on is offered (`exp_next`) or the chapter or campaign is complete. */
export const roomSettled=(s:{mode:string;actions:{id:string}[]})=>s.mode==='complete'||s.actions.some(a=>a.id==='exp_next');

export function descentMap(sceneId:string,settled=false):MapDepth[]{
 const at=ROUTE.findIndex(r=>r.id===sceneId),here=at<0?undefined:ROUTE[at];
 return NUMERALS.map((numeral,i)=>{
  const chapter=i+1,rooms=ROUTE.filter(r=>r.chapter===chapter),name=rooms[0].chapterName;
  const state=!here||chapter>here.chapter?'ahead':chapter<here.chapter?'past':'current';
  return {chapter,numeral,name,state,label:`Chapter ${numeral}, ${name}`,rooms:rooms.map((r,j)=>{
   const index=ROUTE.indexOf(r),roomState:RoomState=index<at?'cleared':index===at?'current':state==='current'?'ahead':'unlit';
   const title=roomState==='unlit'?null:r.title,fork=FORK_ROOMS.includes(r.id),done=roomState==='current'&&settled;
   const label=`${title?title+', ':''}room ${j+1} of ${rooms.length}, ${status[roomState]}${done?', your choice made':''}${fork?'. '+FORK_LINE:''}`;
   return {id:r.id,number:j+1,title,state:roomState,path:roomState==='cleared'||roomState==='current',settled:done,fork,label};
  })};
 });
}
