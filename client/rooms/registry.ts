import {createElement,type ComponentType} from 'react';
import ChapterOneRoom from '../ChapterOneRooms';
import {chapterOneRoom} from '../ChapterAtmosphere';
import DrownedArchive,{mood as archiveMood} from './DrownedArchive';
import AshMarket,{mood as marketMood} from './AshMarket';
import RootboundPrison,{mood as rootsMood} from './RootboundPrison';
import HollowChoir,{mood as choirMood} from './HollowChoir';
import LastDescent,{mood as depthMood} from './LastDescent';
import type {MoodOverride,RoomProps} from './kit';

/** A chapter's room component plus an optional mood override, chosen by the scene id prefix (`archive-3` → `archive`). */
export interface RoomEntry {Room:ComponentType<RoomProps>;mood?:(scene:string)=>MoodOverride}
export type RoomPrefix='archive'|'market'|'roots'|'choir'|'depth';
export const ROOMS:Record<RoomPrefix,RoomEntry>={
 archive:{Room:DrownedArchive,mood:archiveMood},
 market:{Room:AshMarket,mood:marketMood},
 roots:{Room:RootboundPrison,mood:rootsMood},
 choir:{Room:HollowChoir,mood:choirMood},
 depth:{Room:LastDescent,mood:depthMood},
};
const CHAPTER_ONE:RoomEntry={Room:({scene,save,reduced})=>createElement(ChapterOneRoom,{scene,reduced,gateOpen:!!save?.scene.entities.find(e=>e.id==='gate')?.open})};
/** Chapter I scenes (and the creation screen's `approach`) use ChapterOneRooms; Chapters II–VI use their own file; anything else uses the Chapter I aftermath room. */
export function roomFor(scene:string):RoomEntry{return chapterOneRoom(scene)?CHAPTER_ONE:ROOMS[scene.split('-')[0] as RoomPrefix]??CHAPTER_ONE;}
