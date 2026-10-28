import {useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {CREDITS,SRD_NOTICE} from './asset-credits-data';
import {creditSections} from './asset-credits';
import {Dialog} from './Modal';

// #69 Credits: every asset manifest's authors and licences, the music, and the SRD 5.2.1 notice. Opened from Settings and from the ending page. The page renders inside the app shell so it keeps the chapter accent and reduced motion.
const SECTIONS=creditSections(CREDITS);
const plural=(n:number,one:string)=>`${n} ${one}${n===1?'':'s'}`;
export default function Credits({className}:{className?:string}){
 const[open,setOpen]=useState(false),opener=useRef<HTMLButtonElement>(null);
 // Escape closes only this page and focus returns to its button (the shared modal contract, #97).
 const close=()=>setOpen(false);
 const shell=opener.current?.closest('.app')??document.body;
 return <><button ref={opener} className={className??'credits-link'} onClick={()=>setOpen(true)}>Credits</button>{open&&createPortal(<Dialog backdrop="modal-backdrop credits-backdrop" className="credits-page" labelledBy="credits-title" onClose={close} onBackdrop={close}>
  <button data-autofocus aria-label="Close credits" className="close" onClick={close}>×</button>
  <div className="eyebrow">THE HANDS BEHIND THE DESCENT</div><h2 id="credits-title">Credits</h2>
  {SECTIONS.map(({section,credits})=><section key={section} className="credit-section" aria-label={section}><h3>{section}</h3><ul>{credits.map(c=><li key={c.work+c.author}>
   <strong>{c.work}</strong> <span>by {c.author}</span>
   <small>{c.licenceUrl?<a href={c.licenceUrl} target="_blank" rel="noreferrer">{c.licence}</a>:c.licence} · {plural(c.files.length,'file')}{c.source&&<> · <a href={c.source.startsWith('http')?c.source:'https://'+c.source} target="_blank" rel="noreferrer">source</a></>}</small>
   {c.credit&&<p className="credit-line">{c.credit}</p>}
  </li>)}</ul></section>)}
  <section className="credit-section" aria-label="Rules"><h3>Rules</h3><p className="credit-line">{SRD_NOTICE}</p><small><a href="/SRD-NOTICE.txt" target="_blank" rel="noreferrer">Rules attribution</a></small></section>
  <p className="credit-colophon">Echoes Below · Six-chapter expedition v0.2</p>
 </Dialog>,shell)}</>;
}
