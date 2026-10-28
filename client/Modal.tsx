import {useEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {tabStop,tabPosition} from './modal-focus';

// #97 One modal contract for every dialog and full-page overlay: focus moves in on open, Tab stays inside, the rest of the page is inert, Escape closes what can be dismissed, and focus returns to whatever opened it.
const TABBABLE='a[href],button:not(:disabled),input:not(:disabled):not([type=hidden]),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"])';
/** The frame around a full-page overlay (the ending, the chapter card) stays live: the brand, settings, journal and map. */
export const OVERLAY_FRAME='.topbar,.chapter-track';

/** What a browser's Tab would visit: rendered, enabled, and one stop per radio group (its checked radio, else its first). */
function tabbables(root:HTMLElement){return [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(n=>{
 if(n.tabIndex<0||!n.getClientRects().length||n.closest('[inert]'))return false;
 if(!(n instanceof HTMLInputElement)||n.type!=='radio'||!n.name)return true;
 const group=[...root.querySelectorAll<HTMLInputElement>(`input[type=radio][name="${CSS.escape(n.name)}"]:not(:disabled)`)];return n===(group.find(r=>r.checked)??group[0]);});}

/** How many open dialogs hold each element inert. A nested dialog (credits over settings) adds its own holds and gives back only those. */
const holds=new Map<Element,number>();
function hold(el:HTMLElement,keep?:string){const held:Element[]=[];
 for(let node:HTMLElement|null=el;node&&node!==document.body;node=node.parentElement)for(const sibling of node.parentElement?.children??[]){
  if(sibling===node||keep&&sibling.matches(keep)||sibling.tagName==='SCRIPT')continue;
  const n=holds.get(sibling)??0;if(!n&&(sibling as HTMLElement).inert)continue;// inert before any dialog opened: not ours to give back
  holds.set(sibling,n+1);(sibling as HTMLElement).inert=true;held.push(sibling);}
 return()=>held.forEach(e=>{const n=(holds.get(e)??1)-1;if(n>0){holds.set(e,n);return;}holds.delete(e);(e as HTMLElement).inert=false;});}

export interface ModalOptions{
 /** Escape and the close button call this. Leave it out for an overlay that cannot be dismissed. */
 onClose?:()=>void;
 /** Selector for the element that takes focus on open; otherwise the first `[data-autofocus]`, then the first heading, then the dialog. */
 initial?:string;
 /** False for a full-page overlay: the background is inert, but Tab may still reach its frame. */
 trap?:boolean;
 /** Elements outside the dialog that stay live. */
 keep?:string}
export function useModal(ref:RefObject<HTMLElement|null>,{onClose,initial,trap=true,keep}:ModalOptions={}){
 // Read during render, before React's autoFocus or this effect moves focus inside.
 const[opener]=useState(()=>{const a=document.activeElement;return a instanceof HTMLElement&&a!==document.body?a:null;});
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const el=ref.current;if(!el)return;
  const release=hold(el,keep);
  // Focus already inside stays; so does focus on a live frame (settings closed over the ending page returns to its gear).
  const at=document.activeElement;if(!el.contains(at)&&!(keep&&at instanceof Element&&at.closest(keep)))(el.querySelector<HTMLElement>(initial??'[data-autofocus]')??el.querySelector<HTMLElement>('h1,h2')??el).focus({preventScroll:true});
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'&&close.current){e.preventDefault();e.stopPropagation();close.current();return;}
   if(e.key!=='Tab'||!trap||e.altKey||e.ctrlKey||e.metaKey)return;
   const list=tabbables(el),at=document.activeElement as HTMLElement,index=list.indexOf(at);
   const to=tabStop(list.length,tabPosition(index,list.filter(n=>n.compareDocumentPosition(at)&Node.DOCUMENT_POSITION_FOLLOWING).length),e.shiftKey);
   if(to===null)return;e.preventDefault();(to<0?el:list[to]!).focus();
  };
  el.addEventListener('keydown',key);
  // Inert comes off first: focus cannot land inside an inert subtree. An opener that is gone (the ending page while the journal was open) leaves focus to whatever mounts next.
  return()=>{el.removeEventListener('keydown',key);release();if(opener?.isConnected&&!opener.closest('[inert]'))opener.focus({preventScroll:true});};
 },[]);// eslint-disable-line react-hooks/exhaustive-deps -- once per opening
}

/** A centred page-style dialog (settings, journal, credits). */
export function Dialog({label,labelledBy,className,backdrop='modal-backdrop',onClose,onBackdrop,initial,children}:{label?:string;labelledBy?:string;className?:string;backdrop?:string;onClose:()=>void;onBackdrop?:()=>void;initial?:string;children:ReactNode}){
 const ref=useRef<HTMLElement>(null);useModal(ref,{onClose,initial});
 return <div className={backdrop} onClick={onBackdrop&&(e=>{if(e.target===e.currentTarget)onBackdrop();})}><section ref={ref} tabIndex={-1} className={'modal'+(className?' '+className:'')} role="dialog" aria-modal="true" aria-label={label} aria-labelledby={labelledBy}>{children}</section></div>;
}
/** A full-page overlay (the ending, the chapter pages): its heading takes focus and the dimmed HUD behind it is inert; the frame stays live. Escape calls `onClose` when the page can be turned. */
export function Overlay({className,labelledBy,onClose,children}:{className:string;labelledBy:string;onClose?:()=>void;children:ReactNode}){
 const ref=useRef<HTMLElement>(null);useModal(ref,{onClose,initial:'#'+labelledBy,trap:false,keep:OVERLAY_FRAME});
 return <section ref={ref} className={className} aria-labelledby={labelledBy}>{children}</section>;
}
