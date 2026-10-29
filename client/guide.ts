import {panelRows,bestChoice,oddsWho} from './action-focus.js';
import type {Odds} from '../shared/odds.js';
import type {PublicSave} from '../shared/types.js';
import {CHAPTER_ONE} from './descent-map.js';

// #68 The first-run guide shows once, for a new adventure, after the Chapter I title page and before the room's first page. Pure, so "show once" can be tested.
export const GUIDE_KEY='echoes-guide-seen';
type Store=Pick<Storage,'getItem'|'setItem'>|null;
/** Without storage (private mode, blocked cookies) the guide counts as seen for the rest of this visit only. */
export interface GuideMemory{seen:boolean}
const visit:GuideMemory={seen:false};
export function guideSeen(store:Store,memory:GuideMemory=visit){if(memory.seen)return true;try{return store?.getItem(GUIDE_KEY)==='seen';}catch{return false;}}
export function markGuideSeen(store:Store,memory:GuideMemory=visit){memory.seen=true;try{store?.setItem(GUIDE_KEY,'seen');}catch{/* this visit only */}}
interface GuideSave{revision:number;mode:string;scene:{id:string}}
/** Due on a brand-new adventure in Chapter I's first room, once no chapter page is waiting and no turn is playing. A resumed adventure never brings it back. */
export function guideDue(save:GuideSave|null,{seen,chapterPage,busy}:{seen:boolean;chapterPage:boolean;busy:boolean}){
 return !!save&&!seen&&!chapterPage&&!busy&&save.mode==='explore'&&save.revision===0&&save.scene.id===CHAPTER_ONE[0].id;
}

/** #119 The step 3 sample is the row the guide lights, in the row's own words: public check, DC, best member and band. */
export function oddsSample(save:PublicSave|null,selected:string):{label:string;who:string;odds:Odds}|null{
 if(!save)return null;
 for(const row of panelRows(save,selected).ordered){const check=row.kind==='single'?row.action.check:row.check,best=bestChoice(row,save.party);if(check&&best)return {label:check.attribute==='attack'?`Defense ${check.dc}`:`${check.attribute[0]!.toUpperCase()+check.attribute.slice(1)} · DC ${check.dc}`,who:oddsWho(row,save.party,best),odds:best.odds};}
 return null;
}
