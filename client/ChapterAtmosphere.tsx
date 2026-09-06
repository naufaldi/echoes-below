import * as THREE from 'three';
import {useMemo} from 'react';
export function chapterMood(scene:string){
 if(scene.startsWith('archive'))return{kind:'archive',background:'#102732',ambient:'#a4cad4',sun:'#d1e5dd',floor:'#657e83'};
 if(scene.startsWith('market'))return{kind:'market',background:'#2c1916',ambient:'#dbc19a',sun:'#ffd0a0',floor:'#85725e'};
 if(scene.startsWith('roots'))return{kind:'roots',background:'#142518',ambient:'#afc795',sun:'#e4dcac',floor:'#62735c'};
 if(scene.startsWith('choir'))return{kind:'choir',background:'#181d36',ambient:'#b5c5e8',sun:'#e4deff',floor:'#76778d'};
 if(scene.startsWith('depth'))return{kind:'depth',background:'#201322',ambient:'#b5accb',sun:'#f2b397',floor:'#685d70'};
 return{kind:'relay',background:'#141c1a',ambient:'#a5b8a8',sun:'#ffe2ad',floor:'#777766'};
}
function Root({side,offset}:{side:number;offset:number}){
 const path=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(side*6.8,0,offset+1),new THREE.Vector3(side*6.5,1,offset),new THREE.Vector3(side*6.3,2.5,offset-.4),new THREE.Vector3(side*6.6,4,offset-1)]),[side,offset]);
 return <mesh castShadow><tubeGeometry args={[path,12,.23,5,false]}/><meshStandardMaterial color="#534632" roughness={1}/></mesh>;
}
// Solid chapter landmarks live beyond the nine-cell tactical footprint (±4.8).
// Thin floor marks are decorative and do not pretend to block traversal.
export default function ChapterAtmosphere({scene}:{scene:string}){
 const {kind}=chapterMood(scene);const variant=Number(scene.split('-')[1]??1);
 return <group userData={{blocksLabels:true}}>
 {kind==='archive'&&<>
  {[-1,1].map(side=><group key={side}>
   <mesh position={[side*6.6,.025,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.3,12.8]}/><meshStandardMaterial color="#236c80" metalness={.6} roughness={.2} transparent opacity={.8}/></mesh>
   {[-4,-1,2,4].map(z=><mesh key={z} position={[side*5.8,.2,z]}><boxGeometry args={[.16,.45,1.1]}/><meshStandardMaterial color="#526973"/></mesh>)}
  </group>)}
  <group position={[-6.55,.15,1]}><mesh scale={[.55,.23,1.5]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#795936"/></mesh>{[-.7,0,.7].map(z=><mesh key={z} position={[0,.2,z]}><boxGeometry args={[.85,.08,.16]}/><meshStandardMaterial color="#b59a68"/></mesh>)}</group>
  {[-1,1].map(side=><group key={side} position={[side*5.8,0,-5.8]}>{Array.from({length:variant%3+4},(_,i)=><mesh key={i} position={[i*.12-.3,.35+i%2*.15,0]} rotation={[0,0,side*.12]}><cylinderGeometry args={[.025,.04,.7+i%2*.3,4]}/><meshStandardMaterial color="#559a83"/></mesh>)}</group>)}
 </>}
 {kind==='market'&&<>
  {[-1,1].map(side=><group key={side} position={[side*6.2,0,0]}>
   {[-2,2].map(z=><mesh key={z} position={[0,1.35,z]} castShadow><boxGeometry args={[.12,2.7,.12]}/><meshStandardMaterial color="#64503c"/></mesh>)}
   <mesh position={[0,2.6,0]} rotation={[0,0,side*.12]} castShadow><boxGeometry args={[1.5,.09,4.5]}/><meshStandardMaterial color={side===1?'#a64c39':'#c39746'}/></mesh>
   {[-1.4,0,1.4].map(z=><mesh key={z} position={[0,.55,z]}><boxGeometry args={[.8,1,.9]}/><meshStandardMaterial color="#775634"/></mesh>)}
  </group>)}
  <group position={[0,0,-5.9]}><mesh position={[0,.65,0]}><cylinderGeometry args={[.75,1,1.3,8]}/><meshStandardMaterial color="#513e37"/></mesh><mesh position={[0,1.4,0]}><coneGeometry args={[.5,.9,6]}/><meshBasicMaterial color="#ff9b46"/></mesh><pointLight position={[0,2,0]} color="#ff8e41" intensity={10} distance={7}/></group>
 </>}
 {kind==='roots'&&<>
  {[-1,1].flatMap(side=>[-4,0,4].map(offset=><Root key={side+':'+offset} side={side} offset={offset}/>))}
  {[-5.7,5.7].map(x=><group key={x} position={[x,.05,-5.7]}>{[0,1,2].map(i=><mesh key={i} position={[i*.18-.2,.2+i*.08,0]}><sphereGeometry args={[.25,6,4]}/><meshStandardMaterial color={i===1?'#bc9b62':'#728049'}/></mesh>)}</group>)}
 </>}
 {kind==='choir'&&<>
  {[-1,1].flatMap(side=>Array.from({length:7},(_,i)=><group key={side+':'+i} position={[side*(2+i*.55),0,-5.9]}><mesh position={[0,1.1+i*.14,0]} castShadow><cylinderGeometry args={[.14,.14,2.2+i*.28,8]}/><meshStandardMaterial color="#849da7" metalness={.65} roughness={.3}/></mesh><mesh position={[0,2.3+i*.28,0]}><torusGeometry args={[.16,.035,5,12]}/><meshStandardMaterial color="#ccbb88" metalness={.6}/></mesh></group>))}
  <mesh position={[0,.018,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[3.8,3.84,48]}/><meshBasicMaterial color="#829ecc" transparent opacity={.5}/></mesh>
 </>}
 {kind==='depth'&&<group position={[0,2.1,-5.9]}>
  {[1.1,1.6,2].map((r,i)=><mesh key={r} rotation={[0,.2*i,.3*i]} castShadow><torusGeometry args={[r,.12,6,18]}/><meshStandardMaterial color={i===1?'#99815f':'#55465e'} metalness={.7} roughness={.35}/></mesh>)}
  <mesh><octahedronGeometry args={[.65]}/><meshStandardMaterial color="#da806c" emissive="#a72d30" emissiveIntensity={1.3}/></mesh><pointLight color="#c674be" intensity={12} distance={9}/>
 </group>}
 </group>;
}
