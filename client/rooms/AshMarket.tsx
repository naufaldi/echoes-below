import {fixed,slabs} from './parts';
import {useEffect,useMemo,useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Solid,SolidKit,type RoomCtx,mapTint,Instances,KitInstances,Prop,Flame,chain,mat,decal,geo,noRaycast,rand,type Part,type RoomProps} from './kit';

// Ash Market (#48): a burned market in a cavern around the old furnace. Every room shares the same four anchors
// (evidence -2,0 · way forward 0,-3.5 · supplies 3,0 · camp -3,2 in world x,z), so each room's identity lives on the
// perimeter: tall landmarks behind the door (-z) and along the west wall (-x), low dressing east (+x) and south (+z).
// Solid lists stand outside the ±5.4 m footprint and pass through useSolidParts; inside it there are only floor decals.
// Kenney Fantasy Town pieces share one colormap; mapTint(url,tint,roughness) is this file's cached, darkened copy of that material,
// so burned and intact stalls cost one shader program. Contract: ./README.md.
const DUNGEON={wall:'/assets/env/kaykit-dungeon/wall.glb',wallGated:'/assets/env/kaykit-dungeon/wall_gated.glb',wallArched:'/assets/env/kaykit-dungeon/wall_arched.glb',pillar:'/assets/env/kaykit-dungeon/pillar.glb',crates:'/assets/env/kaykit-dungeon/crates_stacked.glb',box:'/assets/env/kaykit-dungeon/box_large.glb',banner:'/assets/env/kaykit-dungeon/banner_thin_brown.glb'};
const TOWN={stall:'/assets/env/kenney-fantasy-town/stall.glb',stallRed:'/assets/env/kenney-fantasy-town/stall-red.glb',stallGreen:'/assets/env/kenney-fantasy-town/stall-green.glb',bench:'/assets/env/kenney-fantasy-town/stall-bench.glb',cart:'/assets/env/kenney-fantasy-town/cart.glb',cartHigh:'/assets/env/kenney-fantasy-town/cart-high.glb',lantern:'/assets/env/kenney-fantasy-town/lantern.glb',fountain:'/assets/env/kenney-fantasy-town/fountain-round.glb',post:'/assets/env/kenney-fantasy-town/pillar-wood.glb',planks:'/assets/env/kenney-fantasy-town/planks.glb'};

const orb=new THREE.IcosahedronGeometry(1,1),ground=new THREE.CircleGeometry(24,32).rotateX(-Math.PI/2);
// Footprint radii for solid lists: pieces behind the room measure their depth, pieces beside it their width.
const back=(p:Part)=>p[5]/2,side=(p:Part)=>p[3]/2,round=(p:Part)=>Math.max(p[3],p[5]);

// ── Shared pieces: cavern rock, ash, charred beams, embers ──
/** Rock walls ringing the market: tall behind (-z) and west (-x), low east and south so the camera keeps the party. `gap` leaves the back clear for the room's landmark. */
function cavern(seed:number,gap:[number,number],tall=1,west=5.6):Part[]{
 const out:Part[]=[];
 for(let i=0;i<15;i++){const x=-12+i*1.7+rand(seed+i)*.6;if(x>gap[0]-1&&x<gap[1]+1)continue;const s=1.4+rand(seed+i+20)*.9;out.push([x,s*.9*tall,-5.6-s*1.15,s*1.1,s*1.7*tall,s,seed+i,rand(seed+i+3)*.4,0]);}
 for(let i=0;i<11;i++){const z=-9+i*1.6+rand(seed+i+40)*.5,s=1.2+rand(seed+i+50)*.8;out.push([-west-s*1.15,s*.8*tall,z,s,s*1.5*tall,s*1.1,seed+i+7,0,rand(seed+i+60)*.3]);}
 for(let i=0;i<10;i++){const z=-8+i*1.5,s=.3+rand(seed+i+70)*.35;out.push([5.6+s*1.35,s*.25,z,s*1.3,s*.55,s,seed+i]);}
 for(let i=0;i<10;i++){const x=-7+i*1.5,s=.3+rand(seed+i+80)*.35;out.push([x,s*.25,5.6+s*1.35,s*1.3,s*.55,s,seed+i]);}
 return out;
}
/** Grey ash drifts: flat decals anywhere (they never block), low mounds only outside the footprint. */
const drifts=(seed:number,n=9):Part[]=>Array.from({length:n},(_,i)=>{const a=rand(seed*3+i)*Math.PI*2,r=1.5+rand(seed+i*7)*4.5;return [Math.cos(a)*r,.004+i*.0004,Math.sin(a)*r,.4+rand(seed+i)*.7,1,.25+rand(seed+i+9)*.4,a] as Part;});
const mounds=(seed:number):Part[]=>Array.from({length:12},(_,i)=>{const s=.4+rand(seed+i*5)*.5,edge=i%3,t=-6+rand(seed+i*11)*12;return (edge===0?[t,s*.12,-5.5-s*1.3,s*1.3,s*.25,s]:edge===1?[-5.5-s*1.3,s*.12,t*.8,s,s*.25,s*1.3]:[5.5+s*1.3,s*.12,t*.8,s,s*.22,s*1.2]) as Part;});
function Ash({ctx,seed,n}:{ctx:RoomCtx;seed:number;n?:number}){
 const flat=useMemo(()=>drifts(seed,n),[seed,n]),heaps=useMemo(()=>mounds(seed),[seed]);
 return <><Instances parts={flat} geometry={geo.disc} color="#7a746c" material={decal('#8a847b',.22)} shadow={false}/><group userData={{blocksLabels:true}}><Solid ctx={ctx} parts={heaps} geometry={geo.rock} color="#5f5953" flat jitter={.2} radius={round} shadow={false}/></group></>;
}
const emberMaterials=new Map<string,THREE.PointsMaterial>();
/** Rising embers: one Points draw. Each ember is stored twice, one cycle apart, so lifting the cloud loops seamlessly. Frozen when `reduced`. */
function Embers({count,color='#ff9a4a',speed=.35,size=.09,reduced}:{count:number;color?:string;speed?:number;size?:number;reduced:boolean}){
 const H=7,points=useMemo(()=>{const p=new Float32Array(count*6);for(let i=0;i<count;i++){const x=-8+rand(i*3.31+1)*16,z=-9.5+rand(i*5.17+2)*15,y=rand(i*7.73+3)*H;p.set([x,y,z,x,y-H,z],i*6);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));let m=emberMaterials.get(color+size);if(!m){m=new THREE.PointsMaterial({color,size,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});emberMaterials.set(color+size,m);}
  const o=new THREE.Points(g,m);o.frustumCulled=false;o.raycast=noRaycast;return o;},[count,color,size]);
 useEffect(()=>()=>points.geometry.dispose(),[points]);
 useFrame(({clock})=>{if(reduced)return;const t=clock.elapsedTime;points.position.set(Math.sin(t*.4)*.25,(t*speed)%H,0);});
 return <primitive object={points}/>;
}
/** Floor: kit tiles across the room (receive shadows, cast none) plus the dark cavern ground beyond. */
const grid12=slabs(1.2,{gap:.05,jitter:.02,seed:(i,j)=>i*31+j}),cobbles=slabs(.6,{gap:.05,jitter:.02,seed:(i,j)=>i*31+j}),brokenGrid=slabs(1.2,{gap:.05,jitter:.02,seed:(i,j)=>i*31+j,pick:(i,j)=>rand(i*7+j*13)>.12}),ashPits=slabs(1.2,{gap:.05,jitter:.02,seed:(i,j)=>i*31+j,pick:(i,j)=>rand(i*7+j*13)<=.12}).map(p=>[p[0],-.16,p[2],p[3],p[4],p[5]] as Part),checkA=slabs(1.2,{gap:.05,jitter:.02,seed:(i,j)=>i*31+j,pick:(i,j)=>(i+j)%2===0}),checkB=slabs(1.2,{gap:.05,jitter:.02,seed:(i,j)=>i*31+j,pick:(i,j)=>(i+j)%2!==0});
function Floor({parts,color,jitter=.22,ground:groundColor='#1d1714'}:{parts:Part[];color:string;jitter?:number;ground?:string}){return <><mesh geometry={ground} material={mat(groundColor,1)} position={[0,-.12,0]} receiveShadow raycast={noRaycast}/><Instances parts={parts} color={color} jitter={jitter} shadow={false}/>{parts===brokenGrid&&<Instances parts={ashPits} color="#4d4741" jitter={.15} shadow={false}/>}</>;}
const plankGrid:Part[]=[-7,-5,-3,-1,1,3,5,7].flatMap(x=>[-7,-5,-3,-1,1,3,5,7].map((z,i)=>[x,-.07,z,2,1.1,2,i%2?0:Math.PI] as Part));

// ── 1 · The Cinder Gate: the toll wall and its gate, a cold furnace beyond, the refugee queue along the east rope ──
const gateWalls:Part[]=[[-4,0,-6.6,1,1,1],[4,0,-6.6,1,1,1],[-8,0,-6.6,1,1,1]],gateBars:Part[]=[[0,0,-6.6,1,1,1]];
const tollBooth:Part[]=[[-6.6,0,-3.6,2.4,2.8,2.6]];
const waterJars:Part[]=[[-6.5,1.25,-4.3,.17,.36,.17],[-6.5,1.25,-3.8,.15,.3,.15],[-6.6,1.25,-3.3,.18,.38,.18],[-6.4,1.25,-2.8,.14,.28,.14],[-7.3,.25,-5.7,.24,.5,.24],[-6.8,.25,-5.9,.22,.46,.22],[-7.5,.25,-5,.2,.42,.2],[-6.3,.23,-6.1,.2,.42,.2]];
const tally:Part[]=[[-7.2,1.9,-.6,.1,1.2,2.2],[-7.2,.9,-1.6,.12,1.8,.12],[-7.2,.9,.4,.12,1.8,.12]];
const tallyMarks:Part[]=[...Array.from({length:14},(_,i)=>[-7.14,1.95+(i%2?.02:0),-1.5+i*.13+Math.floor(i/5)*.12,.01,.42,.03] as Part),...[0,1].map(k=>[-7.14,1.95,-1.25+k*.77,.01,.04,.62,0,.5] as Part)],altered:Part[]=[[-7.13,1.6,.05,.01,.05,.5,0,-.3],[-7.13,1.75,.05,.01,.32,.05]];
const queuePosts:Part[]=[-4.6,-2.2,.2,2.6,5].map(z=>[5.75,0,z,2,1.15,2] as Part),queueRope:Part[]=[-3.4,-1,1.4,3.8].map(z=>[5.75,1.02,z,.03,.03,2.4,0,.08] as Part);
const bedrolls:Part[]=[[6.5,.16,-3.6,.16,1.3,.16,0,0,Math.PI/2],[6.7,.16,-1.4,.15,1.2,.15,.3,0,Math.PI/2],[6.4,.15,1,.15,1.1,.15,-.2,0,Math.PI/2],[6.8,.16,3.2,.16,1.3,.16,.1,0,Math.PI/2],[6.2,.14,4.6,.14,1,.14,1.2,0,Math.PI/2]];
const bundles:Part[]=[[7.1,.25,-2.7,.32,.28,.3,1],[6.3,.22,-.4,.28,.24,.26,2],[7,.3,.4,.36,.32,.32,3],[6.5,.24,2.3,.3,.26,.3,4],[7.2,.22,4,.27,.22,.26,5],[6.3,.2,-4.6,.26,.22,.24,6]];
const queueCart:Part[]=[[6.8,0,6.4,1.6,1.6,1.6,.3]];
const gateBeams:Part[]=[[-6.6,1.5,-6.3,.32,3.6,.32,.2,0,.7],[6.4,1,-6.2,.3,3.2,.3,-.4,0,-.9],[-7.2,.25,1.8,.3,.3,3.6,.3]];
function CinderGate({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 const rock=useMemo(()=>cavern(11,[-6.2,6.2],.9,8),[]);
 return <>
  <Floor parts={brokenGrid} color="#5a4c41" jitter={.3}/><Ash ctx={ctx} seed={1} n={11}/>
  <group userData={{blocksLabels:true}}>
   <Solid ctx={ctx} parts={rock} geometry={geo.rock} color="#4d4641" flat jitter={.22} radius={round}/>
   <SolidKit ctx={ctx} url={DUNGEON.wall} parts={gateWalls} radius={fixed(.6)}/><SolidKit ctx={ctx} url={DUNGEON.wallGated} parts={gateBars} radius={fixed(.6)}/>
   {/* The cold furnace the market grew around, dark above the toll wall. */}
   <group position={[1.5,0,-14]}><mesh position={[0,3.5,0]} material={mat('#39332f')} castShadow><cylinderGeometry args={[3.4,4,7,10]}/></mesh><mesh position={[0,8,0]} material={mat('#332e2b')}><coneGeometry args={[3.6,2.4,10]}/></mesh><mesh position={[1.4,11,0]} material={mat('#2d2926')}><cylinderGeometry args={[.8,1,6,8]}/></mesh><mesh position={[0,2,3.62]} material={decal('#14100e')}><planeGeometry args={[2.4,2.6]}/></mesh></group>
   {/* The toll booth: a counter of water jars and the tally board that carries the new tax. */}
   <SolidKit ctx={ctx} url={TOWN.stall} parts={tollBooth} radius={fixed(.8)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#a38b76',.92)}/>
   <Solid ctx={ctx} parts={waterJars} geometry={geo.cyl} color="#8a6448" radius={fixed(.25)}/><Solid ctx={ctx} parts={tally} color="#3a2c22" radius={side}/>
   <SolidKit ctx={ctx} url={TOWN.post} parts={queuePosts} radius={fixed(.2)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#9b8270',.92)}/><Solid ctx={ctx} parts={queueRope} color="#9b8562" radius={fixed(.05)} shadow={false}/>
   <Solid ctx={ctx} parts={bedrolls} geometry={geo.cyl} color="#6a5a48" jitter={.5} radius={fixed(.2)}/><Solid ctx={ctx} parts={bundles} geometry={geo.rock} color="#75644f" jitter={.4} flat radius={round}/>
   <SolidKit ctx={ctx} url={TOWN.cartHigh} parts={queueCart} radius={fixed(1.2)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#8c7766',.92)}/>
   <Solid ctx={ctx} parts={gateBeams} color="#2a1e18" radius={fixed(.4)}/>
  </group>
  <group><Instances parts={tallyMarks} color="#ddd5c2" material={decal('#d9d2bf')} shadow={false}/><Instances parts={altered} color="#b5432f" material={decal('#b4442f')} shadow={false}/></group>
  <pointLight position={[-5.6,2.4,-3.6]} color="#ffb871" intensity={9} distance={8}/><pointLight position={[0,2.2,-7.6]} color="#8fa6c4" intensity={6} distance={7}/>
  <Embers count={45} reduced={reduced} speed={.25}/>
 </>;
}

// ── 2 · The Glassblower’s Stall: a lane of stalls, strings of glass lamps and the glassblower’s kiln ──
const laneStalls:Part[]=[[-6.9,0,-4,2.2,2.2,2.2,Math.PI/2],[-6.9,0,1.8,2.2,2.2,2.2,Math.PI/2],[3.3,0,-7,2.3,2.4,2.3,0]],laneGreen:Part[]=[[-6.9,0,-1.1,2.2,2.3,2.2,Math.PI/2],[-3.4,0,-7,2.3,2.3,2.3,0]];
const glassBench:Part[]=[[.2,0,-6.9,2.6,2.6,2.2,Math.PI/2]],lampPosts:Part[]=[[-5.9,0,4.4,1.5,1.5,1.5],[5.9,0,-4.6,1.5,1.5,1.5],[5.9,0,1.2,1.5,1.5,1.5]];
const lampStrings:Part[]=[[0,3.05,-5.7,.03,.03,11.4,Math.PI/2],[-5.7,3.05,-.5,.03,.03,10.4]];
const glassA:Part[]=[...Array.from({length:8},(_,i)=>[-5+i*1.4,2.8-(i%2)*.12,-5.7,.13,.15,.13] as Part),...Array.from({length:4},(_,i)=>[-5.7,2.8-(i%2)*.12,-4.6+i*2.6,.13,.15,.13] as Part),[-5.9,2.32,4.4,.16,.2,.16],[5.9,2.32,-4.6,.16,.2,.16],[5.9,2.32,1.2,.16,.2,.16]];
const glassB:Part[]=[...Array.from({length:7},(_,i)=>[-4.3+i*1.4,2.85-(i%2)*.12,-5.7,.12,.14,.12] as Part),...Array.from({length:4},(_,i)=>[-5.7,2.85,-3.3+i*2.6,.12,.14,.12] as Part)];
const brokenLamps:Part[]=[[.6,.9,-6.6,.12,.15,.12],[0,.9,-6.8,.1,.13,.1],[-.5,.9,-6.5,.12,.14,.12],[.3,.9,-7.3,.11,.13,.11],[-.3,.9,-7.2,.1,.12,.1],[-6.4,.86,-4.5,.11,.13,.11],[-6.5,.86,-3.6,.1,.12,.1]];
const kiln:Part[]=[[5.6,.9,-8,1.5,1.8,1.5]],kilnDome:Part[]=[[5.6,1.8,-8,1.5,1.2,1.5]],kilnPipe:Part[]=[[6.1,4.2,-8.4,.3,4.8,.3]];
const glassShards:Part[]=Array.from({length:14},(_,i)=>[3.6+rand(i+3)*2.6,.006,-5.2-rand(i+9)*1.6,.06+rand(i)*.08,1,.04,i] as Part);
const crateStack:Part[]=[[-6.9,0,4.7,.7,.7,.7,.4]];
function GlassblowerStall({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 const rock=useMemo(()=>cavern(23,[-5,7.4],1.05,8.1),[]);
 return <>
  <Floor parts={cobbles} color="#5f5248" jitter={.35}/><Ash ctx={ctx} seed={2} n={7}/>
  <group userData={{blocksLabels:true}}>
   <Solid ctx={ctx} parts={rock} geometry={geo.rock} color="#4f4741" flat jitter={.22} radius={round}/>
   <SolidKit ctx={ctx} url={TOWN.stallRed} parts={laneStalls} radius={fixed(1.15)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#ffffff',.92)}/><SolidKit ctx={ctx} url={TOWN.stallGreen} parts={laneGreen} radius={fixed(1.15)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#e8dcd2',.92)}/>
   <SolidKit ctx={ctx} url={TOWN.stall} parts={glassBench} radius={fixed(1)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#c9b6a4',.92)}/>
   <SolidKit ctx={ctx} url={TOWN.lantern} parts={lampPosts} radius={fixed(.2)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#a99482',.92)}/>
   <SolidKit ctx={ctx} url={DUNGEON.crates} parts={crateStack} radius={fixed(.85)}/>
   {/* The glassblower's kiln: a brick bell with a bright mouth, its flue lost in the smoke above. */}
   <Solid ctx={ctx} parts={kiln} geometry={geo.cyl} color="#6a4636" radius={round}/><Solid ctx={ctx} parts={kilnDome} geometry={orb} color="#5d3e31" radius={round}/><Solid ctx={ctx} parts={kilnPipe} geometry={geo.cyl} color="#3b302b" radius={round}/>
  </group>
  <group>
   <mesh position={[5.6,.95,-6.48]} material={decal('#ffb35a')} raycast={noRaycast}><circleGeometry args={[.55,12]}/></mesh><mesh position={[5.6,.95,-6.47]} material={decal('#fff0b8')} raycast={noRaycast}><circleGeometry args={[.28,10]}/></mesh>
   <Instances parts={lampStrings} geometry={geo.cyl} color="#2b2420" shadow={false}/>
   <Instances parts={glassA} geometry={orb} color="#ffc56a" material={decal('#ffc56a')} shadow={false}/><Instances parts={glassB} geometry={orb} color="#7fd6c8" material={decal('#86d9c6')} shadow={false}/>
   <Instances parts={brokenLamps} geometry={orb} color="#6f8086" roughness={.2} metalness={.3} shadow={false}/>
   <Instances parts={glassShards} geometry={geo.disc} color="#ffe2a6" material={decal('#ffd794',.7)} shadow={false}/>
   {/* Tavin's token, still set in the cracked lamp on the glassblower's bench. */}
   <mesh position={[.15,1.05,-6.55]} rotation={[-.4,0,0]} material={mat('#d6ad52',.35,.8)} raycast={noRaycast}><cylinderGeometry args={[.09,.09,.02,12]}/></mesh>
  </group>
  <pointLight position={[5.4,1.6,-5.8]} color="#ff9a45" intensity={16} distance={10}/><pointLight position={[-3,3,-4.6]} color="#ffc98a" intensity={8} distance={9}/><pointLight position={[-5,2.6,1]} color="#79d1c4" intensity={5} distance={7}/>
  <Embers count={60} reduced={reduced}/>
 </>;
}

// ── 3 · The Bone Auction: a block stage with its display frame, the old company’s banners, benches of bidders ──
const auctionStage:Part[]=[[0,.42,-7.4,10,.84,3.4]],stageSteps:Part[]=[[2.6,.14,-5.55,1.8,.28,.3],[2.6,.42,-5.75,1.8,.28,.3]];
const displayFrame:Part[]=[[-2.2,2.3,-7,.18,3,.18],[-.2,2.3,-7,.18,3,.18],[-1.2,3.75,-7,2.3,.2,.22],[-1.2,.98,-7,1.9,.14,1.2]];
const lectern:Part[]=[[2.6,1.4,-7.2,.8,1.1,.6],[2.6,2,-7.15,1,.08,.8,0,-.25]];
const companyBanners:Part[]=[-3.6,0,3.6].map(x=>[x,3.4,-9.1,1.3,2.8,.08] as Part),insignia:Part[]=[-3.6,0,3.6].map(x=>[x,3.6,-9.04,.38,.03,.38,0,Math.PI/2] as Part);
const bidderBenches:Part[]=[[6.9,0,-3.2,2.4,2.4,2.4,Math.PI/2],[6.9,0,-1.2,2.4,2.4,2.4,Math.PI/2],[6.9,0,.8,2.4,2.4,2.4,Math.PI/2],[6.9,0,2.8,2.4,2.4,2.4,Math.PI/2],[-6.9,0,-.6,2.4,2.4,2.4,Math.PI/2],[-6.9,0,1.4,2.4,2.4,2.4,Math.PI/2],[-6.9,0,3.4,2.4,2.4,2.4,Math.PI/2]];
const bones:Part[]=Array.from({length:22},(_,i)=>{const pile=i%3,c=[[-6.5,-5.9],[4.4,-6.5],[-4.4,-6.3]][pile];return [c[0]+(rand(i)-.5)*1.1,(pile===0?.06:.9)+rand(i+4)*.05,c[1]+(rand(i+8)-.5)*.6,.045,.42+rand(i+2)*.3,.045,rand(i+5)*3,Math.PI/2,0] as Part;});
const skulls:Part[]=[[-6.4,.18,-5.7,.17,.16,.19],[-6.9,.17,-6.2,.16,.15,.18],[4.2,1.02,-6.6,.15,.14,.17]];
const lotTags:Part[]=[[-6.4,1.4,-3.4,.04,.3,.24],[-6.4,1.4,-2.2,.04,.3,.24]];
const auctionChains=[...chain(-1.8,-7,1.4,3.6),...chain(-.6,-7,1.6,3.6)].map(p=>[p[0],p[1],p[2],p[3],p[4],p[5],p[6]] as Part);
function BoneAuction({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 const rock=useMemo(()=>cavern(37,[-5.4,5.4],1.1,8.2),[]);
 return <>
  <mesh geometry={ground} material={mat('#251c17',1)} position={[0,-.06,0]} receiveShadow raycast={noRaycast}/><KitInstances url={TOWN.planks} parts={plankGrid} shadow={false} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#5e4b3e',.92)}/>
  <Ash ctx={ctx} seed={3} n={8}/>
  <group userData={{blocksLabels:true}}>
   <Solid ctx={ctx} parts={rock} geometry={geo.rock} color="#4a433e" flat jitter={.2} radius={round}/>
   <Solid ctx={ctx} parts={auctionStage} color="#4a3626" radius={back}/><Solid ctx={ctx} parts={stageSteps} color="#57402d" radius={back}/>
   <Solid ctx={ctx} parts={displayFrame} color="#3a2a1f" radius={fixed(.3)}/><Solid ctx={ctx} parts={lectern} color="#5b412c" radius={fixed(.5)}/>
   <Solid ctx={ctx} parts={companyBanners} color="#6b2a24" radius={back} jitter={.05}/>
   <SolidKit ctx={ctx} url={TOWN.bench} parts={bidderBenches} radius={fixed(1.15)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#9a8676',.92)}/>
   <Prop file="Cage_Small.gltf" position={[-6.9,0,-3.9]} height={1.5} rotation={.4}/>
   <Solid ctx={ctx} parts={lotTags} color="#c9b28a" radius={fixed(.15)} shadow={false}/>
  </group>
  <group>
   <Instances parts={insignia} geometry={geo.cyl} color="#b4904c" roughness={.4} metalness={.6} shadow={false}/>
   <Instances parts={bones} geometry={geo.cyl} color="#d8cfb8" shadow={false}/><Instances parts={skulls} geometry={orb} color="#d9d0bb" shadow={false}/>
   <Instances parts={auctionChains} geometry={geo.link} color="#5a5f60" roughness={.5} metalness={.7} shadow={false}/>
  </group>
  <pointLight position={[-1,3.8,-5.6]} color="#efe2c6" intensity={14} distance={9}/><pointLight position={[5.4,2.4,1]} color="#ffb070" intensity={6} distance={8}/>
  <Embers count={55} reduced={reduced}/>
 </>;
}

// ── 4 · The Well Under the Forge: a glowing well under the cooling pipe, the children’s stair, two guilds’ banners ──
const forgeWall:Part[]=[[-2.4,0,-9.9,1,1.1,1],[2.4,0,-9.9,1,1.1,1]],well:Part[]=[[0,0,-7.5,1.55,1.8,1.55]],winch:Part[]=[[-1.75,1.4,-7.5,.16,2.8,.16],[1.75,1.4,-7.5,.16,2.8,.16],[0,2.75,-7.5,3.7,.14,.14]];
const bucket:Part[]=[[.3,1.7,-7.5,.2,.28,.2]],rope:Part[]=[[.3,2.25,-7.5,.015,.9,.015]];
const coolingPipe:Part[]=[[0,3.4,-9.2,.34,19,.34,0,0,Math.PI/2],[-4.6,1.7,-9.2,.3,3.4,.3],[4.6,1.7,-9.2,.3,3.4,.3],[2.6,2.15,-8.2,.24,2.6,.24,0,.75,.55],[-7.4,3.4,-9.2,.46,.3,.46,0,0,Math.PI/2],[7.4,3.4,-9.2,.46,.3,.46,0,0,Math.PI/2]];
const crackLeak:Part[]=[[1.7,.005,-6.4,.35,1,.9,.3],[1.2,.006,-5.6,.25,1,.6,.2],[-.6,.005,-5.9,.4,1,.3,1.1]],slimeGlow:Part[]=[[0,.43,-7.5,1.3,1,1.3]];
const childStair:Part[]=Array.from({length:8},(_,i)=>[-7.1,(i+1)*.21,1.5-i*.85,1.7,(i+1)*.42,.85] as Part).concat([[-7.1,1.6,-6.6,1.7,3.2,1.8]]);
const stairRail:Part[]=[[-6.3,1.9,-2.3,.06,.06,8.4,0,-.47]];
const forge:Part[]=[[6.5,.55,-6.6,1.8,1.1,1.6]],forgeHood:Part[]=[[6.5,2.2,-6.7,1.3,1.4,1.2]],anvil:Part[]=[[6.4,.3,-3.6,.4,.6,.4],[6.4,.7,-3.6,.9,.22,.36]];
const guildRed:Part[]=[[6.3,2.2,-1.4,.06,1.9,1,0,0,0],[6.3,1.6,-1.4,.12,3.2,.12]],guildBlue:Part[]=[[-6.9,3.8,-2.2,.06,1.9,1],[-6.9,3.8,1.8,.06,1.9,1]];
const buckets:Part[]=[[-1.9,.2,-6.1,.22,.4,.22],[1.9,.2,-6.2,.2,.38,.2],[6.4,.2,-1.8,.2,.36,.2],[6.6,.2,.6,.22,.4,.22]];
function WellUnderForge({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 const rock=useMemo(()=>cavern(41,[-6.5,6.5],1.15,8.1),[]);
 return <>
  <Floor parts={grid12} color="#4a4d48" jitter={.25} ground="#161a19"/><Ash ctx={ctx} seed={4} n={6}/>
  <group userData={{blocksLabels:true}}>
   <Solid ctx={ctx} parts={rock} geometry={geo.rock} color="#474641" flat jitter={.2} radius={round}/>
   <SolidKit ctx={ctx} url={TOWN.fountain} parts={well} radius={fixed(1.6)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#a6a29a',.92)}/>
   <Solid ctx={ctx} parts={winch} color="#3e3024" radius={fixed(.2)}/><Solid ctx={ctx} parts={bucket} geometry={geo.cyl} color="#5a4532" radius={fixed(.2)}/>
   <SolidKit ctx={ctx} url={DUNGEON.wall} parts={forgeWall} radius={fixed(.6)}/>
   <Solid ctx={ctx} parts={coolingPipe} geometry={geo.cyl} color="#5c4b3e" roughness={.5} metalness={.6} radius={fixed(.5)}/>
   <Solid ctx={ctx} parts={childStair} color="#5b5750" jitter={.14} radius={side}/>
   <Solid ctx={ctx} parts={forge} color="#3d3330" radius={fixed(.9)}/><Solid ctx={ctx} parts={forgeHood} geometry={geo.tent} color="#2e2826" radius={fixed(.9)}/><Solid ctx={ctx} parts={anvil} color="#3b3c3e" roughness={.5} metalness={.6} radius={fixed(.5)}/>
   <Solid ctx={ctx} parts={guildRed} color="#7a2c22" radius={fixed(.2)} jitter={0}/><Solid ctx={ctx} parts={guildBlue} color="#2c4a68" radius={side} jitter={0}/>
   <Solid ctx={ctx} parts={buckets} geometry={geo.cyl} color="#5e4834" radius={fixed(.25)}/>
  </group>
  <group>
   <Instances parts={rope} geometry={geo.cyl} color="#9a8664" shadow={false}/><Instances parts={stairRail} color="#3e3024" shadow={false}/>
   <Instances parts={slimeGlow} geometry={geo.disc} color="#9dff76" material={decal('#8ef56c',.85)} shadow={false}/><Instances parts={crackLeak} geometry={geo.disc} color="#7be05c" material={decal('#79d95c',.4)} shadow={false}/>
   <mesh position={[2.15,1.55,-7.8]} material={decal('#8ef56c',.6)} rotation={[0,0,.5]} raycast={noRaycast}><planeGeometry args={[.1,1.1]}/></mesh>
   <mesh position={[6.5,1.12,-6.6]} rotation={[-Math.PI/2,0,0]} material={decal('#ff8a3a')} raycast={noRaycast}><planeGeometry args={[1.5,1.3]}/></mesh>
  </group>
  <pointLight position={[0,1.2,-7.2]} color="#8ef56c" intensity={14} distance={9}/><pointLight position={[6.3,1.8,-5.6]} color="#ff8a3a" intensity={10} distance={8}/>
  <Embers count={35} reduced={reduced} color="#ffae5c" speed={.2}/>
 </>;
}

// ── 5 · The Ember Theatre: a raised stage, red curtains, the painted fall of Briarwatch, footlights and the east wing ──
const stage:Part[]=[[0,.45,-7.5,11,.9,3.8]],apron:Part[]=[[0,.93,-5.63,11,.06,.08]],proscenium:Part[]=[[-5.6,2.7,-6.1,.7,5.4,.7],[5.6,2.7,-6.1,.7,5.4,.7],[0,5.3,-6.1,11.9,.7,.7]];
const curtains:Part[]=[[-4.5,3.1,-6,1.5,4.4,.3],[4.5,3.1,-6,1.5,4.4,.3],[0,4.65,-5.95,9.6,.7,.18]];
const backdrop:Part[]=[[0,3.2,-9.25,11,5,.1]],painted:Part[]=[[-2.6,2.6,-9.18,.9,2.6,.01],[-2.6,4.15,-9.18,.5,.5,.01,0,0,Math.PI/4],[1.8,1.8,-9.18,3.2,.8,.01],[3.4,2.3,-9.18,.7,1.1,.01],[-.6,1.6,-9.18,1.6,.4,.01]],flames:Part[]=[[1.4,2.5,-9.17,.5,.9,.01,0,0,.2],[3.6,3.1,-9.17,.4,.7,.01,0,0,-.2],[-1.4,2.1,-9.17,.35,.6,.01]];
const footlights:Part[]=Array.from({length:10},(_,i)=>[-4.5+i,1.08,-5.78,.45,.45,.45] as Part),footCups:Part[]=Array.from({length:10},(_,i)=>[-4.5+i,.98,-5.78,.12,.08,.12] as Part);
const wing:Part[]=[[6,1.6,-3.6,.12,3.2,1.8],[6.05,1.6,-1,.12,3,1.4,.2]],costumeRack:Part[]=[[6.8,1.8,.6,.06,.06,1.6,0,Math.PI/2],[6.8,.9,-.2,.06,1.8,.06],[6.8,.9,1.4,.06,1.8,.06]];
const costumes:Part[]=[[6.8,1.25,.1,.12,1,.42],[6.8,1.3,.6,.12,.9,.38],[6.8,1.2,1.05,.12,1.1,.4]],masks:Part[]=[[6.05,2.4,-3.9,.16,.03,.16,0,0,Math.PI/2],[6.05,2.4,-3.3,.16,.03,.16,0,0,Math.PI/2]];
const writerDesk:Part[]=[[7,0,-4.8,1.6,2.2,1.4,0]],scripts:Part[]=[[6.9,.84,-5.1,.3,1,.4,.3],[7.1,.84,-4.6,.28,1,.36,-.2]];
const audience:Part[]=[[-6.9,0,-3.2,2.4,2.4,2.4,Math.PI/2],[-6.9,0,-1.2,2.4,2.4,2.4,Math.PI/2],[-6.9,0,.8,2.4,2.4,2.4,Math.PI/2],[-6.9,0,2.8,2.4,2.4,2.4,Math.PI/2],[-1.4,0,6.6,2.4,2.4,2.4,0],[1.6,0,6.6,2.4,2.4,2.4,0]];
const aisle:Part[]=[[0,.005,.6,2.2,.01,11.6]];
function EmberTheatre({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 const rock=useMemo(()=>cavern(53,[-6.8,6.8],1.2,8.2),[]);
 return <>
  <Floor parts={grid12} color="#4d3f3a" jitter={.25} ground="#1a1314"/><Ash ctx={ctx} seed={5} n={7}/>
  <group userData={{blocksLabels:true}}>
   <Solid ctx={ctx} parts={rock} geometry={geo.rock} color="#463d3a" flat jitter={.2} radius={round}/>
   <Solid ctx={ctx} parts={stage} color="#3d2a20" radius={back}/><Solid ctx={ctx} parts={proscenium} color="#5a3b2a" radius={fixed(.4)}/><Solid ctx={ctx} parts={curtains} color="#7c1f24" jitter={.08} radius={back}/>
   <Solid ctx={ctx} parts={backdrop} color="#40303d" radius={back} shadow={false}/>
   <Solid ctx={ctx} parts={wing} color="#56473b" radius={side}/><Solid ctx={ctx} parts={costumeRack} geometry={geo.cyl} color="#3c3027" radius={fixed(.1)}/><Solid ctx={ctx} parts={costumes} color="#8a4a5c" jitter={.6} radius={side}/>
   <SolidKit ctx={ctx} url={TOWN.stall} parts={writerDesk} radius={fixed(.8)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#a08a78',.92)}/>
   <SolidKit ctx={ctx} url={TOWN.bench} parts={audience} radius={fixed(1.15)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#8a7666',.92)}/>
  </group>
  <group>
   <Instances parts={apron} color="#b4904c" roughness={.4} metalness={.6} shadow={false}/>
   <Instances parts={painted} color="#1c1418" material={decal('#1d1519')} shadow={false}/><Instances parts={flames} color="#e0703a" material={decal('#e2733b')} shadow={false}/>
   <Instances parts={footCups} geometry={geo.cyl} color="#3a3330" roughness={.5} metalness={.5} shadow={false}/><Instances parts={footlights} geometry={geo.flame} color="#ffc070" material={decal('#ffc070')} shadow={false}/>
   <Instances parts={masks} geometry={geo.cyl} color="#e8dcc2" shadow={false}/>
   <Instances parts={scripts} geometry={geo.disc} color="#e6dcc4" material={decal('#e3d9c0')} shadow={false}/>
   <Instances parts={aisle} color="#5a1c20" material={decal('#4c1a1d',.55)} shadow={false}/>
   <Flame position={[7.3,.88,-4.3]} size={.25} reduced={reduced}/>
  </group>
  <pointLight position={[0,1.6,-5]} color="#ffbe78" intensity={14} distance={8}/><pointLight position={[0,4.4,-8.2]} color="#d86a6a" intensity={8} distance={8}/><pointLight position={[6.4,2.2,-2.6]} color="#ffb070" intensity={5} distance={6}/>
  <Embers count={70} reduced={reduced} color="#ff7d4f"/>
 </>;
}

// ── 6 · The Furnace Heart: the great furnace and its tuning stone, the hidden coal channel, chains into the prison below ──
const furnace:Part[]=[[0,.4,-8.8,2.9,.8,2.9],[0,2.2,-8.8,2.6,3.6,2.6]],furnaceCone:Part[]=[[0,4.8,-8.8,2.8,1.8,2.8]],flue:Part[]=[[.9,8.6,-9.1,.8,6,.8]];
const furnaceBands:Part[]=Array.from({length:6},(_,i)=>{const a=Math.PI*(.12+i*.152);return [Math.cos(a)*2.62,2.2,-8.8+Math.sin(a)*2.62,.16,3.7,.16,-a] as Part;});
const stoneCage:Part[]=[[0,.4,-6.1,1,.8,1]],cageRibs:Part[]=[0,1,2,3].map(i=>[Math.cos(i*Math.PI/2+.78)*.5,1.5,-6.1+Math.sin(i*Math.PI/2+.78)*.5,.05,1.4,.05] as Part);
const coalTrough:Part[]=[[-6.05,.28,-1,.16,.56,11],[-7.25,.28,-1,.16,.56,11],[-6.65,.05,-1,1.2,.1,11]],coal:Part[]=Array.from({length:30},(_,i)=>[-6.65+(rand(i)-.5)*.8,.2+rand(i+3)*.1,-6+i*.36,.16+rand(i+7)*.1,.12,.16,i] as Part);
const coalCart:Part[]=[[-6.65,0,5.6,1.7,1.7,1.7]],engineerBench:Part[]=[[6.9,0,-3.4,2.3,2.4,2.3,Math.PI/2]],plans:Part[]=[[6.85,.87,-3.4,.22,1,.3,.2]];
const grates:Part[]=[[-4.3,.006,-6.4,1.2,1,1.2],[4.3,.006,-6.4,1.2,1,1.2]],draw:Part[]=[[-2.2,.007,-6.1,.06,.01,3.4,1.25],[2.2,.007,-6.1,.06,.01,3.4,-1.25],[-4.3,.006,-7.8,.06,.01,2,0],[4.3,.006,-7.8,.06,.01,2,0]];
const prisonerChains=[...chain(-4.3,-6.4,.2,9),...chain(4.3,-6.4,.2,9),...chain(-4.7,-6.8,.2,9)];
const scorch:Part[]=[[0,.004,-5.2,4.5,1,1.8],[0,.005,-3.8,2.4,1,1.2]];
function FurnaceHeart({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 const rock=useMemo(()=>cavern(67,[-4.4,4.4],1.25,7.5),[]),stone=useRef<THREE.Mesh>(null);
 useFrame(({clock})=>{if(stone.current&&!reduced)stone.current.rotation.y=clock.elapsedTime*.6;});
 return <>
  <Floor parts={brokenGrid} color="#5c4034" jitter={.3} ground="#2a1813"/><Ash ctx={ctx} seed={6} n={10}/>
  <group userData={{blocksLabels:true}}>
   <Solid ctx={ctx} parts={rock} geometry={geo.rock} color="#4a3832" flat jitter={.22} radius={round}/>
   <Solid ctx={ctx} parts={furnace} geometry={geo.cyl} color="#4a342b" radius={round}/><Solid ctx={ctx} parts={furnaceCone} geometry={geo.cone} color="#3d2c25" radius={round}/><Solid ctx={ctx} parts={flue} geometry={geo.cyl} color="#2f2522" radius={round}/>
   <Solid ctx={ctx} parts={furnaceBands} color="#2b2522" roughness={.5} metalness={.6} radius={fixed(.2)}/>
   <Solid ctx={ctx} parts={stoneCage} geometry={geo.cyl} color="#3a3330" roughness={.5} metalness={.5} radius={fixed(.6)}/><Solid ctx={ctx} parts={cageRibs} color="#3a3330" roughness={.5} metalness={.6} radius={fixed(.1)}/>
   <Solid ctx={ctx} parts={coalTrough} color="#3b302a" radius={side}/><Solid ctx={ctx} parts={coal} geometry={geo.rock} color="#1d1916" flat radius={fixed(.2)}/>
   <SolidKit ctx={ctx} url={TOWN.cart} parts={coalCart} radius={fixed(1.2)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#6e5c50',.92)}/>
   <SolidKit ctx={ctx} url={TOWN.stall} parts={engineerBench} radius={fixed(1)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#a2907f',.92)}/>
  </group>
  <group>
   {/* The furnace mouth and the third tuning stone burning in its cage. */}
   <mesh position={[0,1.6,-6.16]} material={decal('#ff9d3f')} raycast={noRaycast}><planeGeometry args={[2,2.2]}/></mesh><mesh position={[0,1.4,-6.14]} material={decal('#ffe2a0')} raycast={noRaycast}><planeGeometry args={[1.2,1.3]}/></mesh>
   <mesh ref={stone} position={[0,1.5,-6.1]} raycast={noRaycast}><octahedronGeometry args={[.42]}/><meshStandardMaterial color="#ffcf8a" emissive="#ff8a2a" emissiveIntensity={1.6}/></mesh>
   <Instances parts={grates} geometry={geo.disc} color="#0b0a0d" material={decal('#0c0b10')} shadow={false}/><Instances parts={draw} color="#9a6cff" material={decal('#9b74ff',.55)} shadow={false}/>
   <Instances parts={prisonerChains} geometry={geo.link} color="#4f5052" roughness={.5} metalness={.7} shadow={false}/>
   <Instances parts={plans} geometry={geo.disc} color="#c8d6e6" material={decal('#bccbdb')} shadow={false}/>
   <Instances parts={scorch} geometry={geo.disc} color="#130d0b" material={decal('#140e0b',.5)} shadow={false}/>
  </group>
  <pointLight position={[0,2.4,-5.4]} color="#ff7f30" intensity={26} distance={13}/><pointLight position={[-4.3,.6,-6.4]} color="#9a6cff" intensity={5} distance={5}/><pointLight position={[4.3,.6,-6.4]} color="#9a6cff" intensity={5} distance={5}/>
  <Embers count={200} reduced={reduced} color="#ffa040" speed={.6} size={.1}/>
 </>;
}

// ── 7 · The Council of Three: the guild hall, its balcony with three seats, banners and the ledger table ──
const hallBack:Part[]=[-8,-4,0,4,8].map(x=>[x,0,-9.6,1,1.2,1] as Part),hallSide:Part[]=[-6,-2,2].map(z=>[-8.6,0,z,1,1.2,1,Math.PI/2] as Part);
const hallColumns:Part[]=[[-4.6,0,-6.2,.5,.8,.5],[-1.8,0,-6.2,.5,.8,.5],[1.8,0,-6.2,.5,.8,.5],[4.6,0,-6.2,.5,.8,.5],[-6.3,0,1.6,.5,1.2,.5]];
const balcony:Part[]=[[0,3.35,-7.9,11.4,.3,3.8]],balustrade:Part[]=[[0,4.25,-6.05,11.2,.12,.14],...Array.from({length:23},(_,i)=>[-5.5+i*.5,3.85,-6.05,.08,.7,.08] as Part)];
const seats:Part[]=[-2.6,0,2.6].flatMap(x=>[[x,3.85,-8.4,1,.7,.9],[x,4.9,-8.85,1.1,2.4,.18]] as Part[]),ledgerTable:Part[]=[[0,3.95,-7.2,2.2,.12,.8]],ledgers:Part[]=[[-.6,4.07,-7.2,.42,.12,.3,.2],[.1,4.07,-7.25,.4,.14,.32,-.1],[.7,4.08,-7.15,.36,.16,.3,.3]];
const councilBanners:[string,Part[]][]=[['#7e2a22',[[-2.6,2.4,-5.95,1.1,1.7,.05]]],['#b08a3a',[[0,2.4,-5.95,1.1,1.7,.05]]],['#2f5a3e',[[2.6,2.4,-5.95,1.1,1.7,.05]]]];
const hallStair:Part[]=Array.from({length:8},(_,i)=>[-7.1,(i+1)*.21,.6-i*.6,1.6,(i+1)*.42,.6] as Part).concat([[-7.1,1.7,-5.6,1.6,3.4,4]]);
const sideBanners:Part[]=[[-7.95,0,-2,1.2,1.3,1.2,Math.PI/2],[-7.95,0,2,1.2,1.3,1.2,Math.PI/2]];
const carpet:Part[]=[[0,.005,.2,2.2,.01,10.4]],carpetEdge:Part[]=[[-1.15,.006,.2,.1,.01,10.4],[1.15,.006,.2,.1,.01,10.4]];
const sootStreaks:Part[]=[[-4,1.6,-9.05,1.6,2.6,.01],[3.2,1.4,-9.05,1.2,2.2,.01]];
function CouncilOfThree({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 return <>
  <Floor parts={checkA} color="#6a5c4c" jitter={.12}/><Instances parts={checkB} color="#3a302a" jitter={.12} shadow={false}/><Ash ctx={ctx} seed={7} n={4}/>
  <group userData={{blocksLabels:true}}>
   <SolidKit ctx={ctx} url={DUNGEON.wallArched} parts={hallBack} radius={fixed(.6)}/><SolidKit ctx={ctx} url={DUNGEON.wall} parts={hallSide} radius={fixed(.6)}/>
   <SolidKit ctx={ctx} url={DUNGEON.pillar} parts={hallColumns} radius={fixed(.4)}/>
   <Solid ctx={ctx} parts={balcony} color="#4a3b30" radius={back}/><Solid ctx={ctx} parts={balustrade} color="#6b5a46" radius={fixed(.1)}/>
   <Solid ctx={ctx} parts={seats} color="#3c2a20" radius={fixed(.6)}/><Solid ctx={ctx} parts={ledgerTable} color="#4e3828" radius={back}/><Solid ctx={ctx} parts={ledgers} color="#6d2f26" jitter={.5} radius={fixed(.3)}/>
   {councilBanners.map(([color,parts])=><Solid key={color} ctx={ctx} parts={parts} color={color} jitter={0} radius={back}/>)}
   <Solid ctx={ctx} parts={hallStair} color="#5a5248" jitter={.12} radius={side}/>
   <SolidKit ctx={ctx} url={DUNGEON.banner} parts={sideBanners} radius={fixed(.6)}/>
  </group>
  <group>
   <Instances parts={carpet} color="#5c1e1c" material={decal('#561d1b',.85)} shadow={false}/><Instances parts={carpetEdge} color="#b08a3a" material={decal('#a7843a',.85)} shadow={false}/>
   <Instances parts={sootStreaks} color="#120d0b" material={decal('#120d0b',.45)} shadow={false}/>
   {[-1,1].map(s=><Flame key={s} position={[s*5.6,4,-6.3]} size={.5} reduced={reduced}/>)}
  </group>
  <pointLight position={[0,5.4,-6.4]} color="#ffd59a" intensity={16} distance={11}/><pointLight position={[0,3,-3]} color="#ffcf9a" intensity={9} distance={10}/>
  <Embers count={25} reduced={reduced} speed={.2}/>
 </>;
}

// ── 8 · The Rootlift: the freight cage under its headframe, roots wider than houses, Tavin’s handprint ──
const cagePosts:Part[]=[[-1.7,0,-6.4,2.6,6.2,2.6],[1.7,0,-6.4,2.6,6.2,2.6],[-1.7,0,-9,2.6,6.2,2.6],[1.7,0,-9,2.6,6.2,2.6]];
const cageFrame:Part[]=[[0,.1,-7.7,3.4,.2,2.6],[0,2.9,-7.7,3.5,.14,2.7],[0,6.2,-6.4,4,.3,.3],[0,6.2,-9,4,.3,.3],[0,9.2,-7.7,.3,.3,3]];
const cageBars:Part[]=[...[-1.2,-.7,-.2,.3].map(x=>[x,1.5,-6.4,.04,2.8,.04] as Part),...[-8.4,-7.8,-7.2,-6.8].flatMap(z=>[-1.7,1.7].map(x=>[x,1.5,z,.04,2.8,.04] as Part)),[0,1.5,-9,3.4,.04,.04]];
const cables:Part[]=[[-.4,6,-7.7,.03,6.2,.03],[.4,6,-7.7,.03,6.2,.03],[2.3,5.4,-8.2,.03,7.4,.03]],counterweight:Part[]=[[2.3,1.9,-8.2,.6,1.2,.6]],headPosts:Part[]=[[-2.2,4.6,-7.7,.3,9.2,.3,0,0,.1],[2.2,4.6,-7.7,.3,9.2,.3,0,0,-.1]];
const freight:Part[]=[[6.8,0,-5.8,.75,.75,.75,.4]],freightBoxes:Part[]=[[-6.7,0,-5.9,.75,.75,.75,.3],[6.6,0,-2.6,.6,.6,.6,1.1]];
const letterSacks:Part[]=[[-3,.28,-6.2,.42,.36,.38,1],[-3.6,.25,-6.5,.36,.3,.34,2],[3.2,.27,-6,.4,.34,.36,3]],letters:Part[]=[[-3,.62,-6.2,.2,1,.14,.4],[3.2,.6,-6,.18,1,.13,1]];
const shaftDark:Part[]=[[0,.003,-7.7,3.6,.01,2.9]],handprint:Part[]=[[.85,1.55,-6.36,.16,.2,.01],[.73,1.78,-6.36,.04,.18,.01,0,0,.25],[.81,1.82,-6.36,.04,.2,.01,0,0,.08],[.89,1.83,-6.36,.04,.2,.01,0,0,-.05],[.97,1.79,-6.36,.04,.17,.01,0,0,-.2],[1,1.55,-6.36,.04,.13,.01,0,0,-.9]];
const rootPaths:[number,[number,number,number][]][]=[[1.3,[[-10,9,-10],[-6.8,4.4,-8.4],[-4.4,1.3,-7.6],[-3.2,-1,-6.9]]],[1.1,[[9,9,-11],[6,4.4,-8.8],[4.3,1.2,-7.4],[3.6,-1.2,-6.8]]],[.9,[[-10.5,7,4],[-8.2,3,1.4],[-7.2,.7,-1.6],[-7.4,-1,-4.8]]],[.6,[[-4,9,-10],[-1.6,6.6,-9.4],[1.4,5.4,-9.6],[4,6.4,-10]]]];
function Roots(){
 const geometries=useMemo(()=>rootPaths.map(([r,points])=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,r,7,false)),[]);
 useEffect(()=>()=>geometries.forEach(g=>g.dispose()),[geometries]);
 return <>{geometries.map((g,i)=><mesh key={i} geometry={g} material={mat('#6a5038',1)} castShadow={i<2} receiveShadow raycast={noRaycast}/>)}</>;
}
function Rootlift({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 const rock=useMemo(()=>cavern(83,[-3.4,3.4],1.3,8),[]);
 return <>
  <Floor parts={brokenGrid} color="#4c4538" jitter={.3} ground="#16140f"/><Ash ctx={ctx} seed={8} n={6}/>
  <group userData={{blocksLabels:true}}>
   <Solid ctx={ctx} parts={rock} geometry={geo.rock} color="#48433a" flat jitter={.2} radius={round}/>
   <SolidKit ctx={ctx} url={TOWN.post} parts={cagePosts} radius={fixed(.3)} material={mapTint('/assets/env/kenney-fantasy-town/Textures/colormap.png','#8e7a68',.92)}/>
   <Solid ctx={ctx} parts={cageFrame} color="#3e3026" radius={back}/><Solid ctx={ctx} parts={headPosts} color="#3a2d24" radius={fixed(.3)}/>
   <Solid ctx={ctx} parts={counterweight} color="#3d3d3c" roughness={.5} metalness={.6} radius={fixed(.4)}/>
   <SolidKit ctx={ctx} url={DUNGEON.crates} parts={freight} radius={fixed(.85)}/><SolidKit ctx={ctx} url={DUNGEON.box} parts={freightBoxes} radius={fixed(.6)}/>
   <Solid ctx={ctx} parts={letterSacks} geometry={geo.rock} color="#8c7a5e" flat jitter={.2} radius={round}/>
   <Roots/>
  </group>
  <group>
   <Instances parts={cageBars} geometry={geo.cyl} color="#5a6058" roughness={.5} metalness={.6} shadow={false}/><Instances parts={cables} geometry={geo.cyl} color="#2c2b28" shadow={false}/>
   <mesh position={[0,9.2,-7.7]} rotation={[0,Math.PI/2,0]} material={mat('#4a4844',.5,.6)} raycast={noRaycast}><torusGeometry args={[.9,.12,6,16]}/></mesh>
   <Instances parts={shaftDark} geometry={geo.disc} color="#040605" material={decal('#050706')} shadow={false}/>
   <Instances parts={handprint} color="#a6f0dc" material={decal('#a6f0dc',.85)} shadow={false}/>
   <Instances parts={letters} geometry={geo.disc} color="#e8e0cc" material={decal('#e6decb')} shadow={false}/>
  </group>
  <pointLight position={[0,.6,-7.7]} color="#79d6a2" intensity={12} distance={8}/><pointLight position={[2.4,4.4,-6]} color="#ffbf7a" intensity={9} distance={9}/>
  <Embers count={35} reduced={reduced} speed={.2} color="#ffb070"/>
 </>;
}

const ROOMS:Record<string,(p:{ctx:RoomCtx;reduced:boolean})=>ReactNode>={'market-1':CinderGate,'market-2':GlassblowerStall,'market-3':BoneAuction,'market-4':WellUnderForge,'market-5':EmberTheatre,'market-6':FurnaceHeart,'market-7':CouncilOfThree,'market-8':Rootlift};
export default function AshMarket({scene,save,reduced}:RoomProps){const Room=ROOMS[scene]??CinderGate;return <Room key={scene} ctx={{save,scene}} reduced={reduced}/>;}
