import {thin,wallRow,wallColumn} from './parts';
import * as THREE from 'three';
import {Solid,SolidKit,type RoomCtx,TintedKit,Light,Instances,KitInstances,Prop,Flame,chain,mat,decal,geo,noRaycast,rand,type Part,type RoomProps,type Vec3} from './kit';

// Rootbound Prison (roots-1 … roots-8): a prison overgrown by giant roots. Contract, helpers and budget: ./README.md.
// Every room shares one encounter footprint (±5.4 m) and the same markers, so all solid dressing stands outside it:
// tall walls at −z and −x, low edges at +x/+z for the camera. Inside the footprint only floors, decals and sunken root humps.
// Nothing here animates except kit Flames, which hold still under reduced motion.

// ── Kit files: full literals so the asset gate can follow them ──
const WALL='/assets/env/kaykit-dungeon/wall.glb',WALL_BROKEN='/assets/env/kaykit-dungeon/wall_broken.glb',WALL_GATED='/assets/env/kaykit-dungeon/wall_gated.glb',WALL_ARCHED='/assets/env/kaykit-dungeon/wall_arched.glb',WALL_DOOR='/assets/env/kaykit-dungeon/wall_doorway.glb';
const TILE='/assets/env/kaykit-dungeon/floor_tile_large.glb',DIRT='/assets/env/kaykit-dungeon/floor_dirt_large.glb',PILLAR='/assets/env/kaykit-dungeon/pillar.glb',CANDLE='/assets/env/kaykit-dungeon/candle_lit.glb',TABLE='/assets/env/kaykit-dungeon/table_medium.glb',BOX='/assets/env/kaykit-dungeon/box_large.glb',BARREL='/assets/env/kaykit-dungeon/barrel_large.glb',BANNER='/assets/env/kaykit-dungeon/banner_thin_brown.glb',TORCH='/assets/env/kaykit-dungeon/torch_mounted.glb';
const STUMP='/assets/env/kenney-nature-kit/stump_oldTall.glb',LOG='/assets/env/kenney-nature-kit/log_large.glb',STONE_A='/assets/env/kenney-nature-kit/stone_largeA.glb',STONE_C='/assets/env/kenney-nature-kit/stone_largeC.glb',TALL_A='/assets/env/kenney-nature-kit/stone_tallA.glb',TALL_B='/assets/env/kenney-nature-kit/stone_tallB.glb';
const FUNGUS='/assets/env/kenney-nature-kit/mushroom_tanGroup.glb',FUNGUS_RED='/assets/env/kenney-nature-kit/mushroom_redGroup.glb',BUSH='/assets/env/kenney-nature-kit/plant_bushLarge.glb',FERN='/assets/env/kenney-nature-kit/plant_flatTall.glb',LILY='/assets/env/kenney-nature-kit/lily_large.glb';

// Kenney models ship bright flat colours; one shared tint per role keeps them in the prison's damp palette.
const rockTint=mat('#55574f',1,0,true),caveTint=mat('#3f413b',1,0,true),barkTint=mat('#5a4330',1,0,true),leafTint=mat('#3e5a32',1,0,true),fernTint=mat('#4f6e3a',1,0,true);
const glow=(color:string,emissive:string,intensity=1,opacity=1)=>new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:intensity,roughness:.35,transparent:opacity<1,opacity,depthWrite:opacity>=1});
const fungusGlow=glow('#b9e3c6','#3fae86',.9),fruitGlow=glow('#f1d48a','#c08a2a',.8),knotGlow=glow('#5f6b34','#7f9a2e',.45),amber=glow('#e3a03a','#b0600f',1.1,.78),tuningStone=glow('#b8fff0','#4ad9c0',1.6),lampGlass=glow('#ffe2a8','#ffb44d',1.4);
const puddle=new THREE.MeshStandardMaterial({color:'#4f6461',roughness:.08,metalness:.4,polygonOffset:true,polygonOffsetFactor:-2});

// ── Procedural roots: one tapered tube per shape, instanced at every placement ──
function rootGeo(points:Vec3[],r0:number,r1:number,tubular=22,radial=6){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,tubular,1,radial,false),pos=g.attributes.position,c=new THREE.Vector3(),v=new THREE.Vector3();
 for(let i=0;i<=tubular;i++){curve.getPointAt(i/tubular,c);const r=r0+(r1-r0)*Math.pow(i/tubular,.8);for(let j=0;j<=radial;j++){const k=i*(radial+1)+j;v.fromBufferAttribute(pos,k).sub(c).multiplyScalar(r).add(c);pos.setXYZ(k,v.x,v.y,v.z);}}
 g.computeVertexNormals();return g;
}
// ARCH bursts out of a wall face (local +z is into the room) and dives into the floor within 1.1 m of it.
const ARCH_PTS:Vec3[]=[[0,3.7,-.3],[0,3.3,.6],[.18,2.3,1.05],[.05,1,.95],[0,-.3,.55]],DROP_PTS:Vec3[]=[[0,7.5,0],[.25,5.6,.15],[-.15,4,.1],[.12,2.8,0],[0,2,.05]];
const ARCH=rootGeo(ARCH_PTS,.42,.12),DROP=rootGeo(DROP_PTS,.32,.03),CRAWL=rootGeo([[0,0,0],[.5,0,1],[-.3,0,2.1],[.25,0,3.2],[0,0,4.2]],.24,.05,26,5);
const TRUNK=rootGeo([[0,10,0],[.5,6.5,.3],[.2,3.2,0],[.9,1.2,.4],[1.9,.1,.9],[2.7,-.5,1.2]],1.15,.25,28,8),BRANCH=rootGeo([[-7,0,0],[-3.5,.6,.3],[0,.1,-.2],[3.5,.7,.25],[7,0,0]],.55,.32,28,7);
const VINE_PTS:Vec3[]=[[0,0,0],[1.5,.45,0],[3,-.2,0],[4.5,.4,0],[6,0,0]],VINE=rootGeo(VINE_PTS,.09,.05,30,5);
/** Points spread along a root curve placed at [x,y,z,ry], each as a small spike: thorns, knots or buds. */
function along(points:Vec3[],[x,y,z,ry]:[number,number,number,number],count:number,size:[number,number,number],seed=0):Part[]{
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),v=new THREE.Vector3(),cs=Math.cos(ry),sn=Math.sin(ry);
 return Array.from({length:count},(_,i)=>{curve.getPointAt((i+.5)/count,v);return [x+v.x*cs+v.z*sn,y+v.y,z-v.x*sn+v.z*cs,...size,rand(i+seed)*6,(rand(i+seed+3)-.5)*2.6,(rand(i+seed+5)-.5)*2.6] as Part;});
}
const crawlTorus=new THREE.TorusGeometry(1,.09,6,18),valveTorus=new THREE.TorusGeometry(1,.12,6,20),lampPool=new THREE.CircleGeometry(1,32).rotateX(-Math.PI/2);

// ── Layout helpers. Kit walls are 4 m wide, 4 m tall and 1 m thick with the pivot at the bottom centre. ──
const SIDE_Z=[-4.7,-.7,3.3];
/** 4 m kit floor tiles over ±8 m; `dirt` lists the tile indices (x-major, 0–15) broken through to earth. */
const tiles=(dirt:number[]=[]):Part[]=>[-6,-2,2,6].flatMap((x,i)=>[-6,-2,2,6].map((z,k)=>[x,-.05,z,1,1,1,((i+k)%4)*Math.PI/2] as Part)).filter((_,i)=>!dirt.includes(i));
const earth=(only:number[]):Part[]=>[-6,-2,2,6].flatMap((x,i)=>[-6,-2,2,6].map((z,k)=>[x,-.11,z,1,1,1,((i*3+k)%4)*Math.PI/2] as Part)).filter((_,i)=>only.includes(i));
/** Moss strands hanging from a ledge between two points. */
function moss(x0:number,z0:number,x1:number,z1:number,top:number,count:number,seed:number,max=1.8):Part[]{return Array.from({length:count},(_,i)=>{const t=(i+rand(i+seed)*.6)/count,len=.4+rand(i+seed+9)*max;return [x0+(x1-x0)*t,top-len/2,z0+(z1-z0)*t,.06+rand(i+seed+4)*.05,len,.06+rand(i+seed+6)*.05,rand(i+seed)*6,Math.PI] as Part;});}
/** Floor moss and damp patches: decals, free to cross the footprint. */
const patches=(seed:number,count:number,spread=7):Part[]=>Array.from({length:count},(_,i)=>[(rand(i+seed)-.5)*spread*2,.003+i*.0004,(rand(i+seed+50)-.5)*spread*2,.5+rand(i+seed+20)*1.1,.002,.35+rand(i+seed+30)*.8,rand(i+seed+40)*3]);
/** Damp, mirror-dark puddles: decals, free to cross the footprint. */
const puddles=(seed:number,count:number):Part[]=>Array.from({length:count},(_,i)=>[(rand(i+seed+7)-.5)*11,.008+i*.0003,(rand(i+seed+70)-.5)*11,.35+rand(i+seed+11)*.6,.002,.25+rand(i+seed+13)*.4,rand(i+seed+17)*3]);

const WALL_TINT='#a3a893',TILE_TINT='#8e8a7c',DIRT_TINT='#7b6c56';

/** Kaykit walls in the damp prison tint. */
const Walls=({room,url,parts,size}:{room:RoomCtx;url:string;parts:Part[];size?:number})=><SolidKit ctx={room} url={url} parts={parts} tint={WALL_TINT} radius={p=>(size??.5)*Math.min(p[3],p[5])}/>;
/** Earth slab under every room so no gap shows between tiles and the fog. */
function Bedrock({color='#22261f'}:{color?:string}){return <mesh position={[0,-.45,0]} material={mat(color,1)} receiveShadow raycast={noRaycast}><boxGeometry args={[30,.6,30]}/></mesh>;}
function Floor({tile,dirt}:{tile:Part[];dirt:Part[]}){return <><TintedKit url={TILE} parts={tile} tint={TILE_TINT} shadow={false}/><TintedKit url={DIRT} parts={dirt} tint={DIRT_TINT} shadow={false}/></>;}
/** A giant root lying along the top of the back wall (and optionally the west wall), with roots draped down the wall face from it. */
const WALL_ROOT_Y=4.45;
function WallRoots({backRoot=true,west,drops,color='#54402d'}:{backRoot?:boolean;west?:boolean;drops:[number,number,number][];color?:string}){
 const roots:Part[]=[...(backRoot?[[0,WALL_ROOT_Y,-7.2,1.25,.8,1] as Part]:[]),...(west?[[-7.8,WALL_ROOT_Y,-1,.95,.8,1,Math.PI/2] as Part]:[])];
 return <><Instances parts={roots} geometry={BRANCH} color={color}/><Instances parts={drops.map(([x,z,sy],i)=>[x,WALL_ROOT_Y+.1-7.5*sy,z,.8,sy,.8,i*1.7] as Part)} geometry={DROP} color={color} shadow={false}/></>;
}

// ── roots-1 The Garden of Locks: a sunless cavern, cells hanging from branches, knotted living locks, a gardener's beds ──
const caveBack:Part[]=Array.from({length:9},(_,i)=>[-9.6+i*2.4,0,-8.6-rand(i)*.7,2.6+rand(i+3),4.4+rand(i+5)*2.8,2.4,rand(i+7)*3]);
const caveLeft:Part[]=Array.from({length:6},(_,i)=>[-8.6-rand(i+20)*.5,0,-6+i*2.4,2.4,3.4+rand(i+21)*2.2,2.6,rand(i+22)*3]);
const caveRight:Part[]=Array.from({length:6},(_,i)=>[8.4+rand(i+30)*.5,0,-6+i*2.4,2.2,.9+rand(i+31)*.6,2.4,rand(i+32)*3]);
const gardenBoulders:Part[]=[[-6.8,0,-6.6,2.2,1,2.2,.4],[6.9,0,-6.8,2.4,1.4,2,1.2],[-7,0,4.6,1.6,1,1.6,2]];
const cages:[number,number,number][]=[[-4.3,1.7,-6.6],[-1.7,2.5,-7.3],[1.9,1.5,-6.5],[4.5,2.3,-7.2],[-6.9,2.1,-2.6],[-7.1,1.4,1.4]];
const cageBars:Part[]=cages.flatMap(([x,y,z])=>Array.from({length:10},(_,i)=>{const a=i/10*Math.PI*2;return [x+Math.cos(a)*.55,y+.9,z+Math.sin(a)*.55,.035,1.8,.035] as Part;}));
const cageRims:Part[]=cages.flatMap(([x,y,z])=>[[x,y,z,.6,.08,.6],[x,y+1.8,z,.6,.08,.6]] as Part[]);
const cageRoofs:Part[]=cages.map(([x,y,z])=>[x,y+2.1,z,.66,.55,.66]);
const cageChains:Part[]=cages.flatMap(([x,y,z])=>chain(x,z,y+2.35,x<-6?5.2:5.6));
const cageKnots:Part[]=cages.flatMap(([x,y,z],i)=>[[x+(x<-6?.6:0),y+.95,z+(x<-6?0:.6),.2,.24,.18,i],[x+(x<-6?.62:.12),y+1.2,z+(x<-6?.12:.62),.12,.14,.12,i+1]] as Part[]);
const gardenBranches:Part[]=[[0,5.6,-7.1,1,1,1],[-6.8,5.2,-.4,.85,1,1,Math.PI/2]],gardenTrunks:Part[]=[[-7.6,0,-8,1,1,1,.4],[7.4,0,-8.2,1,1,1,Math.PI-.3]];
const gardenDrops:Part[]=[[-3,-1.9,-7,1,1,1],[.4,-1.9,-7.3,1.1,1,1,1],[3.2,-1.9,-6.9,.9,1,1,2],[-6.8,-2.3,-4.8,1,1,1,.6],[-6.9,-2.3,3,1,1,1,2.2]];
const bedEdge:Part[]=[[6.4,.15,-3.5,.25,.3,4.6],[7.8,.15,-3.5,.25,.3,4.6],[7.1,.15,-1.3,1.6,.3,.25],[7.1,.15,-5.7,1.6,.3,.25],[6.4,.15,2.4,.25,.3,3.2],[7.8,.15,2.4,.25,.3,3.2],[7.1,.15,4,1.6,.3,.25]];
const bedPlants:Part[]=[...[-5.2,-4.4,-3.6,-2.8,-2].map((z,i)=>[7.1+(i%2?.25:-.25),0,z,2.4,2.6,2.4,i] as Part),...[1.3,2.1,2.9,3.6].map((z,i)=>[7.1+(i%2?-.25:.25),0,z,2.2,2.4,2.2,i+3] as Part)];
const bedFruit:Part[]=bedPlants.flatMap(([x,,z],i)=>[[x+.2,.62,z+.1,.07,.08,.07,i],[x-.15,.5,z-.2,.06,.07,.06,i]] as Part[]);
const gardenFungus:Part[]=[[-6.1,0,-5.9,3,3,3],[-5.8,0,-1.2,2.4,2.4,2.4,1],[-6,0,2.6,2.8,2.8,2.8,2],[2.8,0,-6.1,2.6,2.6,2.6,.5],[-1.2,0,-6.2,2,2,2,2.4]];
const irrigation:Part[]=[[7.1,.42,-.3,.07,9.6,.07,0,Math.PI/2],[3.5,.42,-6.15,.07,7,.07,0,0,Math.PI/2]];
const channel:Part[]=[[5.9,.007,-3.8,.32,.01,3.6,.5],[4.1,.007,-5.2,.32,.01,1.6,1.2]];
const gardenMoss=[...moss(-8,-7.4,8,-7.4,6.2,46,1,2.6),...moss(-7.5,-6,-7.5,5,5,22,60,2)];
function GardenOfLocks({room,reduced}:{room:RoomCtx;reduced:boolean}){
 return <>
  <Bedrock color="#1d201a"/><Floor tile={[]} dirt={earth([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])}/>
  <group>
   <Instances parts={patches(1,14)} geometry={geo.rock} color="#2f4426" material={decal('#2c4024',.45)} shadow={false}/><Instances parts={puddles(3,5)} geometry={geo.rock} color="#4f6461" material={puddle} shadow={false}/>
   <Instances parts={channel} color="#4f6461" material={puddle} shadow={false}/>
   <Instances parts={gardenMoss} geometry={geo.cone} color="#4f6b36" jitter={.3} shadow={false}/>
   <Instances parts={cageChains} geometry={geo.link} color="#4a5050" roughness={.5} metalness={.6} shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <SolidKit ctx={room} url={TALL_A} parts={caveBack} material={caveTint} radius={p=>.5*Math.min(p[3],p[5])}/><SolidKit ctx={room} url={TALL_B} parts={[...caveLeft,...caveRight]} material={caveTint} radius={p=>.5*Math.min(p[3],p[5])}/>
   <SolidKit ctx={room} url={STONE_C} parts={gardenBoulders} material={rockTint} radius={p=>.5*Math.min(p[3],p[5])}/>
   <Instances parts={gardenBranches} geometry={BRANCH} color="#4f3c2b"/><Solid ctx={room} parts={gardenTrunks} radius={()=>1.4} geometry={TRUNK} color="#4a3828"/>
   <Instances parts={gardenDrops} geometry={DROP} color="#59442f" shadow={false}/>
   <Instances parts={cageBars} geometry={geo.cyl} color="#3f4644" roughness={.55} metalness={.55}/><Instances parts={cageRims} geometry={geo.cyl} color="#4a4f4b" roughness={.55} metalness={.5}/>
   <Instances parts={cageRoofs} geometry={geo.cone} color="#4b3a2a" flat/><Instances parts={cageKnots} geometry={geo.rock} color="#5f6b34" material={knotGlow}/>
   <Solid ctx={room} parts={bedEdge} color="#4a3a2a" radius={thin}/><SolidKit ctx={room} url={BUSH} parts={bedPlants} material={leafTint} radius={p=>.2*Math.min(p[3],p[5])}/>
   <Instances parts={bedFruit} geometry={geo.rock} color="#f1d48a" material={fruitGlow} shadow={false}/>
   <Solid ctx={room} parts={irrigation} geometry={geo.cyl} radius={()=>.1} color="#6a5a45" roughness={.6} metalness={.3}/>
   <SolidKit ctx={room} url={FUNGUS} parts={gardenFungus} material={fungusGlow} shadow={false} radius={p=>.14*Math.min(p[3],p[5])}/>
  </group>
  <Light position={[-5.6,.8,-4.2]} color="#6fe0b0" intensity={7} distance={7}/><Light position={[0,3.6,-1.5]} color="#9fd8c0" intensity={7} distance={12}/><Light position={[1,1,-6]} color="#7fd8b8" intensity={6} distance={7}/><Light position={[6.6,1.4,-1]} color="#f2c96f" intensity={6} distance={6}/>
  <Flame position={[7.1,.9,-6.3]} size={.4} reduced={reduced}/>
 </>;
}

// ── roots-2 The Nursery of Echoes: tiers of small clay figures under roots that feed them copied voices ──
const nurseryTiers:Part[]=[0,1,2].flatMap(i=>{const h=.38*(i+1);return [[-4,h/2,-5.95-.45*i,5.6,h,.45],[4,h/2,-5.95-.45*i,5.6,h,.45],[-5.95-.45*i,h/2,-.6,.45,h,9.6]] as Part[];});
const figures=[0,1,2].flatMap(i=>{const h=.38*(i+1),z=-5.95-.45*i,x=-5.95-.45*i;return [...Array.from({length:22},(_,k)=>[-6.3+k*.6+(rand(k+i*30)-.5)*.2,h,z+(rand(k+i*7)-.5)*.12,k+i*22] as [number,number,number,number]).filter(([fx])=>Math.abs(fx)>.9),...Array.from({length:15},(_,k)=>[x+(rand(k+i*11)-.5)*.12,h,-4.6+k*.58,100+k+i*15] as [number,number,number,number])];});
const figureBodies:Part[]=figures.map(([x,y,z,i])=>{const s=.8+rand(i)*.5;return [x,y+.13*s,z,.15*s,.26*s,.15*s,rand(i+1)*6,0,(rand(i+2)-.5)*.2] as Part;});
const figureHeads:Part[]=figures.map(([x,y,z,i])=>{const s=.8+rand(i)*.5;return [x+(rand(i+2)-.5)*.04,y+.33*s,z,.1*s,.11*s,.1*s,rand(i+3)*6] as Part;});
const nurseryCandles:Part[]=[-5.4,-3,3,5.4].map((x,i)=>[x,.38*(i%3+1),-5.95-.45*(i%3),.45,.45,.45]);
const nurseryDrops:[number,number,number][]=[[-4.8,-6.55,.62],[-2.6,-6.6,.55],[2.2,-6.6,.6],[4.6,-6.55,.62]];
const nurseryArches:Part[]=[[-4,0,-6.7,1,1,1],[4.2,0,-6.7,.9,1,1,.2],[-7.1,0,-2.6,1,1,1,Math.PI/2]];
const nurseryMoss=[...moss(-9,-6.6,9,-6.6,4,40,12,1.4),...moss(-6.9,-6,-6.9,5,4,20,90,1.2)];
function NurseryOfEchoes({room,reduced}:{room:RoomCtx;reduced:boolean}){
 return <>
  <Bedrock/><Floor tile={tiles([1,4,13])} dirt={earth([1,4,13])}/>
  <group>
   <Instances parts={patches(5,10)} geometry={geo.rock} color="#2f4426" material={decal('#334227',.4)} shadow={false}/><Instances parts={puddles(5,4)} geometry={geo.rock} color="#4f6461" material={puddle} shadow={false}/>
   {/* Echo rings: copied voices spreading across the floor from the figures. */}
   {[[1.8,1.88],[3.4,3.46],[5,5.05]].map(([a,b])=><mesh key={a} position={[0,.006,-5.6]} rotation={[-Math.PI/2,0,0]} material={decal('#b7c5d8',.32)} raycast={noRaycast}><ringGeometry args={[a,b,48,1,Math.PI*.05,Math.PI*.9]}/></mesh>)}
   <Instances parts={nurseryMoss} geometry={geo.cone} color="#56703a" jitter={.3} shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Walls room={room} url={WALL} parts={[...wallRow(-7.2,[-8,-4,4,8]),...wallColumn(-7.8,SIDE_Z)]}/><Walls room={room} url={WALL_ARCHED} parts={wallRow(-7.2,[0])}/>
   <SolidKit ctx={room} url={STONE_A} parts={wallColumn(7.6,[-5.2,-2.4,.4,3.2,6]).map((p,i)=>[p[0],0,p[2],2+rand(i)*.6,1.3,2,i] as Part)} material={rockTint} radius={p=>.5*Math.min(p[3],p[5])}/>
   <Solid ctx={room} parts={nurseryTiers} color="#6b665a" jitter={.08} radius={thin}/>
   <Instances parts={figureBodies} geometry={geo.cone} color="#9c6448" jitter={.3} flat/><Instances parts={figureHeads} geometry={geo.rock} color="#b0765a" jitter={.25} flat shadow={false}/>
   <KitInstances url={CANDLE} parts={nurseryCandles} shadow={false}/>
   <Solid ctx={room} parts={nurseryArches} radius={()=>.6} geometry={ARCH} color="#57412e"/><WallRoots west drops={nurseryDrops}/>
  </group>
  <mesh position={[0,1.6,-7.75]} raycast={noRaycast}><planeGeometry args={[2.6,3.2]}/><meshBasicMaterial color="#0a0d0c"/></mesh>
  {nurseryCandles.map(([x,y,z])=><Flame key={x} position={[x,y+.62,z]} size={.28} reduced={reduced}/>)}
  <Light position={[-3,1.8,-5.6]} color="#ffc98a" intensity={8} distance={7}/><Light position={[3,1.8,-5.6]} color="#ffc98a" intensity={8} distance={7}/><Light position={[0,2.4,-4.4]} color="#9fb6e8" intensity={6} distance={8}/>
 </>;
}

// ── roots-3 The Thorn Infirmary: cells turned sickrooms, cots along the walls, thorned roots and drying bandages ──
const cots:[number,number,number][]=[[-4.3,-6.15,0],[2.3,-6.15,0],[4.7,-6.15,0],[-6.2,-3.4,Math.PI/2],[-6.2,-.6,Math.PI/2],[-6.2,2.2,Math.PI/2]];
const cotFrames:Part[]=cots.map(([x,z,ry])=>[x,.24,z,2,.14,.85,ry]),cotMattress:Part[]=cots.map(([x,z,ry])=>[x,.37,z,1.86,.12,.74,ry]);
const cotPillows:Part[]=cots.map(([x,z,ry])=>[x-(ry?0:.72),.47,z+(ry?.72:0),ry?.55:.32,.09,ry?.32:.55,0]),cotBlankets:Part[]=cots.filter((_,i)=>i!==1).map(([x,z,ry],i)=>[x+(ry?0:.25),.44,z-(ry?.25:0),ry?.78:1.2,.05,ry?1.2:.78,(rand(i)-.5)*.2]);
const thornVines:[number,number,number,number][]=[[-7.6,2.2,-6.6,0],[1.6,3,-6.6,0],[-6.9,2.5,4,Math.PI/2],[-6.9,1.6,-1.8,Math.PI/2]];
const thornVineParts:Part[]=thornVines.map(([x,y,z,ry])=>[x,y,z,1,1,1,ry]);
const thorns:Part[]=thornVines.flatMap((p,i)=>along(VINE_PTS,p,22,[.045,.2,.045],i*40));
const infirmaryArches:Part[]=[[-1.9,0,-6.7,1,1,1],[6.4,0,-6.7,.9,1,.9,-.3],[-7.3,0,.8,1,1,1,Math.PI/2]];
const archThorns:Part[]=infirmaryArches.flatMap(([x,,z,s,,,ry=0],i)=>along(ARCH_PTS.map(([a,b,c])=>[a*s,b*s,c*s] as Vec3),[x,0,z,ry],14,[.06,.24,.06],i*17+300));
const bandageLine:Part[]=[[-5.6,2.35,-6.45,.02,4.2,.02,0,0,Math.PI/2],[-6.75,2.1,2.8,.02,3.4,.02,0,Math.PI/2]];
const bandages:Part[]=[...Array.from({length:8},(_,i)=>[-7.4+i*.5,2.35-.32-rand(i)*.12,-6.45,.2,.6+rand(i+4)*.2,.015,0,0,(rand(i+2)-.5)*.1] as Part),...Array.from({length:6},(_,i)=>[-6.75,2.1-.3-rand(i+9)*.1,1.4+i*.55,.015,.55+rand(i+5)*.2,.2] as Part)];
const herbs:Part[]=Array.from({length:7},(_,i)=>[-6.85,3.1-.25,-5+i*.55,.12,.5,.12,i,Math.PI]);
const tableBottles:Part[]=[[6.35,1,-4.9,.06,.24,.06],[6.6,1,-4.7,.05,.18,.05],[6.85,1,-5,.07,.28,.07],[6.5,.98,-5.2,.05,.16,.05]];
const infirmaryMoss=[...moss(-9,-6.6,9,-6.6,4,36,23,1.3),...moss(-7.2,-6,-7.2,5,4,18,150,1.1)];
const straw:Part[]=[[-4.3,.006,-5.2,1.6,.01,.6,.1],[3.4,.006,-5.3,2.2,.01,.6,-.05],[-5.2,.006,-.6,.6,.01,4.6,.1],[-1,.006,1.4,1.2,.01,.7,.6],[2.6,.006,2.8,.9,.01,.5,1.4]];
function ThornInfirmary({room,reduced}:{room:RoomCtx;reduced:boolean}){
 return <>
  <Bedrock/><Floor tile={tiles([0,7])} dirt={earth([0,7])}/>
  <group>
   <Instances parts={straw} color="#8d7a45" material={decal('#8a7743',.75)} shadow={false}/>
   <Instances parts={patches(9,8)} geometry={geo.rock} color="#2f4426" material={decal('#33452a',.4)} shadow={false}/><Instances parts={puddles(9,4)} geometry={geo.rock} color="#4f6461" material={puddle} shadow={false}/>
   <Instances parts={infirmaryMoss} geometry={geo.cone} color="#566e3a" jitter={.3} shadow={false}/>
   <Instances parts={bandageLine} geometry={geo.cyl} color="#8a7a5c" shadow={false}/><Instances parts={bandages} color="#d9d1bc" jitter={.12} shadow={false}/>
   <Instances parts={herbs} geometry={geo.cone} color="#6e7d43" jitter={.3} shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Walls room={room} url={WALL_GATED} parts={[...wallRow(-7.2,[-4,4]),...wallColumn(-7.8,SIDE_Z)]}/><Walls room={room} url={WALL} parts={wallRow(-7.2,[-8,8])}/><Walls room={room} url={WALL_DOOR} parts={wallRow(-7.2,[0])}/>
   <Walls room={room} url={WALL_BROKEN} parts={wallColumn(7.8,[-4.7,-.7,3.3],.28)}/>
   <Solid ctx={room} parts={cotFrames} color="#5e4632" radius={thin}/><Solid ctx={room} parts={cotMattress} color="#cbbf9f" jitter={.08} radius={thin}/><Instances parts={cotPillows} color="#e2dccb" jitter={.05} shadow={false}/><Instances parts={cotBlankets} color="#6d5a48" jitter={.35} shadow={false}/>
   <Instances parts={thornVineParts} geometry={VINE} color="#4b3a28" shadow={false}/><Instances parts={[...thorns,...archThorns]} geometry={geo.cone} color="#8b7a5a" jitter={.2} shadow={false}/>
   <Solid ctx={room} parts={infirmaryArches} radius={()=>.6} geometry={ARCH} color="#4f3b29"/>
   <SolidKit ctx={room} url={TABLE} parts={[[6.6,0,-4.95,.6,.9,.6]]} radius={p=>1*Math.min(p[3],p[5])}/><Instances parts={tableBottles} geometry={geo.cyl} color="#7fa38a" roughness={.2} metalness={.1} shadow={false}/>
   <SolidKit ctx={room} url={PILLAR} parts={[[-6.6,0,-6.4,.7,1,.7]]} radius={p=>.75*Math.min(p[3],p[5])}/>
   <Prop file="Bucket_83obI9bNun.glb" position={[5.9,0,-6.3]} height={.42}/>
  </group>
  <Flame position={[6.35,1.1,-4.75]} size={.25} reduced={reduced}/>
  <Light position={[6,1.6,-4.6]} color="#ffcf8f" intensity={7} distance={7}/><Light position={[-5,2,-4.8]} color="#ffd9a0" intensity={7} distance={8}/><Light position={[-5.4,1.6,1.6]} color="#c9e0b0" intensity={5} distance={6}/>
 </>;
}

// ── roots-4 Tavin's Survey Camp: a lamp on a desk with a half-finished map, a map board, survey gear ──
const DESK:Vec3=[-2.3,0,-7.1];
const deskMap:Part[]=[[DESK[0],.92,DESK[2],1.5,.012,1,.08],[DESK[0]+.75,.93,DESK[2]+.25,.5,.012,.4,-.3],[DESK[0]-.85,.95,DESK[2]+.3,.3,.06,.22,.2],[DESK[0]-.85,1.01,DESK[2]+.3,.28,.05,.2,.5],[DESK[0]+.9,.93,DESK[2]-.4,.3,.02,.24,-.4]];
const pinned:Part[]=[[-7.27,2.3,-3.2,.02,.4,.3,0,.1],[-7.27,2,-2.6,.02,.32,.26,0,-.1],[-7.27,2.5,-2.2,.02,.36,.3],[-7.27,1.8,-3.5,.02,.3,.24,0,.15],[-7.27,2.2,-1.6,.02,.42,.32,0,-.05],[.6,2.6,-6.66,.3,.36,.02,0,0,.1],[.9,1.9,-6.66,.26,.32,.02,0,0,-.12]];
const mapInk:Part[]=[[DESK[0]-.2,.93,DESK[2],.9,.004,.02,.4],[DESK[0]+.1,.93,DESK[2]-.15,.02,.004,.5,.2],[DESK[0]-.35,.93,DESK[2]+.2,.4,.004,.02,-.6]];
const boardInk:Part[]=[[2.2,2.4,-6.64,1.8,.025,.02,0,0,.3],[1.9,1.9,-6.64,1.2,.025,.02,0,0,-.5],[2.8,2.1,-6.64,.025,1,.02],[1.4,2.6,-6.64,.9,.025,.02,0,0,-.15]];
const boardPins:Part[]=[[1.3,2.7,-6.6,.05,.05,.05],[2.9,2.6,-6.6,.05,.05,.05],[2.8,1.6,-6.6,.05,.05,.05],[1.5,1.7,-6.6,.05,.05,.05],[2.2,2.2,-6.6,.06,.06,.06]];
const tripod:Part[]=[0,1,2].map(i=>{const a=i/3*Math.PI*2;return [5.9+Math.cos(a)*.25,.62,-6.1+Math.sin(a)*.25,.025,1.3,.025,0,Math.sin(a)*.2,-Math.cos(a)*.2] as Part;});
const surveyStakes:Part[]=[[-6,.35,4.6,.04,.7,.04],[-6,.35,-5.8,.04,.7,.04],[6,.35,4.6,.04,.7,.04]];
const chalk:Part[]=[...Array.from({length:14},(_,i)=>[-2.3+i*.18*.6,.006,-5.6+i*.75,.05,.01,.42,-.14] as Part)];
const scatteredNotes:Part[]=[[-2.8,.008,-5.1,.3,.01,.22,.4],[-1.6,.008,-4.6,.3,.01,.22,1.1],[-2.2,.008,-4.2,.3,.01,.22,2.3],[-.9,.008,-5,.3,.01,.22,.2]];
const campBoxes:Part[]=[[-6.4,0,-5.9,.5,.5,.5,.3],[-6.3,.75,-5.9,.36,.36,.36,.9],[6.5,0,-1.4,.42,.42,.42,.3],[6.6,0,.1,.36,.36,.36,1],[6.5,.6,-1.3,.3,.3,.3,.7]];
const bedroll:Part[]=[[-6.4,.2,-1.4,.22,1.7,.22,0,Math.PI/2]],rolledMaps:Part[]=[[-6.3,.95,-4.4,.05,.8,.05,0,.15],[-6.2,.95,-4.3,.05,.8,.05,0,-.1,.12],[-6.4,.98,-4.25,.05,.85,.05,0,.05,-.15]];
const campArches:Part[]=[[-5.6,0,-6.7,1,1,1,.2],[4.8,0,-6.7,1,1,1,-.15],[-7.3,0,1.4,.9,1,.9,Math.PI/2]],campDrops:[number,number,number][]=[[-4.2,-6.6,.55],[.6,-6.6,.6],[3.8,-6.6,.5]];
const campMoss=[...moss(-9,-6.6,9,-6.6,4,30,40,1.2),...moss(-7.2,-6,-7.2,5,4,14,200,1)];
function SurveyCamp({room,reduced}:{room:RoomCtx;reduced:boolean}){
 // Track B companion fork: Oren sits down across the desk like a debriefing; with Mira, Tavin's notes are scattered where she rushed in.
 const oren=!!room.save?.scene.description.includes('Oren, who has');
 return <>
  <Bedrock color="#221f1a"/><Floor tile={tiles([0,1,4,5,8])} dirt={earth([0,1,4,5,8])}/>
  <group>
   {/* The lamplight pool and its edge, where one companion stops in the Oren variant. */}
   <mesh position={[DESK[0],.005,DESK[2]+1.8]} scale={[3.4,1,3.4]} geometry={lampPool} material={decal('#ffcf7a',.1)} raycast={noRaycast}/>
   <mesh position={[DESK[0],.006,DESK[2]+1.8]} rotation={[-Math.PI/2,0,0]} material={decal('#f0c070',.3)} raycast={noRaycast}><ringGeometry args={[3.34,3.42,64]}/></mesh>
   <Instances parts={chalk} color="#d8d0b8" material={decal('#d6cfb6',.45)} shadow={false}/>
   {!oren&&<Instances parts={scatteredNotes} color="#d9caa0" material={decal('#dccca2',.9)} shadow={false}/>}
   <Instances parts={patches(14,8)} geometry={geo.rock} color="#2f4426" material={decal('#33452a',.4)} shadow={false}/><Instances parts={pinned} color="#d8c89c" jitter={.1} shadow={false}/>
   <Instances parts={campMoss} geometry={geo.cone} color="#566e3a" jitter={.3} shadow={false}/>
   <Instances parts={boardInk} color="#7b2f25" shadow={false}/><Instances parts={boardPins} geometry={geo.rock} color="#b8413a" shadow={false}/>
   <Instances parts={mapInk} color="#3a2a1d" shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Walls room={room} url={WALL_BROKEN} parts={[...wallRow(-7.2,[-8,-4,0,8]),...wallColumn(-7.8,[-4.7,3.3]),...wallColumn(7.8,[-4.7,-.7,3.3],.3)]}/><Walls room={room} url={WALL} parts={[...wallRow(-7.2,[4]),...wallColumn(-7.8,[-.7])]}/>
   <mesh position={[2.2,2.2,-6.66]} material={mat('#c9b88e')}><boxGeometry args={[2.4,1.5,.03]}/></mesh>
   <SolidKit ctx={room} url={TABLE} parts={[[DESK[0],0,DESK[2],1.1,.9,.8]]} radius={p=>1*Math.min(p[3],p[5])}/><Instances parts={deskMap} color="#d8c89c" jitter={.06} shadow={false}/>
   <KitInstances url={CANDLE} parts={[[DESK[0]+.6,.9,DESK[2]-.25,.5,.5,.5]]} shadow={false}/>
   <mesh position={[DESK[0]-.55,1.1,DESK[2]-.2]} material={lampGlass}><boxGeometry args={[.18,.26,.18]}/></mesh>
   <Prop file="Chair_zMmKNm8w4a.glb" position={[DESK[0],0,DESK[2]-1.15]} height={1} rotation={oren?Math.PI:Math.PI+.7}/>
   {oren&&<Prop file="Chair_zMmKNm8w4a.glb" position={[DESK[0]+.2,0,DESK[2]+1.1]} height={1} rotation={-.15}/>}
   <Solid ctx={room} parts={tripod} geometry={geo.cyl} radius={()=>.4} color="#6b5236"/><mesh position={[5.9,1.33,-6.1]} material={mat('#a88a4c',.4,.6)}><boxGeometry args={[.22,.14,.14]}/></mesh>
   <Solid ctx={room} parts={surveyStakes} geometry={geo.cyl} radius={()=>.1} color="#7a6040"/>
   <Solid ctx={room} parts={bedroll} geometry={geo.cyl} radius={()=>.25} color="#4f5a64"/>
   <SolidKit ctx={room} url={BARREL} parts={[[-6.3,0,-4.3,.3,.32,.3]]} radius={p=>.9*Math.min(p[3],p[5])}/><Instances parts={rolledMaps} geometry={geo.cyl} color="#d4c49a" shadow={false}/>
   <SolidKit ctx={room} url={BOX} parts={campBoxes} radius={p=>.75*Math.min(p[3],p[5])}/>
   <Solid ctx={room} parts={campArches} radius={()=>.6} geometry={ARCH} color="#54402d"/><WallRoots drops={campDrops}/>
  </group>
  <Flame position={[DESK[0]-.55,1.12,DESK[2]-.2]} size={.3} reduced={reduced}/><Flame position={[DESK[0]+.6,1.42,DESK[2]-.25]} size={.2} reduced={reduced}/>
  <Light position={[DESK[0]-.4,1.7,DESK[2]+.6]} color="#ffc777" intensity={16} distance={10}/><Light position={[4,2.5,-5.4]} color="#b9c9b0" intensity={4} distance={7}/>
 </>;
}

// ── roots-5 The Sap Reservoir: the fourth tuning stone in a tank of amber, three valves from smallest to largest ──
const TANK:Vec3=[0,0,-8];
const tankHoops:Part[]=[.9,2.5,4.1].map(y=>[TANK[0],y,TANK[2],1.95,1.95,1.95,0,Math.PI/2]);
const valveWheels:Part[]=[[2.5,1.15,-6.42,.22,.22,.22],[3.9,1.15,-6.42,.34,.34,.34],[5.5,1.15,-6.42,.5,.5,.5]];
const valveBodies:Part[]=valveWheels.flatMap(([x,,,s])=>[[x,1.15,-6.6,s*.5,.34,s*.5,0,Math.PI/2],[x,.55,-6.75,s*.55,1.1,s*.55]] as Part[]);
const valveSpokes:Part[]=valveWheels.flatMap(([x,y,z,s])=>[[x,y,z+.02,s*1.9,.04,.04],[x,y,z+.02,.04,s*1.9,.04]] as Part[]);
const sapPipes:Part[]=[[4.1,1.15,-6.75,.14,4.4,.14,0,0,Math.PI/2],[-4.1,1.15,-6.75,.14,4.4,.14,0,0,Math.PI/2],[-6.2,2.4,-6.75,.14,2.6,.14]];
const sapChannels:Part[]=[[0,.007,-4.6,.5,.01,2.4],[0,.007,-1.6,.42,.01,3.8,.12],[-1.5,.007,1.2,.32,.01,3.4,.7],[1.6,.007,1.4,.32,.01,3.2,-.65],[0,.007,4.2,.3,.01,3.2]];
const sapPools:Part[]=[[-2.7,.009,2.6,.7,1,.45,.4],[2.8,.009,2.8,.6,1,.4,1],[.2,.009,5.8,.8,1,.5,.2],[-4.6,.009,-2.6,.5,1,.35,2]];
const reservoirDrops:Part[]=[[-.9,1.3,-7.7,1.3,1,1.3,0],[.8,1.4,-8.3,1.2,1,1.2,2],[0,1.6,-8.2,1.4,1,1.4,4]];
const reservoirArches:Part[]=[[-3.4,0,-6.7,1,1,1,.3],[3.2,0,-6.7,.9,1,.9,-.3],[-7.3,0,-3.2,1,1,1,Math.PI/2],[-7.3,0,2.4,1,1,1,Math.PI/2]];
const reservoirMoss=[...moss(-9,-6.6,-2.2,-6.6,4,18,44,1.3),...moss(2.2,-6.6,9,-6.6,4,18,70,1.3),...moss(-7.2,-6,-7.2,5,4,16,240,1.1)];
function SapReservoir({room,reduced}:{room:RoomCtx;reduced:boolean}){
 return <>
  <Bedrock/><Floor tile={tiles([11])} dirt={earth([11])}/>
  <group>
   <Instances parts={sapChannels} color="#d48a22" material={decal('#c98120',.55)} shadow={false}/>
   <Instances parts={sapPools.map(p=>[p[0],p[1],p[2],p[3],.003,p[5],p[6]] as Part)} geometry={geo.rock} color="#d48a22" material={decal('#c98120',.6)} shadow={false}/>
   <Instances parts={reservoirMoss} geometry={geo.cone} color="#566e3a" jitter={.3} shadow={false}/>
   <Instances parts={valveSpokes} color="#5a5048" roughness={.5} metalness={.6} shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Walls room={room} url={WALL} parts={[...wallRow(-7.2,[-8,-4,4,8]),...wallColumn(-7.8,SIDE_Z)]}/><WallRoots backRoot={false} west drops={[[-6.9,-4.6,.5],[-6.9,1.6,.55]]}/>
   <SolidKit ctx={room} url={TALL_B} parts={wallColumn(7.6,[-5,-2,1,4]).map((p,i)=>[p[0],0,p[2],2,1+rand(i+3)*.5,2,i] as Part)} material={rockTint} radius={p=>.5*Math.min(p[3],p[5])}/>
   {/* The reservoir: a stone plinth, a translucent amber tank bound in iron, the tuning stone suspended at its heart. */}
   <mesh position={[TANK[0],.3,TANK[2]]} material={mat('#5b5a52')} castShadow receiveShadow><cylinderGeometry args={[2.2,2.4,.6,16]}/></mesh>
   <mesh position={[TANK[0],2.6,TANK[2]]} material={amber}><cylinderGeometry args={[1.8,1.8,4,24]}/></mesh>
   <mesh position={[TANK[0],4.85,TANK[2]]} material={mat('#4a4640',.6,.5)} castShadow><coneGeometry args={[2,.9,16]}/></mesh>
   <Instances parts={tankHoops} geometry={crawlTorus} color="#3e3a35" roughness={.5} metalness={.6} shadow={false}/>
   <mesh position={[TANK[0],2.6,TANK[2]]} rotation={[.4,.6,0]} material={tuningStone}><octahedronGeometry args={[.5]}/></mesh>
   <Solid ctx={room} parts={sapPipes} geometry={geo.cyl} radius={()=>.15} color="#4e4740" roughness={.5} metalness={.5}/>
   <Instances parts={valveWheels} geometry={valveTorus} color="#8d6d3e" roughness={.4} metalness={.7}/><Solid ctx={room} parts={valveBodies} geometry={geo.cyl} radius={()=>.3} color="#4e4740" roughness={.5} metalness={.5}/>
   <Instances parts={reservoirDrops} geometry={DROP} color="#5c4631"/><Solid ctx={room} parts={reservoirArches} radius={()=>.6} geometry={ARCH} color="#54402d"/>
   <SolidKit ctx={room} url={LILY} parts={[[-5.9,0,-5.9,2,2,2],[5.9,0,5.9,2,2,2,1]]} material={fernTint} shadow={false} radius={p=>.16*Math.min(p[3],p[5])}/>
   <KitInstances url={TORCH} parts={[[-7.28,1.8,-1.6,.8,.8,.8,Math.PI/2]]} shadow={false}/>
  </group>
  <Flame position={[-6.95,2.42,-1.6]} size={.4} reduced={reduced}/>
  <Light position={[0,2.4,-5.4]} color="#ffad48" intensity={16} distance={11}/><Light position={[0,2.6,-8]} color="#6ae6cf" intensity={5} distance={4}/><Light position={[-6,2.8,-1.6]} color="#ffb46b" intensity={6} distance={7}/>
 </>;
}

// ── roots-6 The Warden's Table: a feast laid before a root throne, a guest book, a hearth that makes the cell feel like a home ──
const TABLE_Z=-6.35,places=[-4.4,-3.3,-2.2,-1.1,1.1,2.2,3.3,4.4];
const feastTable:Part[]=[[0,.78,TABLE_Z,10.6,.1,1.15],...[-5,-1.7,1.7,5].map(x=>[x,.38,TABLE_Z,.16,.76,.9] as Part)];
const feastPlates:Part[]=places.map(x=>[x,.84,TABLE_Z+.28,.17,.015,.17]),feastCups:Part[]=places.map(x=>[x+.28,.9,TABLE_Z+.15,.045,.13,.045]);
const feastDishes:Part[]=[[-3.8,.9,TABLE_Z-.15,.22,.14,.18,.3],[-1.6,.9,TABLE_Z-.2,.18,.12,.2,1],[0,.94,TABLE_Z-.1,.32,.2,.26,0],[1.7,.9,TABLE_Z-.2,.2,.13,.18,2],[3.9,.9,TABLE_Z-.15,.22,.12,.2,.8],...places.map((x,i)=>[x,.88,TABLE_Z+.28,.08,.05,.08,i] as Part)];
const feastBowls:Part[]=[[-3.8,.85,TABLE_Z-.15,.3,.04,.3],[-1.6,.85,TABLE_Z-.2,.28,.04,.28],[0,.85,TABLE_Z-.1,.42,.04,.42],[1.7,.85,TABLE_Z-.2,.28,.04,.28],[3.9,.85,TABLE_Z-.15,.3,.04,.3]];
const feastChairs:Part[]=places.flatMap(x=>[[x,.45,TABLE_Z-.85,.5,.08,.45],[x,1,TABLE_Z-1.05,.5,1.2,.08]] as Part[]);
const throne:Part[]=[[0,.35,-8.2,1.6,.7,1.2],[0,1.6,-8.75,1.7,2.6,.3],[-.85,.75,-8.2,.25,.8,1.1],[.85,.75,-8.2,.25,.8,1.1]];
const throneRoots:Part[]=[[-1.1,0,-9.3,1.05,1.05,1.05,.25],[1.1,0,-9.3,1.05,1.05,1.05,-.25]];
const lectern:Part[]=[[-6.5,.55,-2.4,.4,1.1,.4],[-6.4,1.12,-2.4,.6,.06,.7,0,0,.35]],guestBook:Part[]=[[-6.37,1.19,-2.55,.42,.04,.3,0,0,.35],[-6.37,1.19,-2.25,.42,.04,.3,0,0,.35]];
const hearth:Part[]=[[-7.05,.6,2,.6,1.2,2.2],[-6.75,1.3,2,.8,.2,2.4],[-6.8,.55,.95,.5,1.1,.25],[-6.8,.55,3.05,.5,1.1,.25]];
const rug:Part[]=[[0,.005,-1.2,6.4,.01,7.6]],rugBorder:Part[]=[[0,.006,-1.2,5.8,.01,7]];
const wardenCrawl:Part[]=[[-3.2,-.05,-4.9,1,.45,1,.5],[3.4,-.05,-5,1,.45,1,-.6],[-.4,-.05,2.6,.9,.4,.9,2.8]];
const wardenMoss=[...moss(-9,-6.6,9,-6.6,4,22,55,.9),...moss(-7.2,-6,-7.2,5,4,10,260,.8)];
function WardensTable({room,reduced}:{room:RoomCtx;reduced:boolean}){
 return <>
  <Bedrock/><Floor tile={tiles()} dirt={[]}/>
  <group>
   <Instances parts={rug} color="#5b2422" material={decal('#5b2523',.92)} shadow={false}/><Instances parts={rugBorder} color="#7a3a2c" material={decal('#7d3b2e',.9)} shadow={false}/>
   <mesh position={[0,.007,-1.2]} rotation={[-Math.PI/2,0,0]} material={decal('#c09a5a',.55)} raycast={noRaycast}><ringGeometry args={[1.5,1.62,6]}/></mesh>
   <Instances parts={wardenCrawl} geometry={CRAWL} color="#4f3c2a"/>
   <Instances parts={wardenMoss} geometry={geo.cone} color="#566e3a" jitter={.3} shadow={false}/>
   <Instances parts={feastPlates} geometry={geo.cyl} color="#d9d2c0" jitter={.05} shadow={false}/><Instances parts={feastBowls} geometry={geo.cyl} color="#9a8a6a" jitter={.1} shadow={false}/>
   <Instances parts={feastCups} geometry={geo.cyl} color="#a88a4c" roughness={.4} metalness={.6} shadow={false}/><Instances parts={feastDishes} geometry={geo.rock} color="#9b5a2e" jitter={.5} flat shadow={false}/>
   <Instances parts={guestBook} color="#e4dccb" shadow={false}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Walls room={room} url={WALL} parts={[...wallRow(-7.2,[-8,-4,4,8]),...wallColumn(-7.8,SIDE_Z),...wallColumn(7.8,[-4.7,-.7,3.3],.3),[-2.4,0,-8.4,.6,1,.6,Math.PI/2],[2.4,0,-8.4,.6,1,.6,Math.PI/2]]} size={.6}/><Walls room={room} url={WALL_ARCHED} parts={wallRow(-9.6,[0])}/>
   <KitInstances url={BANNER} parts={[[-4,0,-7.2,1,1,1],[4,0,-7.2,1,1,1]]} shadow={false}/>
   <Solid ctx={room} parts={feastTable} color="#5a3d26" jitter={.05} radius={thin}/><Solid ctx={room} parts={feastChairs} color="#4a3220" jitter={.08} radius={thin}/>
   <Instances parts={[[0,.855,TABLE_Z,10.2,.012,.5]]} color="#7a2a24"  shadow={false}/>
   <KitInstances url={CANDLE} parts={[-5,-2.75,2.75,5].map(x=>[x,.83,TABLE_Z-.05,.45,.45,.45] as Part)} shadow={false}/>
   <Solid ctx={room} parts={throne} color="#5d5a52" radius={()=>.6}/><Instances parts={throneRoots} geometry={ARCH} color="#4b3826"/><WallRoots backRoot={false} west drops={[[-6.9,-5.4,.5],[-6.9,-.6,.42]]}/>
   <Solid ctx={room} parts={lectern} color="#4f3826" radius={()=>.3}/>
   <Solid ctx={room} parts={hearth} color="#5f5b52" radius={()=>.3}/>
  </group>
  {[-5,-2.75,2.75,5].map(x=><Flame key={x} position={[x,1.45,TABLE_Z-.05]} size={.22} reduced={reduced}/>)}
  <Flame position={[-6.95,.35,2]} size={1.1} reduced={reduced}/><Flame position={[-6.2,1.42,-2.2]} size={.18} reduced={reduced}/>
  <Light position={[0,2,-5.6]} color="#ffc88a" intensity={14} distance={10}/><Light position={[-6.2,1.2,2]} color="#ff9a4e" intensity={12} distance={8}/><Light position={[0,2.4,-8.4]} color="#9fc29a" intensity={4} distance={5}/>
 </>;
}

// ── roots-7 The Hanging Bridge: a plank deck over a chasm, the roots drawing back, a guard's gate shut at the far end ──
const planks:Part[]=Array.from({length:25},(_,i)=>{const z=8.4-i*.6,cut=rand(i+3)<.25;return [cut?0:(rand(i)-.5)*.2,-.08,z,cut?11.1:11.6+rand(i+1)*.3,.16,.54,(rand(i+2)-.5)*.02] as Part;});
const deckBeams:Part[]=[[-4.4,-.42,1.1,.35,.5,15],[0,-.42,1.1,.35,.5,15],[4.4,-.42,1.1,.35,.5,15]];
const railPosts:Part[]=[-1,1].flatMap(s=>[7.6,5.2,2.8,.4,-2,-4.4].map(z=>[s*6.05,.55,z,.09,1.4,.09] as Part));
const ropes:Part[]=[-1,1].flatMap(s=>[1.1,.6].map(y=>[s*6.05,y,1.6,.025,12.8,.025,0,Math.PI/2] as Part));
const gateLanding:Part[]=[[0,-.3,-7.55,13,.6,2.9]];
const cliffs:Part[]=[-1,1].flatMap(s=>Array.from({length:7},(_,i)=>[s*(13+rand(i+s*5)*2.5),-16,-12+i*4.4,6+rand(i)*3,14+rand(i+2)*6,5,rand(i+4)*6] as Part));
const chasmDrops:Part[]=[[-8.6,-2,-3,1.6,1,1.6,0],[-9.4,-3.5,2.4,1.8,1,1.8,2],[8.8,-2.4,-1,1.6,1,1.6,1],[9.6,-4,4.4,1.9,1,1.9,3],[-7.8,1,-7.6,1.1,1,1.1,4],[7.6,1.2,-7.8,1,1,1,5]];
const chasmArches:Part[]=[[-10.5,-3,-6,1.8,2.2,1.8,Math.PI/2],[10.5,-3.4,-7,1.8,2.2,1.8,-Math.PI/2],[-11.5,-5,1,1.6,2.4,1.6,Math.PI/2]];
const bridgeMoss=[...moss(-6.05,-4.4,-6.05,7.6,.95,18,300,.9),...moss(6.05,-4.4,6.05,7.6,.95,18,330,.9),...moss(-6,-8.4,6,-8.4,4,26,360,1.4)];
function HangingBridge({room,reduced}:{room:RoomCtx;reduced:boolean}){
 return <>
  {/* No bedrock: the chasm drops away beyond the deck. */}
  <mesh position={[0,-26,0]} rotation={[-Math.PI/2,0,0]} raycast={noRaycast}><planeGeometry args={[90,90]}/><meshBasicMaterial color="#050909"/></mesh>
  <group>
   <Instances parts={bridgeMoss} geometry={geo.cone} color="#566e3a" jitter={.3} shadow={false}/>
   <Instances parts={ropes} geometry={geo.cyl} color="#8a7650" shadow={false}/>
   <Instances parts={chasmDrops} geometry={DROP} color="#5c4631" shadow={false}/><Instances parts={chasmArches} geometry={ARCH} color="#54402d" shadow={false}/>
   <SolidKit ctx={room} url={TALL_A} parts={cliffs} material={caveTint} shadow={false} radius={p=>.5*Math.min(p[3],p[5])}/>
  </group>
  <group userData={{blocksLabels:true}}>
   <Instances parts={planks} color="#7a5c3c" jitter={.22}/><Instances parts={deckBeams} color="#4a3826" shadow={false}/>
   <Solid ctx={room} parts={railPosts} geometry={geo.cyl} radius={()=>.12} color="#5a4430"/>
   <Solid ctx={room} parts={gateLanding} color="#5c5b53" radius={()=>1.2}/>
   <Walls room={room} url={WALL} parts={wallRow(-8.4,[-4.2,4.2])}/><Walls room={room} url={WALL_GATED} parts={wallRow(-8.4,[0])}/>
   <SolidKit ctx={room} url={PILLAR} parts={[[-2.2,0,-7.7,.5,1.1,.5],[2.2,0,-7.7,.5,1.1,.5]]} radius={p=>.75*Math.min(p[3],p[5])}/>
   <SolidKit ctx={room} url={STUMP} parts={[[-6.6,-.4,-6.4,4,4,4,.4],[6.7,-.4,-6.6,3.6,3.6,3.6,2.2]]} material={barkTint} radius={p=>.2*Math.min(p[3],p[5])}/>
  </group>
  {[-2.2,2.2].map(x=><Flame key={x} position={[x,4.75,-7.4]} size={.5} reduced={reduced}/>)}
  <Light position={[0,3.2,-6.6]} color="#ffbe78" intensity={12} distance={9}/><Light position={[0,-5,1]} color="#6f9fb8" intensity={14} distance={16}/>
  {/* Lanterns hung on the rail posts light the crossing. */}
  {([[-6.05,1.55,2.8],[6.05,1.55,-2]] as Vec3[]).map(p=><group key={p[2]}><mesh position={p} material={lampGlass}><boxGeometry args={[.16,.22,.16]}/></mesh><Flame position={[p[0],p[1]-.05,p[2]]} size={.22} reduced={reduced}/><Light position={[p[0]*.9,p[1]+.3,p[2]]} color="#ffc070" intensity={7} distance={8}/></group>)}
 </>;
}

// ── roots-8 A Place Without Locks: the rootlift under a shaft of light, cell doors hanging open, a choir below ──
const LIFT_Z=-8.1;
const liftPosts:Part[]=[-1,1].flatMap(s=>[-6.6,-9.6].map(z=>[s*1.9,3.4,z,.2,6.8,.2] as Part));
const liftBeams:Part[]=[[0,6.8,-6.6,4,.22,.22],[0,6.8,-9.6,4,.22,.22],[-1.9,6.8,LIFT_Z,.22,.22,3.2],[1.9,6.8,LIFT_Z,.22,.22,3.2],[0,.12,LIFT_Z,3.6,.24,3]];
const liftBars:Part[]=[...[-1,1].flatMap(s=>Array.from({length:9},(_,i)=>[s*1.88,1.1,-9.3+i*.32,.03,2.2,.03] as Part)),...Array.from({length:11},(_,i)=>[-1.6+i*.32,1.1,-9.55,.03,2.2,.03] as Part),[0,2.2,-9.55,3.6,.06,.06],...[-1,1].map(s=>[s*1.88,2.2,LIFT_Z,.06,.06,3] as Part)];
const liftRopes:Part[]=[[-.6,10.5,LIFT_Z,.05,7.4,.05],[.6,10.5,LIFT_Z,.05,7.4,.05]];
const bundles:Part[]=[[2.7,0,-6.4,.36,.32,.36,.4],[3.4,0,-6.6,.3,.28,.3,1.1],[-2.8,0,-6.3,.34,.3,.34,.7],[-3.3,.48,-6.4,.26,.24,.26,1.4]];
const cellWalls:Part[]=[-4.6,-1.6,1.4,4.4].map(z=>[-7.1,0,z,.5,.8,.5,0]);
const cellFront:Part[]=[-3.1,-.1,2.9].flatMap(c=>[-1.2,-.9,.9,1.2].map(o=>[-6.05,1.25,c+o,.04,2.5,.04] as Part)).concat([-3.1,-.1,2.9].map(c=>[-6.05,2.5,c,.06,.06,2.9] as Part));
/** Cell doors swing open on their hinges: each bar is rotated about the hinge rather than drawn in its own group. */
const openDoors:Part[]=[[-3.1,1.25],[-.1,1.6],[2.9,1.05]].flatMap(([c,a])=>{const hz=c-.75;return [...Array.from({length:5},(_,i)=>{const d=.1+i*.32;return [-6.05-Math.sin(a)*d,1.2,hz+Math.cos(a)*d,.04,2.3,.04] as Part;}),[-6.05-Math.sin(a)*.74,2.35,hz+Math.cos(a)*.74,.05,.05,1.45,-a],[-6.05-Math.sin(a)*.74,.15,hz+Math.cos(a)*.74,.05,.05,1.45,-a]];});
const emptyBedrolls:Part[]=[[-7,.12,-3.1,.2,1.2,.2,0,Math.PI/2,.2],[-7,.12,2.9,.2,1.2,.2,0,Math.PI/2,-.1]];
const limpRoots:Part[]=[[-3.6,-.04,-5.2,1,.4,1,.3],[2.4,-.04,-5.4,.9,.4,.9,-.4],[4.6,-.04,1.6,.8,.35,.8,-1.4],[-1.2,-.04,3.4,.8,.35,.8,2.6]];
const paleArches:Part[]=[[-4.6,0,-6.7,.9,.9,.9,.2],[6.4,0,-6.7,.8,.8,.8,-.3],[-3.2,0,-6.7,.7,.7,.7,-.4]];
const liftMoss=[...moss(-9,-6.6,-2.2,-6.6,4,16,410,1.2),...moss(2.2,-6.6,9,-6.6,4,16,440,1.2),...moss(-7.6,-6,-7.6,5,4,12,470,1)];
function PlaceWithoutLocks({room}:{room:RoomCtx;reduced:boolean}){
 return <>
  <Bedrock/><Floor tile={tiles([9,10])} dirt={earth([9,10])}/>
  <group>
   <Instances parts={limpRoots} geometry={CRAWL} color="#7d705e"/>
   <Instances parts={patches(21,6)} geometry={geo.rock} color="#2f4426" material={decal('#3a4a2e',.35)} shadow={false}/><Instances parts={puddles(21,3)} geometry={geo.rock} color="#4f6461" material={puddle} shadow={false}/>
   <Instances parts={liftMoss} geometry={geo.cone} color="#6a7748" jitter={.3} shadow={false}/>
   <Instances parts={liftRopes} geometry={geo.cyl} color="#8a7650" shadow={false}/>
   <mesh position={[0,7.6,LIFT_Z]} rotation={[Math.PI/2,0,0]} material={mat('#5d5146',.5,.5)} raycast={noRaycast}><torusGeometry args={[.9,.12,6,20]}/></mesh>
   {/* A shaft of daylight falls down the lift: the way up is open. */}
   <mesh position={[0,6,LIFT_Z+.4]} raycast={noRaycast}><coneGeometry args={[2.8,12,24,1,true]}/><meshBasicMaterial color="#fff1cf" transparent opacity={.07} depthWrite={false} side={THREE.DoubleSide}/></mesh>
   <mesh position={[4,1.6,-7.75]} raycast={noRaycast}><planeGeometry args={[2.6,3.2]}/><meshBasicMaterial color="#060a12"/></mesh>
  </group>
  <group userData={{blocksLabels:true}}>
   <Walls room={room} url={WALL} parts={[...wallRow(-7.2,[-8,-4,8]),...wallColumn(-8.6,SIDE_Z),[0,0,-10.4,1,1.8,1]]}/><Walls room={room} url={WALL_ARCHED} parts={wallRow(-7.2,[4])}/>
   <Walls room={room} url={WALL_BROKEN} parts={[...cellWalls,...wallColumn(7.8,[-4.7,-.7,3.3],.26)]}/>
   <Solid ctx={room} parts={liftPosts} radius={()=>.2} color="#4a3a2a"/><Solid ctx={room} parts={liftBeams} radius={()=>.2} color="#544232"/>
   <Instances parts={liftBars} geometry={geo.cyl} color="#5c6460" roughness={.5} metalness={.6}/>
   <Instances parts={cellFront} geometry={geo.cyl} color="#5c6460" roughness={.5} metalness={.6}/><Instances parts={openDoors} geometry={geo.cyl} color="#69736c" roughness={.5} metalness={.6}/>
   <Solid ctx={room} parts={emptyBedrolls} geometry={geo.cyl} radius={()=>.25} color="#5f5a4c"/>
   <SolidKit ctx={room} url={BOX} parts={bundles} radius={p=>.75*Math.min(p[3],p[5])}/><SolidKit ctx={room} url={LOG} parts={[[-6.6,0,5.6,2,2,2,.4],[6.6,0,-6,1.8,1.8,1.8,1.9]]} material={mat('#7d705e',1,0,true)} radius={p=>.3*Math.min(p[3],p[5])}/>
   <Solid ctx={room} parts={paleArches} radius={()=>.6} geometry={ARCH} color="#7d705e"/>
   <SolidKit ctx={room} url={FUNGUS_RED} parts={[[-6.4,0,-6.2,2.2,2.2,2.2],[6.2,0,4.4,2,2,2,1]]} material={mat('#7a4636',1,0,true)} shadow={false} radius={p=>.14*Math.min(p[3],p[5])}/>
   <SolidKit ctx={room} url={FERN} parts={[[6.4,0,-2.6,2.4,2.4,2.4],[6.6,0,1.2,2.2,2.2,2.2,1],[-6.4,0,4.6,2.6,2.6,2.6,2]]} material={fernTint} shadow={false} radius={p=>.14*Math.min(p[3],p[5])}/>
  </group>
  <Light position={[0,5.5,-7.4]} color="#ffeccc" intensity={18} distance={13}/><Light position={[4,1.4,-8.2]} color="#7f9fe0" intensity={8} distance={6}/><Light position={[-5.4,2.2,-.2]} color="#d8d0b0" intensity={5} distance={8}/>
 </>;
}

/** The eight Rootbound rooms, chosen by scene id. */
export default function RootboundPrison({scene,save,reduced}:RoomProps){
 const room={save,scene},n=Number(scene.split('-')[1]);
 return n===1?<GardenOfLocks room={room} reduced={reduced}/>:n===2?<NurseryOfEchoes room={room} reduced={reduced}/>:n===3?<ThornInfirmary room={room} reduced={reduced}/>:n===4?<SurveyCamp room={room} reduced={reduced}/>:n===5?<SapReservoir room={room} reduced={reduced}/>:n===6?<WardensTable room={room} reduced={reduced}/>:n===7?<HangingBridge room={room} reduced={reduced}/>:<PlaceWithoutLocks room={room} reduced={reduced}/>;
}
