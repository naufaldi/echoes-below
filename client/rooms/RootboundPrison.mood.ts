import type {MoodOverride} from './kit';

const MOODS:Record<number,MoodOverride>={
 1:{background:'#0a140e',ambient:'#94b39c',sun:'#a8bda4',fog:[16,38]},
 2:{background:'#15140f',ambient:'#c4b79a',sun:'#d9cfae',fog:[18,42]},
 3:{background:'#131a12',ambient:'#c9c2a6',sun:'#e8dcb8',fog:[18,44]},
 4:{background:'#120f0a',ambient:'#a89a7e',sun:'#cdb68a',fog:[16,40]},
 5:{background:'#1a1206',ambient:'#cdb27e',sun:'#f0c27a',fog:[16,40]},
 6:{background:'#1c120b',ambient:'#d6b88e',sun:'#f2cf9a',fog:[20,46]},
 7:{background:'#0c1618',ambient:'#adc4c2',sun:'#d0dcd2',fog:[12,34]},
 8:{background:'#141c1b',ambient:'#c3cfbb',sun:'#f4e6c2',fog:[20,48]},
};
/** Per-room light: a sunless cavern, warm nursery candles, amber sap, the warden's hearth, a dark chasm, daylight down the lift. */
export const mood=(scene:string):MoodOverride=>MOODS[Number(scene.split('-')[1])]??{};
