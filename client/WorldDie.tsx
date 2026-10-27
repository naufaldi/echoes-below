import {createDieGeometry} from './die-geometry';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Edges,Html} from '@react-three/drei';
import type {Group,Mesh,MeshStandardMaterial} from 'three';
import {actorHeight} from '../shared/visual-identity';
import type {PublicSave} from '../shared/types';

/** The saved roll being presented. Presentation only: the outcome is already committed. */
export interface WorldRoll {key:string;actorId:string;sides:number;rolling:boolean;kept:number|null;}

/** Rolls the die in the world above the acting character, so the roll never covers the scene. */
export default function WorldDie({roll,save,reduced}:{roll:WorldRoll;save:PublicSave;reduced:boolean}) {
 const actor=[...save.party,...save.enemies].find(a=>a.id===roll.actorId);
 const group=useRef<Group>(null),mesh=useRef<Mesh>(null),material=useRef<MeshStandardMaterial>(null),settled=useRef(0);
 const geometry=useMemo(()=>createDieGeometry(roll.sides),[roll.sides]);useEffect(()=>()=>geometry.dispose(),[geometry]);
 useEffect(()=>{settled.current=0;},[roll.key,roll.rolling]);
 useFrame(({clock},delta)=>{
  if(!mesh.current||!group.current)return;
  const spinning=roll.rolling&&!reduced;
  if(spinning){mesh.current.rotation.x+=delta*7;mesh.current.rotation.y+=delta*9;group.current.position.y=Math.abs(Math.sin(clock.elapsedTime*5))*.25;}
  else {mesh.current.rotation.x*=Math.exp(-delta*9);mesh.current.rotation.y*=Math.exp(-delta*9);group.current.position.y*=Math.exp(-delta*12);settled.current=Math.min(1,settled.current+delta*2.5);}
  if(material.current)material.current.emissiveIntensity=roll.kept===null?.15:.15+(reduced?.6:.6*(1-settled.current));
 });
 if(!actor)return null;
 return <group position={[actor.position[0],actorHeight(actor)+.85,-actor.position[1]]}>
  <group ref={group}><mesh ref={mesh} geometry={geometry} scale={.32} castShadow><meshStandardMaterial ref={material} color="#173a34" emissive="#efcb7d" emissiveIntensity={.15} metalness={.75} roughness={.23}/><Edges color="#efcb7d"/></mesh></group>
  {roll.kept!==null&&<Html center position={[0,.85,0]} zIndexRange={[60,0]} className="world-die-result" aria-hidden="true">{roll.kept}</Html>}
 </group>;
}
