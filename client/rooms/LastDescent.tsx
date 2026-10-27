import {useEffect,useMemo,useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {Instances,KitInstances,Flame,chain,mat,decal,geo,noRaycast,rand,useSolidParts,type MoodOverride,type Part,type RoomProps,type Vec3} from './kit';
import IsolatedAsset from '../IsolatedAsset';

// Last Descent (depth-1 … depth-8): the deep core below Briarwatch. Raw cavern, the founders' machine, the bell's resonance and glowing seams.
// Every room shares one encounter footprint (±5.4 m) and the same markers, so solid dressing stands outside it:
// tall landmarks at −z and −x, low edges at +x/+z for the camera. Inside the footprint only floor slabs, seams and decals.
// Seams and crystals are static emissive materials. Gears, the blade ring and the morning motes move only when `reduced` is off.

// ── Kit files: full literals so the asset gate can follow them ──
const K={wall:'/assets/env/kaykit-dungeon/wall.glb',arched:'/assets/env/kaykit-dungeon/wall_arched.glb',door:'/assets/env/kaykit-dungeon/wall_doorway.glb',broken:'/assets/env/kaykit-dungeon/wall_broken.glb',tile:'/assets/env/kaykit-dungeon/floor_tile_large.glb',box:'/assets/env/kaykit-dungeon/box_large.glb',barrel:'/assets/env/kaykit-dungeon/barrel_large.glb',crates:'/assets/env/kaykit-dungeon/crates_stacked.glb',table:'/assets/env/kaykit-dungeon/table_medium.glb',candle:'/assets/env/kaykit-dungeon/candle_lit.glb'};
const A={bed:'/assets/env/kaykit-archive/bed_frame.glb',grate:'/assets/env/kaykit-archive/floor_tile_big_grate.glb'};
const G={obelisk:'/assets/env/kenney-graveyard-descent/pillar-obelisk.glb',plaque:'/assets/env/kenney-graveyard-descent/gravestone-wide.glb',broken:'/assets/env/kenney-graveyard-descent/gravestone-broken.glb',square:'/assets/env/kenney-graveyard-descent/pillar-square.glb',column:'/assets/env/kenney-graveyard-descent/column-large.glb',altar:'/assets/env/kenney-graveyard-descent/altar-stone.glb',brazier:'/assets/env/kenney-graveyard-descent/fire-basket.glb',lantern:'/assets/env/kenney-graveyard-descent/lantern-candle.glb',urn:'/assets/env/kenney-graveyard-descent/urn-round.glb',debris:'/assets/env/kenney-graveyard-descent/debris.glb'};

// ── Materials: shared per key, like kit mat() ──
const cache=new Map<string,THREE.Material>();
const cached=<M extends THREE.Material>(key:string,make:()=>M):M=>{let m=cache.get(key);if(!m)cache.set(key,m=make());return m as M;};
let colormap:THREE.Texture|undefined;
/** Kenney Graveyard pieces share one colormap; this is the cached copy under a multiply tint, so every tint costs one material. */
const grave=(tint:string)=>cached('grave'+tint,()=>{colormap??=Object.assign(new THREE.TextureLoader().load('/assets/env/kenney-graveyard-descent/Textures/colormap.png'),{flipY:false,colorSpace:THREE.SRGBColorSpace});return new THREE.MeshStandardMaterial({map:colormap,color:tint,roughness:.9});});
/** Static emissive: seams, crystals and tuning stones. Nothing here pulses. */
const glow=(color:string,emissive:string,intensity=1,opacity=1)=>cached(['glow',color,emissive,intensity,opacity].join(),()=>new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:intensity,roughness:.3,metalness:.1,transparent:opacity<1,opacity,depthWrite:opacity>=1}));
const lit=(color:string,opacity=1)=>cached(['lit',color,opacity].join(),()=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1}));
const beam=(color:string,opacity:number)=>cached(['beam',color,opacity].join(),()=>new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
const darkGlass=new THREE.MeshStandardMaterial({color:'#07060c',emissive:'#1c0d33',emissiveIntensity:.8,roughness:.06,metalness:.9});
const bronze=new THREE.MeshStandardMaterial({color:'#8a6a3c',roughness:.38,metalness:.75,side:THREE.DoubleSide});

// ── Shared geometry: built once, instanced or reused by every placement ──
const plane=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),wallPlane=new THREE.PlaneGeometry(1,1),ground=new THREE.CircleGeometry(30,32).rotateX(-Math.PI/2);
const shard=new THREE.OctahedronGeometry(1,0),orb=new THREE.IcosahedronGeometry(1,1),ring=new THREE.TorusGeometry(1,.08,6,32),capsule=new THREE.CapsuleGeometry(.5,1,3,8);
/** A spur gear of radius 1 in the xy plane, centred on its axle. */
function gearGeo(teeth:number,depth=.22){
 const s=new THREE.Shape(),step=Math.PI*2/teeth;
 for(let i=0;i<teeth;i++){const a=i*step,pts:[number,number][]=[[.82,a],[1,a+step*.18],[1,a+step*.45],[.82,a+step*.63]];pts.forEach(([r,t],k)=>i===0&&k===0?s.moveTo(Math.cos(t)*r,Math.sin(t)*r):s.lineTo(Math.cos(t)*r,Math.sin(t)*r));}
 const hole=new THREE.Path();hole.absarc(0,0,.22,0,Math.PI*2,true);s.holes.push(hole);
 return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:4}).translate(0,0,-depth/2);
}
const GEAR=gearGeo(14),GEAR_SMALL=gearGeo(9);
/** Briarwatch's bell profile, 1.3 m tall at scale 1, lip at y=0. */
const BELL=new THREE.LatheGeometry([[0,1.32],[.24,1.3],[.36,1.22],[.42,1.02],[.45,.74],[.52,.42],[.66,.18],[.84,.04],[.9,0],[.86,-.03],[.8,0]].map(([x,y])=>new THREE.Vector2(x,y)),28);

// ── Layout helpers ──
type Ctx={save:RoomProps['save'];scene:string};
const thin=(p:Part)=>Math.min(p[3],p[5])/2,fixed=(r:number)=>()=>r;
/** Instanced primitives that stand on the floor: kept only clear of walkable tiles and markers (useSolidParts). */
function Solid({room,parts,r=thin,...rest}:{room:Ctx;parts:Part[];r?:(p:Part)=>number}&Omit<Parameters<typeof Instances>[0],'parts'>){const kept=useSolidParts(room.save,room.scene,parts,r);return kept.length?<Instances parts={kept} {...rest}/>:null;}
/** Kit model instances that stand on the floor; `size` is the model's native half-footprint in metres, scaled per part. */
function SolidKit({room,url,parts,size=.5,shadow,material}:{room:Ctx;url:string;parts:Part[];size?:number;shadow?:boolean;material?:THREE.Material}){const kept=useSolidParts(room.save,room.scene,parts,p=>size*Math.min(p[3],p[5]));return <KitInstances url={url} parts={kept} shadow={shadow} material={material}/>;}
// Kaykit atlases are pale; a cloned, tinted copy of the kit material darkens it without losing the texture. Cached per file and tint.
function TintedInstances({url,parts,tint,shadow}:{url:string;parts:Part[];tint:string;shadow?:boolean}){
 const {scene}=useGLTF(url),material=cached('kay'+url+tint,()=>{let base:THREE.Material|undefined;scene.traverse(n=>{const mesh=n as THREE.Mesh;if(mesh.isMesh&&!base)base=mesh.material as THREE.Material;});const m=(base as THREE.MeshStandardMaterial).clone();m.color.set(tint);return m;});
 return <KitInstances url={url} parts={parts} shadow={shadow} material={material}/>;
}
/** Same loading and retry boundary as KitInstances: TintedInstances reads the GLB itself. Floors and wall-hung pieces use this directly. */
function TintedKit({url,parts,tint,shadow}:{url:string;parts:Part[];tint:string;shadow?:boolean}){if(!parts.length)return null;const [x,y,z]=parts[0];return <IsolatedAsset url={url} id={'tinted:'+url+tint} name="Scenery" position={[x,y+1,z]}><TintedInstances url={url} parts={parts} tint={tint} shadow={shadow}/></IsolatedAsset>;}
/** Tinted kit pieces that stand on the floor, filtered like SolidKit. */
function Tinted({room,parts,size=.5,...rest}:{room:Ctx;url:string;parts:Part[];tint:string;shadow?:boolean;size?:number}){const kept=useSolidParts(room.save,room.scene,parts,p=>size*Math.min(p[3],p[5]));return <TintedKit parts={kept} {...rest}/>;}
/** Kit walls: pieces centred on x along a back line at z, or on z along a side line at x. */
const back=(z:number,xs:number[],sy=1):Part[]=>xs.map(x=>[x,0,z,1,sy,1]),side=(x:number,zs:number[],sy=1):Part[]=>zs.map(z=>[x,0,z,1,sy,1,Math.PI/2]);
/** 4 m kit floor tiles over ±8 m. */
const kitFloor=(y=-.05):Part[]=>[-6,-2,2,6].flatMap((x,i)=>[-6,-2,2,6].map((z,k)=>[x,y,z,1,1,1,((i+k)%4)*Math.PI/2] as Part));
function Light({position,color,intensity=8,distance=8}:{position:Vec3;color:string;intensity?:number;distance?:number}){return <pointLight position={position} color={color} intensity={intensity} distance={distance} decay={2}/>;}
/** Turns its children about one axis; holds still under reduced motion. */
function Spin({position,rotation,speed,axis='z',reduced,children}:{position:Vec3;rotation?:Vec3;speed:number;axis?:'y'|'z';reduced:boolean;children:ReactNode}){const ref=useRef<THREE.Group>(null);useFrame((_,dt)=>{if(ref.current&&!reduced)ref.current.rotation[axis]+=dt*speed;});return <group position={position} rotation={rotation}><group ref={ref}>{children}</group></group>;}

/** Square stone slabs on the 1.2 m tactical grid (or larger plates), so cells read in Echo too. The gaps show the seam plane beneath. */
const slabs=(size:number,extent=8.4,gap=.07,pick:(i:number,j:number)=>boolean=()=>true):Part[]=>{const out:Part[]=[],n=Math.round(extent/size);for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++)if(pick(i,j))out.push([i*size,-.1-rand(i*31+j*7)*.015,j*size,size-gap,.2,size-gap]);return out;};
/** Floor: slabs over a static glowing seam plane (or plain dark ground) and the cavern floor beyond. */
function Floor({parts,color,seam,base='#0c0a10',jitter=.16,extent=8.4,roughness=.9,metalness=0}:{parts:Part[];color:string;seam?:string;base?:string;jitter?:number;extent?:number;roughness?:number;metalness?:number}){
 const w=extent*2+1.2;
 return <><mesh geometry={ground} material={mat(base,1)} position={[0,-.24,0]} receiveShadow raycast={noRaycast}/>
  {seam&&<mesh geometry={plane} material={lit(seam)} position={[0,-.15,0]} scale={[w,1,w]} raycast={noRaycast}/>}
  <Instances parts={parts} color={color} jitter={jitter} roughness={roughness} metalness={metalness} shadow={false}/></>;
}
/** Raw cavern rock: tall behind (−z) and west (−x), low east (+x) and south (+z). `gap` keeps the back clear for the room's landmark. */
function cavern(seed:number,{back=-7.6,gap=[0,0] as [number,number],tall=1,west=-7.4,east=6.6,south=6.6,low=1}={}):Part[]{
 const out:Part[]=[];
 for(let i=0;i<16;i++){const x=-14+i*1.85+rand(seed+i)*.7;if(x>gap[0]-1.2&&x<gap[1]+1.2)continue;const s=1.4+rand(seed+i+20)*1.1;out.push([x,s*.8*tall,back-s*1.05,s*1.25,s*2*tall,s,seed+i,rand(seed+i+3)*.4,0]);}
 for(let i=0;i<11;i++){const z=-9+i*1.65+rand(seed+i+40)*.5,s=1.2+rand(seed+i+50)*.9;out.push([west-s*1.05,s*.7*tall,z,s,s*1.7*tall,s*1.15,seed+i+7,0,rand(seed+i+60)*.3]);}
 for(let i=0;i<10;i++){const z=-8+i*1.5,s=(.35+rand(seed+i+70)*.4)*low;out.push([east+s*1.1,s*.22,z,s*1.3,s*.6,s,seed+i]);}
 for(let i=0;i<10;i++){const x=-7+i*1.5,s=(.35+rand(seed+i+80)*.4)*low;out.push([x,s*.22,south+s*1.1,s*1.3,s*.6,s,seed+i]);}
 return out;
}
function Cavern({room,parts,color,shadow=true}:{room:Ctx;parts:Part[];color:string;shadow?:boolean}){return <Solid room={room} parts={parts} geometry={geo.rock} color={color} flat jitter={.22} shadow={shadow}/>;}
/** A crystal cluster: tilted shards half-sunk at (x,z). */
const cluster=(x:number,z:number,n:number,seed:number,s=1,y=0):Part[]=>Array.from({length:n},(_,i)=>{const h=(.5+rand(seed+i)*.9)*s,a=rand(seed+i+5)*Math.PI*2,d=rand(seed+i+9)*.45*s;return [x+Math.cos(a)*d,y+h*.35,z+Math.sin(a)*d,h*.22,h,h*.22,rand(seed+i+2)*3,Math.cos(a)*.45,Math.sin(a)*.45] as Part;});
/** Thin bright lines on the floor (decals, free to cross the footprint): [x0,z0,x1,z1,width]. */
const lines=(segs:[number,number,number,number,number?][],y=.004):Part[]=>segs.map(([x0,z0,x1,z1,w=.06],i)=>[(x0+x1)/2,y+i*.0002,(z0+z1)/2,w,.002,Math.hypot(x1-x0,z1-z0),Math.atan2(x1-x0,z1-z0)]);
/** A jagged crack from (x,z) heading `a` for `len` metres in `n` kinks. */
function crack(x:number,z:number,a:number,len:number,n:number,seed:number,w=.05):[number,number,number,number,number][]{const out:[number,number,number,number,number][]=[];let px=x,pz=z;for(let i=0;i<n;i++){const t=a+(rand(seed+i)-.5)*1.1,l=len/n,nx=px+Math.sin(t)*l,nz=pz+Math.cos(t)*l;out.push([px,pz,nx,nz,w*(1-i/n*.6)]);px=nx;pz=nz;}return out;}

const iron=mat('#3b3640',.45,.7),brass=mat('#a07a3e',.35,.8),steel=mat('#c4c7cf',.25,.85);
const discZ=new THREE.CircleGeometry(1,40);

// ── depth-1 The Founders' Descent: a monolithic black stair, founders' names chiselled out and numbered, a marked side exit ──
const fdSteps:Part[]=Array.from({length:12},(_,i)=>{const h=(i+1)*.36;return [0,h/2,-6.1-i*.62,6.4,h,.62] as Part;}).concat([[0,2.16,-14.2,6.4,4.32,2]]);
const fdNosing:Part[]=Array.from({length:12},(_,i)=>[0,(i+1)*.36+.004,-5.82-i*.62,6.2,.012,.05]);
const fdCheeks:Part[]=[[-4.1,2.9,-9.7,1.6,5.8,7.8],[4.1,2.9,-9.7,1.6,5.8,7.8]],fdNameWalls:Part[]=[[-7.3,2.6,-7.7,4.8,5.2,1.4],[7.3,2.6,-7.7,4.8,5.2,1.4]];
const fdPlaques:Part[]=[-1,1].flatMap(s=>[5.7,6.9,8.1].flatMap(x=>[.6,1.6,2.6,3.6].map(y=>[s*x,y,-6.92,1.25,1.25,.6] as Part)));
const fdScars:Part[]=fdPlaques.map(([x,y,z],i)=>[x+(rand(i)-.5)*.1,y+.38,z+.1,.66+rand(i+3)*.12,.2,.01,0,0,(rand(i+7)-.5)*.08]);
const fdNumbers:Part[]=fdPlaques.flatMap(([x,y,z],i)=>Array.from({length:1+i%3},(_,k)=>[x-.12+k*.12,y+.38,z+.112,.035,.15,.01] as Part));
/** Obelisks crown the stair cheeks and flank the marked emergency exit in the west wall. */
const fdObelisks:Part[]=[[-4.1,5.8,-6.4,3,3.4,3],[4.1,5.8,-6.4,3,3.4,3],[-4.1,5.8,-12.8,2.4,2.6,2.4],[4.1,5.8,-12.8,2.4,2.6,2.4],[-7.4,0,-3.4,3.4,3.6,3.4],[-7.4,0,.8,3.4,3.6,3.4]];

const fdArrows:Part[]=[-3.6,-4.6,-5.6,-6.6].flatMap(x=>[[x+.18,.005,-1.45,.06,.002,.5,.75],[x+.18,.005,-1.15,.06,.002,.5,-.75]] as Part[]);
const fdSeams=lines([...crack(0,-5.5,0,3.4,5,11),...crack(-2,-5.5,-.45,2.8,4,21),...crack(2.1,-5.5,.4,2.6,4,31)],.006);
const fdRock=cavern(101,{back:-10.5,gap:[-5,5],tall:1.3,west:-8.6});
function FoundersDescent({room}:{room:Ctx;reduced:boolean}){
 return <>
  <Floor parts={slabs(1.2)} color="#2b2832" seam="#4a3a80"/>
  <group>
   <Instances parts={fdSeams} color="#b9a7ff" material={lit('#a693ff',.85)} shadow={false}/><Instances parts={fdNosing} color="#9f8cff" material={lit('#8f7ae8',.9)} shadow={false}/>
   <Instances parts={fdArrows} color="#d6cfb6" material={decal('#cfc8b0',.5)} shadow={false}/>
   <Instances parts={fdScars} color="#7c7488" material={decal('#7a7286',.9)} shadow={false}/><Instances parts={fdNumbers} color="#c4b6ff" material={lit('#c4b6ff')} shadow={false}/>
   {/* The way back up: pale light at the head of the stair, and the dark mouth of the emergency passage. */}
   <mesh position={[0,6.4,-15.15]} geometry={wallPlane} scale={[3.2,4.2,1]} material={lit('#5c5384')} raycast={noRaycast}/>
   <mesh position={[-8.62,1.6,-1.3]} rotation={[0,Math.PI/2,0]} geometry={wallPlane} scale={[2.4,3.2,1]} material={lit('#0a120e')} raycast={noRaycast}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Cavern room={room} parts={fdRock} color="#2e2a33"/>
   <Solid room={room} parts={fdSteps} color="#211f28" jitter={.06} roughness={.4} metalness={.15}/>
   <Solid room={room} parts={[...fdCheeks,...fdNameWalls]} color="#1a181f" jitter={.05} roughness={.45} metalness={.1}/>
   <KitInstances url={G.plaque} parts={fdPlaques} material={grave('#4a4458')} shadow={false}/>
   <SolidKit room={room} url={G.obelisk} parts={fdObelisks} size={.17} material={grave('#3a3546')}/>
   <Tinted room={room} url={K.arched} parts={[[-8.9,0,-1.3,.8,.85,.8,Math.PI/2]]} tint="#4c4858"/>
  </group>
  <Light position={[0,5,-10]} color="#9d8cff" intensity={20} distance={14}/><Light position={[-7,3,-5.4]} color="#b0a3ff" intensity={6} distance={7}/><Light position={[7,3,-5.4]} color="#b0a3ff" intensity={6} distance={7}/>
  <Light position={[-7.6,1.6,-1.3]} color="#8fe0b0" intensity={6} distance={6}/><Light position={[2,3.4,2]} color="#a8a0c8" intensity={4} distance={10}/>
 </>;
}

// ── depth-2 The Abandoned Watch: a guard room in the rock, bunks and a room full of packed bags, spears racked by the way up ──
const awWalls:Part[]=[...back(-7.2,[-8,-4,4,8]),...side(-7.8,[-4.7,-.7,3.3])],awLow=side(7.8,[-4.7,-.7,3.3],.3);
const awBeds:Part[]=[-4.4,-1.4].flatMap(z=>[[-6.6,0,z,.8,.8,.8],[-6.6,1.15,z,.8,.8,.8]] as Part[]),awPosts:Part[]=[-4.4,-1.4].flatMap(z=>[-1,1].flatMap(a=>[-1,1].map(b=>[-6.6+a*.55,1.1,z+b*1.15,.05,2.2,.05] as Part)));
const awRolls:Part[]=[[-6.6,.98,-5.2,.17,.9,.17,0,0,Math.PI/2],[-6.6,2.13,-2.2,.17,.9,.17,0,0,Math.PI/2]];
/** Packed bags: two rows along the back wall, a heap by the door and a few on the bunks. */
const awBags:Part[]=[...[-6.1,-5.5,-4.9,-4.3,-3.7,-3.1,-2.5,2.6].flatMap((x,i)=>[[x+(rand(i)-.5)*.15,.26,-6.15,.4,.34,.32,rand(i+1)*3] as Part,[x+.3,.24,-6.6,.36,.3,.3,rand(i+2)*3] as Part,...(i%3===0?[[x+.1,.6,-6.4,.32,.28,.28,rand(i+3)*3] as Part]:[])]),
 [-1.9,.3,-6.2,.42,.38,.34,.4],[-1.7,.72,-6.3,.34,.3,.3,1.2],[1.9,.3,-6.25,.42,.36,.34,2],[-6.4,1.42,-4.2,.3,.26,.26,.6],[-6.7,.32,-3,.34,.3,.3,1.8],[-6.3,.3,-.1,.36,.32,.3,.4],[-6.5,.66,-.3,.28,.24,.26,2.2]];
const awStraps:Part[]=awBags.filter((_,i)=>i%2===0).map(([x,y,z,sx,sy,sz,r])=>[x,y+sy*.55,z,sx*.18,.03,sz*1.05,r]);
const awRack:Part[]=[[4,1.7,-6.55,2.9,.08,.08],[4,.55,-6.55,2.9,.08,.08],[2.6,1.1,-6.55,.1,2.2,.1],[5.4,1.1,-6.55,.1,2.2,.1]];
const awSpearsUp:Part[]=Array.from({length:7},(_,i)=>[2.9+i*.37,1.3,-6.42,.03,2.6,.03]),awTipsUp:Part[]=awSpearsUp.map(([x])=>[x,2.72,-6.42,.06,.24,.06]);
const awSpearsDown:Part[]=Array.from({length:6},(_,i)=>[4,.05,-5.8-i*.11,.03,2.6,.03,0,0,Math.PI/2]),awTipsDown:Part[]=awSpearsDown.map(([,,z])=>[5.4,.05,z,.06,.24,.06,0,0,-Math.PI/2]);
const awShieldsWall:Part[]=[-5.4,-4.2,-3,4,5.2].map(x=>[x,2.5,-6.64,.42,.05,.42,0,Math.PI/2]),awShieldsWary:Part[]=[-5,-4.1,-3.2,-2.3,2.2,3.1].map((x,i)=>[x,.42,-5.98,.42,.05,.42,(rand(i)-.5)*.2,Math.PI/2-.25]);
const awTable:Part[]=[[6.5,0,-1.2,.55,.55,.55]],awMugs:Part[]=[[6.3,.6,-1.4,.06,.12,.06],[6.75,.6,-1,.06,.12,.06],[6.5,.6,-.9,.05,.1,.05]],awCrates:Part[]=[[-6.5,0,-6.3,.6,.6,.6,.3]],awBoxes:Part[]=[[6.4,0,-4.4,.45,.45,.45,.2],[6.5,.68,-4.4,.3,.3,.3,.8]],awBarrels:Part[]=[[6.9,0,-3.1,.35,.35,.35]];
const awBrazier:Part[]=[[6.3,1,-6.3,3.5,3.5,3.5]],awStand:Part[]=[[6.3,.5,-6.3,.12,1,.12]];
const awScrit:Part[]=[[0,3.15,-6.67,1.6,1,.02]];
function AbandonedWatch({room,reduced}:{room:Ctx;reduced:boolean}){
 // Track B Scrit fork: with Scrit's runner (ally) the spears are laid down, shields hung and Scrit's mark hangs in the doorway; wary guards keep spears racked and shields up in a line.
 const ally=!!room.save?.scene.description.includes('Scrit');
 return <>
  <mesh position={[0,-.45,0]} material={mat('#201b17',1)} receiveShadow raycast={noRaycast}><boxGeometry args={[30,.6,30]}/></mesh>
  <TintedKit url={K.tile} parts={kitFloor()} tint="#7d7466" shadow={false}/>
  <group>
   <mesh position={[0,1.7,-7.75]} geometry={wallPlane} scale={[2.6,3.4,1]} material={lit('#07090d')} raycast={noRaycast}/>
   <Instances parts={awStraps} color="#3a2a1c" shadow={false}/>
   {ally?<><Instances parts={awSpearsDown} geometry={geo.cyl} color="#6b5236" shadow={false}/><Instances parts={awTipsDown} geometry={geo.cone} color="#9a9ea0" roughness={.4} metalness={.7} shadow={false}/>
    <Instances parts={awScrit} color="#56703a" jitter={0} shadow={false}/><mesh position={[0,3.18,-6.655]} geometry={discZ} scale={.26} material={lit('#e3b04a')} raycast={noRaycast}/><mesh position={[0,3.18,-6.65]} geometry={wallPlane} scale={[.05,.62,1]} material={lit('#2a2014')} raycast={noRaycast}/></>
   :<><Instances parts={awSpearsUp} geometry={geo.cyl} color="#6b5236" shadow={false}/><Instances parts={awTipsUp} geometry={geo.cone} color="#9a9ea0" roughness={.4} metalness={.7} shadow={false}/></>}
   <Instances parts={ally?awShieldsWall:awShieldsWary} geometry={geo.cyl} color="#8a3b2a" jitter={.25} shadow={false}/>
   <Instances parts={awMugs} geometry={geo.cyl} color="#8d7a5a" shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Tinted room={room} url={K.wall} parts={awWalls} tint="#9a9284"/><Tinted room={room} url={K.door} parts={back(-7.2,[0])} tint="#9a9284"/><Tinted room={room} url={K.broken} parts={awLow} tint="#8a8274"/>
   <SolidKit room={room} url={A.bed} parts={awBeds} size={.75}/><Solid room={room} parts={awPosts} geometry={geo.cyl} r={fixed(.06)} color="#4a3624"/><Instances parts={awRolls} geometry={geo.cyl} color="#5a6470" shadow={false}/>
   <Solid room={room} parts={awBags} geometry={geo.rock} color="#7a6248" jitter={.35} flat r={fixed(.22)}/>
   <Solid room={room} parts={awRack} r={fixed(.06)} color="#4a3624"/>
   <SolidKit room={room} url={K.crates} parts={awCrates} size={1.1}/><SolidKit room={room} url={K.box} parts={awBoxes} size={.75}/><SolidKit room={room} url={K.barrel} parts={awBarrels} size={.9}/>
   <SolidKit room={room} url={K.table} parts={awTable} size={1}/>
   <Solid room={room} parts={awStand} geometry={geo.cyl} r={fixed(.15)} color="#2e2a26" roughness={.5} metalness={.6}/><KitInstances url={G.brazier} parts={awBrazier} material={grave('#5a5048')} shadow={false}/>
  </group>
  <Flame position={[6.3,1.42,-6.3]} size={1.1} reduced={reduced}/>
  <Light position={[6,2,-5.8]} color="#ff9a4e" intensity={16} distance={11}/><Light position={[0,2.2,-7.6]} color="#7f9fd8" intensity={5} distance={6}/>
  <Light position={[-3.4,2.6,-5.4]} color={ally?'#ffc27a':'#9fb0c8'} intensity={ally?9:6} distance={9}/>
 </>;
}

// ── depth-3 The Engine of Hunger: a round glass seal in a machine wall, the dark pressing behind it, three visions on the glass ──
const ehWall:Part[]=[[0,4,-8.6,24,8,1.4]],ehButtress:Part[]=[-8.6,-3.5,3.5,8.6].map(x=>[x,4,-7.75,.9,8,.5]);
const ehRivets:Part[]=Array.from({length:28},(_,i)=>{const a=i/28*Math.PI*2;return [Math.cos(a)*2.78,3+Math.sin(a)*2.78,-7.62,.08,.08,.08] as Part;});
const ehPanes:Part[]=[-1,1].flatMap(s=>[[s*6,4.4,-7.8,2.3,.14,.14],[s*6,.8,-7.8,2.3,.14,.14],[s*7.1,2.6,-7.8,.14,3.7,.14],[s*4.9,2.6,-7.8,.14,3.7,.14],[s*6,2.6,-7.8,.08,3.6,.08]] as Part[]);
const ehPipes:Part[]=[[0,6.05,-7.7,.16,7.6,.16,0,0,Math.PI/2],[-3.05,3,-7.72,.12,6,.12],[3.05,3,-7.72,.12,6,.12],[-6,5.2,-7.7,.1,2,.1,0,0,Math.PI/2],[6,5.2,-7.7,.1,2,.1,0,0,Math.PI/2]];
const ehPistons:Part[]=[-4.2,-1.6,1].flatMap(z=>[[-7,1.1,z,.45,2.2,.45],[-7,2.85,z,.13,1.5,.13],[-7,3.6,z,.3,.18,.3]] as Part[]);
/** The three visions: the shape of whoever each companion still misses, pressed against the inside of the glass. */
const ehVisions:[string,string,Part[]][]=[['#ffcf8a','#ff9f3a',[[-1.15,2.25,-7.8,.55,.5,.2],[-1.15,3.18,-7.8,.32,.18,.32]]],['#a8c4ff','#4f86ff',[[.05,2.4,-7.8,.6,.55,.2],[.05,3.4,-7.8,.34,.19,.34]]],['#d8b0ff','#9b5cff',[[1.2,2.2,-7.8,.5,.48,.2],[1.2,3.1,-7.8,.3,.17,.3]]]];
const ehCracks=lines([...crack(0,-6.4,0,5.4,6,41),...crack(-.9,-6.4,-.25,4.2,5,51),...crack(1,-6.4,.3,4,5,61),...crack(-2.6,-6.4,-.6,3.2,4,71),...crack(2.7,-6.4,.55,3,4,81)],.006);
const ehCloth:Part[]=[[5.7,2.75,-7.66,1.3,3.4,.06,.04,.05,.03],[6.45,2.9,-7.62,1.2,3.2,.06,-.06,.08,-.05]],ehHeap:Part[]=[[6.5,.22,-6.3,.9,.36,.7,.4]];
const ehRock=cavern(301,{back:-9.4,gap:[-9,9],west:-8});
const ehGears:[number,number,number,number][]=[[-6,5.85,1.25,.22],[-8.15,4.55,.85,-.33],[6,5.85,1.25,-.22],[8.15,4.55,.85,.33]];
function EngineOfHunger({room,reduced}:{room:Ctx;reduced:boolean}){
 return <>
  <Floor parts={slabs(1.2)} color="#2c2a33" seam="#3c2068" roughness={.55} metalness={.45} jitter={.1}/>
  <group>
   <Instances parts={ehCracks} color="#9b6cff" material={lit('#8a5cf0',.85)} shadow={false}/>
   <mesh position={[0,3,-7.86]} geometry={discZ} scale={2.62} material={darkGlass} raycast={noRaycast}/>
   {[[.5,.9],[1.3,1.65],[2,2.25]].map(([a,b])=><mesh key={a} position={[0,3,-7.84]} material={lit('#000000',.55)} raycast={noRaycast}><ringGeometry args={[a,b,40]}/></mesh>)}
   {ehVisions.map(([c,e,p])=><Instances key={c} parts={p} geometry={capsule} color={c} material={glow(c,e,.9,.42)} shadow={false}/>)}
   {[-6,6].map(x=><mesh key={x} position={[x,2.6,-7.86]} geometry={wallPlane} scale={[2.2,3.6,1]} material={darkGlass} raycast={noRaycast}/>)}
   <Instances parts={ehCloth} color="#5a5040" jitter={.2} shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Cavern room={room} parts={ehRock} color="#25222b"/>
   <Solid room={room} parts={ehWall} color="#1c1a22" jitter={0} roughness={.7}/><Solid room={room} parts={ehButtress} color="#34313a" roughness={.5} metalness={.6} jitter={.05}/>
   <mesh position={[0,3,-7.78]} scale={2.78} geometry={ring} material={iron} castShadow raycast={noRaycast}/><Instances parts={ehRivets} geometry={geo.rock} color="#6a6470" roughness={.4} metalness={.7} shadow={false}/>
   <Instances parts={ehPanes} color="#3b3640" roughness={.45} metalness={.7} shadow={false}/><Instances parts={ehPipes} geometry={geo.cyl} color="#5a4c3c" roughness={.4} metalness={.7} shadow={false}/>
   <Solid room={room} parts={ehPistons} geometry={geo.cyl} r={fixed(.25)} color="#4a4550" roughness={.4} metalness={.7}/>
   <Solid room={room} parts={ehHeap} geometry={geo.rock} color="#5a5040" flat r={fixed(.45)}/>
   {ehGears.map(([x,y,r,v])=><Spin key={x+':'+y} position={[x,y,-7.82]} speed={v} reduced={reduced}><mesh geometry={GEAR} scale={[r,r,1]} material={iron} castShadow raycast={noRaycast}/></Spin>)}
  </group>
  <Light position={[0,3,-6.4]} color="#8a5cff" intensity={18} distance={11}/><Light position={[5,5,-2]} color="#b8c4ff" intensity={8} distance={14}/><Light position={[0,6.4,-5.6]} color="#9d8cff" intensity={10} distance={10}/><Light position={[-6.4,2.6,-1.6]} color="#7f6fd0" intensity={4} distance={7}/>
 </>;
}

// ── depth-4 The Last Living Keeper: a worn circle older than Briarwatch, standing stones, Neris's alcove and a wall of names ──
const lkStones:Part[]=[200,220,240,300,320,340].map((d,i)=>{const a=d*Math.PI/180;return [Math.cos(a)*8.6,0,Math.sin(a)*8.6,3,2.6+rand(i)*1.4,3,-a] as Part;});
const lkStubs:Part[]=[25,60,120,155].map((d,i)=>{const a=d*Math.PI/180;return [Math.cos(a)*8.4,0,Math.sin(a)*8.4,3,3,3,rand(i)*6] as Part;});
const lkRunes:Part[]=Array.from({length:30},(_,i)=>{const a=i/30*Math.PI*2;return [Math.cos(a)*4.55,.005,Math.sin(a)*4.55,.07,.002,i%3?.3:.5,Math.PI/2-a] as Part;});
const lkSpokes=lines(Array.from({length:6},(_,i)=>{const a=i/6*Math.PI*2+.26;return [Math.cos(a)*2.25,Math.sin(a)*2.25,Math.cos(a)*3.85,Math.sin(a)*3.85,.07] as [number,number,number,number,number];}),.005);
/** Names of every replacement who never arrived, cut in rows into the alcove walls, and her tallies beside them. */
const lkNames:Part[]=[-1,1].flatMap(s=>Array.from({length:8},(_,r)=>Array.from({length:6},(_,c)=>{const i=r*6+c+(s>0?60:0);return [s*(2.1+c*.62+rand(i)*.08),.75+r*.36,-8.38,.3+rand(i+5)*.25,.05,.01] as Part;})).flat());
const lkTallies:Part[]=[-1,1].flatMap(s=>Array.from({length:5},(_,g)=>[...Array.from({length:4},(_,k)=>[s*(1.95+g*.4+k*.07),3.85,-8.38,.025,.26,.01] as Part),[s*(2.05+g*.4),3.85,-8.37,.025,.34,.01,0,0,s*1.1] as Part]).flat());
const lkWalls:Part[]=back(-8.9,[-4,4]),lkUrns:Part[]=[[-2.3,0,-7.4,3,3,3],[-3,0,-7.7,2.4,2.4,2.4],[3,0,-7.5,3,3,3]];
const lkCandles:Part[]=[[-1.6,0,-7.1,.6,.6,.6],[1.6,0,-7.2,.6,.6,.6],[-.5,.98,-7.55,.45,.45,.45],[.45,.98,-7.45,.45,.45,.45],[-3.8,0,-7.4,.5,.5,.5],[3.9,0,-7.6,.5,.5,.5]];
const lkBedroll:Part[]=[[2.1,.15,-7.15,.19,1.3,.19,0,0,Math.PI/2]],lkBlanket:Part[]=[[2.1,.06,-6.9,1.4,.06,.7,.1]];
const lkRock=cavern(401,{back:-10.4,gap:[-6.5,6.5],tall:1.2,west:-9.4});
function LastLivingKeeper({room}:{room:Ctx;reduced:boolean}){
 return <>
  <Floor parts={slabs(1.2)} color="#5b554b" seam="#1d1914" base="#14110d" jitter={.2}/>
  <group>
   {[[2.1,2.24,0,Math.PI*2],[3.86,4,.3,Math.PI*1.7],[5.02,5.16,-.4,Math.PI*1.5],[5.02,5.16,Math.PI*1.25,Math.PI*.6]].map(([a,b,t0,tl])=><mesh key={a+':'+t0} position={[0,.005,0]} rotation={[-Math.PI/2,0,0]} material={lit('#e7c878',.75)} raycast={noRaycast}><ringGeometry args={[a,b,72,1,t0,tl]}/></mesh>)}
   <Instances parts={[...lkRunes,...lkSpokes]} color="#e7c878" material={lit('#e7c878',.75)} shadow={false}/>
   <Instances parts={[...lkNames,...lkTallies]} color="#d8c391" material={lit('#cdb98a',.7)} shadow={false}/>
   <mesh position={[0,1.7,-9.25]} geometry={wallPlane} scale={[2.8,3.2,1]} material={lit('#0e1414')} raycast={noRaycast}/>
   <Instances parts={lkBlanket} color="#6d5a48" jitter={0} shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Cavern room={room} parts={lkRock} color="#3c362e"/>
   <Tinted room={room} url={K.wall} parts={lkWalls} tint="#bdb096"/><Tinted room={room} url={K.arched} parts={back(-8.9,[0])} tint="#bdb096"/>
   <SolidKit room={room} url={G.square} parts={lkStones} size={.17} material={grave('#9c968a')}/><SolidKit room={room} url={G.broken} parts={lkStubs} size={.28} material={grave('#8c867a')}/>
   <SolidKit room={room} url={G.altar} parts={[[0,0,-7.6,2,2,2]]} size={.33} material={grave('#a39c8e')}/>
   <SolidKit room={room} url={G.urn} parts={lkUrns} size={.13} material={grave('#d8c4a4')} shadow={false}/>
   <KitInstances url={K.candle} parts={lkCandles} shadow={false}/>
   <Solid room={room} parts={lkBedroll} geometry={geo.cyl} r={fixed(.2)} color="#5f5a4c"/>
  </group>
  <Light position={[0,1.8,-7]} color="#ffcf8a" intensity={14} distance={9}/><Light position={[0,3.4,-1.5]} color="#ecd9a4" intensity={5} distance={10}/><Light position={[-5.6,5,-5]} color="#8fd8d0" intensity={6} distance={10}/>
 </>;
}

// ── depth-5 The Fracture Gallery: a cracked landing over the chasm, three broken bridges to the core, the counterweights that mend them ──
const fgLanding=slabs(1.2,6);
const fgBridges:[number,[number,number][]][]=[[-4,[[5,7]]],[0,[[9,10],[15,99]]],[4,[[3,4],[12,99]]]];
const fgDeck:Part[]=fgBridges.flatMap(([x,gaps],b)=>Array.from({length:17},(_,i)=>{if(gaps.some(([a,c])=>i>=a&&i<=c))return [];const before=gaps.some(([a])=>i===a-1),after=gaps.some(([,c])=>i===c+1),sag=Math.sin(i/16*Math.PI)*.35;return [[x+(rand(i+b*20)-.5)*.12,-.15-sag-(before||after?.25:0),-7.2-i*1.02,1.8,.26,.94,(rand(i+b*7)-.5)*.06,before?-.32:after?.32:0,(rand(i+b*3)-.5)*.05] as Part];}).flat());
const fgRails:Part[]=fgDeck.filter((_,i)=>i%2===0).flatMap(([x,y,z,,,,ry,rx])=>[-1,1].map(s=>[x+s*.88,y+.5,z,.05,.95,.05,ry,rx] as Part));
const fgAbut:Part[]=[-4,0,4].flatMap(x=>[[x-1.15,0,-6.3,2.2,2,2.2],[x+1.15,0,-6.3,2.2,2,2.2]] as Part[]);
const fgAnchors:Part[]=[-4,0,4].flatMap(x=>[[x-.62,.03,-5.95,.2,.2,.2,0,Math.PI/2],[x+.62,.03,-5.95,.2,.2,.2,0,Math.PI/2]] as Part[]);
const fgMarks:Part[]=[-4,0,4].flatMap(x=>[-.62,.62].flatMap(o=>[[x+o-.1,.006,-5.55,.05,.002,.34,.6],[x+o+.1,.006,-5.55,.05,.002,.34,-.6]] as Part[]));
const fgParapet:Part[]=[...[-1,1].flatMap(s=>[-4.4,-3,-1.2,.6,2.2,3.8,5.6].filter((_,i)=>rand(i+s)>.2).map((z,i)=>[s*6.45,.3,z,.3,.45+rand(i+s*3)*.35,1.1] as Part)),...[-5.2,-3.4,-1.6,.6,2.4,4.2].map((x,i)=>[x,.3,6.45,1.1,.45+rand(i+9)*.3,.3] as Part)];
const fgGantry:Part[]=[-1,1].flatMap(s=>[[s*6.3,3.4,-6.2,.3,6.8,.3],[s*6.3,3.4,-1.4,.3,6.8,.3],[s*6.3,6.85,-5.6,.36,.36,8.8]] as Part[]);
const fgWeights:Part[]=[[-6.3,2.6,-9.6,1.3,1.6,1.3],[6.3,3.4,-9.6,1.3,1.6,1.3]],fgBands:Part[]=fgWeights.flatMap(([x,y,z])=>[[x,y+.45,z,1.36,.12,1.36],[x,y-.45,z,1.36,.12,1.36]] as Part[]);
const fgCracks=lines([...crack(-5,-6.4,.6,7,6,501),...crack(4.8,-6.5,-.5,6,5,511),...crack(-1,-6.5,.1,9,7,521),...crack(6.4,2,-1.9,6,5,531),...crack(-6.4,3.5,1.7,5,4,541)],.006);
const fgGlass:Part[]=[...cluster(-6.2,-6.1,6,551),...cluster(6.1,4.6,5,561,.8),...cluster(-6.2,1.4,5,571,.9),...cluster(6.25,-3.4,4,581,.7),...cluster(-2,-6.35,4,591,.7)];
const fgBones:Part[]=Array.from({length:14},(_,i)=>{const s=i%2?1:-1,z=-5+i*.75;return [s*(6.15+rand(i)*.3),.25,z,.07,.6+rand(i+1)*.5,.07,rand(i+2)*6,(rand(i+3)-.5)*.8,s*(.4+rand(i+4)*.5)] as Part;});
const fgCliffs:Part[]=[...[-1,1].flatMap(s=>Array.from({length:8},(_,i)=>[s*(13+rand(i+s*5)*3),-8,-32+i*5.5,5+rand(i)*3,16+rand(i+2)*6,5,rand(i+4)*6] as Part)),...Array.from({length:5},(_,i)=>[-10+i*5,-6,-38,6,18,5,i] as Part)];
const fgIsland:Part[]=[[0,-2,-27,4.6,3.4,3.8,.4],[-1.8,-3.4,-26,2.6,2.6,2.4,1.2]];
function FractureGallery({room,reduced}:{room:Ctx;reduced:boolean}){
 return <>
  {/* No cavern floor: the landing is a block over the chasm. */}
  <mesh position={[0,-32,0]} geometry={plane} scale={[120,1,120]} material={lit('#020306')} raycast={noRaycast}/>
  <mesh position={[0,-.15,-.3]} geometry={plane} scale={[13.2,1,13.6]} material={lit('#5fd0ff')} raycast={noRaycast}/>
  <mesh position={[0,-2.3,-.3]} material={mat('#1c1f26',1)} receiveShadow raycast={noRaycast}><boxGeometry args={[13.4,4.2,13.8]}/></mesh>
  <Instances parts={fgLanding} color="#3a3e48" jitter={.18} shadow={false}/>
  <group>
   <Instances parts={fgCracks} color="#bff0ff" material={lit('#a8e8ff',.9)} shadow={false}/><Instances parts={fgMarks} color="#e2b23a" material={lit('#e2b23a',.85)} shadow={false}/>
   <Instances parts={fgAnchors} geometry={ring} color="#5a5e66" roughness={.4} metalness={.7} shadow={false}/>
   <Instances parts={fgRails} geometry={geo.cyl} color="#4a3c30" shadow={false}/>
   <Instances parts={[...chain(-6.3,-9.6,3.4,6.7),...chain(6.3,-9.6,4.2,6.7)]} geometry={geo.link} color="#4f5052" roughness={.5} metalness={.7} shadow={false}/>
   <Instances parts={fgCliffs} geometry={geo.rock} color="#1e222b" flat jitter={.2} shadow={false}/><Instances parts={fgIsland} geometry={geo.rock} color="#2a2430" flat shadow={false}/>
   {/* The core beyond the bridges. */}
   <mesh position={[0,4,-27]} scale={2.2} geometry={orb} material={glow('#ffd0f4','#ff6ad8',2.2)} raycast={noRaycast}/>
   <Spin position={[0,4,-27]} rotation={[.5,0,.3]} speed={.15} reduced={reduced}><mesh scale={3.4} geometry={ring} material={glow('#ffb8ee','#ff6ad8',1.4)} raycast={noRaycast}/></Spin>
  </group>
  <group userData={{blocksLabels:true}}>
   <Instances parts={fgDeck} color="#5a4a3a" jitter={.25}/><Instances parts={fgWeights} color="#4a4e56" jitter={.1}/><Instances parts={fgBands} color="#2e3036" roughness={.4} metalness={.7} shadow={false}/>
   <Solid room={room} parts={fgParapet} color="#3e424c" jitter={.12}/>
   <Solid room={room} parts={fgGantry} r={fixed(.2)} color="#4a3c30"/>
   <SolidKit room={room} url={G.square} parts={fgAbut} size={.17} material={grave('#6a6e7a')}/>
   <Solid room={room} parts={fgGlass} geometry={shard} r={fixed(.3)} color="#d8f2ff" material={glow('#d8f2ff','#5fb8ff',.7,.82)} shadow={false}/>
   <Solid room={room} parts={fgBones} geometry={geo.cone} r={fixed(.1)} color="#d8d0bc" jitter={.1} shadow={false}/>
  </group>
  <Light position={[0,1.2,-1]} color="#7fd6ff" intensity={7} distance={9}/><Light position={[0,4,-23]} color="#ff7ae0" intensity={60} distance={30}/><Light position={[5,6,3]} color="#c8d8ff" intensity={5} distance={14}/>
 </>;
}

// ── depth-6 The Sixth Stone: a ring of blades turning round the last tuning stone, a forge of old machine parts, the controls behind ──
const ssBlades:Part[]=Array.from({length:16},(_,i)=>{const a=i/16*Math.PI*2;return [Math.cos(a)*2.2,Math.sin(a)*2.2,0,.26,1.1,.06,0,0,a+Math.PI/2] as Part;});
const ssColumns:Part[]=[-8.4,-4.8,4.8,8.4].map(x=>[x,0,-7.6,3.6,5,3.6]);
const ssPistons:Part[]=[-1,1].flatMap(s=>[[s*3.5,1.6,-7.4,.34,3.2,.34,0,0,s*.38],[s*2.9,3.05,-7.4,.14,1.6,.14,0,0,s*.38]] as Part[]);
const ssConsole:Part[]=[[0,.55,-6.35,2.6,1.1,.8],[0,1.17,-6.15,2.6,.08,.72,0,-.6]],ssLevers:Part[]=[-.9,-.45,0,.45,.9].map((x,i)=>[x,1.42,-5.98,.035,.5,.035,0,.35+(i%2)*.25]);
const ssKnobs:Part[]=[-.9,-.45,0,.45,.9].map(x=>[x,1.67,-5.9,.07,.07,.07]);
const ssScrap:Part[]=[[6.6,0,1.8,3,3,3,.4],[6.9,0,-2.6,2.6,2.6,2.6,1.6],[-6.8,0,3.2,3,3,3,2.4]],ssParts:Part[]=[[6.7,.08,1.3,.5,.5,1,0,Math.PI/2],[6.4,.12,2.4,.35,.35,1,.6,Math.PI/2-.3],[-6.9,.08,2.6,.45,.45,1,0,Math.PI/2],[7.1,.1,-2.1,.38,.38,1,0,Math.PI/2+.2]];
const ssBands:Part[]=[0,2.4,4.8,7.2].map(y=>[0,y+.6,-8.75,24,.18,.06]);
const ssRock=cavern(601,{back:-10,gap:[-10,10],west:-9.4});
function SixthStone({room,reduced}:{room:Ctx;reduced:boolean}){
 return <>
  <mesh position={[0,-1.1,0]} geometry={plane} scale={[40,1,40]} material={mat('#0e0a08',1)} raycast={noRaycast}/>
  <mesh position={[0,-.7,0]} geometry={plane} scale={[16,1,16]} material={lit('#c4501c')} raycast={noRaycast}/>
  <TintedKit url={A.grate} parts={kitFloor(0)} tint="#6e5c4a" shadow={false}/>
  <group>
   {[[2.6,2.76],[1,1.08]].map(([a,b])=><mesh key={a} position={[0,.07,0]} rotation={[-Math.PI/2,0,0]} material={decal('#c89a4a',.75)} raycast={noRaycast}><ringGeometry args={[a,b,64]}/></mesh>)}
   <Instances parts={ssBands} color="#a07a3e" material={brass} shadow={false}/>
   <Instances parts={ssKnobs} geometry={geo.rock} color="#9cff8a" material={glow('#c8ffb0','#58e04a',1.4)} shadow={false}/>
   <Instances parts={ssParts} geometry={GEAR_SMALL} color="#5a4a3a" roughness={.5} metalness={.6} shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Cavern room={room} parts={ssRock} color="#2e241e"/>
   <Solid room={room} parts={[[0,4.5,-9.4,24,9,1.2]]} color="#221c18" jitter={0} roughness={.7}/>
   <mesh position={[0,3.3,-8.5]} rotation={[Math.PI/2,0,0]} material={iron} castShadow raycast={noRaycast}><cylinderGeometry args={[3.5,3.5,.4,40]}/></mesh>
   {/* The ring of blades and the sixth stone at its heart. */}
   <Spin position={[0,3.3,-7.95]} speed={.22} reduced={reduced}>
    <mesh scale={2.95} geometry={ring} material={brass} castShadow raycast={noRaycast}/><mesh scale={1.15} geometry={ring} material={brass} raycast={noRaycast}/>
    <Instances parts={ssBlades} geometry={geo.tent} color="#c4c7cf" material={steel}/>
   </Spin>
   <Spin position={[0,3.3,-7.8]} axis="y" speed={.7} reduced={reduced}><mesh scale={.62} geometry={shard} material={glow('#fff3cf','#ffc45a',2.4)} raycast={noRaycast}/></Spin>
   <SolidKit room={room} url={G.column} parts={ssColumns} size={.2} material={grave('#9a7a5a')}/>
   {([[-6.6,5,1.6,.18],[-6.6,1.9,1,-.29],[6.6,5,1.6,-.18],[6.6,1.9,1,.29]] as const).map(([x,y,r,v])=><Spin key={x+':'+y} position={[x,y,-8.75]} speed={v} reduced={reduced}><mesh geometry={GEAR} scale={[r,r,1]} material={iron} castShadow raycast={noRaycast}/></Spin>)}
   <Solid room={room} parts={ssPistons} geometry={geo.cyl} r={fixed(.25)} color="#5a4c3c" roughness={.4} metalness={.7}/>
   <Solid room={room} parts={ssConsole} r={fixed(.38)} color="#3a302a" roughness={.5} metalness={.5}/><Instances parts={ssLevers} geometry={geo.cyl} color="#a07a3e" material={brass} shadow={false}/>
   <SolidKit room={room} url={G.debris} parts={ssScrap} size={.3} material={grave('#7a6250')} shadow={false}/>
  </group>
  <Light position={[0,3.3,-6.6]} color="#ffe0a0" intensity={24} distance={12}/><Light position={[-6,3,-3]} color="#ff9a50" intensity={7} distance={9}/><Light position={[5,4,2]} color="#ffb070" intensity={4} distance={12}/>
 </>;
}

// ── depth-7 The Heart Below: six tuning stones on pylons round a hollow where the hungry force pushes through, a circuit of light ──
const HOLLOW:[number,number]=[0,-12.5];
const hbPylonAt=Array.from({length:6},(_,i)=>{const a=(30+i*60)*Math.PI/180;return [HOLLOW[0]+Math.cos(a)*5.4,HOLLOW[1]+Math.sin(a)*5.4] as [number,number];});
const hbPylons:Part[]=hbPylonAt.map(([x,z],i)=>[x,0,z,2.6,1.9,2.6,i*.5]);
const STONE_COLOURS=['#7fe0ff','#ffb24a','#b8fff0','#c9a0ff','#ff8a7a','#fff2c0'];
const hbCircuit=lines([...hbPylonAt.map(([x,z],i)=>{const [nx,nz]=hbPylonAt[(i+1)%6];return [x,z,nx,nz,.09] as [number,number,number,number,number];}),...hbPylonAt.map(([x,z])=>{const dx=HOLLOW[0]-x,dz=HOLLOW[1]-z,d=Math.hypot(dx,dz);return [x+dx/d*.7,z+dz/d*.7,x+dx/d*1.6,z+dz/d*1.6,.07] as [number,number,number,number,number];}),[hbPylonAt[1][0],hbPylonAt[1][1]+.6,0,-2.2,.1]],.008);
const hbFractures=lines([...crack(-3.2,-9.4,.5,6,6,701),...crack(3.4,-9.6,-.4,6.4,6,711),...crack(-6,-12,1.2,5,5,721),...crack(5.8,-12.4,-1.3,4.6,5,731),...crack(0,-8.8,.05,5.5,6,741)],.007);
const hbBulges:Part[]=Array.from({length:9},(_,i)=>{const a=i/9*Math.PI*2+.3;return [HOLLOW[0]+Math.cos(a)*3.1,.1,HOLLOW[1]+Math.sin(a)*3.1,.5+rand(i)*.5,.45+rand(i+1)*.5,.5+rand(i+2)*.4,a] as Part;});
const hbStalactites:Part[]=Array.from({length:22},(_,i)=>{const x=-12+rand(i+700)*24,z=-8-rand(i+710)*12;return [x,10.5,z,.35+rand(i+720)*.4,2.5+rand(i+730)*3.5,.35+rand(i+720)*.4,rand(i)*3,Math.PI] as Part;});
const hbRock=cavern(701,{back:-19.5,gap:[-9,9],tall:1.8,west:-9.8});
const voidMat=new THREE.MeshStandardMaterial({color:'#040208',emissive:'#3a0f5c',emissiveIntensity:.9,roughness:.12,metalness:.85});
function HeartBelow({room}:{room:Ctx;reduced:boolean}){
 return <>
  <Floor parts={slabs(1.2)} color="#25212b" seam="#5a1a50" base="#09070c" jitter={.14} roughness={.6}/>
  <group>
   <Instances parts={hbCircuit} color="#ffe9a8" material={lit('#ffe6a0')} shadow={false}/><Instances parts={hbFractures} color="#c070ff" material={lit('#b45cff',.85)} shadow={false}/>
   <mesh position={[0,.006,0]} rotation={[-Math.PI/2,0,0]} material={lit('#ffe6a0',.85)} raycast={noRaycast}><ringGeometry args={[1.55,1.66,48]}/></mesh>
   {/* The hollow: black, rimmed in violet, with the force bulging up through it. */}
   <mesh position={[HOLLOW[0],-.2,HOLLOW[1]]} geometry={plane} rotation={[0,0,0]} scale={[7.4,1,7.4]} material={lit('#000000')} raycast={noRaycast}/>
   <mesh position={[HOLLOW[0],-.19,HOLLOW[1]]} rotation={[-Math.PI/2,0,0]} material={lit('#b05cff')} raycast={noRaycast}><ringGeometry args={[3.5,3.68,64]}/></mesh>
   <mesh position={[HOLLOW[0],-.19,HOLLOW[1]]} rotation={[-Math.PI/2,0,0]} material={lit('#5a1f8a',.8)} raycast={noRaycast}><ringGeometry args={[4.1,4.2,64]}/></mesh>
   <Instances parts={hbStalactites} geometry={geo.cone} color="#2a2430" flat jitter={.2} shadow={false}/>
   {hbPylonAt.map(([x,z],i)=><mesh key={i} position={[x,2.9,z]} rotation={[0,i,0]} scale={[.42,.6,.42]} geometry={shard} material={lit(STONE_COLOURS[i])} raycast={noRaycast}/>)}
  </group>
  <group userData={{blocksLabels:true}}>
   <Cavern room={room} parts={hbRock} color="#221d27"/>
   <mesh position={[HOLLOW[0],.2,HOLLOW[1]]} scale={[2.7,1.9,2.7]} geometry={orb} material={voidMat} castShadow raycast={noRaycast}/>
   <Instances parts={hbBulges} geometry={geo.rock} color="#07050b" material={voidMat}/>
   <SolidKit room={room} url={G.square} parts={hbPylons} size={.17} material={grave('#4a4258')}/>
  </group>
  <Light position={[HOLLOW[0],1.8,HOLLOW[1]]} color="#b45cff" intensity={40} distance={18}/><Light position={[0,3.4,-8.6]} color="#ffd27a" intensity={26} distance={13}/><Light position={[-3,2.6,-2]} color="#9a6ad0" intensity={6} distance={9}/><Light position={[4,4,2]} color="#c8a0e8" intensity={4} distance={12}/>
 </>;
}

// ── depth-8 The First Morning: the open relay, a shaft of dawn, the bell hung quiet over the road out, people waiting along it ──
const SHAFT_Z=-7.8;
const fmSteps:Part[]=Array.from({length:14},(_,i)=>{const h=(i+1)*.42;return [0,h/2,-6.3-i*.7,5.2,h,.7] as Part;}).concat([[0,2.94,-17.4,9,5.88,3.4]]);
const stepTop=(z:number)=>z>-5.95?0:Math.min(5.88,(Math.floor((-5.95-z)/.7)+1)*.42);
const fmColumns:Part[]=[-1,1].flatMap(s=>[-7.4,-10.8,-14.2].map(z=>[s*4.7,0,z,4.2,8.4,4.2] as Part));
const fmStairWalls:Part[]=[[-3.2,1.6,-11.6,1.2,3.2,11],[3.2,1.6,-11.6,1.2,3.2,11]];
const fmYoke:Part[]=[[0,7.1,SHAFT_Z,9.8,.55,.6],[0,6.62,SHAFT_Z,.3,.45,.3]];
const fmLanterns:Part[]=[-1,1].flatMap(s=>[-6.6,-8,-9.4,-10.8,-12.2,-13.6,-15].map(z=>[s*2.25,stepTop(z),z,2.4,2.4,2.4] as Part));
const fmLanternGlow:Part[]=fmLanterns.map(([x,y,z])=>[x,y+.42,z,.13,.2,.13]);
type Person=[number,number,number,number,number];// x, floor y, z, height, facing
const crowd=(seed:number,spots:[number,number][]):Person[]=>spots.map(([x,z],i)=>[x+(rand(seed+i+3)-.5)*.2,stepTop(z),z+(rand(seed+i+7)-.5)*.15,1.45+rand(seed+i)*.3,rand(seed+i+9)*6]);
const fmMarket=crowd(1,[[-1.9,-7.7],[-1.7,-9.1],[1.8,-8.4],[-6.6,-5.9],[-7.2,-4.6],[-6.4,-3.2],[-1.85,-14.3],[1.9,-12.9],[-7.3,-1.4]]);
const fmPrisoners=crowd(31,[[1.9,-7],[1.7,-9.8],[-1.8,-11.5],[1.8,-11.5],[-6.7,-1.8],[-7.6,-2.6],[6.4,-6.4],[7,-5.8],[1.85,-14.9]]);
const fmChoir=crowd(61,[[-1.9,-10.4],[1.85,-10.6],[-1.7,-12.6],[-1.9,-13.4],[1.6,-13.8],[-1.2,-16.6],[0,-16.9],[1.2,-16.6],[-7.8,-3.8]]);
const bodies=(c:Person[]):Part[]=>c.map(([x,y,z,h,r])=>[x,y+h*.37,z,.44,h*.37,.38,r]),heads=(c:Person[]):Part[]=>c.map(([x,y,z,h,r])=>[x,y+h*.85,z,.15,.17,.15,r]);
const fmBanners:[string,Part[]][]=[['#9a3a2a',[[-4.7,5.6,-6.25,1.3,3.6,.05],[4.7,5.6,-13.05,1.3,3.6,.05]]],['#3e5a9a',[[4.7,5.6,-6.25,1.3,3.6,.05],[-4.7,5.6,-9.65,1.3,3.6,.05]]],['#4c6a3a',[[4.7,5.6,-9.65,1.3,3.6,.05],[-4.7,5.6,-13.05,1.3,3.6,.05]]]];
const fmInlays:Part[]=Array.from({length:6},(_,i)=>{const a=i/6*Math.PI*2+Math.PI/6;return [Math.cos(a)*3.3,.006,Math.sin(a)*3.3,.28,.002,.28,a] as Part;});
const fmRock=cavern(181,{back:-19.5,gap:[-6,6],tall:1.6,west:-8.6,low:.55});
const fmLedge:Part[]=[[-7.4,-.05,-3.6,2.8,.2,6.4],[6.9,-.05,-6.2,2.4,.2,2.4]];
let motes:THREE.Points|undefined;
/** Dust in the dawn shaft: one Points draw, sinking slowly, frozen when `reduced`. */
function Motes({reduced}:{reduced:boolean}){
 const H=9,points=useMemo(()=>{if(motes)return motes;const p=new Float32Array(160*6);for(let i=0;i<160;i++){const a=rand(i*3.1)*Math.PI*2,r=Math.sqrt(rand(i*5.3))*3.4,x=Math.cos(a)*r,z=SHAFT_Z+Math.sin(a)*r,y=rand(i*7.7)*H;p.set([x,y,z,x,y+H,z],i*6);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const o=new THREE.Points(g,new THREE.PointsMaterial({color:'#ffe9c4',size:.06,transparent:true,opacity:.75,depthWrite:false}));o.frustumCulled=false;o.raycast=noRaycast;return motes=o;},[]);
 useFrame(({clock})=>{if(!reduced)points.position.y=-(clock.elapsedTime*.12)%H;});
 return <primitive object={points}/>;
}
function FirstMorning({room,reduced}:{room:Ctx;reduced:boolean}){
 return <>
  <Floor parts={slabs(1.2)} color="#776c5c" seam="#2c251f" base="#1e1a17" jitter={.2}/>
  <group>
   <mesh position={[0,.005,0]} rotation={[-Math.PI/2,0,0]} material={decal('#b9a47c',.45)} raycast={noRaycast}><ringGeometry args={[3.24,3.34,64]}/></mesh>
   <Instances parts={fmInlays} geometry={geo.disc} color="#a9946c" material={decal('#9c8a66',.9)} shadow={false}/>
   {/* Dawn: the sky at the head of the road, and the light falling down the open shaft past the bell. */}
   <mesh position={[0,8.6,-19.05]} geometry={wallPlane} scale={[7,6,1]} material={lit('#ffe2b8')} raycast={noRaycast}/>
   <mesh position={[0,14,SHAFT_Z]} material={beam('#ffdcaa',.07)} raycast={noRaycast}><coneGeometry args={[4.6,28,28,1,true]}/></mesh>
   <mesh position={[0,14,SHAFT_Z]} material={beam('#fff2d8',.06)} raycast={noRaycast}><coneGeometry args={[2.4,28,20,1,true]}/></mesh>
   <mesh position={[0,.008,SHAFT_Z+1.2]} geometry={geo.disc} scale={[3.6,1,2.4]} material={beam('#ffe2b0',.12)} raycast={noRaycast}/>
   <Instances parts={fmLanternGlow} color="#ffd08a" material={glow('#ffe2a8','#ffb44d',1.6)} shadow={false}/>
   {fmBanners.map(([c,p])=><Instances key={c} parts={p} color={c} jitter={.1} shadow={false}/>)}
  </group>
  <group userData={{blocksLabels:true}}>
   <Cavern room={room} parts={fmRock} color="#5a4c40"/><Solid room={room} parts={fmLedge} color="#6e6253" jitter={.1}/>
   <Solid room={room} parts={fmSteps} color="#8d8170" jitter={.08}/><Solid room={room} parts={fmStairWalls} color="#6f6456" jitter={.08}/>
   <SolidKit room={room} url={G.column} parts={fmColumns} size={.2} material={grave('#b8a68a')}/>
   <Instances parts={fmYoke} color="#4a3a2c" jitter={.05}/>
   {/* Briarwatch's bell, hung still over the road: for once only a bell. */}
   <mesh position={[0,4.3,SHAFT_Z]} scale={1.75} geometry={BELL} material={bronze} castShadow raycast={noRaycast}/>
   <mesh position={[0,4.75,SHAFT_Z]} scale={.26} geometry={orb} material={bronze} raycast={noRaycast}/>
   <KitInstances url={G.lantern} parts={fmLanterns} material={mat('#3a332c',.6,.5)} shadow={false}/>
   <Instances parts={bodies(fmMarket)} geometry={capsule} color="#8a4a32" jitter={.3}/><Instances parts={bodies(fmPrisoners)} geometry={capsule} color="#6f7562" jitter={.25}/><Instances parts={bodies(fmChoir)} geometry={capsule} color="#45598c" jitter={.2}/>
   <Instances parts={heads([...fmMarket,...fmPrisoners,...fmChoir])} geometry={orb} color="#c09a76" jitter={.3} shadow={false}/>
  </group>
  <Motes reduced={reduced}/>
  <Light position={[0,7,-6.6]} color="#ffe2b0" intensity={40} distance={20}/><Light position={[0,4.6,-13]} color="#ffc070" intensity={12} distance={10}/><Light position={[0,3.4,-1]} color="#ffdcb4" intensity={8} distance={12}/><Light position={[-6.8,2.4,-3.4]} color="#ffc78f" intensity={5} distance={6}/>
 </>;
}

// ── Rooms by number ──
const ROOMS:Record<number,(p:{room:Ctx;reduced:boolean})=>ReactNode>={1:FoundersDescent,2:AbandonedWatch,3:EngineOfHunger,4:LastLivingKeeper,5:FractureGallery,6:SixthStone,7:HeartBelow,8:FirstMorning};
/** The eight Last Descent rooms, chosen by scene id. */
export default function LastDescent({scene,save,reduced}:RoomProps){const Room=ROOMS[Number(scene.split('-')[1])]??FoundersDescent;return <Room key={scene} room={{save,scene}} reduced={reduced}/>;}
const MOODS:Record<number,MoodOverride>={
 1:{background:'#0f0c16',ambient:'#a39cc4',sun:'#c9c0ff',fog:[18,44]},
 2:{background:'#16100c',ambient:'#c4ad92',sun:'#f0c494',fog:[16,40]},
 3:{background:'#0b0812',ambient:'#aca2cc',sun:'#cfc4f6',fog:[16,40]},
 4:{background:'#14120e',ambient:'#cbbd9a',sun:'#f4dca8',fog:[18,44]},
 5:{background:'#070a10',ambient:'#9fb2c8',sun:'#cfe2ff',fog:[18,60]},
 6:{background:'#140c08',ambient:'#c2a080',sun:'#ffcf96',fog:[16,42]},
 7:{background:'#0c0510',ambient:'#a68cb8',sun:'#e3b0ff',fog:[18,50]},
 8:{background:'#3a3340',ambient:'#e6d2bf',sun:'#ffe0b4',fog:[22,62]},
};
/** Per-room light: violet stone, a guard fire, the hungry glass, the keeper's candles, a chasm, the blade forge, the core, and dawn. */
export const mood=(scene:string):MoodOverride=>MOODS[Number(scene.split('-')[1])]??{};
