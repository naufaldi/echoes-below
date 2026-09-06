import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {placeLabels,type LabelCandidate} from './label-layout';
type Entry={id:string;text:string;detail?:string;priority:number;error?:boolean;anchor:THREE.Object3D;onSelect:()=>void};
const Registry=createContext<Map<string,Entry>|null>(null);
export function WorldLabel({id,text,detail,priority,position,onSelect,error}:{id:string;text:string;detail?:string;priority:number;error?:boolean;position:[number,number,number];onSelect:()=>void}){
 const registry=useContext(Registry);const anchor=useRef<THREE.Group>(null);
 useEffect(()=>{if(!anchor.current||!registry)return;registry.set(id,{id,text,detail,priority,anchor:anchor.current,onSelect,error});return()=>{registry.delete(id);};},[registry,id,text,detail,priority,onSelect,error]);
 return <group ref={anchor} position={position}/>;
}
function Layer({registry}:{registry:Map<string,Entry>}){
 const {camera,gl,scene,size}=useThree();const [labels,setLabels]=useState<(LabelCandidate&Entry)[]>([]);const [errors,setErrors]=useState<Entry[]>([]);const elapsed=useRef(0);const ray=useRef(new THREE.Raycaster());const scratch=useRef(new THREE.Vector3());
 useFrame((_,dt)=>{elapsed.current+=dt;if(elapsed.current<.08)return;elapsed.current=0;setErrors([...registry.values()].filter(e=>e.error));
  if(document.querySelector('[aria-modal="true"],.modal-backdrop,.ending')){setLabels(old=>old.length?[]:old);return;}
  const canvas=gl.domElement.getBoundingClientRect();const sx=size.width/canvas.width,sy=size.height/canvas.height;
  const blocked=Array.from(document.querySelectorAll('.topbar,.party-panel,.actions-panel,.narration-panel,.chapter-track,.initiative-strip,.scene-heading,.dice-result,.asset-issues')).map(e=>{const b=e.getBoundingClientRect();return{x:(b.x-canvas.x)*sx,y:(b.y-canvas.y)*sy,width:b.width*sx,height:b.height*sy};});
  const candidates:LabelCandidate[]=[];
  for(const entry of registry.values()){
   entry.anchor.getWorldPosition(scratch.current);const world=scratch.current.clone();const p=world.clone().project(camera);if(p.z< -1||p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1)continue;
   const direction=world.clone().sub(camera.position);const distance=direction.length();ray.current.set(camera.position,direction.normalize());ray.current.far=Math.max(0,distance-.15);
   const occluded=ray.current.intersectObjects(scene.children,true).some(hit=>{let node:THREE.Object3D|null=hit.object;while(node){if(node.userData.blocksLabels)return true;node=node.parent;}return false;});if(occluded)continue;
   candidates.push({id:entry.id,x:(p.x+1)*size.width/2,y:(1-p.y)*size.height/2,width:Math.min(188,Math.max(120,entry.text.length*7+24)),height:entry.detail?48:40,priority:entry.priority});
  }
  setLabels(placeLabels(candidates,{x:0,y:0,width:size.width,height:size.height},blocked).map(box=>({...registry.get(box.id)!,...box})));
 });
 return <Html fullscreen style={{pointerEvents:'none'}} zIndexRange={[8,0]}><div className="world-label-layer" style={{width:size.width,height:size.height}}>{errors.length>0&&<aside className="asset-issues" aria-label="Model loading problems" role="status">{errors.map(entry=><button key={entry.id} onClick={entry.onSelect}>{entry.text} · Retry</button>)}</aside>}{labels.map(label=><button key={label.id} className={'managed-world-label '+(label.priority>=80?'important':'')} data-world-label={label.id} style={{left:label.x,top:label.y,width:label.width,height:label.height}} onClick={e=>{e.stopPropagation();label.onSelect();}} title={label.text}><span>{label.text}</span>{label.detail&&<small>{label.detail}</small>}</button>)}</div></Html>;
}
export function WorldLabelProvider({children}:{children:ReactNode}){const registry=useRef(new Map<string,Entry>());return <Registry.Provider value={registry.current}>{children}<Layer registry={registry.current}/></Registry.Provider>;}
