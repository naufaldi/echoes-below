import {useEffect,useMemo} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Prop,Instances,Flame,WallTorch,chain,mat,decal,geo,noRaycast,rand,smooth,type Part} from './rooms/kit';

// Each Chapter I room owns its layout. Server anchors map to world (x,0,-y); the curated
// tactical footprint is ±5.4 (nine 1.2 m cells), so solid shells stay outside it and floors
// stay at or below y=0. The camera sits in +x/+z, so that side stays low.
function Chest(){return <Prop file="Chest_O72u4Drp8k.glb" position={[4.6,0,.7]} height={.8}/>;}

// ── Broken Approach: an exterior hillside in rain ──
const track:[number,number][]=[[-.4,9],[-1.3,4.2],[-2.1,.4],[-1.4,-2.6],[0,-4.4]];
function trackDistance(x:number,z:number){let best=Infinity;for(let i=1;i<track.length;i++){const [ax,az]=track[i-1],[bx,bz]=track[i],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-ax-dx*t,z-az-dz*t));}return best;}
export function groundHeight(x:number,z:number){
 const n=Math.sin(x*.55+z*.31)*.5+Math.sin(x*.21-z*.47)*.6,edge=8.6+Math.sin(x*.45)*.7;
 const hill=smooth(-z,5.8,8.8)*(5.2+n)+smooth(-z,9,17)*3,west=smooth(-x,9.5,18)*(2+n*.6),east=smooth(x,10.5,16)*(3+n*.5),drop=smooth(z,edge,edge+1.3)*9;
 return hill+west-east-drop+n*.3*Math.max(smooth(Math.abs(x),8,10),smooth(-z,5.4,6.6),smooth(z,7.4,8.4));
}
function Hillside(){
 const geometry=useMemo(()=>{const g=new THREE.PlaneGeometry(72,64,72,64).rotateX(-Math.PI/2);const p=g.attributes.position,colors:number[]=[],c=new THREE.Color(),grass=new THREE.Color('#566343'),mud=new THREE.Color('#5d4b37'),rock=new THREE.Color('#5f605a');
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=groundHeight(x,z);p.setY(i,y);const steep=Math.abs(groundHeight(x+.6,z)-y)+Math.abs(groundHeight(x,z+.6)-y);
   c.copy(grass).multiplyScalar(.86+rand(i)*.22).lerp(mud,smooth(1.9-trackDistance(x,z),0,1)*.85).lerp(rock,smooth(steep,.35,1));colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;},[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} receiveShadow raycast={noRaycast}><meshStandardMaterial vertexColors roughness={1} flatShading/></mesh>;
}
const pines:[number,number,number][]=[[-7.4,-2,1.1],[-8.6,1.6,1.3],[-7.2,4.8,1],[-9.8,-4.8,1.2],[-11.2,3.8,1.4],[-6.4,-7.6,1.1],[-3.4,-9.8,1.2],[4.6,-8.8,1.3],[7.4,-6.6,1.1],[9.6,-3.4,1.2],[11.8,-7.4,1.4],[-12.6,-.8,1.3],[-4.8,-12.6,1.5],[1.4,-13,1.3],[8.2,-11.8,1.4],[-9.4,8.4,1.1]];
const trunks:Part[]=pines.map(([x,z,s])=>[x,groundHeight(x,z)+.8*s,z,.2*s,1.6*s,.2*s]);
const needles:Part[]=pines.flatMap(([x,z,s],i)=>[1.7,2.5,3.2].map((h,k)=>[x,groundHeight(x,z)+h*s,z,(1.5-k*.35)*s,1.6*s,(1.5-k*.35)*s,i+k] as Part));
const hillRocks:Part[]=Array.from({length:48},(_,i)=>{const a=rand(i)*Math.PI*2,r=7.2+rand(i+40)*9,x=Math.cos(a)*r,z=Math.sin(a)*r*.9-2,s=.25+rand(i+80)*.75;return [x,groundHeight(x,z)+s*.3,z,s*1.3,s,s*1.1,i,rand(i+9),0] as Part;}).filter(([x,,z])=>!(Math.abs(x)<7.5&&z>-6.5&&z<9)&&!(x>3&&z>3));
const ruts:Part[]=track.slice(1).flatMap(([bx,bz],i)=>{const [ax,az]=track[i],len=Math.hypot(bx-ax,bz-az),ry=Math.atan2(bx-ax,bz-az),nx=Math.cos(ry)*.42,nz=-Math.sin(ry)*.42;return [-1,1].map(s=>[(ax+bx)/2+nx*s,.006,(az+bz)/2+nz*s,.13,.01,len,ry] as Part);});
const puddleMaterial=new THREE.MeshStandardMaterial({color:'#8a9ba3',roughness:.1,metalness:.35,polygonOffset:true,polygonOffsetFactor:-2});
const approachSteps:Part[]=[[0,.02,-4.95,2.3,.08,.5],[0,.01,-5.4,2.1,.06,.45]];
const puddles:Part[]=[[-1.5,.012,3.4,.9,1,.5,.3],[-2.6,.012,-.6,.6,1,.4,1],[-.9,.012,-3,.7,1,.45,2],[.8,.012,6.2,1.1,1,.6,.8],[3.6,.012,3.8,.5,1,.35,1.4]];
const relayRuin:Part[]=[[-2.4,groundHeight(-2.4,-10.4)+1.2,-10.4,3.2,2.4,.7,.1],[1.6,groundHeight(1.6,-10.8)+.8,-10.8,2.2,1.6,.7,-.15],[-.4,groundHeight(-.4,-10.6)+.25,-9.8,1.4,.5,1,.4]];
function Rain({reduced}:{reduced:boolean}){
 const lines=useMemo(()=>{const n=650,p=new Float32Array(n*12);for(let i=0;i<n;i++){const x=-16+rand(i)*32,y=rand(i+999)*12,z=-14+rand(i+555)*27;for(const [k,o] of [[0,0],[1,12]]){const b=(i*2+k)*6;p.set([x,y+o,z,x+.07,y+o-.6,z+.05],b);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:'#b5c4cc',transparent:true,opacity:.4}));l.raycast=noRaycast;l.frustumCulled=false;return l;},[]);
 useEffect(()=>()=>{lines.geometry.dispose();(lines.material as THREE.Material).dispose();},[lines]);
 useFrame(({clock})=>{lines.position.y=reduced?-4:-((clock.elapsedTime*11)%12);});
 return <primitive object={lines}/>;
}
function BrokenApproach({reduced}:{reduced:boolean}){
 const tarp=mat('#6a6247'),wood=mat('#5f4a33');
 return <>
  <Hillside/>
  <group userData={{blocksLabels:true}}>
   <Instances parts={trunks} geometry={geo.cyl} color="#574b37"/><Instances parts={needles} geometry={geo.cone} color="#36503a" flat/>
   <Instances parts={hillRocks} geometry={geo.rock} color="#6a6b62" flat/><Instances parts={relayRuin} color="#727166" flat/>
   {/* The relay entrance: a stone portal cut into the foot of the hill, steps sinking into the dark. */}
   <Prop file="Arch_QwWdOcNIMh.glb" position={[0,0,-5.9]} height={3.4}/>
   {[-1,1].map(s=><Prop key={s} file="Wall_Modular_itasw0GWNf.glb" position={[s*2.75,0,-5.5]} height={2.3} rotation={s*.32}/>)}
   <Prop file="Column_wLubNpOTX4.glb" position={[-2.4,groundHeight(-2.4,-11.2)-.3,-11.2]} height={3.6}/><Prop file="Column_6y1EFzpRI9.glb" position={[1.2,groundHeight(1.2,-11.4)-.3,-11.4]} height={2.2}/>
   {/* Broken supply cart beside the tracks: one wheel lies in the mud. */}
   <group position={[-3.7,0,-.1]} rotation={[0,.6,.09]}><mesh position={[0,.6,0]} castShadow material={wood}><boxGeometry args={[1.8,.15,1.1]}/></mesh><mesh position={[0,.86,.5]} material={wood}><boxGeometry args={[1.8,.5,.1]}/></mesh><mesh position={[.7,.4,.62]} rotation={[0,0,Math.PI/2]} castShadow><torusGeometry args={[.4,.08,5,10]}/><meshStandardMaterial color="#8b7553"/></mesh></group>
   <mesh position={[-2.75,.07,.95]} rotation={[-Math.PI/2,0,.4]}><torusGeometry args={[.4,.08,5,10]}/><meshStandardMaterial color="#8b7553"/></mesh>
   <Prop file="Crate_SfJtdV8GDr.glb" position={[-4.6,0,1]} height={.55} rotation={.5}/><Prop file="Barrel_ONdghDBByN.glb" position={[3.4,0,-.7]} height={.9}/>
   {/* Sheltered camp: a lean-to east of the fire, sloping away so neither camera loses the party behind it. */}
   {[.5,1.9].map(z=><mesh key={z} position={[3,.75,z]} material={wood} castShadow><cylinderGeometry args={[.05,.06,1.5,6]}/></mesh>)}
   <mesh position={[3.45,.8,1.2]} rotation={[0,0,-1]} material={tarp} castShadow><boxGeometry args={[1.7,.04,1.7]}/></mesh>
   <mesh position={[2.6,.12,2.1]} rotation={[0,.3,Math.PI/2]} material={tarp}><cylinderGeometry args={[.16,.16,1.2,8]}/></mesh>
   <group position={[2.3,0,-4.4]} rotation={[0,-.35,0]}><mesh position={[0,.75,0]} material={wood} castShadow><boxGeometry args={[.1,1.5,.1]}/></mesh><mesh position={[.28,1.3,0]} rotation={[0,0,-.1]} material={wood}><boxGeometry args={[.75,.24,.05]}/></mesh></group>
   <Instances parts={approachSteps} color="#6c6c62" flat/>
   <mesh position={[0,1.3,-6.05]}><planeGeometry args={[1.9,2.6]}/><meshBasicMaterial color="#090c0c"/></mesh>
  </group>
  <group><Instances parts={ruts} color="#3e3226" jitter={0} shadow={false}/><Instances parts={puddles} geometry={geo.disc} color="#7d8c94" shadow={false} material={puddleMaterial}/><Rain reduced={reduced}/></group>
 </>;
}

// ── Counterweight Hall: a tall seamed hall, a western ledge and an open counterweight shaft to the east ──
const hallSlabs:Part[]=[-6,-4,-2,0,2,4,6].flatMap(x=>[-6,-4,-2,0,2,4,6].map(z=>[x,-.12,z,1.93,.24,1.93] as Part));
const hallWalls:Part[]=[[-7.7,3,-.5,.8,6,14],[-2.15,3,-7.45,11.7,6,.9],[6.4,3,-7.45,1.3,6,.9],[4.7,4.7,-7.45,2.2,2.6,.9],[-.5,-.45,-.5,15,.4,15.5]];
const hallLedge:Part[]=[[-6.3,.45,-.5,1.9,.9,13],[-5.15,.3,-1,.5,.6,1.4],[-4.7,.15,-1,.4,.3,1.4]];
const hallSlits:Part[]=[...[-5,-2.5,0,2.5,5].map(z=>[-7.27,3.3,z,.06,1.2,.16] as Part),...[-5.6,-3.1,-.6,1.9].map(x=>[x,3.5,-6.99,.16,1.3,.06] as Part)];
const hallRail:Part[]=[...[-6,-4,-2,0,2,4,6].map(z=>[6.9,.5,z,.28,1,.28] as Part),[6.9,1.04,0,.16,.12,12.4]];
const hallSeams:Part[]=[[-1.2,.006,0,.05,.01,4],[1.2,.006,0,.05,.01,4],[0,.006,-1.2,4,.01,.05],[0,.006,1.2,4,.01,.05],[0,.006,-3.4,9,.01,.04],[3.2,.006,2.6,.04,.01,5]];
const hallChains:Part[]=[...chain(2,-2.25,2.9,13),...chain(8.3,-5.2,-7,13),...chain(-3.6,-6.4,1,13)];
function CounterweightHall({reduced}:{reduced:boolean}){
 return <>
  <group userData={{blocksLabels:true}}>
   <Instances parts={hallSlabs} color="#6c695d" jitter={.18}/><Instances parts={hallWalls} color="#4d5450"/><Instances parts={hallLedge} color="#666a5f"/><Instances parts={hallRail} color="#5b5f58"/>
   {[-5.3,-1.5,2.3].map(x=><Prop key={x} file="Column_6y1EFzpRI9.glb" position={[x,0,-6.6]} height={6}/>)}
   <WallTorch position={[-6.7,.9,-3.8]} reduced={reduced}/><WallTorch position={[-6.7,.9,2.8]} reduced={reduced}/>
  </group>
  <group>
   <Instances parts={hallSlits} color="#070a0a" material={decal('#070a0a')} shadow={false}/><Instances parts={hallSeams} color="#141a17" material={decal('#141a17')} shadow={false}/>
   <Instances parts={hallChains} geometry={geo.link} color="#4d5557" roughness={.5} metalness={.7} shadow={false}/>
   {[-3.4,.4].map(x=><mesh key={x} position={[x,3.9,-6.97]} raycast={noRaycast}><torusGeometry args={[1.9,.12,5,16,Math.PI]}/><meshStandardMaterial color="#7a7c70"/></mesh>)}
   <mesh position={[4.7,1.7,-7.3]} raycast={noRaycast}><planeGeometry args={[2.2,3.4]}/><meshBasicMaterial color="#5a3018"/></mesh>
  </group>
 </>;
}

// ── Goblin Cookfire: a rough cave, an earth floor and the goblin camp around the hearth ──
const caveRocks:Part[]=Array.from({length:40},(_,i)=>{const a=i/40*Math.PI*2,x=Math.cos(a),z=Math.sin(a),front=z>.35||(x>.55&&z>-.5),s=front?.55+rand(i)*.5:1.6+rand(i)*.9,r=front?8:8.7+rand(i+3)*.8;return [x*r,front?s*.4:s*.7,z*r,s*1.3,s*(front?.8:1.5),s,i,rand(i+7)*.6,rand(i+11)*.4] as Part;}).concat(Array.from({length:22},(_,i)=>{const a=Math.PI*(1.08+i/22*.84),s=1.4+rand(i+50)*.8;return [Math.cos(a)*9.3,s*2.2,Math.sin(a)*9.3,s*1.4,s*1.3,s,i,rand(i+60),0] as Part;}));
const bars=(xs:number[],z:number,y=1.4,h=2.8):Part[]=>xs.map(x=>[x,y,z,.045,h,.045]);
const tents:Part[]=[[-6.6,1.2,1.2,1.4,2.4,1.4,.3],[6.6,1.1,-3.8,1.3,2.2,1.3,.8]],furs:Part[]=[[-6.4,.08,-1.4,.9,.12,.6,.4],[-5.9,.08,3.6,.8,.12,.55,1.2],[6.3,.08,-1.6,.8,.12,.5,.2]];
const passageBars:Part[]=[...bars([-1,-.6,-.2,.2,.6,1],-6.8),[0,2.75,-6.8,2.2,.1,.08]];
const caveFloor=new THREE.CircleGeometry(10.5,40).rotateX(-Math.PI/2);
const hearthStones:Part[]=Array.from({length:9},(_,i)=>{const a=i/9*Math.PI*2;return [-3.2+Math.cos(a)*.62,.1,-1.9+Math.sin(a)*.62,.17,.13,.15,i];});
const campFloor:Part[]=[[-3.2,0,-1.9,1.5,1,1.4],[-6.2,0,-1.2,1.3,1,.9,.4],[6.1,0,-3.8,1.5,1,1.2]];
function GoblinCookfire({reduced}:{reduced:boolean}){
 return <>
  <mesh position={[0,-.02,0]} geometry={caveFloor} material={mat('#4b3b2b',1)} receiveShadow raycast={noRaycast}/>
  <group><Instances parts={campFloor} geometry={geo.disc} color="#2f251c" material={decal('#33281e',.35)} shadow={false}/></group>
  <group userData={{blocksLabels:true}}>
   <Instances parts={caveRocks} geometry={geo.rock} color="#4f4a42" flat jitter={.25}/>
   <Instances parts={hearthStones} geometry={geo.rock} color="#5d5a50" flat/>
   <Prop file="Cauldron.gltf" position={[-3.2,.12,-1.9]} height={.75}/>
   <Instances parts={tents} geometry={geo.tent} color="#7b6243" flat/>
   <Instances parts={furs} geometry={geo.rock} color="#6e5844" flat/>
   <Prop file="Banner_svYG8KZxjq.glb" position={[-5.9,0,-5.4]} height={2.6} rotation={.6}/><Prop file="Banner_svYG8KZxjq.glb" position={[5.2,0,-6.2]} height={2.4} rotation={-.5}/>
   <Prop file="Skull_EAsVEJwsv7.glb" position={[-6.1,0,-3.4]} height={.3} rotation={.8}/><Prop file="Skull_EAsVEJwsv7.glb" position={[6.2,0,-.4]} height={.28} rotation={-1}/>
   <Prop file="Barrel_ONdghDBByN.glb" position={[6.4,0,1.4]} height={1}/><Prop file="Crate_SfJtdV8GDr.glb" position={[6.2,0,2.6]} height={.7} rotation={.3}/><Prop file="Crate_SfJtdV8GDr.glb" position={[6.3,.7,2.5]} height={.5} rotation={1}/>
   {/* Prison passage: a barred arch at the back of the cave, cold air beyond. */}
   <Prop file="Arch_QwWdOcNIMh.glb" position={[0,0,-6.9]} height={3.6}/>
   <Instances parts={passageBars} color="#5b6460" roughness={.5} metalness={.6}/>
   <WallTorch position={[2,0,-6.3]} reduced={reduced}/>
  </group>
  <mesh position={[0,1.4,-7.1]} raycast={noRaycast}><planeGeometry args={[2.2,2.9]}/><meshBasicMaterial color="#0b1418"/></mesh>
  <Flame position={[-3.2,.3,-1.9]} size={1.3} reduced={reduced}/><pointLight position={[-3.2,1.3,-1.9]} intensity={14} distance={9} color="#ff9a46"/>
 </>;
}

// ── Prison Alcove: a narrow cell block with three cells along the back ──
const prisonSlabs:Part[]=Array.from({length:20},(_,row)=>Array.from({length:10},(_,col)=>[-5.4+col*1.2+(row%2?.6:0),-.12,-5.1+row*.62,1.16,.24,.58] as Part)).flat().filter(([x])=>x<5.6);
const prisonWalls:Part[]=[[-5.9,1.8,.6,.8,3.6,12.6],[0,1.8,-5.6,12.6,3.6,.8],[5.9,.45,.6,.8,.9,12.6],[-2.3,1.5,-3.9,.4,3,3.4],[2.3,1.5,-3.9,.4,3,3.4],[0,-.45,.6,12.6,.4,13]];
const prisonBars:Part[]=[...bars([-2,-1.6,-1.25,1.25,1.6,2],-2.4,1.3,2.6),...bars([-5.3,-4.9,-4.5,-4.1,-3.7,-3.3,-2.9,-2.5,2.5,2.9,3.3,3.7,4.1,4.5,4.9,5.3],-2.4,1.3,2.6),[0,2.65,-2.4,.06,11.2,.06,0,0,Math.PI/2]],gateBars=bars([-1,-.5,0,.5,1],0,1.2,2.4);
const straw:Part[]=[[-1,.006,-4.3,1.3,.01,.8,.3],[-4,.006,-3.4,1,.01,.7,1],[1.4,.006,1.6,.8,.01,.5,2],[-3.6,.006,4,1,.01,.6,.6]];
function PrisonAlcove({gateOpen,reduced}:{gateOpen:boolean;reduced:boolean}){
 return <>
  <group userData={{blocksLabels:true}}>
   <Instances parts={prisonSlabs} color="#5a5f5b" jitter={.2}/><Instances parts={prisonWalls} color="#4a4f4c"/>
   <Prop file="Bed_Twin1.gltf" position={[-3.9,0,-4.1]} height={.7} rotation={Math.PI/2}/><Prop file="Bucket_83obI9bNun.glb" position={[-2.9,0,-2.9]} height={.4}/>
   <Prop file="Cage_Small.gltf" position={[4.4,0,-4.4]} height={1.2}/><Prop file="Chain_Coil.gltf" position={[3.4,0,-3.2]} height={.2}/>
   <Prop file="Small_Table_rAEBvfb1FT.glb" position={[-3.2,0,.1]} height={.8}/><Prop file="Chair_zMmKNm8w4a.glb" position={[-3.7,0,1.3]} height={1} rotation={2.6}/>
   <WallTorch position={[-5.2,0,-.9]} reduced={reduced}/>
  </group>
  <group>
   <Instances parts={prisonBars} geometry={geo.cyl} color="#5c6661" roughness={.5} metalness={.6}/>
   <Instances parts={straw} color="#8d7a45" material={decal('#8a7743')} shadow={false}/>
   {[-3.9,3.9].map(x=><mesh key={x} position={[x,1.6,-5.17]}><torusGeometry args={[.16,.04,5,10]}/><meshStandardMaterial color="#59625d" metalness={.6}/></mesh>)}
   {/* The courier's gate swings open once the rules engine reports it unlocked. */}
   <group position={[gateOpen?1.8:0,0,-2.4]} rotation={[0,gateOpen?Math.PI/2:0,0]}><Instances parts={gateBars} geometry={geo.cyl} color="#69736c" roughness={.5} metalness={.6}/></group>
   <Flame position={[-3.2,.86,.3]} size={.25} reduced={reduced}/><pointLight position={[-3.2,1.3,.3]} intensity={4} distance={4.5} color="#ffd08a"/>
  </group>
 </>;
}

// ── Bell Chamber: a round chamber, the bell hanging over the seal, relay fittings on the west side ──
const ring=(count:number,radius:number,from:number,span:number,y:number,w:number,h:number,d:number):Part[]=>Array.from({length:count},(_,i)=>{const a=from+(i+.5)/count*span;return [Math.cos(a)*radius,y,Math.sin(a)*radius,w,h,d,-a-Math.PI/2];});
const bellWalls:Part[]=[...ring(18,9.4,Math.PI,Math.PI,3.5,1.7,7,.9),...ring(18,9.4,0,Math.PI,.4,1.7,.8,.9),...ring(19,8.95,Math.PI-Math.PI/36,Math.PI*19/18,3.9,.5,7.8,.6)];
const bellInlays:Part[]=Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2;return [Math.cos(a)*4.3,.004,Math.sin(a)*4.3,.08,.01,2.6,Math.PI/2-a];});
const bellChain=chain(0,-4.6,3.9,13);
const fittings:Part[]=[[-6.4,1.6,-1.8,.07,3.2,.07],[-6.4,1.6,-1.2,.07,3.2,.07],[-6.4,1.6,-.6,.07,3.2,.07],[-6.4,2.5,-1.2,.07,1.6,.07,0,Math.PI/2],[-7.9,2.5,-1.2,.07,3,.07,0,0,Math.PI/2],[-6.1,.35,-1.2,.25,.7,.25]];
function BellChamber({reduced}:{reduced:boolean}){
 return <>
  <mesh position={[0,-.17,0]} material={mat('#596064')} receiveShadow raycast={noRaycast}><cylinderGeometry args={[8.9,8.9,.3,48]}/></mesh>
  <group>
   {[[2.9,3],[5.6,5.7],[8.2,8.3]].map(([a,b])=><mesh key={a} position={[0,.004,0]} rotation={[-Math.PI/2,0,0]} material={decal('#8aa1b5',.45)}><ringGeometry args={[a,b,64]}/></mesh>)}
   <Instances parts={bellInlays} color="#3e4549" material={decal('#3a4145')} shadow={false}/>
   <mesh position={[0,.008,-4.6]} rotation={[-Math.PI/2,0,0]} material={decal('#72d9c0',.5)}><ringGeometry args={[2.05,2.18,48]}/></mesh>
   <Instances parts={bellChain} geometry={geo.link} color="#5d6466" roughness={.5} metalness={.7} shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Instances parts={bellWalls} color="#4f5660" jitter={.16}/>
   <Instances parts={fittings} geometry={geo.cyl} color="#8a7a58" roughness={.45} metalness={.65}/>
   {[[-5.95,1.2,-1.8],[-5.95,1.7,-.6]].map(([x,y,z])=><mesh key={z} position={[x,y,z]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.2,.04,5,12]}/><meshStandardMaterial color="#9b4b3c" metalness={.4}/></mesh>)}
   <mesh position={[-6.1,1.95,-1.2]}><boxGeometry args={[.08,.5,.5]}/><meshStandardMaterial color="#c5a35e" metalness={.6}/></mesh>
   <group position={[0,0,-4.6]}><mesh position={[0,.35,0]}><cylinderGeometry args={[1.7,1.9,.7,8]}/><meshStandardMaterial color="#67705c"/></mesh><mesh position={[0,3,0]} geometry={geo.bell} castShadow><meshStandardMaterial color="#927547" metalness={.7} roughness={.4} side={THREE.DoubleSide}/></mesh><mesh position={[0,3.8,0]}><torusGeometry args={[.16,.04,6,12]}/><meshStandardMaterial color="#ad8c50" metalness={.7}/></mesh><pointLight position={[0,1,0]} color="#72d9c0" intensity={9} distance={6}/></group>
   {[-1,1].map(s=><group key={s} position={[s*6.4,0,-4.4]}><mesh position={[0,.5,0]} material={mat('#3f3a34',.6,.5)}><cylinderGeometry args={[.12,.2,1,6]}/></mesh><mesh position={[0,1.05,0]} material={mat('#3f3a34',.6,.5)}><cylinderGeometry args={[.45,.25,.25,8]}/></mesh><Flame position={[0,1.35,0]} size={.9} reduced={reduced}/><pointLight position={[0,1.9,0]} color="#ffb067" intensity={8} distance={7}/></group>)}
  </group>
 </>;
}

// ── After the Last Echo: the undercroft under a quiet seal, the bell fallen, a stair opening below ──
const octWalls:Part[]=[[-Math.PI/2,5.2],[-3*Math.PI/4,4.6],[Math.PI,3.8],[0,1.1],[Math.PI/4,.6],[Math.PI/2,.6],[3*Math.PI/4,.6]].map(([a,h])=>[Math.cos(a)*8.25,h/2,Math.sin(a)*8.25,6.6,h,.8,-a-Math.PI/2]);
const rubble:Part[]=Array.from({length:18},(_,i)=>{const a=-Math.PI/4+(rand(i)-.5)*.7,r=6.4+rand(i+5)*2.2,s=.35+rand(i+9)*.8;return [Math.cos(a)*r,s*.45,Math.sin(a)*r,s*1.2,s,s,i,rand(i+2),rand(i+4)];});
const cracks:Part[]=Array.from({length:11},(_,i)=>{const a=i/11*Math.PI*2+rand(i)*.4,l=1.2+rand(i+20)*2.4,r=1.1+l/2;return [Math.cos(a)*r,.005,-1+Math.sin(a)*r,.035,.01,l,-a+Math.PI/2];});
const hatchCurb:Part[]=[[0,.1,-4.75,2.6,.2,.25],[-1.2,.1,-5.75,.2,.2,2.1],[1.2,.1,-5.75,.2,.2,2.1]];
const stairs:Part[]=[0,1,2,3].map(i=>[0,.004,-5.1-i*.42,2,.01,.4]);
function Aftermath({reduced}:{reduced:boolean}){
 return <>
  <mesh position={[0,-.17,0]} rotation={[0,Math.PI/8,0]} material={mat('#6b675a')} receiveShadow raycast={noRaycast}><cylinderGeometry args={[8.7,8.7,.3,8]}/></mesh>
  <group>
   <Instances parts={cracks} color="#24221d" material={decal('#3a372e',.55)} shadow={false}/>
   {/* A stairwell opens in the floor behind the deeper-door marker; rising strips fake its depth. */}
   <mesh position={[0,.003,-5.75]} rotation={[-Math.PI/2,0,0]} material={decal('#05080a')}><planeGeometry args={[2.2,1.9]}/></mesh>
   {stairs.map((p,i)=><mesh key={i} position={[p[0],p[1]+.001,p[2]]} rotation={[-Math.PI/2,0,0]} material={decal(['#55605f','#3a4446','#232b2e','#141a1d'][i])}><planeGeometry args={[2,.3]}/></mesh>)}
   <mesh position={[0,4.6,-1]} raycast={noRaycast}><coneGeometry args={[2.3,9.6,24,1,true]}/><meshBasicMaterial color="#f3e6c4" transparent opacity={.07} depthWrite={false} side={THREE.DoubleSide}/></mesh>
  </group>
  <group userData={{blocksLabels:true}}>
   <Instances parts={octWalls} color="#57564e" jitter={.14}/><Instances parts={rubble} geometry={geo.rock} color="#66645a" flat jitter={.2}/>
   <Instances parts={hatchCurb} color="#77756a"/>
   <Prop file="Trap_Door_PALqVBff9b.glb" position={[2.6,0,-5.7]} height={.14} rotation={.2}/>
   <Prop file="Column_6y1EFzpRI9.glb" position={[-6.3,0,-1.4]} height={3.2}/><Prop file="Column_wLubNpOTX4.glb" position={[-5.4,0,-5.8]} height={4.6}/>
   <mesh position={[-6,.42,2.6]} rotation={[0,.5,Math.PI/2]} material={mat('#77756a')} castShadow><cylinderGeometry args={[.42,.42,2.6,8]}/></mesh>
   {/* The bell has come down and rests on its lip against the western wall. */}
   <group position={[-4.7,.95,-3.6]} rotation={[.15,.3,.55]} scale={1.25}><mesh geometry={geo.bell} castShadow><meshStandardMaterial color="#7f6743" metalness={.6} roughness={.5} side={THREE.DoubleSide}/></mesh></group>
   <pointLight position={[0,3.6,-1]} color="#ffe9c2" intensity={10} distance={9}/><pointLight position={[0,.3,-5.8]} color="#7fb3d6" intensity={5} distance={5}/>
  </group>
 </>;
}

export default function ChapterOneRoom({scene,gateOpen=false,reduced=false}:{scene:string;gateOpen?:boolean;reduced?:boolean}){
 return <>{scene==='approach'?<BrokenApproach reduced={reduced}/>:scene==='hall'?<CounterweightHall reduced={reduced}/>:scene==='cookfire'?<GoblinCookfire reduced={reduced}/>:scene==='prison'?<PrisonAlcove gateOpen={gateOpen} reduced={reduced}/>:scene==='bell'?<BellChamber reduced={reduced}/>:<Aftermath reduced={reduced}/>}<Chest/></>;
}
