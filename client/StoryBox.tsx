import {useEffect,useMemo,useRef,useState} from 'react';
import type {Dialogue,PublicSave} from '../shared/types';
import type {BarkEvent} from '../shared/companion-barks';
import {PortraitImage} from './Portrait';
import {portraitSubjectFor} from './portrait-look';
import NarrativePassage,{EventLines,MechTag,useOSReducedMotion,useReveal} from './NarrativePassage';
import {PAGE_CHARS,combatLines,opensWithDescription,paginate,plateColour,readingDelay,storyPages} from './story-pages';
import {pageBudget} from './reading-settings';
import {useReading} from './use-reading';

type Cast=Pick<PublicSave,'party'|'enemies'>&{scene:Pick<PublicSave['scene'],'entities'>};
/** The class glyphs the party panel uses; the portrait shows one until its snapshot is ready. */
const EMBLEMS:Record<string,string>={guardian:'♜',scout:'➶',adept:'✧',cleric:'☀'};

/** A speaker's portrait: the rendered or painted portrait (#65), the class emblem until it is ready, or an initial for a voice with no model. */
export function SpeakerPortrait({speakerId,name,cast,small}:{speakerId:string;name:string;cast:Cast;small?:boolean}){
 const subject=portraitSubjectFor(speakerId,cast);
 return <div className={'story-portrait portrait '+(subject?.classId??'')+(small?' small':'')} aria-hidden="true">{subject?<PortraitImage subject={subject} fallback={EMBLEMS[subject.classId]??name.charAt(0)}/>:name.charAt(0)}</div>;
}
export function NamePlate({speakerId,name,cast}:{speakerId:string;name:string;cast:Cast}){
 const colour=plateColour(speakerId,cast);
 return <span className="name-plate story-plate" data-palette={colour.palette} data-enemy={colour.enemy?'':undefined}>{name}</span>;
}
const COMPANION_NAMES={mira:'Mira',oren:'Oren'} as const;
/** A companion's short reaction (#67), on a tab at the box's top edge so the page under it stays readable. */
export function StoryBark({bark,cast}:{bark:BarkEvent;cast:Cast}){
 const name=COMPANION_NAMES[bark.speaker];
 return <div className="story-bark" role="status"><SpeakerPortrait speakerId={bark.speaker} name={name} cast={cast} small/><NamePlate speakerId={bark.speaker} name={name} cast={cast}/><q>{bark.text}</q></div>;
}
/** Settled barks show for this long; a playback bark lasts as long as its step. */
export const BARK_MS=5000;

/** Space, Enter and Escape belong to the story box only when nothing else is focused (or focus is in the box itself), so a focused action row, the confirm card or a text field keeps its own keys. */
export function storyKeyTarget(target:EventTarget|null,box:HTMLElement|null){
 const t=target as HTMLElement|null;if(!t)return false;
 if(box?.contains(t))return t===box||!t.closest('button,input,textarea,select,a,summary,[contenteditable]');
 return t===document.body||t.tagName==='CANVAS';
}

/** Read-aloud pages are shown once per room in each adventure, remembered in this browser. */
const seenKey=(saveId:string)=>'echoes-read-aloud:'+saveId;
function readAloudSeen(saveId:string,sceneId:string){try{return (JSON.parse(localStorage.getItem(seenKey(saveId))??'[]') as string[]).includes(sceneId);}catch{return false;}}
function markReadAloud(saveId:string,sceneId:string){try{const seen=JSON.parse(localStorage.getItem(seenKey(saveId))??'[]') as string[];if(!seen.includes(sceneId))localStorage.setItem(seenKey(saveId),JSON.stringify([...seen,sceneId]));}catch{/* private mode: the page shows again next time */}}

interface StoryBoxProps {save:PublicSave;dialogue:Dialogue|null;reduced:boolean;autoAdvance:boolean;
 /** False while a modal, the confirm card or a request owns the keyboard. */
 active:boolean;bark:BarkEvent|null;onBacklog:()=>void;
 voice:{speaking:boolean;ready:boolean;onToggle:()=>void};narrate:(()=>void)|null;
 /** Called with the box's `storyKey` once its last page is fully shown, or skipped to (#96). Replies and the chapter card wait for it. */
 onRead?:(key:string)=>void;
 /** Something waits on this passage: offer a visible skip to its last page. */
 holding?:boolean}

/** One key per passage the box shows: a dialogue, the combat feed, or one saved revision. */
export const storyKey=(save:Pick<PublicSave,'id'|'revision'|'mode'>,dialogue:Pick<Dialogue,'id'>|null)=>dialogue?'dialogue:'+dialogue.id:save.mode==='combat'?`${save.id}:${save.revision}:combat`:`${save.id}:${save.revision}`;

/**
 * Issue #60: the ADV story box. Exploration pages through the current revision's passage, with the room's read-aloud page
 * first on a first visit; combat shows the newest events (#29); AI dialogue pages like any passage. The journal is the backlog.
 */
export default function StoryBox(props:StoryBoxProps){
 const {save,dialogue}=props;
 const id=storyKey(save,dialogue);
 return <StoryPages key={id} storyId={id} {...props}/>;
}

function StoryPages({storyId,save,dialogue,reduced,autoAdvance,active,bark,onBacklog,voice,narrate,onRead,holding}:StoryBoxProps&{storyId:string}){
 const box=useRef<HTMLElement>(null),os=useOSReducedMotion(),still=reduced||os;
 const combat=!dialogue&&save.mode==='combat';
 const [readAloud]=useState(()=>!dialogue&&!combat&&opensWithDescription(save)&&!readAloudSeen(save.id,save.scene.id));
 // #68 Larger text fits fewer letters in the box's three lines, so pages hold less.
 const reading=useReading(),budget=pageBudget(reading.size,PAGE_CHARS);
 const pages=useMemo(()=>dialogue?paginate([{key:dialogue.id,voice:dialogue.speaker==='dm'?'narrator':'character',speakerId:dialogue.speaker==='dm'?null:dialogue.speaker,name:dialogue.speaker==='dm'?null:COMPANION_NAMES[dialogue.speaker],text:dialogue.text,tag:null}],{budget}):storyPages(save,{readAloud,budget}),[save,dialogue,readAloud,budget]);
 // Playback already showed this revision's outcome, so the settled box shows its pages whole, from the first.
 const [resumed]=useState(()=>!dialogue&&!readAloud&&!!save.presentation?.length);
 const [view,setView]=useState(()=>({page:0,boxed:readAloud}));
 const [barkShown,setBarkShown]=useState(true);
 const last=pages.length-1,page=Math.min(view.page,last),current=pages[page]!,boxed=view.boxed&&!!current.readAloud;
 const [skipped,setSkipped]=useState(false);
 const {count,done,complete}=useReveal(current.text,still||resumed||skipped);
 const more=page<last||boxed;
 useEffect(()=>{if(readAloud)markReadAloud(save.id,save.scene.id);},[]);// eslint-disable-line react-hooks/exhaustive-deps -- once, on the page's first showing
 useEffect(()=>{if(!bark)return;const t=setTimeout(()=>setBarkShown(false),BARK_MS);return()=>clearTimeout(t);},[bark]);
 /** First press completes the page; the next turns it. Past the last read-aloud page the box collapses to an ordinary page. */
 const advance=()=>{if(!done){complete();return;}if(page<last)setView({page:page+1,boxed:view.boxed});else if(boxed)setView({page,boxed:false});};
 /** Escape leaves a read-aloud box for the passage after it; on an ordinary passage it turns to the last page, shown whole. */
 const skip=()=>{if(!boxed){setSkipped(true);setView({page:last,boxed:false});return;}const next=pages.findIndex((p,i)=>i>page&&!p.readAloud);setView({page:next>=0?next:page,boxed:false});if(next<0)complete();};
 const read=combat||page===last&&!boxed&&done,reported=useRef(onRead);reported.current=onRead;
 useEffect(()=>{if(read)reported.current?.(storyId);},[read,storyId]);
 const keys=useRef({advance,skip});keys.current={advance,skip};
 useEffect(()=>{
  if(!active||combat)return;
  const key=(e:KeyboardEvent)=>{
   if(e.altKey||e.ctrlKey||e.metaKey||!storyKeyTarget(e.target,box.current))return;
   if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)keys.current.advance();}
   else if(e.key==='Escape')keys.current.skip();
  };
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[active,combat]);
 useEffect(()=>{if(!autoAdvance||!active||!done||!more)return;const t=setTimeout(()=>keys.current.advance(),readingDelay(current.text,reading.pause));return()=>clearTimeout(t);},[autoAdvance,active,done,more,current.text,reading.pause]);
 const speaker=current.voice==='character'&&current.speakerId?{id:current.speakerId,name:current.name??current.speakerId}:null;
 const journal=<button className="story-link" onClick={onBacklog} aria-keyshortcuts="J" title="Read everything so far (J)">Journal <kbd>J</kbd></button>;
 if(combat){
  const events=combatLines(save);
  return <section ref={box} tabIndex={-1} className="narration-panel story-box combat" aria-label="Latest events"><div className="story-body" aria-live="polite">{events.length?<EventLines events={events}/>:<NarrativePassage text={save.scene.description} count={save.scene.description.length}/>}</div><div className="story-controls">{journal}</div>{bark&&barkShown&&<StoryBark bark={bark} cast={save}/>}</section>;
 }
 return <section ref={box} tabIndex={-1} className={'narration-panel story-box'+(boxed?' boxed':'')+(speaker?' speaking':'')} aria-label="Story">
  {speaker&&<SpeakerPortrait speakerId={speaker.id} name={speaker.name} cast={save}/>}
  {boxed?<span className="story-tab read-aloud-tab">{save.scene.title}</span>:speaker&&<NamePlate speakerId={speaker.id} name={speaker.name} cast={save}/>}
  <div className="story-body" onClick={advance} aria-live="polite"><NarrativePassage key={current.key} text={current.text} count={count} className={current.voice==='narrator'?'voice-narrator':'voice-character'}/></div>
  <div className="story-foot">
   <span className="story-tags">{current.tags.map((t,i)=><MechTag key={i} parts={t}/>)}</span>
   <span className="story-controls">
    {pages.length>1&&<span className="page-indicator" aria-label={`Page ${page+1} of ${pages.length}`}>{page+1} / {pages.length}</span>}
    {dialogue&&<button className="story-link" disabled={!voice.speaking&&!voice.ready} title={!voice.ready?'Choose an AI mode in Settings to hear voices':undefined} onClick={voice.onToggle}>{voice.speaking?'■ Stop':voice.ready?'▷ Listen':'Voice unavailable'}</button>}
    {narrate&&<button className="story-link" onClick={narrate}>Let the DM narrate ✧</button>}
    {holding&&!read&&<button className="story-link" onClick={skip} title="Turn to the last page" aria-keyshortcuts="Escape">Skip <kbd>Esc</kbd></button>}
    {journal}
    {more&&<button className="story-next" onClick={advance}>Go on <span aria-hidden="true">›</span></button>}
   </span>
  </div>
  {bark&&barkShown&&<StoryBark bark={bark} cast={save}/>}
 </section>;
}
