import type {Scene} from '../shared/types';
/** All positions follow the same saved drainage state as the medic and labels. */
export default function InfirmaryMechanism({state}:{state:NonNullable<Scene['infirmary']>}){
 const cotY=state.drained?.48:1.98;
 return <group userData={{blocksLabels:true}}>
  <group position={[-3,cotY,-2]}>
   <mesh castShadow receiveShadow><boxGeometry args={[2.3,.18,1.25]}/><meshStandardMaterial color="#626b61" metalness={.45} roughness={.65}/></mesh>
   <mesh position={[0,.13,0]} receiveShadow><boxGeometry args={[2.1,.1,1.05]}/><meshStandardMaterial color="#b6b39b" roughness={1}/></mesh>
   <mesh position={[-.75,.26,0]}><boxGeometry args={[.4,.17,.85]}/><meshStandardMaterial color="#d5d0b5"/></mesh>
   <mesh position={[.65,.34,0]} castShadow><boxGeometry args={[.52,.34,.48]}/><meshStandardMaterial color="#694c31"/></mesh>
   {[-1,1].map(x=><mesh key={x} position={[x,-.24,0]}><boxGeometry args={[.08,.48,1.1]}/><meshStandardMaterial color="#626b61" metalness={.4}/></mesh>)}
  </group>
  {!state.drained&&<mesh position={[-3,3,-2]} renderOrder={2}><boxGeometry args={[2.65,2.2,1.65]}/><meshStandardMaterial color="#48a6b6" transparent opacity={.19} depthWrite={false} roughness={.15}/></mesh>}
  {state.braced&&[-4.05,-1.95].map(x=><mesh key={x} position={[x,(cotY+.08)/2,-2]}><cylinderGeometry args={[.025,.025,cotY+.08,6]}/><meshStandardMaterial color="#c5aa73"/></mesh>)}
  <group position={[-1,.45,-1.7]}>
   <mesh castShadow><cylinderGeometry args={[.16,.2,.9,8]}/><meshStandardMaterial color="#6d776c" metalness={.55}/></mesh>
   <mesh position={[0,.48,0]} rotation={[Math.PI/2,0,state.drained?Math.PI/2:0]}><torusGeometry args={[.3,.045,8,20]}/><meshStandardMaterial color={state.drained?'#83baa8':'#b59a62'} metalness={.6}/></mesh>
  </group>
  <mesh position={[-2,.02,-1.65]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.6,.25]}/><meshStandardMaterial color={state.drained?'#427784':'#293a3b'}/></mesh>
 </group>;
}
