import {createElement,lazy,type ComponentType} from 'react';
import ChapterOneRoom from '../ChapterOneRooms';
import {chapterOneRoom} from '../ChapterAtmosphere';
import {mood as archiveMood} from './DrownedArchive.mood';
import {mood as marketMood} from './AshMarket.mood';
import {mood as rootsMood} from './RootboundPrison.mood';
import {mood as choirMood} from './HollowChoir.mood';
import {mood as depthMood} from './LastDescent.mood';
import type {MoodOverride,RoomProps} from './kit';

const loaders={archive:()=>import('./DrownedArchive'),market:()=>import('./AshMarket'),roots:()=>import('./RootboundPrison'),choir:()=>import('./HollowChoir'),depth:()=>import('./LastDescent')};
export function prefetch(prefix:string){if(Object.hasOwn(loaders,prefix))void loaders[prefix as RoomPrefix]().catch(()=>{});}

/** A chapter's room component plus an optional mood override, chosen by the scene id prefix (`archive-3` → `archive`). */
export interface RoomEntry {Room:ComponentType<RoomProps>;mood?:(scene:string)=>MoodOverride}
export type RoomPrefix='archive'|'market'|'roots'|'choir'|'depth';
export const ROOMS:Record<RoomPrefix,RoomEntry>={
 archive:{Room:lazy(loaders.archive),mood:archiveMood},
 market:{Room:lazy(loaders.market),mood:marketMood},
 roots:{Room:lazy(loaders.roots),mood:rootsMood},
 choir:{Room:lazy(loaders.choir),mood:choirMood},
 depth:{Room:lazy(loaders.depth),mood:depthMood},
};
const CHAPTER_ONE:RoomEntry={Room:({scene,save,reduced})=>createElement(ChapterOneRoom,{scene,reduced,gateOpen:!!save?.scene.entities.find(e=>e.id==='gate')?.open})};
/** Chapter I scenes (and the creation screen's `approach`) use ChapterOneRooms; Chapters II–VI use their own file; anything else uses the Chapter I aftermath room. */
export function roomFor(scene:string):RoomEntry{return chapterOneRoom(scene)?CHAPTER_ONE:ROOMS[scene.split('-')[0] as RoomPrefix]??CHAPTER_ONE;}
