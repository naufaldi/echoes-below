import {useEffect,useMemo,useState} from 'react';
import * as THREE from 'three';
import {findPath,type Cell} from '../shared/tactical-grid';
import type {ActionOption,PublicSave} from '../shared/types';
import TextSprite from './TextSprite';

const at=([x,y]:Cell,h=0):[number,number,number]=>[(x-4)*1.2,h,-(y-4)*1.2];
const flat=[-Math.PI/2,0,0] as [number,number,number];
export const moveCell=(a:ActionOption):Cell|null=>{const p=a.id.split(':')[2]?.split(',').map(Number);return p&&p.length===2&&p.every(Number.isInteger)?[p[0],p[1]]:null;};

/**
 * Curated-tactics grid on the active player's turn: every cell outlined, reachable cells clickable with a
 * route preview and its cost, and attackable enemies marked. All options are the engine's own legal actions.
 */
export default function TacticalOverlay({save,onAction}:{save:PublicSave;onAction?:(a:ActionOption)=>void}){
 const tactical=save.tactical!,grid=tactical.grid,actorId=save.turn?.actorId,start=actorId?tactical.cells[actorId]:undefined;
 const [hover,setHover]=useState<string|null>(null);useEffect(()=>setHover(null),[save.revision,actorId]);
 const lines=useMemo(()=>{const points:number[]=[],x0=at([0,0])[0]-.6,z0=at([0,0])[2]+.6,x1=at([grid.width-1,0])[0]+.6,z1=at([0,grid.height-1])[2]-.6;
  for(let i=0;i<=grid.width;i++){const x=x0+i*1.2;points.push(x,.03,z0,x,.03,z1);}for(let j=0;j<=grid.height;j++){const z=z0-j*1.2;points.push(x0,.03,z,x1,.03,z);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));return g;},[grid.width,grid.height]);
 useEffect(()=>()=>lines.dispose(),[lines]);
 const moves=save.actions.filter(a=>a.kind==='move').flatMap(a=>{const c=moveCell(a);return c?[{action:a,cell:c,key:c.join(',')}]:[];});
 const attacks=Object.entries(save.actions.filter(a=>a.kind==='attack'&&a.targetId&&tactical.cells[a.targetId]).reduce<Record<string,ActionOption[]>>((m,a)=>{(m[a.targetId!]??=[]).push(a);return m;},{}));
 // Mirror the engine's movement grid: other living creatures block their cells (server/tactical.ts gridFor).
 const occupied=[...save.party,...save.enemies].filter(a=>a.id!==actorId&&a.hp>0&&tactical.cells[a.id]).map(a=>tactical.cells[a.id]);
 const target=moves.find(m=>m.key===hover);const route=target&&start?findPath({...grid,blocked:[...grid.blocked,...occupied]},start,target.cell,grid.width*grid.height*10):null;
 return <group>
  <lineSegments geometry={lines} raycast={()=>null}><lineBasicMaterial color="#d8c08a" transparent opacity={.22} depthWrite={false}/></lineSegments>
  {moves.map(m=><mesh key={m.action.id} rotation={flat} position={at(m.cell,.04)} onClick={e=>{e.stopPropagation();onAction?.(m.action);}} onPointerOver={e=>{e.stopPropagation();setHover(m.key);}} onPointerOut={()=>setHover(h=>h===m.key?null:h)}>
   <planeGeometry args={[1.06,1.06]}/><meshBasicMaterial color={hover===m.key?'#f0ce85':'#7aaed2'} transparent opacity={hover===m.key?.6:.38} depthWrite={false}/></mesh>)}
  {route&&route.cells.slice(1,-1).map(c=><mesh key={c.join(',')} rotation={flat} position={at(c,.06)} raycast={()=>null}><circleGeometry args={[.14,16]}/><meshBasicMaterial color="#f0ce85" transparent opacity={.85} depthWrite={false}/></mesh>)}
  {route&&target&&<TextSprite text={`${route.costFeet} ft`} color="#fce6b2" position={at(target.cell,.75)} height={.42}/>}
  {attacks.map(([id,options])=><mesh key={'attack:'+id} rotation={flat} position={at(tactical.cells[id],.045)} onClick={e=>{if(options.length!==1)return;e.stopPropagation();onAction?.(options[0]);}}>
   <ringGeometry args={[.42,.56,32]}/><meshBasicMaterial color="#e0644c" transparent opacity={.75} depthWrite={false}/></mesh>)}
 </group>;
}
