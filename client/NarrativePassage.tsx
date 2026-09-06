import {useEffect,useId,useRef,useState} from 'react';
export default function NarrativePassage({text}:{text:string}){
 const passage=useRef<HTMLParagraphElement>(null),hintId=useId();const [hint,setHint]=useState<string|null>(null);
 const measure=()=>{const p=passage.current;if(!p)return;setHint(p.scrollHeight>p.clientHeight+2?(p.scrollTop+p.clientHeight<p.scrollHeight-2?'Scroll to read more ↓':'End of passage · scroll up to reread ↑'):null);};
 useEffect(()=>{const p=passage.current!;p.scrollTop=0;measure();const observer=new ResizeObserver(measure);observer.observe(p);return()=>observer.disconnect();},[text]);
 return <><p ref={passage} tabIndex={0} aria-label="Narrative passage" aria-describedby={hint?hintId:undefined} onScroll={measure}>{text}</p>{hint&&<small id={hintId} className="passage-scroll-hint">{hint}</small>}</>;
}
