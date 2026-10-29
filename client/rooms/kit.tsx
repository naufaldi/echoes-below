import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import IsolatedAsset from '../IsolatedAsset';
import type {Mood} from '../ChapterAtmosphere';
import {encounterTerrain} from '../../shared/encounter-terrain';
import type {Cell,TacticalGrid} from '../../shared/tactical-grid';
import {rand,type Part} from './parts';
export type {Part} from './parts';
export {rand} from './parts';
import type {PublicSave} from '../../shared/types';

// Shared building blocks for every room file (Chapter I and client/rooms/<Chapter>.tsx). Contract and budget: ./README.md.
export type Vec3=[number,number,number];
/** What World passes every room. `save` is null only on the creation screen, which shows Chapter I's approach. */
export type RoomCtx=Pick<RoomProps,'save'|'scene'>;
export type RoomProps={scene:string;save:PublicSave|null;reduced:boolean};
/** Partial override merged over chapterMood(scene): background, fog, ambient and sun. */
export type MoodOverride=Partial<Omit<Mood,'kind'>>;

export const smooth=THREE.MathUtils.smoothstep;
// Materials are shared by key, so rooms never pay for duplicate shader programs or per-mesh material uploads.
const materials=new Map<string,THREE.Material>();
export function mat(color:string,roughness=.95,metalness=0,flat=false){const key=[color,roughness,metalness,flat].join();let m=materials.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,roughness,metalness,flatShading:flat});materials.set(key,m);}return m;}
export function decal(color:string,opacity=1){const key='decal'+color+opacity;let m=materials.get(key);if(!m){m=new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});materials.set(key,m);}return m;}
export const geo={box:new THREE.BoxGeometry(1,1,1),rock:new THREE.DodecahedronGeometry(1,0),cyl:new THREE.CylinderGeometry(1,1,1,8),cone:new THREE.ConeGeometry(1,1,7),tent:new THREE.ConeGeometry(1,1,4),link:new THREE.TorusGeometry(.16,.045,5,10),disc:new THREE.CircleGeometry(1,16).rotateX(-Math.PI/2),bell:new THREE.CylinderGeometry(.55,.95,1.3,12,1,true),flame:new THREE.ConeGeometry(.2,.55,5)};
export const noRaycast=()=>{};

/** One draw call per list: walls, rocks, slabs and chain links are instanced, not separate meshes. */
export function Instances({parts,geometry=geo.box,color,jitter=.12,roughness=.95,metalness=0,flat=false,shadow=true,material}:{parts:Part[];geometry?:THREE.BufferGeometry;color:string;jitter?:number;roughness?:number;metalness?:number;flat?:boolean;shadow?:boolean;material?:THREE.Material}){
 const mesh=useMemo(()=>{const m=new THREE.InstancedMesh(geometry,material??mat('#ffffff',roughness,metalness,flat),parts.length);const o=new THREE.Object3D(),c=new THREE.Color();
  parts.forEach(([x,y,z,sx,sy,sz,ry=0,rx=0,rz=0],i)=>{o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(sx,sy,sz);o.updateMatrix();m.setMatrixAt(i,o.matrix);if(!material)m.setColorAt(i,c.set(color).multiplyScalar(1-jitter/2+rand(i+x*3.1+z*7.7)*jitter));});
  m.castShadow=shadow;m.receiveShadow=true;m.computeBoundingSphere();if(!shadow)m.raycast=noRaycast;return m;},[parts,geometry,color,jitter,roughness,metalness,flat,shadow,material]);
 useEffect(()=>()=>{mesh.dispose();},[mesh]);return <primitive object={mesh}/>;
}
export function chain(x:number,z:number,from:number,to:number):Part[]{return Array.from({length:Math.floor((to-from)/.3)},(_,i)=>[x,from+i*.3,z,1,1,1,i%2?Math.PI/2:0]);}
export function Flame({position,size=1,reduced}:{position:Vec3;size?:number;reduced:boolean}){const fire=useRef<THREE.Mesh>(null);useFrame(({clock})=>{if(fire.current&&!reduced)fire.current.scale.set(size*(1+Math.sin(clock.elapsedTime*7+position[0])*.13),size*(1+Math.sin(clock.elapsedTime*11+position[2])*.15),size);});return <mesh ref={fire} position={position} scale={size} geometry={geo.flame} raycast={noRaycast}><meshBasicMaterial color="#ffc070"/></mesh>;}
export function WallTorch({position,reduced,color='#ffb46b'}:{position:Vec3;reduced:boolean;color?:string}){return <><Prop file="Torch_Gq38E7hFZw.glb" position={position} height={1.3}/><Flame position={[position[0],position[1]+1.45,position[2]]} size={.6} reduced={reduced}/><pointLight position={[position[0],position[1]+1.9,position[2]]} color={color} intensity={10} distance={8} decay={2}/></>;}

// ── Models: useGLTF caches each file once; placements clone the scene graph and share its geometry, materials and textures. ──
type ModelProps={url:string;position:Vec3;height?:number;scale?:number;rotation?:number};
function LoadedModel({url,position,height,scale=1,rotation=0}:ModelProps){
 const {scene}=useGLTF(url);
 const {object,size,offset}=useMemo(()=>{const object=scene.clone(true);object.traverse(n=>{if((n as THREE.Mesh).isMesh){n.castShadow=true;n.receiveShadow=true;}});if(height===undefined)return{object,size:scale,offset:[0,0,0] as Vec3};const box=new THREE.Box3().setFromObject(object),bounds=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const size=height/Math.max(bounds.y,.01);return{object,size,offset:[-center.x*size,-box.min.y*size,-center.z*size] as Vec3};},[scene,height,scale]);
 return <group userData={{blocksLabels:true}} position={position} rotation={[0,rotation,0]}><group position={offset} scale={size}><primitive object={object}/></group></group>;
}
/** One placed model. With `height` it is centred on x/z, rests on y=0 and is scaled to that height; without it the kit's own pivot and `scale` are kept, so modular walls and floors tile on their native grid. Write `url` as a full '/assets/env/<kit>/<file>' literal: the asset gate scans for it. */
export function Model(props:ModelProps){return <IsolatedAsset url={props.url} id={props.url+props.position.join(',')} name="Scenery" position={[props.position[0],props.position[1]+(props.height??1),props.position[2]]}><LoadedModel {...props}/></IsolatedAsset>;}
/** Quaternius props already in public/assets/expansion, by bare file name. */
export function Prop({file,height=1,...props}:Omit<ModelProps,'url'|'scale'>&{file:string}){return <IsolatedAsset url={'/assets/expansion/'+file} id={file+props.position.join(',')} name="Scenery" position={[props.position[0],props.position[1]+height,props.position[2]]}><LoadedModel url={'/assets/expansion/'+file} height={height} {...props}/></IsolatedAsset>;}

function LoadedKitInstances({url,parts,shadow=true,material}:{url:string;parts:Part[];shadow?:boolean;material?:THREE.Material}){
 const {scene}=useGLTF(url);
 const meshes=useMemo(()=>{scene.updateMatrixWorld(true);const list:THREE.InstancedMesh[]=[],o=new THREE.Object3D(),m=new THREE.Matrix4();
  scene.traverse(n=>{const mesh=n as THREE.Mesh;if(!mesh.isMesh)return;const inst=new THREE.InstancedMesh(mesh.geometry,material??mesh.material,parts.length);
   parts.forEach(([x,y,z,sx,sy,sz,ry=0,rx=0,rz=0],i)=>{o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(sx,sy,sz);o.updateMatrix();inst.setMatrixAt(i,m.multiplyMatrices(o.matrix,mesh.matrixWorld));});
   inst.castShadow=shadow;inst.receiveShadow=true;inst.computeBoundingSphere();if(!shadow)inst.raycast=noRaycast;list.push(inst);});
  return list;},[scene,parts,shadow,material]);
 // InstancedMesh.dispose frees only instance buffers; the cached glTF geometry stays shared.
 useEffect(()=>()=>meshes.forEach(m=>m.dispose()),[meshes]);
 return <>{meshes.map((m,i)=><primitive key={i} object={m}/>)}</>;
}
/** Repeat one kit model at many placements for one draw call per mesh in the file (plus its shadow pass), instead of one per copy. Parts use the kit's native pivot and size: [x,y,z,sx,sy,sz,ry,rx,rz]. Keep `parts` stable (module constant or useMemo); wrap solid lists in <group userData={{blocksLabels:true}}> like Instances. */
export function KitInstances(props:{url:string;parts:Part[];shadow?:boolean;material?:THREE.Material}){if(!props.parts.length)return null;const [x,y,z]=props.parts[0];return <IsolatedAsset url={props.url} id={'instances:'+props.url} name="Scenery" position={[x,y+1,z]}><LoadedKitInstances {...props}/></IsolatedAsset>;}

// ── Placement: keep solid dressing off tiles the party can stand on and away from interactables. ──
export const CELL=1.2;
/** Tactical cell [x,y] → world; cell [4,4] is the room centre. Same mapping as TacticalTerrain and TacticalOverlay. */
export const cellToWorld=([x,y]:Cell,h=0):Vec3=>[(x-4)*CELL,h,-(y-4)*CELL];
export const worldToCell=(x:number,z:number):Cell=>[Math.round(x/CELL+4),Math.round(-z/CELL+4)];
/** Server entity or actor position [x,y] → world [x,elevation,-y]. Interactables, labels and actors stay on these anchors. */
export const entityToWorld=(e:{position:[number,number];elevation?:number}):Vec3=>[e.position[0],e.elevation??0,-e.position[1]];
/** The room's 9×9 tactical grid: the saved grid during Curated combat, otherwise this scene's authored encounter terrain, which is what combat will load. */
export function roomGrid(save:PublicSave|null,scene:string):TacticalGrid{return save?.mode==='combat'&&save.tactical?save.tactical.grid:encounterTerrain(scene);}
/** Cells a creature can stand on. Echo Rules has no grid and lets creatures cross the whole footprint, so there every cell counts as walkable. */
export function walkableCells(save:PublicSave|null,scene:string):Cell[]{const grid=roomGrid(save,scene),echo=!!save&&!save.tactical,blocked=new Set(echo?[]:grid.blocked.map(c=>c.join()));const cells:Cell[]=[];for(let x=0;x<grid.width;x++)for(let y=0;y<grid.height;y++)if(!blocked.has(x+','+y))cells.push([x,y]);return cells;}
/** True when a solid footprint of `radius` metres at world (x,z) overlaps no walkable cell and no interactable marker. Blocked Curated cells and everything beyond ±5.4 m are free for dressing. */
export function clearOfPlay(save:PublicSave|null,scene:string,x:number,z:number,radius=.5){
 return clearOfCells(save,walkableCells(save,scene),x,z,radius);
}
function clearOfCells(save:PublicSave|null,cells:Cell[],x:number,z:number,radius:number){
 const half=CELL/2,hit=cells.some(c=>{const [cx,,cz]=cellToWorld(c),dx=Math.max(Math.abs(x-cx)-half,0),dz=Math.max(Math.abs(z-cz)-half,0);return dx*dx+dz*dz<radius*radius;});
 return !hit&&!(save?.scene.entities??[]).some(e=>{const [ex,,ez]=entityToWorld(e);return Math.hypot(x-ex,z-ez)<radius+.7;});
}
/** Filter a solid Part list to the parts clear of play, memoised per room layout so instanced meshes are not rebuilt every render. Default footprint: half the larger of sx/sz (unit-box parts); pass `radius` for models. Dropped parts are logged in development. */
export function useSolidParts(save:PublicSave|null,scene:string,parts:Part[],radius?:(p:Part)=>number):Part[]{
 const grid=roomGrid(save,scene),key=JSON.stringify([scene,!!save&&!save.tactical,grid.blocked,save?.scene.entities.map(e=>[e.id,...e.position])]);
 return useMemo(()=>{const cells=walkableCells(save,scene),kept=parts.filter(p=>clearOfCells(save,cells,p[0],p[2],radius?radius(p):Math.max(p[3],p[5])/2));if(import.meta.env.DEV&&kept.length<parts.length)console.warn(`[rooms] ${scene}: ${parts.length-kept.length} solid part(s) dropped from walkable tiles`);return kept;},[key,parts]);
}

export const cached=<M extends THREE.Material>(key:string,make:()=>M):M=>{let m=materials.get(key);if(!m)materials.set(key,m=make());return m as M;};
const colormaps=new Map<string,THREE.Texture>();
export function mapTint(url:string,tint:string,roughness:number){return cached(JSON.stringify(['mapTint',url,tint,roughness]),()=>{let map=colormaps.get(url);if(!map){map=Object.assign(new THREE.TextureLoader().load(url),{flipY:false,colorSpace:THREE.SRGBColorSpace});colormaps.set(url,map);}return new THREE.MeshStandardMaterial({map,color:tint,roughness});});}
function TintedInstances({url,parts,tint,shadow}:{url:string;parts:Part[];tint:string;shadow?:boolean}){
 const {scene}=useGLTF(url),material=cached('kay'+url+tint,()=>{let base:THREE.Material|undefined;scene.traverse(n=>{const mesh=n as THREE.Mesh;if(mesh.isMesh&&!base)base=mesh.material as THREE.Material;});const m=(base as THREE.MeshStandardMaterial).clone();m.color.set(tint);return m;});
 return <KitInstances url={url} parts={parts} shadow={shadow} material={material}/>;
}
export function TintedKit({url,parts,tint,shadow}:{url:string;parts:Part[];tint:string;shadow?:boolean}){if(!parts.length)return null;const [x,y,z]=parts[0];return <IsolatedAsset url={url} id={'tinted:'+url+tint} name="Scenery" position={[x,y+1,z]}><TintedInstances url={url} parts={parts} tint={tint} shadow={shadow}/></IsolatedAsset>;}
export function Solid({ctx,parts,radius,...rest}:{ctx:RoomCtx;parts:Part[];radius:((p:Part)=>number)|undefined}&Omit<Parameters<typeof Instances>[0],'parts'>){const kept=useSolidParts(ctx.save,ctx.scene,parts,radius);return kept.length?<Instances parts={kept} {...rest}/>:null;}
export function SolidKit({ctx,parts,radius,tint,...rest}:{ctx:RoomCtx;parts:Part[];radius:((p:Part)=>number)|undefined;tint?:string}&Omit<Parameters<typeof KitInstances>[0],'parts'>){const kept=useSolidParts(ctx.save,ctx.scene,parts,radius);return tint?<TintedKit parts={kept} tint={tint} {...rest}/>:<KitInstances parts={kept} {...rest}/>;}
export function Light({position,color,intensity=8,distance=8}:{position:Vec3;color:string;intensity?:number;distance?:number}){return <pointLight position={position} color={color} intensity={intensity} distance={distance} decay={2}/>;}
