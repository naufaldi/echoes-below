import {createDieGeometry} from './die-geometry';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Edges} from '@react-three/drei';
import TextSprite from './TextSprite';
import {AdditiveBlending,CanvasTexture,SRGBColorSpace,type Group,type Mesh,type MeshBasicMaterial,type MeshStandardMaterial,type Sprite} from 'three';
import {actorHeight} from '../shared/visual-identity';
import type {PublicSave} from '../shared/types';
import type {NaturalEvent} from './audio-cues';

/** The saved roll being presented. Presentation only: the outcome is already committed. `event` marks a saved natural 20 or 1 (#61). */
export interface WorldRoll {key:string;actorId:string;sides:number;rolling:boolean;kept:number|null;event?:NaturalEvent|null;}

const GOLD='#efcb7d',GOLD_STRONG='#f3cd82',CRACK='#ec8468',EVENT_SECONDS=.3;
/** Ease-out quartic, close to the HUD's --ease-out (cubic-bezier(.23,1,.32,1)): the burst answers at once, then settles. */
const easeOut=(t:number)=>1-(1-t)**4;
/** The event motion also honours the system setting, not only the in-game one. */
const systemReduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/** A jagged fracture drawn once to a canvas: the natural 1's crack across the die. */
function crackTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;
 const path=(points:[number,number][],width:number,color:string)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.lineWidth=width;ctx.strokeStyle=color;ctx.lineJoin='miter';ctx.stroke();};
 const main:[number,number][]=[[18,10],[46,40],[38,58],[70,74],[62,92],[96,118]],branch:[number,number][]=[[38,58],[16,72]],twig:[number,number][]=[[70,74],[104,60]];
 for(const [w,c] of [[11,'rgba(5,10,9,.85)'],[4,CRACK]] as const){path(main,w,c);path(branch,w*.7,c);path(twig,w*.7,c);}
 const t=new CanvasTexture(canvas);t.colorSpace=SRGBColorSpace;return t;
}
/** Rolls the die in the world above the acting character, so the roll never covers the scene. A natural 20 bursts with light; a natural 1 cracks with a short jolt. Reduced motion keeps only the colour change. */
export default function WorldDie({roll,save,reduced}:{roll:WorldRoll;save:PublicSave;reduced:boolean}) {
 const actor=[...save.party,...save.enemies].find(a=>a.id===roll.actorId);
 const crack=useRef<Sprite>(null),group=useRef<Group>(null),mesh=useRef<Mesh>(null),material=useRef<MeshStandardMaterial>(null),burst=useRef<Mesh>(null),burstMaterial=useRef<MeshBasicMaterial>(null),settled=useRef(0),eventAge=useRef(0);
 const geometry=useMemo(()=>createDieGeometry(roll.sides),[roll.sides]);useEffect(()=>()=>geometry.dispose(),[geometry]);
 useEffect(()=>{settled.current=0;eventAge.current=0;},[roll.key,roll.rolling]);
 const event=!roll.rolling&&roll.kept!==null?roll.event??null:null,still=reduced||systemReduced();
 const fracture=useMemo(()=>event==='natural-1'?crackTexture():null,[event]);useEffect(()=>()=>fracture?.dispose(),[fracture]);
 useFrame(({clock},delta)=>{
  if(!mesh.current||!group.current)return;
  const spinning=roll.rolling&&!reduced;
  if(spinning){mesh.current.rotation.x+=delta*7;mesh.current.rotation.y+=delta*9;group.current.position.y=Math.abs(Math.sin(clock.elapsedTime*5))*.25;}
  else {mesh.current.rotation.x*=Math.exp(-delta*9);mesh.current.rotation.y*=Math.exp(-delta*9);group.current.position.y*=Math.exp(-delta*12);settled.current=Math.min(1,settled.current+delta*2.5);}
  if(material.current)material.current.emissiveIntensity=event==='natural-20'?.9:event==='natural-1'?.05:roll.kept===null?.15:.15+(reduced?.6:.6*(1-settled.current));
  if(!event)return;eventAge.current+=delta;const t=Math.min(1,eventAge.current/EVENT_SECONDS);
  if(burst.current&&burstMaterial.current){burst.current.visible=event==='natural-20'&&!still&&t<1;burst.current.scale.setScalar(.35+1.25*easeOut(t));burstMaterial.current.opacity=.8*(1-t);}
  group.current.position.x=event==='natural-1'&&!still&&t<1?Math.sin(eventAge.current*80)*.06*(1-t):0;
  // The crack opens along its length (scale); under reduced motion it is simply there.
  if(crack.current)crack.current.scale.set(.62*(still?1:easeOut(t)),.62,1);
 });
 if(!actor)return null;
 return <group position={[actor.position[0],actorHeight(actor)+.85,-actor.position[1]]}>
  <group ref={group}><mesh ref={mesh} geometry={geometry} scale={.32} castShadow><meshStandardMaterial ref={material} color={event==='natural-1'?'#2a2220':'#173a34'} emissive={GOLD} emissiveIntensity={.15} metalness={.75} roughness={event==='natural-1'?.7:.23}/><Edges color={event==='natural-1'?CRACK:GOLD}/></mesh>
   {fracture&&<sprite ref={crack} raycast={()=>null} scale={[still?.62:0,.62,1]} renderOrder={21}><spriteMaterial map={fracture} transparent depthTest={false} depthWrite={false} toneMapped={false}/></sprite>}
   <mesh ref={burst} visible={false} raycast={()=>null} renderOrder={19}><sphereGeometry args={[.5,24,16]}/><meshBasicMaterial ref={burstMaterial} color={GOLD_STRONG} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false}/></mesh></group>
  {roll.kept!==null&&<TextSprite text={String(roll.kept)} color={event==='natural-1'?CRACK:'#fce6b2'} position={[0,.95,0]} height={.95}/>}
  {event&&<TextSprite text={event==='natural-20'?'Natural 20':'Natural 1'} color={event==='natural-20'?GOLD_STRONG:CRACK} position={[0,1.6,0]} height={.36} italic/>}
 </group>;
}
