import {CAMPAIGN_MAP} from '../shared/campaign-map.js';
import {CHAPTER_ONE} from './descent-map.js';
import type {ChapterRecap} from '../shared/chapter-pages.js';

// #66 Which chapter page is due (ROADMAP D8): the recap of the chapter just left, then the next chapter's title page, both before its first read-aloud page; Chapter I's closing card; Chapter VI's recap before the ending. Pure, so it can be tested.
export interface ChapterPageView {kind:'title'|'recap';chapter:number}
interface FlowSave {id:string;mode:string;scene:{id:string};chapterRecaps?:readonly {chapter:number}[]}
/** Each chapter's first room: Chapter I's opening scene, then each chapter's first entry in the campaign map. */
export const FIRST_ROOMS:Readonly<Record<string,number>>=Object.fromEntries([[CHAPTER_ONE[0].id,1],...[...new Set(CAMPAIGN_MAP.map(r=>r.chapter))].map(c=>[CAMPAIGN_MAP.find(r=>r.chapter===c)!.id,c])]);
export const pageId=(p:ChapterPageView)=>`${p.kind}:${p.chapter}`;

/**
 * `seen` holds the pages already dismissed for this save. `waiting` is the caller's gate: playback on the way into a room, and
 * the closing passage (#96) when a chapter ends the save (Chapter I, Chapter VI). A recap is only offered where it appeared:
 * in the next chapter's first room, so a save resumed mid-chapter never replays an old one. Chapter I's card shows whenever its
 * chapter waits on it, and is never marked seen; Chapter II has no recap page because that card is its recap.
 */
export function dueChapterPage(save:FlowSave,seen:readonly string[],waiting:boolean):ChapterPageView|null{
 if(waiting||save.mode==='defeat')return null;
 const unseen=(p:ChapterPageView)=>seen.includes(pageId(p))?null:p,recap=(chapter:number)=>save.chapterRecaps?.some(r=>r.chapter===chapter);
 if(save.mode==='complete')return save.scene.id==='aftermath'?{kind:'recap',chapter:1}:recap(6)?unseen({kind:'recap',chapter:6}):null;
 const chapter=FIRST_ROOMS[save.scene.id];if(!chapter)return null;
 return chapter>=3&&recap(chapter-1)&&unseen({kind:'recap',chapter:chapter-1})||unseen({kind:'title',chapter});
}

/** Dismissed pages per save. Without storage (private mode, blocked cookies) they last for this session. */
const session=new Map<string,Set<string>>();
const storeKey=(saveId:string)=>'echoes-chapter-pages:'+saveId;
type Store=Pick<Storage,'getItem'|'setItem'>|null;
export function seenPages(store:Store,saveId:string):string[]{
 const here=[...session.get(saveId)??[]];
 try{const kept:unknown=JSON.parse(store?.getItem(storeKey(saveId))??'[]');return [...new Set([...(Array.isArray(kept)?kept.filter((p):p is string=>typeof p==='string'):[]),...here])];}catch{return here;}
}
export function markPageSeen(store:Store,saveId:string,page:ChapterPageView){
 const id=pageId(page);session.set(saveId,new Set([...session.get(saveId)??[],id]));
 try{store?.setItem(storeKey(saveId),JSON.stringify(seenPages(store,saveId)));}catch{/* kept for this session */}
}

/** A recap's mechanics as tags without verbs, and the narrator's words for them (ROADMAP §6). Numbers live only in the tags. */
type RecapNumbers=Pick<ChapterRecap,'trustDelta'|'mercy'|'force'|'xp'>;
const signed=(n:number)=>n>0?`+${n}`:n<0?`−${-n}`:'±0';
const trustWords=(name:string,d:number)=>d>0?`${name} trusts you more.`:d<0?`${name} trusts you less.`:`${name}’s trust holds steady.`;
export function recapRows(r:RecapNumbers):{key:string;tag:string;line:string}[]{
 const {mira,oren}=r.trustDelta;
 return [
  {key:'trust',tag:`Trust · Mira ${signed(mira)} · Oren ${signed(oren)}`,line:mira>0&&oren>0?'Mira and Oren both trust you more.':mira===0&&oren===0?'Mira and Oren hold their trust steady.':`${trustWords('Mira',mira)} ${trustWords('Oren',oren)}`},
  ...(r.mercy+r.force?[{key:'stance',tag:`Mercy ${r.mercy} · Force ${r.force}`,line:r.mercy>r.force?'You chose talk over steel.':r.force>r.mercy?'You let steel decide.':'Talk and steel, in equal measure.'}]:[]),
  {key:'xp',tag:`Experience · +${r.xp} XP`,line:'The party is stronger for every step of it.'},
 ];
}
