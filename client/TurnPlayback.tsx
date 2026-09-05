import {useEffect,useRef,useState} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import {Edges} from '@react-three/drei';
import type {Mesh} from 'three';
import type {PublicSave} from '../shared/types';

function Die({rolling,sides}:{rolling:boolean;sides:number}) {
 const mesh=useRef<Mesh>(null);
 useFrame((_,delta)=>{if(!mesh.current)return;if(rolling){mesh.current.rotation.x+=delta*7;mesh.current.rotation.y+=delta*9;}else {mesh.current.rotation.x*=Math.exp(-delta*9);mesh.current.rotation.y*=Math.exp(-delta*9);}});
 return <mesh ref={mesh}>{sides===6?<boxGeometry args={[2,2,2]}/>:sides===4?<tetrahedronGeometry args={[1.55,0]}/>:sides===8?<octahedronGeometry args={[1.55,0]}/>:<icosahedronGeometry args={[1.55,0]}/>}<meshStandardMaterial color="#173a34" metalness={.75} roughness={.23}/><Edges color="#efcb7d"/></mesh>;
}

/** Presentation never rolls dice or writes game state. Its frames are committed server outcomes. */
export function TurnPlayback({before,after,reduced,onFrame,onDone}:{before:PublicSave;after:PublicSave;reduced:boolean;onFrame:(save:PublicSave)=>void;onDone:()=>void}) {
 const panel=useRef<HTMLElement>(null);
 const [index,setIndex]=useState(0),[revealed,setRevealed]=useState(false);
 const frames=after.presentation??[],frame=frames[index],done=useRef(onDone),show=useRef(onFrame);
 done.current=onDone;show.current=onFrame;
 useEffect(()=>{
  if(!frame){done.current();return;}
  setRevealed(false);panel.current?.focus();
  const previous=index?frames[index-1]:null;
  const room=frame.sceneId===before.scene.id?before:after;
  const visible={...room,actions:[],party:previous?.party??before.party,enemies:previous?.enemies.length?previous.enemies:frame.enemies,logs:before.logs,turn:after.turn?{...after.turn,actorId:frame.actorId}:null};
  show.current(visible);
  const t=setTimeout(()=>{setRevealed(true);show.current({...visible,party:frame.party,enemies:frame.enemies,logs:[...before.logs,frame.log]});},reduced?100:frame.log.rolls.length?1250:300);
  return()=>clearTimeout(t);
 },[index,frame,before,after,reduced,frames]);
 if(!frame)return null;
 const roll=frame.log.rolls[0],actor=[...frame.party,...frame.enemies].find(a=>a.id===frame.actorId);
 return <section ref={panel} tabIndex={-1} onKeyDown={event=>{if(event.key!=='Tab')return;const buttons=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(!buttons.length)return;const index=buttons.indexOf(document.activeElement as HTMLButtonElement);event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}} className={'turn-playback '+(roll?'with-roll':'')} role="dialog" aria-modal="true" aria-label="Action playback">
  <div className="eyebrow">{actor?.name??'FATE'} · {index+1} / {frames.length}</div>
  <h2>{roll?`D${roll.sides} · ${roll.purpose}`:'Taking action'}</h2>
  {roll&&<div className="rolling-die"><Canvas camera={{position:[0,0,5]}}><ambientLight intensity={2}/><directionalLight position={[3,4,5]} intensity={6}/><Die sides={roll.sides} rolling={!revealed&&!reduced}/></Canvas><strong className={revealed?'revealed':''}>{revealed?roll.kept:'?'}</strong></div>}
  <div className="turn-outcome" aria-live="polite">{revealed?<>{roll&&<div className="roll-equation">{roll.values.length>1?`[${roll.values.join(', ')}] → `:''}{roll.kept} {roll.modifier<0?'−':'+'} {Math.abs(roll.modifier)} <b>= {roll.total}</b></div>}<p>{frame.log.text}</p>{frame.log.rolls.slice(1).map((r,i)=><small key={i}>{r.purpose}: {r.values.join(' + ')} + {r.modifier} = {r.total}</small>)}</>:<p>{roll?'The dice are in motion…':`${actor?.name??'The party'} acts…`}</p>}</div>
  <button className="primary" autoFocus disabled={!revealed} onClick={()=>index+1<frames.length?setIndex(index+1):done.current()}>{index+1<frames.length?'Next action':'Continue adventure'} →</button>
  <button className="skip-playback" onClick={()=>done.current()}>Skip presentation · outcomes are already saved</button>
 </section>;
}
