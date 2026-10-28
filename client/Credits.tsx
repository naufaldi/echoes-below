import {useRef,useState,type KeyboardEvent} from 'react';
import {createPortal} from 'react-dom';
import {CREDITS,SRD_NOTICE} from './asset-credits-data';
import {creditSections} from './asset-credits';

// #69 Credits: every asset manifest's authors and licences, the music, and the SRD 5.2.1 notice. Opened from Settings and from the ending page. The page renders inside the app shell so it keeps the chapter accent and reduced motion.
const SECTIONS=creditSections(CREDITS);
const plural=(n:number,one:string)=>`${n} ${one}${n===1?'':'s'}`;
export default function Credits({className}:{className?:string}){
 const[open,setOpen]=useState(false),opener=useRef<HTMLButtonElement>(null);
 const close=()=>{setOpen(false);opener.current?.focus();};
 // Escape closes only this page; Tab stays inside it, like the journal.
 const keys=(e:KeyboardEvent<HTMLElement>)=>{
  if(e.key==='Escape'){e.stopPropagation();close();}
  else if(e.key==='Tab'){const controls=[...e.currentTarget.querySelectorAll<HTMLElement>('button,a[href]')];e.preventDefault();const index=controls.indexOf(document.activeElement as HTMLElement);controls[(index+(e.shiftKey?-1:1)+controls.length)%controls.length]?.focus();}
 };
 const shell=opener.current?.closest('.app')??document.body;
 return <><button ref={opener} className={className??'credits-link'} onClick={()=>setOpen(true)}>Credits</button>{open&&createPortal(<div className="modal-backdrop credits-backdrop" onClick={e=>{if(e.target===e.currentTarget)close();}}><section className="modal credits-page" role="dialog" aria-modal="true" aria-labelledby="credits-title" onKeyDown={keys}>
  <button autoFocus aria-label="Close credits" className="close" onClick={close}>×</button>
  <div className="eyebrow">THE HANDS BEHIND THE DESCENT</div><h2 id="credits-title">Credits</h2>
  {SECTIONS.map(({section,credits})=><section key={section} className="credit-section" aria-label={section}><h3>{section}</h3><ul>{credits.map(c=><li key={c.work+c.author}>
   <strong>{c.work}</strong> <span>by {c.author}</span>
   <small>{c.licenceUrl?<a href={c.licenceUrl} target="_blank" rel="noreferrer">{c.licence}</a>:c.licence} · {plural(c.files.length,'file')}{c.source&&<> · <a href={c.source.startsWith('http')?c.source:'https://'+c.source} target="_blank" rel="noreferrer">source</a></>}</small>
   {c.credit&&<p className="credit-line">{c.credit}</p>}
  </li>)}</ul></section>)}
  <section className="credit-section" aria-label="Rules"><h3>Rules</h3><p className="credit-line">{SRD_NOTICE}</p><small><a href="/SRD-NOTICE.txt" target="_blank" rel="noreferrer">Rules attribution</a></small></section>
  <p className="credit-colophon">Echoes Below · Six-chapter expedition v0.2</p>
 </section></div>,shell)}</>;
}
