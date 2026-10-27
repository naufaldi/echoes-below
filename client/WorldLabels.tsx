import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {focusPriority,placeLabels,type LabelCandidate,type PlacedLabel,type Rect} from './label-layout';
type Entry={id:string;text:string;detail?:string;priority:number;error?:boolean;actor?:boolean;anchor:THREE.Object3D;onSelect:()=>void};
let labelFont:{text:string;detail:string}|null=null;let measureContext:CanvasRenderingContext2D|null=null;
/** Pill size from the label's own font tokens, so overlap avoidance reserves what is actually drawn. */
function pillSize(text:string,detail:string|undefined,important:boolean){
 if(!labelFont){const css=getComputedStyle(document.documentElement),family=css.getPropertyValue('--font-ui');labelFont={text:`500 ${css.getPropertyValue('--fs-sm')} ${family}`,detail:`400 ${css.getPropertyValue('--fs-xs')} ${family}`};}
 measureContext??=document.createElement('canvas').getContext('2d');const measure=(value:string,font:string)=>{if(!measureContext)return value.length*7.5;measureContext.font=font;return measureContext.measureText(value).width;};
 const content=Math.max(measure(text,labelFont.text),detail?measure(detail,labelFont.detail):0)+26,max=important?240:200,lines=important&&content>max?2:1;
 return {width:Math.ceil(Math.min(max,Math.max(44,content))),height:8+lines*16+(detail?14:0)};
}
const Registry=createContext<Map<string,Entry>|null>(null);
type Silhouette={anchor:THREE.Object3D;radius:number;height:number};
const Silhouettes=createContext<Map<string,Silhouette>|null>(null);
/** A conservative body volume, independent of the current animation pose. */
export function WorldLabelSilhouette({id,radius,height}:{id:string;radius:number;height:number}){
 const registry=useContext(Silhouettes);const anchor=useRef<THREE.Group>(null);
 useEffect(()=>{if(!registry||!anchor.current)return;registry.set(id,{anchor:anchor.current,radius,height});return()=>{registry.delete(id);};},[registry,id,radius,height]);
 return <group ref={anchor}/>;
}
export function WorldLabel({id,text,detail,priority,position,onSelect,error,actor}:{id:string;text:string;detail?:string;priority:number;error?:boolean;actor?:boolean;position:[number,number,number];onSelect:()=>void}){
 const registry=useContext(Registry);const anchor=useRef<THREE.Group>(null);
 useEffect(()=>{if(!anchor.current||!registry)return;registry.set(id,{id,text,detail,priority,anchor:anchor.current,onSelect,error,actor});return()=>{registry.delete(id);};},[registry,id,text,detail,priority,onSelect,error,actor]);
 return <group ref={anchor} position={position}/>;
}
/** drei places a fullscreen Html at its projected world origin; pin it to the canvas centre so the layer's top-left is the canvas's, the space labels are laid out in. */
const pinToCanvas=(_:THREE.Object3D,__:THREE.Camera,size:{width:number;height:number})=>[size.width/2,size.height/2];
/** `muteActors` fades actor labels out while a playback beat reveals, so the die and damage floaters above the actors are never covered. */
function Layer({registry,muteActors}:{registry:Map<string,Entry>;muteActors:boolean}){
 const silhouettes=useContext(Silhouettes);const {camera,gl,scene,size}=useThree();const [labels,setLabels]=useState<(PlacedLabel&Entry)[]>([]);const [errors,setErrors]=useState<Entry[]>([]);const elapsed=useRef(0);const ray=useRef(new THREE.Raycaster());const scratch=useRef(new THREE.Vector3());
 useFrame((_,dt)=>{elapsed.current+=dt;if(elapsed.current<.08)return;elapsed.current=0;setErrors([...registry.values()].filter(e=>e.error));
  if(document.querySelector('[aria-modal="true"],.modal-backdrop,.ending')){setLabels(old=>old.length?[]:old);return;}
  const canvas=gl.domElement.getBoundingClientRect();const sx=size.width/canvas.width,sy=size.height/canvas.height;
  const blocked=Array.from(document.querySelectorAll('.topbar,.party-panel,.actions-panel,.narration-panel,.chapter-track,.initiative-strip,.scene-heading,.asset-issues')).map(e=>{const b=e.getBoundingClientRect();return{x:(b.x-canvas.x)*sx,y:(b.y-canvas.y)*sy,width:b.width*sx,height:b.height*sy};});
  const bodies:Rect[]=[];
  for(const body of silhouettes?.values()??[]){
   body.anchor.updateWorldMatrix(true,false);
   const points:THREE.Vector3[]=[];
   for(const x of [-body.radius,body.radius])for(const y of [0,body.height])for(const z of [-body.radius,body.radius])points.push(new THREE.Vector3(x,y,z).applyMatrix4(body.anchor.matrixWorld).project(camera));
   if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.z< -1||p.z>1))continue;
   const left=Math.min(...points.map(p=>(p.x+1)*size.width/2)),right=Math.max(...points.map(p=>(p.x+1)*size.width/2));
   const top=Math.min(...points.map(p=>(1-p.y)*size.height/2)),bottom=Math.max(...points.map(p=>(1-p.y)*size.height/2));
   bodies.push({x:left,y:top,width:right-left,height:bottom-top});
  }
  const candidates:LabelCandidate[]=[];
  for(const entry of registry.values()){
   entry.anchor.getWorldPosition(scratch.current);const world=scratch.current.clone();const p=world.clone().project(camera);if(p.z< -1||p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1)continue;
   const direction=world.clone().sub(camera.position);const distance=direction.length();ray.current.set(camera.position,direction.normalize());ray.current.far=Math.max(0,distance-.15);
   const occluded=ray.current.intersectObjects(scene.children,true).some(hit=>{let node:THREE.Object3D|null=hit.object;while(node){if(node.userData.blocksLabels)return true;node=node.parent;}return false;});if(occluded)continue;
   candidates.push({id:entry.id,x:(p.x+1)*size.width/2,y:(1-p.y)*size.height/2,...pillSize(entry.text,entry.detail,entry.priority>=80),priority:entry.priority});
  }
  setLabels(placeLabels(candidates,{x:0,y:0,width:size.width,height:size.height},blocked,bodies).map(box=>({...registry.get(box.id)!,...box})));
 });
 return <Html fullscreen calculatePosition={pinToCanvas} style={{pointerEvents:'none'}} zIndexRange={[8,0]}><div className="world-label-layer" style={{width:size.width,height:size.height}}>{errors.length>0&&<aside className="asset-issues" aria-label="Model loading problems" role="status">{errors.map(entry=><button key={entry.id} onClick={entry.onSelect}>{entry.text} · Retry</button>)}</aside>}<svg className="world-label-leaders" width={size.width} height={size.height} aria-hidden="true">{labels.map(label=>{const x=Math.max(label.x,Math.min(label.x+label.width,label.anchorX)),y=Math.max(label.y,Math.min(label.y+label.height,label.anchorY));return label.offset&&!(muteActors&&label.actor)?<g key={label.id}><line x1={label.anchorX} y1={label.anchorY} x2={x} y2={y}/><circle cx={label.anchorX} cy={label.anchorY} r={2}/></g>:null;})}</svg>{labels.map(label=>{const muted=muteActors&&!!label.actor;return <button key={label.id} className={'managed-world-label'+(label.priority>=80?' important':'')+(label.priority<focusPriority?' dim':'')+(muted?' muted':'')} data-world-label={label.id} style={{left:label.x,top:label.y,width:label.width,height:label.height}} tabIndex={muted?-1:undefined} aria-hidden={muted||undefined} onClick={e=>{e.stopPropagation();label.onSelect();}} title={label.text}><span>{label.text}</span>{label.detail&&<small>{label.detail}</small>}</button>;})}</div></Html>;
}
export function WorldLabelProvider({children,muteActors=false}:{children:ReactNode;muteActors?:boolean}){const registry=useRef(new Map<string,Entry>());const bodies=useRef(new Map<string,Silhouette>());return <Registry.Provider value={registry.current}><Silhouettes.Provider value={bodies.current}>{children}<Layer registry={registry.current} muteActors={muteActors}/></Silhouettes.Provider></Registry.Provider>;}
