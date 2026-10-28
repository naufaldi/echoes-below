import {useEffect,useRef,type RefObject} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {PublicSave} from '../shared/types';
import {freeRegion} from './free-region';

const rect=(selector:string)=>{const e=document.querySelector(selector);const r=e?.getBoundingClientRect();return r&&r.width>0&&r.height>0?r:null;};

/**
 * Centres the rendered scene in the space the HUD leaves open, and in combat eases the orbit target
 * toward the acting creature and its target. A player's own orbit drag always wins until the next turn.
 */
export default function SceneFraming({save,orbit,reduced,userMoved}:{save:PublicSave|null;orbit:RefObject<{target:THREE.Vector3;update:()=>void}|null>;reduced:boolean;userMoved:RefObject<boolean>}){
 const {camera,size}=useThree();const shift=useRef({x:0,y:0});const goal=useRef<THREE.Vector3|null>(null);
 useEffect(()=>{
  // Creation already lays its preview out beside the form, so only in-game HUD panels shift the view. The narrow drawer (#97) spans the width, so it is not a side panel.
  const apply=()=>{const free=rect('.creation')?{x:0,y:0}:freeRegion(size.width,size.height,{left:rect('.party-panel'),right:document.querySelector('.app[data-drawer]')?null:rect('.actions-panel'),top:rect('.scene-heading'),bottom:rect('.turn-playback')??rect('.narration-panel')});
   if(Math.abs(free.x-shift.current.x)<2&&Math.abs(free.y-shift.current.y)<2&&camera.view?.enabled)return;shift.current=free;
   const cam=camera as THREE.PerspectiveCamera;cam.setViewOffset(size.width,size.height,-free.x,-free.y,size.width,size.height);};
  apply();const t=setInterval(apply,400);return()=>{clearInterval(t);(camera as THREE.PerspectiveCamera).clearViewOffset();};
 },[camera,size.width,size.height]);
 const turnActor=save?.mode==='combat'?save.turn?.actorId:undefined;
 useEffect(()=>{
  if(!save){goal.current=null;return;}
  if(!turnActor){goal.current=new THREE.Vector3(0,.4,-.5);return;}
  const all=[...save.party,...save.enemies],actor=all.find(a=>a.id===turnActor);if(!actor)return;
  const foes=all.filter(a=>a.side!==actor.side&&a.hp>0);const near=foes.sort((a,b)=>Math.hypot(a.position[0]-actor.position[0],a.position[1]-actor.position[1])-Math.hypot(b.position[0]-actor.position[0],b.position[1]-actor.position[1]))[0];
  const focus=near?[(actor.position[0]+near.position[0])/2,(actor.position[1]+near.position[1])/2]:actor.position;
  userMoved.current=false;goal.current=new THREE.Vector3(focus[0],.4,-focus[1]);
 },[turnActor,save?.scene.id]);// eslint-disable-line react-hooks/exhaustive-deps
 useFrame((_,delta)=>{
  const controls=orbit.current;if(!controls||!goal.current||userMoved.current)return;
  if(reduced)controls.target.copy(goal.current);else controls.target.lerp(goal.current,Math.min(1,delta*2.5));
  controls.update();if(controls.target.distanceTo(goal.current)<.02)goal.current=null;
 });
 return null;
}
