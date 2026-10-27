import {revealedScene} from './playback-scene';
import {playbackSteps} from './playback-steps';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {PublicSave} from '../shared/types';
import type {WorldRoll} from './WorldDie';
import {cueFor,type WorldCue} from './combat-cue';

/** Presentation never rolls dice or writes game state. Its frames are committed server outcomes. */
export function TurnPlayback({before,after,reduced,onFrame,onRoll,onCue,onDone}:{before:PublicSave;after:PublicSave;reduced:boolean;onFrame:(save:PublicSave)=>void;onRoll:(roll:WorldRoll|null)=>void;onCue:(cue:WorldCue|null)=>void;onDone:()=>void}) {
 const panel=useRef<HTMLElement>(null);
 const [step,setStep]=useState(0),[revealed,setRevealed]=useState(false);
 const frames=after.presentation??[],steps=useMemo(()=>playbackSteps(frames),[frames]),[index,last]=steps[step]??[frames.length,frames.length],group=frames.slice(index,last+1),frame=frames[index],final=frames[last],done=useRef(onDone),show=useRef(onFrame),rolled=useRef(onRoll),cued=useRef(onCue);
 done.current=onDone;show.current=onFrame;rolled.current=onRoll;cued.current=onCue;
 useEffect(()=>()=>{rolled.current(null);cued.current(null);},[]);
 useEffect(()=>{
  if(!frame){done.current();return;}
  setRevealed(false);panel.current?.focus();
  const previous=index?frames[index-1]:null;
  const room=frame.sceneId===before.scene.id?before:after;
  const turn=frame.turn??after.turn??before.turn;
  const visible={...room,activeReaction:frame.log.actionKind==='reaction'?frame.actorId:undefined,mode:frame.mode??room.mode,actions:[],party:previous?.party??before.party,enemies:previous?.enemies.length?previous.enemies:frame.enemies,logs:before.logs,turn:turn?{...turn,actorId:frame.actorId}:null};
  show.current(visible);
  const first=group.length===1?frame.log.rolls[0]:undefined,roll=first?{key:frame.log.id,actorId:frame.actorId,sides:first.sides,rolling:true,kept:null}:null;rolled.current(roll);
  const t=setTimeout(()=>{setRevealed(true);rolled.current(roll&&{...roll,rolling:false,kept:first!.kept});cued.current(group.length===1?cueFor(frame.log.id,frame.actorId,frame.log.animation,frame.log.text,[...visible.party,...(previous?.enemies??before.enemies)],[...frame.party,...frame.enemies]):null);show.current({...visible,scene:revealedScene(before,after,final,last===frames.length-1),tactical:final.tactical??visible.tactical,party:final.party,enemies:final.enemies,turn:turn?{...turn,actorId:group.length>1?(final.turn??after.turn)?.actorId??final.actorId:final.actorId}:null,logs:[...before.logs,...group.map(f=>f.log)]});},reduced?100:frame.log.rolls.length?1250:300);
  return()=>clearTimeout(t);
 },[index,last,frame,final,before,after,reduced,frames]);
 if(!frame)return null;
 const roll=group.length===1?frame.log.rolls[0]:undefined,actor=[...frame.party,...frame.enemies].find(a=>a.id===frame.actorId),order=group.length>1?group.map(f=>({name:[...f.party,...f.enemies].find(a=>a.id===f.actorId)?.name??f.actorId,roll:f.log.rolls[0]})).sort((a,b)=>b.roll.total-a.roll.total):[];
 return <section ref={panel} tabIndex={-1} onKeyDown={event=>{if(event.key!=='Tab')return;const buttons=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(!buttons.length)return;const index=buttons.indexOf(document.activeElement as HTMLButtonElement);event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}} className={'turn-playback '+(roll?'with-roll':'')} role="dialog" aria-modal="false" aria-label="Action playback">
  <div className="eyebrow">{order.length?`${order.length} combatants`:actor?.name??'FATE'} · {step+1} / {steps.length}</div>
  <div className="roll-head">{roll&&<strong className={'roll-badge'+(revealed?' revealed':'')} aria-label={revealed?`Rolled ${roll.kept}`:'Rolling'}>{revealed?roll.kept:'?'}</strong>}<h2>{order.length?'D20 · Initiative':roll?`D${roll.sides} · ${roll.purpose}`:'Taking action'}</h2></div>
  <div className="turn-outcome" aria-live="polite">{order.length?revealed?<ol className="initiative-order">{order.map((o,i)=><li key={i}><span>{o.name}</span><b>{o.roll.total}</b><small>{o.roll.kept} {o.roll.modifier<0?'−':'+'} {Math.abs(o.roll.modifier)}</small></li>)}</ol>:<p>Everyone rolls for initiative…</p>:revealed?<>{roll&&<div className="roll-equation">{roll.values.length>1?`[${roll.values.join(', ')}] → `:''}{roll.kept} {roll.modifier<0?'−':'+'} {Math.abs(roll.modifier)} <b>= {roll.total}</b></div>}<p>{frame.log.text}</p>{frame.log.rolls.slice(1).map((r,i)=><small key={i}>{r.purpose}: {r.values.join(' + ')} + {r.modifier} = {r.total}</small>)}</>:<p>{roll?'The dice are in motion…':`${actor?.name??'The party'} acts…`}</p>}</div>
  <button className="primary" autoFocus disabled={!revealed} onClick={()=>step+1<steps.length?setStep(step+1):done.current()}>{step+1<steps.length?'Next action':'Continue adventure'} →</button>
  <button className="skip-playback" onClick={()=>done.current()}>Skip presentation · outcomes are already saved</button>
 </section>;
}
