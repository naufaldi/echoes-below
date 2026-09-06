import type {Scene} from '../shared/types';
export default function InkGarden({state}:{state:NonNullable<Scene['inkGarden']>}){
 return <group>
  <group position={[-3,0,-1.5]}>{Array.from({length:8},(_,i)=>{const x=(i%4)*.38-.55,z=Math.floor(i/4)*.45-.2,h=.7+(i%3)*.18;return <group key={i} position={[x,0,z]}>
   <mesh position={[0,.12,0]}><cylinderGeometry args={[.16,.2,.24,8]}/><meshStandardMaterial color="#6a5849"/></mesh>
   <mesh position={[0,h/2,0]}><cylinderGeometry args={[.018,.035,h,5]}/><meshStandardMaterial color="#304c43"/></mesh>
   <mesh position={[.04,h-.1,0]} rotation={[0,i*.36,.16]}><boxGeometry args={[.22,.42,.035]}/><meshStandardMaterial color="#839383"/></mesh>
   {[0,1,2].map(line=><mesh key={line} position={[.04,h-.22+line*.085,.023]}><boxGeometry args={[.12,.014,.008]}/><meshStandardMaterial color="#283c37"/></mesh>)}
   {state.sleeved&&<mesh position={[0,.35,0]}><cylinderGeometry args={[.13,.18,.65,8,1,true]}/><meshStandardMaterial color="#a28460" side={2}/></mesh>}
  </group>;})}</group>
  {!state.lanternTaken&&<group position={[-1,0,-2]}>
   <mesh position={[0,.18,0]}><cylinderGeometry args={[.35,.42,.36,8]}/><meshStandardMaterial color="#68583f"/></mesh>
   <mesh position={[0,.7,0]}><cylinderGeometry args={[.16,.2,.4,8]}/><meshStandardMaterial color="#dfbe6f" transparent opacity={.45}/></mesh>
   {[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={x+':'+z} position={[x*.2,.68,z*.2]}><boxGeometry args={[.045,.72,.045]}/><meshStandardMaterial color="#776849"/></mesh>))}
   <mesh position={[0,state.ready?1:1.14,0]}><coneGeometry args={[.36,.2,8]}/><meshStandardMaterial color="#645d49"/></mesh>
   <mesh position={[0,.66,0]}><sphereGeometry args={[state.ready?.095:.13,8,6]}/><meshBasicMaterial color={state.ready?'#ffd48d':'#b58856'}/></mesh>
   {!state.ready&&[0,1,2].map(i=><mesh key={i} position={[i*.04,1.35+i*.2,0]}><sphereGeometry args={[.12+i*.035,7,5]}/><meshBasicMaterial color="#343d3c" transparent opacity={.3-i*.05}/></mesh>)}
   <pointLight position={[0,1,0]} color="#ffc779" intensity={state.ready?7:2} distance={5}/>
  </group>}
 </group>;
}
