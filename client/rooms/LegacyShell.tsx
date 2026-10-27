import {useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import DungeonDressing from '../DungeonDressing';
import ChapterAtmosphere,{chapterMood} from '../ChapterAtmosphere';

// The shared dungeon shell Chapters II–VI used before #46, moved here unchanged from World.tsx.
// Each chapter stub renders it until its own issue (#47–#51) replaces the stub; delete this file when no room imports it.
function Tiles({color}:{color:string}){const mesh=useRef<THREE.InstancedMesh>(null);useEffect(()=>{if(!mesh.current)return;let i=0;const dummy=new THREE.Object3D();for(let x=-7;x<=7;x++)for(let z=-7;z<=7;z++){dummy.position.set(x, -.13+Math.sin(x*23+z)*.012,z);dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix);mesh.current.setColorAt(i,new THREE.Color(color).multiplyScalar(.7+((x*13+z*7+98)%5)*.035));i++;}mesh.current.instanceMatrix.needsUpdate=true;if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;},[color]);return <instancedMesh ref={mesh} args={[undefined,undefined,225]} receiveShadow><boxGeometry args={[.96,.22,.96]}/><meshStandardMaterial roughness={.96}/></instancedMesh>;}
/** Free-standing shell torch, also used by camp markers in World. */
export function Torch({position}:{position:[number,number,number]}){const fire=useRef<THREE.Mesh>(null);useFrame(({clock})=>{if(fire.current)fire.current.scale.set(1+Math.sin(clock.elapsedTime*7+position[0])*.13,1+Math.sin(clock.elapsedTime*11)*.15,1);});return <group position={position}><mesh position={[0,.65,0]}><cylinderGeometry args={[.07,.1,1.3,6]}/><meshStandardMaterial color="#58412b"/></mesh><mesh position={[0,1.22,0]}><cylinderGeometry args={[.19,.12,.15,6]}/><meshStandardMaterial color="#34302a"/></mesh><mesh ref={fire} position={[0,1.55,0]}><coneGeometry args={[.14,.48,5]}/><meshBasicMaterial color="#ffd287"/></mesh><pointLight position={[0,1.8,0]} color="#ffc27b" intensity={12} distance={9} decay={2}/></group>;}
function Shell({scene}:{scene:string}){return <group userData={{blocksLabels:true}}><Tiles color={chapterMood(scene).floor}/>
 <mesh position={[0,-.4,0]} receiveShadow><boxGeometry args={[16,.5,16]}/><meshStandardMaterial color="#1e2626" roughness={1}/></mesh>
 {[-6,-3,3,6].map(x=><group key={x} position={[x,0,-6.5]}><mesh position={[0,1.9,0]} castShadow><boxGeometry args={[.8,3.8,.9]}/><meshStandardMaterial color="#646860" roughness={1}/></mesh><mesh position={[0,3.65,0]}><boxGeometry args={[1.1,.3,1.15]}/><meshStandardMaterial color="#7c7d6e"/></mesh><mesh position={[0,.15,0]}><boxGeometry args={[1.1,.3,1.15]}/><meshStandardMaterial color="#555b56"/></mesh></group>)}
 {[-5,-4,-2,-1,1,2,4,5].map(x=><mesh key={x} position={[x,1.25,-6.7]} receiveShadow castShadow><boxGeometry args={[.98,2.5,.55]}/><meshStandardMaterial color={x%2?'#50574f':'#575d56'} roughness={1}/></mesh>)}
 <mesh position={[0,3.7,-6.6]} castShadow><boxGeometry args={[13.5,.55,.9]}/><meshStandardMaterial color="#636a60"/></mesh>
 <mesh position={[0,1.4,-7]}><planeGeometry args={[1.9,2.8]}/><meshBasicMaterial color="#0c1616"/></mesh>
 {[-1,1].map(s=><group key={s}><mesh position={[s*7.3,.7,-1]} receiveShadow><boxGeometry args={[.5,1.4,12]}/><meshStandardMaterial color="#454e48"/></mesh><Torch position={[s*5.5,0,-4.8]}/><Torch position={[s*6,0,3.8]}/></group>)}
 {Array.from({length:14},(_,i)=><mesh key={i} position={[Math.sin(i*45)*6.5,.1,Math.cos(i*15)*6.4]} rotation={[.1,i,.2]} castShadow><dodecahedronGeometry args={[.12+(i%3)*.06,0]}/><meshStandardMaterial color="#686b5d" roughness={1}/></mesh>)}
 </group>;}
function Crate({position,scale=1}:{position:[number,number,number],scale?:number}){return <group position={position} scale={scale}><mesh position={[0,.45,0]} castShadow receiveShadow><boxGeometry args={[.95,.9,.8]}/><meshStandardMaterial color="#675039" roughness={1}/></mesh>{[-1,1].map(n=><mesh key={n} position={[n*.34,.46,.415]}><boxGeometry args={[.065,.86,.035]}/><meshStandardMaterial color="#a08053"/></mesh>)}<mesh position={[0,.46,.42]} rotation={[0,0,.8]}><boxGeometry args={[.06,1.13,.04]}/><meshStandardMaterial color="#a08053"/></mesh></group>;}
function SetDressing(){return <group>
 {/* Dressing stays outside movement anchors, so it never invents a blocked path. */}
 <Crate position={[-5.8,0,-5.6]}/><Crate position={[-4.7,0,-5.7]} scale={.8}/><Crate position={[-5.7,.9,-5.6]} scale={.7}/>
 {[4.8,5.6].map((x,i)=><group key={x} position={[x,0,-5.5+i*.4]}><mesh position={[0,.45,0]} castShadow><cylinderGeometry args={[.35,.3,.9,10]}/><meshStandardMaterial color="#786344"/></mesh>{[.18,.7].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[.357,.357,.08,10]}/><meshStandardMaterial color="#383d33" metalness={.5}/></mesh>)}</group>)}
 {[-3,3].map(x=><group key={x} position={[x,0,-6.12]}><mesh position={[0,2.5,0]}><boxGeometry args={[.85,1.6,.03]}/><meshStandardMaterial color="#36534a" roughness={1}/></mesh><mesh position={[0,2.5,.025]} rotation={[0,0,Math.PI/4]}><planeGeometry args={[.26,.26]}/><meshStandardMaterial color="#c0a975"/></mesh><mesh position={[0,3.4,0]}><boxGeometry args={[1.08,.055,.06]}/><meshStandardMaterial color="#ae9160" metalness={.5}/></mesh></group>)}
 </group>;}
/** Today's shell for one Chapter II–VI scene: floor, back wall, side rails, torches, crates and banners, the per-chapter props and the chapter atmosphere. */
export default function LegacyShell({scene}:{scene:string}){return <><Shell scene={scene}/><SetDressing/><DungeonDressing scene={scene}/><ChapterAtmosphere scene={scene}/></>;}
