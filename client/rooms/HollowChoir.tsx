import LegacyShell from './LegacyShell';
import type {MoodOverride,RoomProps} from './kit';

// Hollow Choir rooms (choir-1 … choir-8). #46 stub: renders the shared shell unchanged. #50 replaces it with bespoke rooms.
// Contract, helpers and budget: ./README.md. Edit only this file and your kit folder under public/assets/env/.
export default function HollowChoir({scene}:RoomProps){return <LegacyShell scene={scene}/>;}
/** Optional lighting override merged over chapterMood(scene); return {} to keep today's mood. */
export const mood=(_scene:string):MoodOverride=>({});
