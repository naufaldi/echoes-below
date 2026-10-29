import type {MoodOverride} from './kit';

/** Per-room light over the chapter's ember-brown mood: colder at the gate, green at the well, red at the furnace heart. */
const MOODS:Record<string,MoodOverride>={
 'market-1':{background:'#1f1716',ambient:'#cdb79c',sun:'#f0cfae',fog:[20,46]},
 'market-2':{background:'#26170f',ambient:'#e3c79d',sun:'#ffd2a2'},
 'market-3':{background:'#1c1514',ambient:'#cfc2ac',sun:'#e9d8bf'},
 'market-4':{background:'#131a19',ambient:'#b9c9b4',sun:'#e6dcc0'},
 'market-5':{background:'#1d1013',ambient:'#d6b3a6',sun:'#ffc2a0'},
 'market-6':{background:'#2b110a',ambient:'#e8b48c',sun:'#ffb07a',fog:[18,44]},
 'market-7':{background:'#20160f',ambient:'#e0cba8',sun:'#ffdcb0'},
 'market-8':{background:'#141710',ambient:'#c3c9a6',sun:'#e8dcb4'},
};
export const mood=(scene:string):MoodOverride=>MOODS[scene]??{};
