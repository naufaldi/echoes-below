/// <reference types="vite/client" />
import {Vector3,type Object3D} from 'three';
import {characterAsset} from '../shared/visual-identity.js';
import type {Actor} from '../shared/types.js';

/** Explicit local preview only. The production asset map and save format stay unchanged. */
export function isRoguePreview(actor:Pick<Actor,'classId'|'raceId'>){return import.meta.env?.DEV&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('elfRoguePreview')==='1'&&actor.classId==='scout'&&actor.raceId==='elf';}
export function renderCharacterAsset(actor:Pick<Actor,'classId'|'assetId'|'raceId'>){return isRoguePreview(actor)?'/__elf-rogue-preview.glb':characterAsset(actor);}
const sockets=new Map<string,{object:Object3D;release:number;origin:()=>Vector3|undefined}>();
export function registerRangedSocket(id:string,object:Object3D){
 let release=0;object.traverse(n=>{if(Number.isFinite(n.userData.rangedReleaseSeconds))release=Math.max(0,n.userData.rangedReleaseSeconds);});
 const socket=object.getObjectByName('Arrow_Release');
 const entry={object,release,origin:()=>{if(!socket)return undefined;object.updateWorldMatrix(true,true);return socket.getWorldPosition(new Vector3());}};sockets.set(id,entry);
 return()=>{if(sockets.get(id)===entry)sockets.delete(id);};
}
export function rangedPresentation(id:string){const s=sockets.get(id);return{releaseSeconds:s?.release??0,origin:()=>s?.origin()};}

// Deterministic visual QA for the local review page only; not used by game outcomes.
const previewAnimations=new Map<string,{actions:Record<string,import('three').AnimationAction|null>;mixer:import('three').AnimationMixer}>();
export function registerPreviewAnimation(id:string,actions:Record<string,import('three').AnimationAction|null>,mixer:import('three').AnimationMixer){if(!import.meta.env?.DEV)return()=>{};const entry={actions,mixer};previewAnimations.set(id,entry);return()=>{if(previewAnimations.get(id)===entry)previewAnimations.delete(id);};}
export function samplePreviewAnimation(id:string,seconds:number,clipName='Attack_Ranged'){if(!import.meta.env?.DEV)return false;const e=previewAnimations.get(id),a=e?.actions[clipName]??(clipName==='Attack_Ranged'?e?.actions.Bow_Shoot:undefined);if(!e||!a)return false;for(const other of Object.values(e.actions))other?.stop();a.reset().setEffectiveWeight(1).play();a.paused=true;a.time=Math.max(0,Math.min(seconds,a.getClip().duration));e.mixer.update(0);return true;}

export function inspectPreviewAnimation(id:string){if(!import.meta.env?.DEV)return null;const e=previewAnimations.get(id);if(!e)return null;const arrows:{name:string;scale:number[];position:number[]}[]=[];(e.mixer.getRoot() as Object3D).traverse(n=>{if(/arrow|dagger|bow_left|weapon_/i.test(n.name))arrows.push({name:n.name,scale:n.scale.toArray(),position:n.getWorldPosition(new Vector3()).toArray()});});return{actions:Object.entries(e.actions).filter(([,a])=>a&&a.getEffectiveWeight()>0&&a.isRunning()).map(([name,a])=>({name,time:a!.time,weight:a!.getEffectiveWeight()})),arrows};}
export function inspectPreviewMaterials(id:string){if(!import.meta.env?.DEV)return null;const root=previewAnimations.get(id)?.mixer.getRoot() as Object3D|undefined;if(!root)return null;const result:Record<string,string>={};root.traverse(n=>{const m=n as import('three').Mesh;if(!m.isMesh)return;for(const material of Array.isArray(m.material)?m.material:[m.material]){const p=material as import('three').MeshStandardMaterial;if(p.color)result[p.name]=p.color.getHexString();}});return result;}
