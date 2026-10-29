import type {MoodOverride} from './kit';

const MOODS:Record<number,MoodOverride>={
 1:{background:'#0c0e12',ambient:'#aab2bf',sun:'#dfe5ee',fog:[18,44]},
 2:{background:'#16100c',ambient:'#c4ad92',sun:'#f0c494',fog:[16,40]},
 3:{background:'#150807',ambient:'#c6a69e',sun:'#f2bea6',fog:[16,40]},
 4:{background:'#14120e',ambient:'#cbbd9a',sun:'#f4dca8',fog:[18,44]},
 5:{background:'#070a10',ambient:'#9fb2c8',sun:'#cfe2ff',fog:[18,60]},
 6:{background:'#140c08',ambient:'#c2a080',sun:'#ffcf96',fog:[16,42]},
 7:{background:'#0c0510',ambient:'#a68cb8',sun:'#e3b0ff',fog:[18,50]},
 8:{background:'#3a3340',ambient:'#e6d2bf',sun:'#ffe0b4',fog:[22,62]},
};
/** Per-room light: cold grey stone, a guard fire, the red hungry glass, the keeper's candles, a chasm, the blade forge, the core, and dawn. */
export const mood=(scene:string):MoodOverride=>MOODS[Number(scene.split('-')[1])]??{};
