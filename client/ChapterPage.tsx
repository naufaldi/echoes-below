import {useMemo,useState,type KeyboardEvent} from 'react';
import type {PublicSave} from '../shared/types';
import {CHAPTER_PAGES} from '../shared/chapter-pages';
import {CAMPAIGN_MAP} from '../shared/campaign-map';
import {dueChapterPage,markPageSeen,recapRows,seenPages,type ChapterPageView} from './chapter-flow';
import {CHAPTER_ONE} from './descent-map';
import {Dialog,Overlay} from './Modal';
import './chapter-page.css';

// #66 Chapter pages (ROADMAP D8, NVL): a title page as each chapter opens, a recap as it closes, and "Read your story" by chapter.
/** Storage itself can be unreachable (blocked cookies); the pages then show once per session. */
const store=()=>{try{return localStorage;}catch{return null;}};
const chapterOf=(sceneId:string)=>CHAPTER_ONE.some(r=>r.id===sceneId)?1:CAMPAIGN_MAP.find(r=>r.id===sceneId)?.chapter??1;
const pageFor=(chapter:number)=>CHAPTER_PAGES.find(p=>p.chapter===chapter)!;
/** Enter on the page itself turns it; a focused button already answers Enter with its own click. */
const onEnter=(go:()=>void)=>(e:KeyboardEvent)=>{if(e.key!=='Enter'||e.altKey||e.ctrlKey||e.metaKey||(e.target as HTMLElement).closest('button,a,summary,input,select,textarea'))return;e.preventDefault();go();};

/** The page due now, read during render so the story box never mounts (and spends its read-aloud page) under a title page. */
export function useChapterPage(save:PublicSave|null,waiting:boolean){
 const[turned,setTurned]=useState(0),id=save?.id??'';
 const seen=useMemo(()=>id?seenPages(store(),id):[],[id,turned]);// eslint-disable-line react-hooks/exhaustive-deps -- `turned` re-reads after a page is dismissed
 const page=save?dueChapterPage(save,seen,waiting):null;
 const done=(p:ChapterPageView)=>{if(!save)return;markPageSeen(store(),save.id,p);setTurned(n=>n+1);
  // Past the title page the room's first passage takes focus, as it does when the journal closes.
  if(p.kind==='title')requestAnimationFrame(()=>document.querySelector<HTMLElement>('.story-box')?.focus({preventScroll:true}));};
 return {page,done};
}

export default function ChapterPages({page,save,busy,onDone,onRead,onContinue,onRestart}:{page:ChapterPageView;save:PublicSave;busy:boolean;onDone:(p:ChapterPageView)=>void;onRead:()=>void;onContinue:()=>void;onRestart:()=>void}){
 const next=()=>onDone(page);
 return page.kind==='title'?<ChapterTitlePage key={'title:'+page.chapter} chapter={page.chapter} onNext={next}/>:<ChapterRecapPage key={'recap:'+page.chapter} save={save} chapter={page.chapter} busy={busy} onNext={next} onRead={onRead} onContinue={onContinue} onRestart={onRestart}/>;
}

function ChapterTitlePage({chapter,onNext}:{chapter:number;onNext:()=>void}){
 const p=pageFor(chapter);
 return <Overlay className="ending chapter-page chapter-title-page" labelledBy="chapter-title" onClose={onNext}>
  <article onKeyDown={onEnter(onNext)}>
   <div className="chapter-numeral" aria-hidden="true">{p.numeral}</div>
   <div className="eyebrow">CHAPTER {p.numeral}</div>
   <h2 id="chapter-title" tabIndex={-1}>{p.name}</h2>
   <div className="chapter-prologue">{p.prologue.map((line,i)=><p key={i}>{line}</p>)}</div>
   <button className="primary" onClick={onNext} aria-keyshortcuts="Enter Escape">Read on <span aria-hidden="true">→</span></button>
  </article>
 </Overlay>;
}

/** Chapter I's recap is its closing card: the chapter waits on it, so it keeps the card's ways on and cannot be dismissed. */
function ChapterRecapPage({save,chapter,busy,onNext,onRead,onContinue,onRestart}:{save:PublicSave;chapter:number;busy:boolean;onNext:()=>void;onRead:()=>void;onContinue:()=>void;onRestart:()=>void}){
 const p=pageFor(chapter),recap=save.chapterRecaps?.find(r=>r.chapter===chapter),closing=chapter===1;
 const story=<>
  <div className="eyebrow">CHAPTER {p.numeral} · COMPLETE</div>
  <h2 id="chapter-end-title" tabIndex={-1}>{closing?<>The bell is quiet.<br/><em>Your story isn't.</em></>:p.name}</h2>
  {closing&&save.ending&&<p>{save.ending}</p>}
  {recap&&recap.changes.length>0&&<><h3 className="chapter-section">What changed</h3><ul className="chapter-changes">{recap.changes.map((c,i)=><li key={i}>{c}</li>)}</ul></>}
  <div className="ending-actions">{closing?<>{save.scene.id==='aftermath'&&<button className="primary" disabled={busy} onClick={onContinue}>Continue to Chapter II →</button>}<button className="primary" onClick={onRead}>Read your story →</button><button className="ending-quiet" disabled={busy} onClick={onRestart}>Begin another journey</button></>:<button className="primary" onClick={onNext} aria-keyshortcuts="Enter Escape">Turn the page <span aria-hidden="true">→</span></button>}</div>
  {closing&&<small className="chapter-note">Your party, experience and choices continue into five further chapters.</small>}
 </>;
 return <Overlay className={'ending chapter-page chapter-recap-page'+(recap?' ending-page':'')} labelledBy="chapter-end-title" onClose={closing?undefined:onNext}>
  <article className="ending-story" onKeyDown={closing?undefined:onEnter(onNext)}>{story}</article>
  {recap&&<aside className="ending-recap" aria-label={`Chapter ${p.numeral} in brief`}>
   <h3>Your choices <small>{recap.choices.length}</small></h3>
   <ol className="chapter-choices">{recap.choices.map(c=><li key={c.room}><span className="chapter-choice-room">{c.title}</span><span className="chapter-choice">{c.choice}</span></li>)}</ol>
   <dl>{recapRows(recap).map(r=><div key={r.key} className={'recap-row recap-'+r.key}><dt>{r.tag}</dt><dd>{r.line}</dd></div>)}</dl>
  </aside>}
 </Overlay>;
}

/** "Read your story": every chapter reached, each with its recap. A chapter still under way (or one an older save cannot recap) lists the decisions its journal holds. */
export function StoryView({save,onClose}:{save:PublicSave;onClose:()=>void}){
 const current=chapterOf(save.scene.id),hero=save.party[0]?.name;
 const decisions=(chapter:number)=>CAMPAIGN_MAP.filter(r=>r.chapter===chapter).flatMap(r=>{const f=save.facts.find(x=>x.id==='decision:'+r.id);return f?[{room:r.id,title:r.title,text:f.text}]:[];});
 return <Dialog className="story-view" labelledBy="story-view-title" onClose={onClose} initial="#story-view-title">
  <button aria-label="Close your story" className="close" onClick={onClose}>×</button>
  <div className="eyebrow">THE STORY SO FAR</div>
  <h2 id="story-view-title" tabIndex={-1}>{hero?`${hero}’s descent`:'Your descent'}</h2>
  {CHAPTER_PAGES.filter(p=>p.chapter<=current).map(p=>{const recap=save.chapterRecaps?.find(r=>r.chapter===p.chapter),told=recap?[]:decisions(p.chapter);
   return <section key={p.chapter} className="story-chapter" aria-labelledby={'story-chapter-'+p.chapter}>
    <h3 id={'story-chapter-'+p.chapter}><span className="story-chapter-numeral">{p.numeral}</span>{p.name}</h3>
    {recap?<>
     <ol className="chapter-choices">{recap.choices.map(c=><li key={c.room}><span className="chapter-choice-room">{c.title}</span><span className="chapter-choice">{c.choice}</span></li>)}</ol>
     {recap.changes.length>0&&<ul className="chapter-changes">{recap.changes.map((c,i)=><li key={i}>{c}</li>)}</ul>}
     <div className="chapter-tags">{recapRows(recap).map(r=><span key={r.key}>{r.tag}</span>)}</div>
    </>:told.length?<ul className="chapter-changes">{told.map(d=><li key={d.room}><span className="chapter-choice-room">{d.title}</span>{d.text}</li>)}</ul>:<p className="muted">This chapter is still being written.</p>}
   </section>;})}
 </Dialog>;
}
