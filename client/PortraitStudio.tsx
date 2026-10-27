import {Component,Suspense,useEffect,useMemo,useRef,useSyncExternalStore,type ReactNode} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {animationClip} from '../shared/animation-cues';
import {expressionClip} from './portrait-look';
import {dressCharacter,raceBreadth} from './character-dress';
import {subscribePortraits,nextPortraitJob,finishPortrait,followNeutral,type PortraitJob,type PortraitTiming} from './portrait-store';
/** CHARACTERS.md §6.1 framing. SIDE −1 puts the camera at the character's right, so a +Z-facing model turns toward the right of the frame, into the story box (§6.2). */
export const PORTRAIT_SIZE=512;const SIDE=-1,YAW=20*Math.PI/180,PITCH=8*Math.PI/180,FOV=30,HEAD_SHARE=.45,EYE_FROM_TOP=.4,HEAD_MAX=.4,EYES_UP_HEAD=.5;
let readback:'async'|'sync'='async';
/** Developer comparison only: a synchronous readback includes the GPU wait in the measured time. */
export const setPortraitReadback=(mode:'async'|'sync')=>{readback=mode;};
type Studio={scene:THREE.Scene;stage:THREE.Group;camera:THREE.PerspectiveCamera;source:THREE.WebGLRenderTarget;target:THREE.WebGLRenderTarget;output:OutputPass;pixels:Uint8Array};
/** Neutral three-point light, independent of the room mood; nothing casts shadows. */
function createStudio():Studio{
 const scene=new THREE.Scene(),stage=new THREE.Group();scene.add(stage);
 const key=new THREE.DirectionalLight('#fff4e6',2.6);key.position.set(SIDE*2.5,3,3.5);const fill=new THREE.DirectionalLight('#e6eeff',.9);fill.position.set(-SIDE*3,1,2.5);const rim=new THREE.DirectionalLight('#ffffff',1.8);rim.position.set(-SIDE*1.5,2.5,-3.5);
 scene.add(key,fill,rim,new THREE.HemisphereLight('#f2f0ea','#4a463f',1.1));
 const source=new THREE.WebGLRenderTarget(PORTRAIT_SIZE,PORTRAIT_SIZE,{type:THREE.HalfFloatType,samples:4});
 const target=new THREE.WebGLRenderTarget(PORTRAIT_SIZE,PORTRAIT_SIZE,{type:THREE.UnsignedByteType,depthBuffer:false});
 // Multisampled edges come back premultiplied against the transparent clear; un-premultiply before tone mapping so the PNG has clean straight alpha.
 const output=new OutputPass();output.clear=true;output.material.fragmentShader=output.material.fragmentShader.replace('gl_FragColor = texture2D( tDiffuse, vUv );','gl_FragColor = texture2D( tDiffuse, vUv ); if ( gl_FragColor.a > 0.0 ) gl_FragColor.rgb /= gl_FragColor.a;');
 return {scene,stage,camera:new THREE.PerspectiveCamera(FOV,1,.01,100),source,target,output,pixels:new Uint8Array(PORTRAIT_SIZE*PORTRAIT_SIZE*4)};
}
/** Bounds of everything that moves with the head: skinned vertices weighted mostly to the head bone or its children, and meshes attached under it. */
function headBounds(model:THREE.Object3D,head:THREE.Object3D){
 const box=new THREE.Box3(),inHead=new Set<THREE.Object3D>();head.traverse(n=>inHead.add(n));const v=new THREE.Vector3();
 model.traverseVisible(n=>{const mesh=n as THREE.SkinnedMesh;if(!mesh.isMesh)return;
  if(inHead.has(mesh)){box.expandByObject(mesh,false);return;}if(!mesh.isSkinnedMesh)return;
  const joints=mesh.skeleton.bones.map(b=>inHead.has(b)),index=mesh.geometry.getAttribute('skinIndex'),weight=mesh.geometry.getAttribute('skinWeight'),count=mesh.geometry.getAttribute('position').count;
  for(let i=0;i<count;i++){let w=0;for(let k=0;k<4;k++)if(joints[index.getComponent(i,k)])w+=weight.getComponent(i,k);if(w>.5){mesh.getVertexPosition(i,v);box.expandByPoint(v.applyMatrix4(mesh.matrixWorld));}}
 });return box;
}
const findHead=(root:THREE.Object3D)=>{let head:THREE.Object3D|undefined;root.traverse(n=>{if(!head&&/^head$/i.test(n.name))head=n;});return head;};
/** Poses the dressed model (first frame of the expression's clip, else Idle), then aims the camera so the head fills ~45% of the frame with the eyes ~40% from the top. */
function stageModel(studio:Studio,gltf:{scene:THREE.Object3D;animations:THREE.AnimationClip[]},job:PortraitJob){
 const {subject}=job,names=gltf.animations.map(c=>c.name);const pose=expressionClip(names,job.expression)??(job.expression==='neutral'?animationClip(names,'idle',subject):undefined);
 const model=dressCharacter(gltf.scene,subject);model.traverse(n=>{n.frustumCulled=false;if((n as THREE.Mesh).isMesh){(n as THREE.Mesh).castShadow=false;(n as THREE.Mesh).receiveShadow=false;}});
 const holder=new THREE.Group();holder.scale.set(raceBreadth(subject.raceId),1,1);holder.add(model);studio.stage.add(holder);
 const mixer=new THREE.AnimationMixer(model);const clip=gltf.animations.find(c=>c.name===pose);if(clip){mixer.clipAction(clip).play();mixer.update(0);}
 holder.updateMatrixWorld(true);const bounds=new THREE.Box3();model.traverseVisible(n=>{const mesh=n as THREE.SkinnedMesh;if(!mesh.isMesh)return;if(mesh.isSkinnedMesh)(mesh as {boundingBox:THREE.Box3|null}).boundingBox=null;bounds.expandByObject(mesh,false);});const height=Math.max(.001,bounds.max.y-bounds.min.y);
 // Head size comes from what moves with the head bone, capped at 40% of the model so a tall hat or a blob-shaped creature cannot push the face out of frame. Eyes sit about halfway up that head. Without a head bone, the top of the model stands in.
 const head=findHead(model),box=head?headBounds(model,head):new THREE.Box3();if(box.isEmpty())box.set(new THREE.Vector3(bounds.min.x,bounds.max.y-height*HEAD_MAX,bounds.min.z),bounds.max.clone());
 const headSize=Math.max(.05*height,Math.min(box.max.y-box.min.y,height*HEAD_MAX)),centre=box.getCenter(new THREE.Vector3()),eye=new THREE.Vector3(centre.x,box.min.y+headSize*EYES_UP_HEAD,centre.z);
 // Keep the eyes at the studio origin so the fixed light rig always lights the face.
 holder.position.sub(eye);holder.updateMatrixWorld(true);
 const view=headSize/HEAD_SHARE,distance=view/2/Math.tan(THREE.MathUtils.degToRad(FOV/2)),camera=studio.camera;
 camera.position.set(SIDE*Math.sin(YAW)*Math.cos(PITCH),Math.sin(PITCH),Math.cos(YAW)*Math.cos(PITCH)).multiplyScalar(distance);camera.near=distance/20;camera.far=distance*20;camera.updateProjectionMatrix();
 camera.lookAt(0,-(.5-EYE_FROM_TOP)*view,0);camera.updateMatrixWorld();
 return {pose,dispose:()=>{mixer.stopAllAction();mixer.uncacheRoot(model);studio.stage.remove(holder);model.traverse(n=>{const m=(n as THREE.Mesh).material;if(m)for(const material of Array.isArray(m)?m:[m])material.dispose();});}};
}
async function encode(pixels:Uint8Array){
 const row=PORTRAIT_SIZE*4,image=new ImageData(PORTRAIT_SIZE,PORTRAIT_SIZE);for(let y=0;y<PORTRAIT_SIZE;y++)image.data.set(pixels.subarray((PORTRAIT_SIZE-1-y)*row,(PORTRAIT_SIZE-y)*row),y*row);
 const canvas=new OffscreenCanvas(PORTRAIT_SIZE,PORTRAIT_SIZE),context=canvas.getContext('2d');if(!context)throw Error('No 2D context');context.putImageData(image,0,0);
 return URL.createObjectURL(await canvas.convertToBlob({type:'image/png'}));
}
/** Runs `fn` in idle time with at least `budget` ms left before the next frame, so preparation never lengthens a rendered frame. */
const idle=(fn:()=>void,budget=0)=>{let id=0;const run=(deadline?:IdleDeadline)=>{if(deadline&&!deadline.didTimeout&&deadline.timeRemaining()<budget){id=requestIdleCallback(run,{timeout:1000});return;}fn();};if('requestIdleCallback' in window){id=requestIdleCallback(run,{timeout:1000});return()=>cancelIdleCallback(id);}const t=setTimeout(run,50);return()=>clearTimeout(t);};
/** Renders into the studio target with the renderer's own state saved and restored around it. */
function drawStudio(gl:THREE.WebGLRenderer,studio:Studio,draw:()=>void){const previous=gl.getRenderTarget(),autoClear=gl.autoClear,clearColor=gl.getClearColor(new THREE.Color()),clearAlpha=gl.getClearAlpha();gl.autoClear=true;gl.setClearColor(0x000000,0);try{draw();}finally{gl.setRenderTarget(previous);gl.autoClear=autoClear;gl.setClearColor(clearColor,clearAlpha);}}
type Phase='wait'|'compiled'|'ready'|'shot';
function Snapshot({job,studio,paused}:{job:PortraitJob;studio:Studio;paused:boolean}){
 const gltf=useGLTF(job.look.asset);const {gl}=useThree();const state=useRef<{phase:Phase;stage?:ReturnType<typeof stageModel>;prepareMs:number;compileMs:number;warmMs:number}>({phase:'wait',prepareMs:0,compileMs:0,warmMs:0});
 useEffect(()=>{let cancelled=false,cancel=()=>{};const s=state.current;cancel=idle(()=>{if(cancelled)return;
  const names=gltf.animations.map(c=>c.name);if(job.expression!=='neutral'&&!expressionClip(names,job.expression)){followNeutral(job);return;}
  const t0=performance.now();s.stage=stageModel(studio,gltf,job);const t1=performance.now();s.prepareMs=t1-t0;
  // Programs depend on the bound target (render targets take linear output), so compile against the studio target, in parallel where the browser allows.
  let compiling:Promise<unknown>=Promise.resolve();drawStudio(gl,studio,()=>{gl.setRenderTarget(studio.source);compiling=gl.compileAsync(studio.scene,studio.camera);});
  void compiling.catch(()=>undefined).then(()=>{if(cancelled)return;s.compileMs=performance.now()-t1;s.phase='compiled';
   // A first draw of a fresh clone sets up its skeleton texture, material uniforms and any texture not yet on the GPU. Do it in idle time so the snapshot frame only draws.
   cancel=idle(()=>{if(cancelled)return;const t2=performance.now();drawStudio(gl,studio,()=>{gl.setRenderTarget(studio.source);gl.clear();gl.render(studio.scene,studio.camera);studio.output.render(gl,studio.target,studio.source,0,false);});s.warmMs=performance.now()-t2;s.phase='ready';},8);
  });
 },4);return()=>{cancelled=true;cancel();if(s.phase!=='shot'){s.stage?.dispose();s.stage=undefined;}};},[gltf,job,studio,gl]);
 useFrame(()=>{const s=state.current;if(s.phase!=='ready'||paused||document.hidden)return;s.phase='shot';
  const mode=readback,t0=performance.now();let pending:Promise<unknown>=Promise.resolve();
  drawStudio(gl,studio,()=>{gl.setRenderTarget(studio.source);gl.clear();gl.render(studio.scene,studio.camera);studio.output.render(gl,studio.target,studio.source,0,false);
   if(mode==='sync')gl.readRenderTargetPixels(studio.target,0,0,PORTRAIT_SIZE,PORTRAIT_SIZE,studio.pixels);else pending=gl.readRenderTargetPixelsAsync(studio.target,0,0,PORTRAIT_SIZE,PORTRAIT_SIZE,studio.pixels);});
  const renderMs=performance.now()-t0;s.stage?.dispose();s.stage=undefined;
  void pending.then(async()=>{const readbackMs=performance.now()-t0-renderMs,t1=performance.now(),url=await encode(studio.pixels);finishPortrait(job.key,url,{key:job.key,prepareMs:s.prepareMs,compileMs:s.compileMs,warmMs:s.warmMs,renderMs,readbackMs,encodeMs:performance.now()-t1,readback:mode});}).catch(()=>finishPortrait(job.key,null));
 });
 return null;
}
class SnapshotBoundary extends Component<{job:PortraitJob;children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){finishPortrait(this.props.job.key,null);}
 render(){return this.state.failed?null:this.props.children;}
}
/** Takes portrait snapshots offscreen in the world's own renderer: one queued look at a time, after idle-time preparation, never while `paused` (the world pauses it for rolls, cues and combat, so turn playback frames are never touched). Mount once inside the Canvas. */
export default function PortraitStudio({paused=false}:{paused?:boolean}){
 const job=useSyncExternalStore(subscribePortraits,nextPortraitJob);const studio=useMemo(createStudio,[]);
 useEffect(()=>()=>{studio.source.dispose();studio.target.dispose();studio.output.dispose();},[studio]);
 return job?<SnapshotBoundary key={job.key} job={job}><Suspense fallback={null}><Snapshot job={job} studio={studio} paused={paused}/></Suspense></SnapshotBoundary>:null;
}
