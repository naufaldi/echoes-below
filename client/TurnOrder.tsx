import {useLayoutEffect,useRef} from 'react';
import {centreScroll} from './turn-order';
import {actorDisplayName} from '../shared/visual-identity';
import type {PublicSave} from '../shared/types';

export default function TurnOrder({save,reduced,narrow}:{save:PublicSave;reduced:boolean;narrow:boolean}){
 const stripRef=useRef<HTMLElement|null>(null);
 /** #112 Whoever acts now stays in full view in a turn order wider than its room; at once under reduced motion. */
 useLayoutEffect(()=>{const keep=()=>{const el=stripRef.current?.querySelector<HTMLElement>('.current'),strip=el?.parentElement;if(el&&strip)strip.scrollTo({left:centreScroll(el.offsetLeft,el.offsetWidth,strip.clientWidth,strip.scrollWidth),behavior:reduced?'auto':'smooth'});};keep();addEventListener('resize',keep);return()=>removeEventListener('resize',keep);},[save?.mode,save?.turn?.actorId,save?.activeReaction,save?.turn?.round,reduced,narrow]);
 return save.mode==='combat'?<nav ref={stripRef} className="initiative-strip" aria-label="Turn order">{save.turn?.order.map(id=>{const a=[...save.party,...save.enemies].find(x=>x.id===id);return a&&<span key={id} className={(save.turn?.actorId===id?'current ':'')+(a.hp<=0?'fallen':'')}>{actorDisplayName(a,save.enemies)}<small>{a.hp<=0?'Downed':save.turn?.actorId===id?(save.activeReaction===id?'Reacting now':'Acting now'):'Waiting'}</small></span>})}</nav>:null;
}
