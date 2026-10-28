import {playbackStartSave,playbackRevealSave} from './playback-save';
import {playFrameCues} from './audio';
import {playbackSteps} from './playback-steps';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {PublicSave} from '../shared/types';
import type {BarkEvent} from '../shared/companion-barks';
import type {WorldRoll} from './WorldDie';
import {cueFor,type WorldCue} from './combat-cue';
import NarrativePassage,{MechTag,useOSReducedMotion,useReveal} from './NarrativePassage';
import {NamePlate,SpeakerPortrait,StoryBark,storyKeyTarget} from './StoryBox';
import {checkTag,readingDelay,type TagPart} from './story-pages';
import {actorDisplayName} from '../shared/visual-identity';

const cap=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
/** Presentation never rolls dice or writes game state. Its frames are committed server outcomes, shown in the story box one step at a time. */
export function TurnPlayback({before,after,reduced,autoAdvance,barks,onFrame,onRoll,onCue,onDone}:{before:PublicSave;after:PublicSave;reduced:boolean;autoAdvance:boolean;barks:BarkEvent[];onFrame:(save:PublicSave)=>void;onRoll:(roll:WorldRoll|null)=>void;onCue:(cue:WorldCue|null)=>void;onDone:()=>void}) {
 const panel=useRef<HTMLElement>(null),os=useOSReducedMotion(),still=reduced||os;
 const [step,setStep]=useState(0),[revealed,setRevealed]=useState(false);const revealNow=useRef<(()=>void)|null>(null);
 const frames=after.presentation??[],steps=useMemo(()=>playbackSteps(frames),[frames]),[index,last]=steps[step]??[frames.length,frames.length],group=frames.slice(index,last+1),frame=frames[index],final=frames[last],done=useRef(onDone),show=useRef(onFrame),rolled=useRef(onRoll),cued=useRef(onCue);
 done.current=onDone;show.current=onFrame;rolled.current=onRoll;cued.current=onCue;
 useEffect(()=>()=>{rolled.current(null);cued.current(null);},[]);
 useEffect(()=>{
  if(!frame){done.current();return;}
  setRevealed(false);if(!panel.current?.contains(document.activeElement))panel.current?.focus({preventScroll:true});
  const previous=index?frames[index-1]:null;
  const visible=playbackStartSave(before,after,frames,index);
  show.current(visible);playFrameCues('start',frame,previous??before);
  const first=group.length===1?frame.log.rolls[0]:undefined,roll=first?{key:frame.log.id,actorId:frame.actorId,sides:first.sides,rolling:true,kept:null}:null;rolled.current(roll);
  let shown=false;
  const reveal=()=>{if(shown)return;shown=true;setRevealed(true);rolled.current(roll&&{...roll,rolling:false,kept:first!.kept});cued.current(group.length===1?cueFor(frame.log.id,frame.actorId,frame.log.animation,frame.log.text,[...visible.party,...(previous?.enemies??before.enemies)],[...frame.party,...frame.enemies]):null);show.current(playbackRevealSave(before,after,frames,index,last));playFrameCues('reveal',final,previous??before);};
  // A press while the die is still in the air lands it now, so the step's roll and cue are never skipped.
  const t=setTimeout(reveal,reduced?100:frame.log.rolls.length?1250:300);revealNow.current=()=>{clearTimeout(t);reveal();};
  return()=>{clearTimeout(t);revealNow.current=null;};
 },[index,last,frame,final,before,after,reduced,frames]);
 const roll=frame&&group.length===1?frame.log.rolls[0]:undefined,actor=frame&&[...frame.party,...frame.enemies].find(a=>a.id===frame.actorId),order=frame&&group.length>1?group.map(f=>{const a=[...f.party,...f.enemies].find(a=>a.id===f.actorId);return {name:a?actorDisplayName(a,f.enemies):f.actorId,roll:f.log.rolls[0]};}).sort((a,b)=>b.roll.total-a.roll.total):[];
 const text=frame&&revealed&&!order.length?frame.log.prose??frame.log.text:'';
 const typed=useReveal(text,still);
 const finished=revealed&&typed.done;
 const advance=()=>{if(!revealed){revealNow.current?.();return;}if(!typed.done){typed.complete();return;}if(step+1<steps.length)setStep(step+1);else done.current();};
 const keys=useRef(advance);keys.current=advance;
 useEffect(()=>{if(!autoAdvance||!finished)return;const t=setTimeout(()=>keys.current(),order.length?2500:readingDelay(text));return()=>clearTimeout(t);},[autoAdvance,finished,text,order.length]);
 if(!frame)return null;
 const cast={party:frame.party,enemies:frame.enemies,scene:after.scene};
 const tags:TagPart[][]=!revealed||order.length?[]:frame.log.check?[checkTag(frame.log.check,frame.log.rolls,cast,{named:frame.log.check.actorId!==actor?.id,short:(frame.mode??after.mode)==='combat'})]:frame.log.rolls.map(r=>[{text:cap(r.purpose)},{text:`${r.kept} ${r.modifier<0?'−':'+'} ${Math.abs(r.modifier)} = ${r.total}`}]);
 const bark=revealed?barks.find(b=>b.step===step):undefined,name=actor?actorDisplayName(actor,frame.enemies):frame.actorId;
 // Portraits are for characters (#65); an enemy keeps its plate only, so combat never queues a new model snapshot.
 const portrait=!!actor&&!order.length&&actor.side!=='enemy';
 return <section ref={panel} tabIndex={-1} onKeyDown={event=>{
   if(event.key==='Escape'){event.preventDefault();done.current();return;}
   if((event.key===' '||event.key==='Enter')&&storyKeyTarget(event.target,panel.current)){event.preventDefault();if(!event.repeat)advance();return;}
   if(event.key!=='Tab')return;const buttons=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(!buttons.length)return;const index=buttons.indexOf(document.activeElement as HTMLButtonElement);event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
  }} className={'narration-panel story-box turn-playback'+(portrait?' speaking':'')} role="dialog" aria-modal="false" aria-label="What happens">
  {portrait&&<SpeakerPortrait speakerId={actor.id} name={name} cast={cast}/>}{actor&&!order.length&&<NamePlate speakerId={actor.id} name={name} cast={cast}/>}
  <div className="story-body" onClick={advance} aria-live="polite">
   {order.length?revealed?<ol className="initiative-order" aria-label="Initiative order">{order.map((o,i)=><li key={i} title={`${o.roll.kept} ${o.roll.modifier<0?'−':'+'} ${Math.abs(o.roll.modifier)}`}><span>{o.name}</span><b>{o.roll.total}</b></li>)}</ol>:<p className="story-text voice-narrator">Everyone reaches for their weapons…</p>
    :revealed?<NarrativePassage key={frame.log.id} text={text} count={typed.count} className="voice-narrator"/>:<p className="story-text voice-narrator">{roll?'The dice are in motion…':`${actor?.name??'The party'} acts…`}</p>}
  </div>
  <div className="story-foot">
   <span className="story-tags">{roll&&<strong className={'roll-badge'+(revealed?' revealed':'')} aria-label={revealed?`Rolled ${roll.kept}`:'Rolling'}>{revealed?roll.kept:'?'}</strong>}{order.length>0&&<span className="mech-tag story-tag">Initiative · {order.length} combatants</span>}{tags.map((t,i)=><MechTag key={i} parts={t}/>)}</span>
   <span className="story-controls">
    <span className="page-indicator" aria-label={`Step ${step+1} of ${steps.length}`}>{step+1} / {steps.length}</span>
    <button className="story-link" onClick={()=>done.current()} title="Skip ahead. Every roll stands as it fell." aria-keyshortcuts="Escape">Skip <kbd>Esc</kbd></button>
    <button className="story-next" onClick={advance}>Go on <span aria-hidden="true">›</span></button>
   </span>
  </div>
  {bark&&<StoryBark bark={bark} cast={cast}/>}
 </section>;
}
