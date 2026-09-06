import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Group} from 'three';
import type {Scene} from '../shared/types';

/** Visible state is projected by the rules engine, never inferred from narration. */
export default function CounterweightMechanism({state,reduced,onSelect}:{state:NonNullable<Scene['counterweight']>;reduced:boolean;onSelect:()=>void}){
 const pawl=useRef<Group>(null),weight=useRef<Group>(null),pin=useRef<Group>(null);
 useFrame((_,dt)=>{
  const blend=reduced?1:Math.min(1,dt*8);
  if(pawl.current)pawl.current.rotation.z+=( (state.pawlReleased?-.8:0)-pawl.current.rotation.z)*blend;
  if(weight.current)weight.current.position.y+=((state.weightSeated?.8:1.8)-weight.current.position.y)*blend;
  if(pin.current)pin.current.position.x+=((state.locked?.65:1)-pin.current.position.x)*blend;
 });
 const iron='#687575',brass='#c5a35e';
 return <group position={[2,0,-2]} userData={{blocksLabels:true}} onClick={e=>{e.stopPropagation();onSelect();}}>
  <mesh position={[0,.3,0]} castShadow receiveShadow><boxGeometry args={[2.3,.6,1]}/><meshStandardMaterial color="#555345"/></mesh>
  {[-.65,.65].map(x=><mesh key={x} position={[x,1.65,-.25]} castShadow><boxGeometry args={[.12,2.1,.15]}/><meshStandardMaterial color={iron} metalness={.65} roughness={.5}/></mesh>)}
  <mesh position={[0,2.7,-.25]} castShadow><boxGeometry args={[1.5,.15,.2]}/><meshStandardMaterial color={iron}/></mesh>
  <group ref={weight} position={[0,state.weightSeated?.8:1.8,-.25]}>
   <mesh castShadow><boxGeometry args={[.95,.5,.55]}/><meshStandardMaterial color="#777362" metalness={.3}/></mesh>
   {[.4,.63,.86].map(y=><mesh key={y} position={[0,y,0]} rotation={[0,y===.63?Math.PI/2:0,0]}><torusGeometry args={[.09,.025,5,8]}/><meshStandardMaterial color={iron}/></mesh>)}
  </group>
  <group ref={pawl} position={[-.9,.65,.25]} rotation={[0,0,state.pawlReleased?-.8:0]}>
   <mesh position={[0,.3,0]} castShadow><boxGeometry args={[.1,.6,.1]}/><meshStandardMaterial color={brass}/></mesh>
   <mesh position={[0,.62,0]}><sphereGeometry args={[.13,8,6]}/><meshStandardMaterial color="#944b40"/></mesh>
  </group>
  <group ref={pin} position={[state.locked?.65:1,.85,.25]}>
   <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.055,.055,.6,8]}/><meshStandardMaterial color={brass} metalness={.6}/></mesh>
   <mesh position={[.3,0,0]}><sphereGeometry args={[.12,8,6]}/><meshStandardMaterial color={state.locked?'#81b88b':brass}/></mesh>
  </group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.615,.28]}><planeGeometry args={[.5,.28]}/><meshStandardMaterial color={brass}/></mesh>
 </group>;
}
