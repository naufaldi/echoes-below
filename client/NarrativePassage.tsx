import {Fragment,useCallback,useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {tagText,type TagPart} from './story-pages';
import {SPEED_CPS} from './reading-settings';
import {useReading} from './use-reading';

const motionQuery=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
/** The OS preference, live. The in-game setting is passed in separately; CSS rules cannot stop a JS reveal. */
export function useOSReducedMotion(){return useSyncExternalStore(f=>{motionQuery?.addEventListener('change',f);return()=>motionQuery?.removeEventListener('change',f);},()=>!!motionQuery?.matches,()=>false);}

/** Typewriter reveal at the player's text speed (#68; normal is TYPEWRITER_CPS). `instant` (reduced motion, a page already read, or instant text) shows the whole page at once. */
export function useReveal(text:string,still:boolean){
 const cps=SPEED_CPS[useReading().speed],instant=still||cps===Infinity;
 const [state,setState]=useState({text,count:0});const frame=useRef(0);
 const count=instant?text.length:state.text===text?state.count:0;
 useEffect(()=>{
  if(instant)return;
  const start=performance.now();
  const tick=(now:number)=>{const n=Math.min(text.length,Math.floor((now-start)/1000*cps));setState(s=>s.text===text&&s.count===n?s:{text,count:n});if(n<text.length)frame.current=requestAnimationFrame(tick);};
  setState({text,count:0});frame.current=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame.current);
 },[text,instant,cps]);
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

/** Combat events, oldest first: prose with its tag. A long event wraps onto a second line rather than clipping (#98); the tag breaks only between its parts. */
export function EventLines({events}:{events:{key:string;text:string;tag:TagPart[]|null;lead:string|null;enemy:boolean}[]}){
 return <ol className="event-lines" aria-label="Latest events">{events.map(e=><li key={e.key}>{e.lead?<><b className={e.enemy?'enemy':undefined}>{e.lead}</b>{e.text.slice(e.lead.length)}</>:e.text}{e.tag&&<> <MechTag parts={e.tag}/></>}</li>)}</ol>;
}
