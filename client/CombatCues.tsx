import {useRef,useState,useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import TextSprite from './TextSprite';
import {AdditiveBlending,type Group} from 'three';
import {actorHeight} from '../shared/visual-identity';
import type {Actor,PublicSave} from '../shared/types';
import type {WorldCue} from './combat-cue';
export type {WorldCue} from './combat-cue';

const lift=(a:Actor)=>actorHeight(a)+.35;
const at=(a:Actor,y:number):[number,number,number]=>[a.position[0],y,-a.position[1]];

function Floater({actor,text,tone,reduced}:{actor:Actor;text:string;tone:'damage'|'heal'|'miss';reduced:boolean}){
 return <TextSprite text={text} color={tone==='damage'?'#ff9a7f':tone==='heal'?'#9be0b8':'#e8ebf0'} italic={tone==='miss'} position={at(actor,lift(actor)+.35)} height={tone==='miss'?.8:.95} rise={.9} life={1.5} reduced={reduced}/>;
}

/** Drawn over bodies like the floaters: a shot in melee range starts and ends inside the two characters. */
const cueMaterial={transparent:true,depthTest:false,depthWrite:false,toneMapped:false} as const;
function Projectile({from,to,kind,reduced}:{from:Actor;to:Actor;kind:'ranged'|'spell';reduced:boolean}){
 const group=useRef<Group>(null),progress=useRef(0);const [done,setDone]=useState(reduced);
 const start=at(from,actorHeight(from)*.6),end=at(to,actorHeight(to)*.6),arc=kind==='ranged'?.35:.15;
 useFrame((_,delta)=>{if(done||!group.current)return;progress.current=Math.min(1,progress.current+delta/.38);const t=progress.current,g=group.current;
  g.position.set(start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t+Math.sin(t*Math.PI)*arc,start[2]+(end[2]-start[2])*t);
  // Point along the arc's tangent so an arrow flies nose first.
  g.lookAt(g.position.x+end[0]-start[0],g.position.y+end[1]-start[1]+Math.cos(t*Math.PI)*Math.PI*arc,g.position.z+end[2]-start[2]);if(t>=1)setDone(true);});
 if(done)return null;
 return <group ref={group} position={start}>{kind==='ranged'?<>
  <mesh rotation={[Math.PI/2,0,0]} position={[0,0,-.2]} renderOrder={19} raycast={()=>null}><cylinderGeometry args={[.035,.015,.5,6]}/><meshBasicMaterial color="#f7e7c1" opacity={.95} {...cueMaterial}/></mesh>
  <mesh renderOrder={19} raycast={()=>null}><sphereGeometry args={[.08,10,10]}/><meshBasicMaterial color="#fff6dc" {...cueMaterial}/></mesh>
 </>:<>
  <mesh renderOrder={19} raycast={()=>null}><sphereGeometry args={[.32,16,16]}/><meshBasicMaterial color="#b48cff" opacity={.3} blending={AdditiveBlending} {...cueMaterial}/></mesh>
  <mesh renderOrder={19} raycast={()=>null}><sphereGeometry args={[.15,14,14]}/><meshBasicMaterial color="#e6d8ff" {...cueMaterial}/></mesh>
 </>}</group>;
}

/** Floating damage, heal and miss text plus ranged/spell projectiles for the beat just revealed. */
export default function CombatCues({cue,save,reduced}:{cue:WorldCue;save:PublicSave;reduced:boolean}){
 const actors=[...save.party,...save.enemies],find=(id?:string)=>actors.find(a=>a.id===id);
 const attacker=find(cue.actorId),[visible,setVisible]=useState(true);
 useEffect(()=>{const t=setTimeout(()=>setVisible(false),1600);return()=>clearTimeout(t);},[]);
 const target=find(cue.missTargetId)??find(cue.changes.find(c=>c.delta<0&&c.actorId!==cue.actorId)?.actorId);
 if(!visible)return null;
 return <>
  {attacker&&target&&(cue.kind==='ranged'||cue.kind==='spell')&&<Projectile from={attacker} to={target} kind={cue.kind} reduced={reduced}/>}
  {cue.changes.map(c=>{const a=find(c.actorId);return a&&<Floater key={c.actorId} actor={a} text={c.delta<0?`−${-c.delta}`:`+${c.delta}`} tone={c.delta<0?'damage':'heal'} reduced={reduced}/>;})}
  {cue.missTargetId&&find(cue.missTargetId)&&<Floater actor={find(cue.missTargetId)!} text="Miss" tone="miss" reduced={reduced}/>}
 </>;
}
