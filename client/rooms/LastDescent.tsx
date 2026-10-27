import LegacyShell from './LegacyShell';
import type {MoodOverride,RoomProps} from './kit';

// Last Descent rooms (depth-1 … depth-8). #46 stub: renders the shared shell unchanged. #51 replaces it with bespoke rooms.
// Contract, helpers and budget: ./README.md. Edit only this file and your kit folder under public/assets/env/.
export default function LastDescent({scene}:RoomProps){return <LegacyShell scene={scene}/>;}
/** Optional lighting override merged over chapterMood(scene); return {} to keep today's mood. */
export const mood=(_scene:string):MoodOverride=>({});
