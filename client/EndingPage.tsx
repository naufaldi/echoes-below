import {useState} from 'react';
import type {PublicSave} from '../shared/types';
import type {CampaignRecap} from '../shared/endings';
import Credits from './Credits';
import {endingParagraphs,pathTaken,recapRows} from './ending-recap';
import {endingSlots,recordFound} from './endings-found';

// #69 The ending as a full page (ROADMAP D2, NVL): its title and prose, the run's recap, the endings this browser has found, and the credits.
const LOCKED_HINT='Found on another descent.';
/** Storage itself can be unreachable (blocked cookies); the page still shows this ending. */
function remember(recap:CampaignRecap){const ending={id:recap.endingId,title:recap.title};try{return recordFound(localStorage,ending);}catch{return [ending];}}
export default function EndingPage({save,recap,busy,onRead,onRestart}:{save:PublicSave;recap:CampaignRecap;busy:boolean;onRead:()=>void;onRestart:()=>void}){
 // Recording is idempotent, so a repeated initialiser (Strict Mode) writes the same list.
 const[found]=useState(()=>remember(recap)),slots=endingSlots(found),{depths}=pathTaken(save);
 return <section className="ending ending-page" aria-labelledby="ending-title">
  <article className="ending-story">
   <div className="eyebrow">THE DESCENT IS OVER</div>
   <h2 id="ending-title">{recap.title}</h2>
   {endingParagraphs(save,recap.title).map((p,i)=><p key={i}>{p}</p>)}
   <div className="ending-actions"><button className="primary" onClick={onRead}>Read your story →</button><Credits className="ending-quiet"/><button className="ending-quiet" disabled={busy} onClick={onRestart}>Begin another journey</button></div>
  </article>
  <aside className="ending-recap" aria-label="Your descent">
   <h3>Your descent</h3>
   <dl>{recapRows(save,recap).map(r=><div key={r.key} className={'recap-row recap-'+r.key}><dt>{r.tag}</dt><dd>{r.line}</dd></div>)}</dl>
   <ol className="ending-path" aria-label="The path you took">{depths.map(d=><li key={d.chapter} aria-label={`${d.label}, ${d.rooms.length} rooms`}><span className="ending-path-numeral">{d.numeral}</span><span className="ending-path-name">{d.name}</span><span className="ending-path-rooms" aria-hidden="true">{d.rooms.map(r=><i key={r.id} className={r.fork?'fork':undefined}/>)}</span></li>)}</ol>
   <h3>Endings found <small>{found.length} of {slots.length}</small></h3>
   <ul className="endings-found">{slots.map((s,i)=>s.found?<li key={s.id} className={s.id===recap.endingId?'current':undefined}><strong>{s.title}</strong>{s.id===recap.endingId&&<small>This descent</small>}</li>:<li key={'locked-'+i} className="locked" aria-label="An ending not yet found"><strong aria-hidden="true">?</strong><small>{LOCKED_HINT}</small></li>)}</ul>
  </aside>
 </section>;
}
