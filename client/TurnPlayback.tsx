import {revealedScene} from './playback-scene';
import {useEffect,useRef,useState} from 'react';
import type {PublicSave} from '../shared/types';
import type {WorldRoll} from './WorldDie';

/** Presentation never rolls dice or writes game state. Its frames are committed server outcomes. */
export function TurnPlayback({before,after,reduced,onFrame,onRoll,onDone}:{before:PublicSave;after:PublicSave;reduced:boolean;onFrame:(save:PublicSave)=>void;onRoll:(roll:WorldRoll|null)=>void;onDone:()=>void}) {
 const panel=useRef<HTMLElement>(null);
 const [index,setIndex]=useState(0),[revealed,setRevealed]=useState(false);
 const frames=after.presentation??[],frame=frames[index],done=useRef(onDone),show=useRef(onFrame),rolled=useRef(onRoll);
 done.current=onDone;show.current=onFrame;rolled.current=onRoll;
 useEffect(()=>()=>rolled.current(null),[]);
 useEffect(()=>{
  if(!frame){done.current();return;}
  setRevealed(false);panel.current?.focus();
  const previous=index?frames[index-1]:null;
  const room=frame.sceneId===before.scene.id?before:after;
  const turn=frame.turn??after.turn??before.turn;
  const visible={...room,activeReaction:frame.log.actionKind==='reaction'?frame.actorId:undefined,mode:frame.mode??room.mode,actions:[],party:previous?.party??before.party,enemies:previous?.enemies.length?previous.enemies:frame.enemies,logs:before.logs,turn:turn?{...turn,actorId:frame.actorId}:null};
  show.current(visible);
  const first=frame.log.rolls[0],roll=first?{key:frame.log.id,actorId:frame.actorId,sides:first.sides,rolling:true,kept:null}:null;rolled.current(roll);
  const t=setTimeout(()=>{setRevealed(true);rolled.current(roll&&{...roll,rolling:false,kept:first!.kept});show.current({...visible,scene:revealedScene(before,after,frame,index===frames.length-1),tactical:frame.tactical??visible.tactical,party:frame.party,enemies:frame.enemies,logs:[...before.logs,frame.log]});},reduced?100:frame.log.rolls.length?1250:300);
  return()=>clearTimeout(t);
 },[index,frame,before,after,reduced,frames]);
 if(!frame)return null;
 const roll=frame.log.rolls[0],actor=[...frame.party,...frame.enemies].find(a=>a.id===frame.actorId);
 return <section ref={panel} tabIndex={-1} onKeyDown={event=>{if(event.key!=='Tab')return;const buttons=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(!buttons.length)return;const index=buttons.indexOf(document.activeElement as HTMLButtonElement);event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}} className={'turn-playback '+(roll?'with-roll':'')} role="dialog" aria-modal="false" aria-label="Action playback">
  <div className="eyebrow">{actor?.name??'FATE'} · {index+1} / {frames.length}</div>
  <div className="roll-head">{roll&&<strong className={'roll-badge'+(revealed?' revealed':'')} aria-label={revealed?`Rolled ${roll.kept}`:'Rolling'}>{revealed?roll.kept:'?'}</strong>}<h2>{roll?`D${roll.sides} · ${roll.purpose}`:'Taking action'}</h2></div>
  <div className="turn-outcome" aria-live="polite">{revealed?<>{roll&&<div className="roll-equation">{roll.values.length>1?`[${roll.values.join(', ')}] → `:''}{roll.kept} {roll.modifier<0?'−':'+'} {Math.abs(roll.modifier)} <b>= {roll.total}</b></div>}<p>{frame.log.text}</p>{frame.log.rolls.slice(1).map((r,i)=><small key={i}>{r.purpose}: {r.values.join(' + ')} + {r.modifier} = {r.total}</small>)}</>:<p>{roll?'The dice are in motion…':`${actor?.name??'The party'} acts…`}</p>}</div>
  <button className="primary" autoFocus disabled={!revealed} onClick={()=>index+1<frames.length?setIndex(index+1):done.current()}>{index+1<frames.length?'Next action':'Continue adventure'} →</button>
  <button className="skip-playback" onClick={()=>done.current()}>Skip presentation · outcomes are already saved</button>
 </section>;
}
