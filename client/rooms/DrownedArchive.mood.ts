import type {MoodOverride} from './kit';

/** Each room keeps the chapter's drowned palette but shifts it: green ink, bronze, clinical cyan, cold vault, deep glass, gold, dusk. */
const MOODS:Record<string,MoodOverride>={
 'archive-1':{background:'#0a1a22',ambient:'#94bccb',sun:'#c6dde0',fog:[22,48]},
 'archive-2':{background:'#08140f',ambient:'#9cc4ac',sun:'#cfe3c6',fog:[18,44]},
 'archive-3':{background:'#0e141c',ambient:'#b8b6b0',sun:'#ecd8b0',fog:[22,48]},
 'archive-4':{background:'#0a1c20',ambient:'#acd4d0',sun:'#dcefe8',fog:[20,46]},
 'archive-5':{background:'#0d1117',ambient:'#b4bccb',sun:'#dfe6f2',fog:[20,44]},
 'archive-6':{background:'#040a12',ambient:'#8cb0cc',sun:'#b8d4ea',fog:[18,44]},
 'archive-7':{background:'#140f0b',ambient:'#d0bc9c',sun:'#f2d6a8',fog:[22,48]},
 'archive-8':{background:'#151a2a',ambient:'#c6c0c8',sun:'#ffd9b0',fog:[24,52]},
};
export const mood=(scene:string):MoodOverride=>MOODS[scene]??{};
