import IsolatedAsset from './IsolatedAsset';
import {chapterOneRoom} from './ChapterAtmosphere';
import {useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';

function LoadedProp({file,position,height=1,rotation=0}:{file:string;position:[number,number,number];height?:number;rotation?:number}){
 const {scene}=useGLTF('/assets/expansion/'+file);
 const {object,scale,offset}=useMemo(()=>{const object=scene.clone(true);object.traverse(n=>{if((n as THREE.Mesh).isMesh){n.castShadow=true;n.receiveShadow=true;}});const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const scale=height/Math.max(size.y,.01);return{object,scale,offset:[-center.x*scale,-box.min.y*scale,-center.z*scale] as [number,number,number]};},[scene,height]);
 return <group userData={{blocksLabels:true}} position={position} rotation={[0,rotation,0]}><group position={offset} scale={scale}><primitive object={object}/></group></group>;
}
export function Prop(props:Parameters<typeof LoadedProp>[0]){return <IsolatedAsset url={'/assets/expansion/'+props.file} id={props.file+props.position.join(',')} name="Scenery" position={[props.position[0],props.position[1]+(props.height??1),props.position[2]]}><LoadedProp {...props}/></IsolatedAsset>;}
export default function DungeonDressing({scene}:{scene:string}){
 if(chapterOneRoom(scene))return null;
 const roots=scene.startsWith('roots'),archive=scene.startsWith('archive'),market=scene.startsWith('market'),choir=scene.startsWith('choir'),final=scene.startsWith('depth');
 return <>
 <Prop file="Arch_Door_MVVMLXOfg1.glb" position={[0,0,-6.1]} height={3.4}/>
 <Prop file="Chest_O72u4Drp8k.glb" position={[4.6,0,.7]} height={.8}/>
 <Prop file="Sword_Wall_Mount_3LyJaWgoJG.glb" position={[-5.2,1.4,-6.2]} height={1.1}/>
 <Prop file="Barrel_ONdghDBByN.glb" position={[-4.8,0,.8]} height={1}/>
 <Prop file="Crate_SfJtdV8GDr.glb" position={[-4.9,0,2]} height={.7}/>
 <Prop file="Cobweb_EHYNWew6JK.glb" position={[-6.4,2,-6.1]} height={1.2}/>
 {roots?<>
  <Prop file="Bed_Twin1.gltf" position={[-6.1,0,2]} height={.7} rotation={Math.PI/2}/>
  <Prop file="Cage_Small.gltf" position={[6.2,0,-3.2]} height={2.1}/>
  <Prop file="Bucket_83obI9bNun.glb" position={[6.2,0,3.4]} height={.4}/>
  <Prop file="Chain_Coil.gltf" position={[3.9,0,1.1]} height={.2}/>
  <Prop file="Chair_zMmKNm8w4a.glb" position={[-6.1,0,.3]} height={1}/>
  {[-6.2,6.2].map(x=><group key={x}>{[-3,-3.5,-4,-4.5,-5].map(z=><mesh key={z} position={[x,1.2,z]} castShadow><cylinderGeometry args={[.035,.035,2.4,6]}/><meshStandardMaterial color="#555f58" metalness={.7}/></mesh>)}<mesh position={[x,2.3,-4]}><boxGeometry args={[.08,.08,2.3]}/><meshStandardMaterial color="#555f58"/></mesh></group>)}
 </>:archive?<>{[-6.1,6.1].map(x=><Prop key={x} file="Bookcase_2.gltf" position={[x,0,-2]} height={2.8}/>) }<Prop file="Table_Big_KWaAZIDK9F.glb" position={[6.2,0,2]} height={.8}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,.008,-4.7]}><planeGeometry args={[10,2]}/><meshStandardMaterial color="#26566b" transparent opacity={.65} metalness={.5} roughness={.15}/></mesh></>:market?<><Prop file="Workbench.gltf" position={[-6.2,0,-2]} height={1.1}/><Prop file="Table_Big_KWaAZIDK9F.glb" position={[6.2,0,-2]} height={.9}/><Prop file="Coin_Piles_9OWkKczINo.glb" position={[6.2,.9,-2]} height={.18}/><Prop file="Cauldron.gltf" position={[-6.2,0,3]} height={.8}/></>:choir||final?<><Prop file="Horse_Statue_AK9CmjFnL6.glb" position={[-6.2,0,-3]} height={2.5}/><Prop file="Pedestal_wUeoDKnFBF.glb" position={[6.2,0,-2]} height={1.4}/><pointLight position={[0,2,-4]} color={final?'#dc6a38':'#71cadd'} intensity={14} distance={10}/></>:<><Prop file="Small_Table_rAEBvfb1FT.glb" position={[4.5,0,-2.5]} height={.8}/><Prop file="Chair_zMmKNm8w4a.glb" position={[4.4,0,-1.5]} height={1}/></>}
 </>;
}
