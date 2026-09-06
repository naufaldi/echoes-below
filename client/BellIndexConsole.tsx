import type {Scene} from '../shared/types';
export default function BellIndexConsole({state}:{state:NonNullable<Scene['bellIndex']>}){
 return <group position={[-3,0,2]} userData={{blocksLabels:true}}>
  <mesh position={[0,.4,0]} castShadow receiveShadow><boxGeometry args={[2,.8,.85]}/><meshStandardMaterial color="#615844" roughness={.85}/></mesh>
  {[0,1,2].map(slot=><group key={slot} position={[(slot-1)*.6,.83,0]}>
   <mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.19,.24,24]}/><meshStandardMaterial color={state.solved?'#8fdcb9':'#bfa171'} emissive={state.solved?'#31664b':'#000000'}/></mesh>
   {state.sequence[slot]&&<mesh position={[0,.07,0]} rotation={[-Math.PI/2,0,0]} castShadow>
    {state.sequence[slot]==='witness'?<torusGeometry args={[.12,.035,8,20]}/>:state.sequence[slot]==='keeper'?<circleGeometry args={[.15,3]}/>:<planeGeometry args={[.24,.24]}/>}
    <meshStandardMaterial color="#e6c77d" side={2}/>
   </mesh>}
  </group>)}
 </group>;
}
