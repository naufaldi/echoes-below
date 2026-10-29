export type Mood={kind:string;background:string;ambient:string;sun:string;fog:[number,number]};
const CHAPTER_ONE=['approach','hall','cookfire','prison','bell','aftermath'];
/** Chapter I rooms each own a layout (ChapterOneRooms); later chapters use their registered room component. */
export const chapterOneRoom=(scene:string)=>CHAPTER_ONE.includes(scene);
const relay:Record<string,Omit<Mood,'kind'>>={
 approach:{background:'#6b7a80',ambient:'#b4c3c8',sun:'#d6e0e4',fog:[12,40]},
 hall:{background:'#0e1416',ambient:'#9fb2b4',sun:'#d9e6e0',fog:[20,46]},
 cookfire:{background:'#140d0a',ambient:'#c4a487',sun:'#ffc08a',fog:[18,42]},
 prison:{background:'#0b0f11',ambient:'#93a2a6',sun:'#c5d0d4',fog:[18,42]},
 bell:{background:'#0c1320',ambient:'#a6b6d2',sun:'#d8e2f2',fog:[18,46]},
 aftermath:{background:'#171a1e',ambient:'#c9c4b6',sun:'#f4e6c8',fog:[18,46]},
};
export function chapterMood(scene:string):Mood{
 if(scene.startsWith('archive'))return{kind:'archive',background:'#102732',ambient:'#a4cad4',sun:'#d1e5dd',fog:[24,50]};
 if(scene.startsWith('market'))return{kind:'market',background:'#2c1916',ambient:'#dbc19a',sun:'#ffd0a0',fog:[24,50]};
 if(scene.startsWith('roots'))return{kind:'roots',background:'#142518',ambient:'#afc795',sun:'#e4dcac',fog:[24,50]};
 if(scene.startsWith('choir'))return{kind:'choir',background:'#181d36',ambient:'#b5c5e8',sun:'#e4deff',fog:[24,50]};
 if(scene.startsWith('depth'))return{kind:'depth',background:'#201322',ambient:'#b5accb',sun:'#f2b397',fog:[24,50]};
 return{kind:'relay',...(relay[scene]??{background:'#141c1a',ambient:'#a5b8a8',sun:'#ffe2ad',fog:[24,50]})};
}
