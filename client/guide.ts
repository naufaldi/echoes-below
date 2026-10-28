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
