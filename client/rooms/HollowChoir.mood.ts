import type {MoodOverride} from './kit';

/** Per-room light over the chapter's cold indigo mood: blue at the stair, violet at the conductor's cage, warmer in the refectory. */
const MOODS:Record<string,MoodOverride>={
 'choir-1':{background:'#151a30',ambient:'#b8c6ea',sun:'#e2e6ff'},
 'choir-2':{background:'#17162a',ambient:'#c4c2e2',sun:'#e8e2ff'},
 'choir-3':{background:'#1a1822',ambient:'#cfc6c4',sun:'#efe2d4',fog:[22,48]},
 'choir-4':{background:'#10172c',ambient:'#aec2ea',sun:'#d8e6ff',fog:[26,56]},
 'choir-5':{background:'#0b1530',ambient:'#a4bce8',sun:'#cfe0ff',fog:[26,58]},
 'choir-6':{background:'#191628',ambient:'#c6c0dc',sun:'#ece2f4'},
 'choir-7':{background:'#150f26',ambient:'#bcb0e0',sun:'#e2d6ff'},
 'choir-8':{background:'#121a2a',ambient:'#b8c4e2',sun:'#f0e6d0'},
};
export const mood=(scene:string):MoodOverride=>MOODS[scene]??{};
