import {Fragment,useCallback,useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {TYPEWRITER_CPS,tagText,type TagPart} from './story-pages';

const motionQuery=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
/** The OS preference, live. The in-game setting is passed in separately; CSS rules cannot stop a JS reveal. */
export function useOSReducedMotion(){return useSyncExternalStore(f=>{motionQuery?.addEventListener('change',f);return()=>motionQuery?.removeEventListener('change',f);},()=>!!motionQuery?.matches,()=>false);}

/** Typewriter reveal at TYPEWRITER_CPS. `instant` (reduced motion, a page already read) shows the whole page at once. */
export function useReveal(text:string,instant:boolean){
 const [state,setState]=useState({text,count:0});const frame=useRef(0);
 const count=instant?text.length:state.text===text?state.count:0;
 useEffect(()=>{
  if(instant)return;
  const start=performance.now();
  const tick=(now:number)=>{const n=Math.min(text.length,Math.floor((now-start)/1000*TYPEWRITER_CPS));setState(s=>s.text===text&&s.count===n?s:{text,count:n});if(n<text.length)frame.current=requestAnimationFrame(tick);};
  setState({text,count:0});frame.current=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame.current);
 },[text,instant]);
 const complete=useCallback(()=>{cancelAnimationFrame(frame.current);setState({text,count:text.length});},[text]);
 return {count,done:count>=text.length,complete};
}

/** One page of story text. The unrevealed rest is laid out but transparent, so the box never reflows as letters appear; screen readers get the whole page once. */
export default function NarrativePassage({text,count,className}:{text:string;count:number;className?:string}){
 return <p className={'story-text '+(className??'')}><span aria-hidden="true">{text.slice(0,count)}</span><span aria-hidden="true" className="unrevealed">{text.slice(count)}</span><span className="sr-only">{text}</span></p>;
}

/** A mechanics tag: uppercase, no verbs, natural 20 and natural 1 marked. */
export function MechTag({parts}:{parts:TagPart[]}){
 return <span className="mech-tag story-tag" title={tagText(parts)}>{parts.map((p,i)=><Fragment key={i}>{i>0&&" · "}<span className={p.mark?'mark-'+p.mark:undefined}>{p.text}</span></Fragment>)}</span>;
}

/** Combat events, oldest first, one line each: prose with its tag. The full text stays in the DOM (and the title) when a long line is clipped. */
export function EventLines({events}:{events:{key:string;text:string;tag:TagPart[]|null;lead:string|null;enemy:boolean}[]}){
 return <ol className="event-lines" aria-label="Latest events">{events.map(e=><li key={e.key} title={e.tag?`${e.text} ${tagText(e.tag)}`:e.text}>{e.lead?<><b className={e.enemy?'enemy':undefined}>{e.lead}</b>{e.text.slice(e.lead.length)}</>:e.text}{e.tag&&<> <MechTag parts={e.tag}/></>}</li>)}</ol>;
}
