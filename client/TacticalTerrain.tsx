import type {TacticalGrid} from '../shared/tactical-grid';
/** Read saved geometry, including legacy layouts, rather than guessing from scene. */
export default function TacticalTerrain({grid}:{grid:TacticalGrid}){
 return <group>
  {grid.blocked.map(([x,y])=><group key={`wall:${x},${y}`} position={[(x-4)*1.2,0,-(y-4)*1.2]} userData={{blocksLabels:true}}>
   <mesh position={[0,1.1,0]} castShadow receiveShadow><boxGeometry args={[1.12,2.2,1.12]}/><meshStandardMaterial color="#696e68" roughness={.95}/></mesh>
   <mesh position={[0,2.23,0]} castShadow><boxGeometry args={[1.18,.12,1.18]}/><meshStandardMaterial color="#a0977a" roughness={.9}/></mesh>
  </group>)}
  {(grid.difficult??[]).map(([x,y])=><group key={`rough:${x},${y}`} position={[(x-4)*1.2,0,-(y-4)*1.2]}>
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]}><planeGeometry args={[1.13,1.13]}/><meshStandardMaterial color="#8e683b" roughness={1}/></mesh>
   {[-.3,0,.3].map((offset,i)=><mesh key={i} position={[offset,.075,(i%2?-.2:.2)]} rotation={[.2,i,.3]} receiveShadow><dodecahedronGeometry args={[.11,0]}/><meshStandardMaterial color="#b8a381" roughness={1}/></mesh>)}
  </group>)}
 </group>;
}
