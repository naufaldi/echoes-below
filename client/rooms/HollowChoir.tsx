import {fixed,slabs} from './parts';
import {useEffect,useMemo,useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Solid,SolidKit,type RoomCtx,mapTint,Instances,KitInstances,Flame,mat,decal,geo,noRaycast,rand,type Part,type RoomProps} from './kit';

// Hollow Choir (#50): a vast hollow cathedral where echoes sing. Every room shares the same four anchors
// (evidence -2,0 · way forward 0,-3.5 · supplies 3,0 · camp -3,2 in world x,z), so each room's identity lives on the
// perimeter: the tall nave wall, its colonnade and the room's landmark behind the door (-z), secondary height along
// the west wall (-x), and only low pews, rails and supplies east (+x) and south (+z) so the camera keeps the party.
// Solid lists stand outside the ±5.4 m footprint and pass through useSolidParts; inside it there are only floor slabs,
// inlays and the static light shafts. Kenney Graveyard and Castle pieces each share one colormap; mapTint(MAPS[kit],tint,.88) is
// this file's cached, cold-tinted copy of that material. Contract: ./README.md.
const DUNGEON={wall:'/assets/env/kaykit-dungeon/wall.glb',arched:'/assets/env/kaykit-dungeon/wall_arched.glb',shelves:'/assets/env/kaykit-dungeon/shelves.glb',table:'/assets/env/kaykit-dungeon/table_medium.glb',barrel:'/assets/env/kaykit-dungeon/barrel_large.glb',box:'/assets/env/kaykit-dungeon/box_large.glb',crates:'/assets/env/kaykit-dungeon/crates_stacked.glb'};
const GRAVE={pillar:'/assets/env/kenney-graveyard-kit/pillar-square.glb',obelisk:'/assets/env/kenney-graveyard-kit/pillar-obelisk.glb',crypt:'/assets/env/kenney-graveyard-kit/crypt-large-door.glb',lantern:'/assets/env/kenney-graveyard-kit/lantern-candle.glb',candles:'/assets/env/kenney-graveyard-kit/candle-multiple.glb',bench:'/assets/env/kenney-graveyard-kit/bench.glb',plaque:'/assets/env/kenney-graveyard-kit/gravestone-decorative.glb',fence:'/assets/env/kenney-graveyard-kit/iron-fence.glb',chalice:'/assets/env/kenney-graveyard-kit/detail-chalice.glb',plate:'/assets/env/kenney-graveyard-kit/detail-plate.glb',debris:'/assets/env/kenney-graveyard-kit/debris.glb'};
const CASTLE={banner:'/assets/env/kenney-castle-kit/flag-banner-long.glb'};

const MAPS={grave:'/assets/env/kenney-graveyard-kit/Textures/colormap.png',castle:'/assets/env/kenney-castle-kit/Textures/colormap.png'};
const STONE='#c3cbe0',OAK='#8a7a80';
const glows=new Map<string,THREE.Material>();
/** Additive, unlit and depth-transparent: light shafts, their floor pools and glowing stones. Never animated. */
function glow(color:string,opacity:number){const key=color+opacity;let m=glows.get(key);if(!m){m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});glows.set(key,m);}return m;}
const orb=new THREE.IcosahedronGeometry(1,1),ground=new THREE.CircleGeometry(30,32).rotateX(-Math.PI/2),hex=new THREE.CylinderGeometry(1,1,1,6),ring=new THREE.RingGeometry(.9,1,40).rotateX(-Math.PI/2);
const shaftGeo=new THREE.CylinderGeometry(.42,1,1,14,1,true),rib=new THREE.TorusGeometry(1,.07,5,22,Math.PI),halfLeft=new THREE.CircleGeometry(1,24,Math.PI/2,Math.PI),halfRight=new THREE.CircleGeometry(1,24,-Math.PI/2,Math.PI),hoop=new THREE.TorusGeometry(1,.12,6,36);
// Footprint radii for solid lists: pieces behind the room measure their depth, pieces beside it their width.
const back=(p:Part)=>p[5]/2,side=(p:Part)=>p[3]/2;
/** Yaw that turns a part's local x axis toward world direction (dx,dz). */
const yaw=(dx:number,dz:number)=>Math.atan2(-dz,dx);

// ── Shared pieces: the nave shell, colonnade and rib arches, high lancets, static light shafts, slow dust ──
/** The cathedral's outer walls: a tall arched nave wall behind the room and a lower wall far to the west. */
const nave=(z=-11,h=2.4):Part[]=>[-10,-6,-2,2,6,10].map(x=>[x,0,z,1,h,1] as Part),westWall=(x=-10.6,h=1.7):Part[]=>[-8,-4,0,4].map(z=>[x,0,z,1,h,1,Math.PI/2] as Part);
/** Tall graveyard pillars (≈1.2 m wide, 8 m high) with the rib arches that span them at the springing line. */
const pillars=(points:[number,number][],h=7):Part[]=>points.map(([x,z])=>[x,0,z,3.6,h,3.6] as Part);
const ribsBetween=(points:[number,number][],y:number):Part[]=>points.slice(1).map(([x,z],i)=>{const [px,pz]=points[i],half=Math.hypot(x-px,z-pz)/2;return [(x+px)/2,y,(z+pz)/2,half,half*1.15,half,yaw(x-px,z-pz)] as Part;});
const BACK_COLS:[number,number][]=[[-7,-7],[-3.6,-7],[3.6,-7],[7,-7]],WEST_COLS:[number,number][]=[[-7,-7],[-7,-3.5],[-7,0],[-7,3.5]];
function Shell({ctx,wall=DUNGEON.arched,z=-11,h=2.4,west=1.7,cols=BACK_COLS,westCols=WEST_COLS,colH=7,stone=STONE}:{ctx:RoomCtx;wall?:string;z?:number;h?:number;west?:number;cols?:[number,number][];westCols?:[number,number][];colH?:number;stone?:string}){
 // Callers pass literal layouts, so memoise on their contents: a new array each render must not rebuild the instanced meshes.
 const key=JSON.stringify([cols,westCols,colH]);
 const walls=useMemo(()=>nave(z,h),[z,h]),sides=useMemo(()=>westWall(-10.6,west),[west]);
 const columns=useMemo(()=>pillars([...cols,...westCols.filter(p=>!cols.some(c=>c[0]===p[0]&&c[1]===p[1]))],colH),[key]);
 const ribs=useMemo(()=>[...ribsBetween(cols,colH*1.15),...ribsBetween(westCols,colH*1.15)],[key]);
 return <>
  <SolidKit ctx={ctx} url={wall} parts={walls} radius={fixed(.6)} shadow={false}/>{west>0&&<SolidKit ctx={ctx} url={DUNGEON.wall} parts={sides} radius={fixed(.6)} shadow={false}/>}
  <SolidKit ctx={ctx} url={GRAVE.pillar} parts={columns} radius={fixed(.65)} shadow={false} material={mapTint(MAPS['grave'],stone,.88)}/>
  <Solid ctx={ctx} parts={ribs} geometry={rib} color="#8d93a8" jitter={.05} radius={fixed(.6)} shadow={false}/>
 </>;
}
/** Pointed lancet window, 1 m wide and 3.1 m tall, standing on y=0 in the XY plane. */
const lancet=(()=>{const s=new THREE.Shape();s.moveTo(-.5,0);s.lineTo(.5,0);s.lineTo(.5,2);s.quadraticCurveTo(.5,2.65,0,3.1);s.quadraticCurveTo(-.5,2.65,-.5,2);s.closePath();return new THREE.ShapeGeometry(s,6);})();
/** Lancet windows glowing on the nave wall: one draw in the glass colour. */
/** Keep an inline Part list stable across renders by its contents, so its instanced mesh is built once per room. */
function useStable(parts:Part[]){const key=JSON.stringify(parts);return useMemo(()=>parts,[key]);}
function Lancets({parts:inline,color='#9fb6ff'}:{parts:Part[];color?:string}){const parts=useStable(inline);return <Instances parts={parts} geometry={lancet} color={color} material={decal(color,.8)} shadow={false}/>;}
const naveLancets=(z=-10.45,xs=[-8,-4,4,8],y=4.4,s=1.25):Part[]=>xs.map(x=>[x,y,z,s,s*1.5,1] as Part);
/** A static shaft of light from a high window: lands on the floor at (x,z) and leans back toward -z (`lean`) and west (`tilt`). */
const shaft=(x:number,z:number,len:number,r:number,lean=-.32,tilt=.22):Part=>{const dx=-Math.sin(tilt),dy=Math.cos(tilt)*Math.cos(lean),dz=Math.cos(tilt)*Math.sin(lean);return [x+dx*len/2,dy*len/2,z+dz*len/2,r,len,r,0,lean,tilt];};
function Shafts({parts:inline,color='#a9c4ff',opacity=.07}:{parts:Part[];color?:string;opacity?:number}){
 const parts=useStable(inline);
 // Each shaft's floor pool sits where its axis meets y=0: the centre minus half the length along the lean.
 const pools=useMemo(()=>parts.map(([x,,z,r,len,,,lean=0,tilt=0])=>[x+Math.sin(tilt)*len/2,.014,z-Math.cos(tilt)*Math.sin(lean)*len/2,r*1.05,1,r*1.05] as Part),[parts]);
 return <><Instances parts={parts} geometry={shaftGeo} color={color} material={glow(color,opacity)} shadow={false}/><Instances parts={pools} geometry={geo.disc} color={color} material={glow(color,opacity*1.6)} shadow={false}/></>;
}
const moteMaterials=new Map<string,THREE.PointsMaterial>();
/** Dust drifting down through the shafts: one Points draw, each mote stored twice one cycle apart so the fall loops. Frozen when `reduced`. */
function Motes({count,color='#cfdcff',speed=.12,reduced}:{count:number;color?:string;speed?:number;reduced:boolean}){
 const H=9,points=useMemo(()=>{const p=new Float32Array(count*6);for(let i=0;i<count;i++){const x=-7+rand(i*3.31+1)*14,z=-9+rand(i*5.17+2)*13,y=rand(i*7.73+3)*H;p.set([x,y,z,x,y+H,z],i*6);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));let m=moteMaterials.get(color);if(!m){m=new THREE.PointsMaterial({color,size:.06,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false});moteMaterials.set(color,m);}
  const o=new THREE.Points(g,m);o.frustumCulled=false;o.raycast=noRaycast;return o;},[count,color]);
 useEffect(()=>()=>points.geometry.dispose(),[points]);
 useFrame(({clock})=>{if(reduced)return;const t=clock.elapsedTime;points.position.set(Math.sin(t*.15)*.3,-((t*speed)%H),0);});
 return <primitive object={points}/>;
}
/** Floor: stone slabs on the 1.2 m tactical grid (tops at y=0, no shadows cast) over the dark cathedral ground. `pick` splits a pattern. */
const grid12=slabs(1.2,{gap:.04,jitter:.015,seed:(i,j)=>i*31+j}),checkA=slabs(1.2,{gap:.04,jitter:.015,seed:(i,j)=>i*31+j,pick:(i,j)=>(i+j)%2===0}),checkB=slabs(1.2,{gap:.04,jitter:.015,seed:(i,j)=>i*31+j,pick:(i,j)=>(i+j)%2!==0}),westHalf=slabs(1.2,{gap:.04,jitter:.015,seed:(i,j)=>i*31+j,pick:i=>i<0}),eastHalf=slabs(1.2,{gap:.04,jitter:.015,seed:(i,j)=>i*31+j,pick:i=>i>=0}),longSlabs=slabs(1.2,{gap:.04,jitter:.015,seed:(i,j)=>i*31+j,pick:(i,j)=>j%2===0}).map(p=>[p[0],p[1],p[2]+.6,p[3],p[4],2.36] as Part);
// Slabs outside the ±5.4 m footprint sit a step lower and darker, so the nave's aisles frame the playable floor in Echo too.
const inside=(p:Part)=>Math.abs(p[0])<5.4&&Math.abs(p[2])<5.4,aisle=(parts:Part[])=>parts.filter(p=>!inside(p)).map(p=>[p[0],p[1]-.06,p[2],p[3],p[4],p[5]] as Part);
function Slabs({parts,color,jitter}:{parts:Part[];color:string;jitter:number}){
 const [inner,outer]=useMemo(()=>[parts.filter(inside),aisle(parts)],[parts]),dim=useMemo(()=>'#'+new THREE.Color(color).multiplyScalar(.62).getHexString(),[color]);
 return <><Instances parts={inner} color={color} jitter={jitter} shadow={false}/><Instances parts={outer} color={dim} jitter={jitter} shadow={false}/></>;
}
function Floor({parts,color,jitter=.16,ground:groundColor='#121524',extra}:{parts:Part[];color:string;jitter?:number;ground?:string;extra?:[Part[],string]}){
 return <><mesh geometry={ground} material={mat(groundColor,1)} position={[0,-.12,0]} receiveShadow raycast={noRaycast}/><Slabs parts={parts} color={color} jitter={jitter}/>{extra&&<Slabs parts={extra[0]} color={extra[1]} jitter={jitter}/>}</>;
}
const pipe=(x:number,z:number,h:number,r=.28):Part=>[x,h/2,z,r,h,r];
const bell=(x:number,y:number,z:number,s=1):Part=>[x,y,z,s,s,s];

// ── 1 · The Hall of Breaths: ranks of stone pipes on the nave and west walls, the novice's silent pipe, notes in the floor ──
const breathPipes:Part[]=[...Array.from({length:21},(_,i)=>{const x=-7.5+i*.75;return pipe(x,-7.3-(i%2)*.55,2.4+Math.abs(x)*.62+rand(i)*.7,.27);}).filter(p=>Math.abs(p[0])>.9),...Array.from({length:15},(_,i)=>{const z=-6.2+i*.72;return pipe(-6.95-(i%2)*.5,z,Math.max(1.4,6.4-(z+6.2)*.42+rand(i+40)*.6),.25);})];
const pipeMouths:Part[]=breathPipes.map(([x,y,z,r],i)=>i<18?[x,y*.45,z+r+.012,r*.75,.34,.01] as Part:[x+r+.012,y*.45,z,.01,.34,r*.75] as Part);
const pipePlinths:Part[]=[[0,.3,-7.55,16.4,.6,1.7],[-7.2,.3,-.6,1.5,.6,12.2]];
const silentPipe:Part[]=[pipe(-1.8,-6.3,3.4,.34)],silentCrack:Part[]=[[-1.8,1.9,-5.955,.03,1.1,.01,0,0,.25],[-1.72,1.3,-5.955,.02,.5,.01,0,0,-.4]];
const noteSteps:[number,number][]=[[.5,4.6],[-.45,3.4],[.45,2.2],[-.4,1],[.4,-.2],[-.35,-1.4],[.3,-2.5]];
const noteRings:Part[]=noteSteps.flatMap(([x,z],i)=>[[x,.012+i*.0003,z,.36,1,.36],[x,.013+i*.0003,z,.62,1,.62]] as Part[]),noteDots:Part[]=noteSteps.map(([x,z])=>[x,.011,z,.12,1,.12] as Part);
const kneelers:Part[]=[-3.2,-.8,1.6,4].map(z=>[6.5,0,z,2,1.5,2,Math.PI/2] as Part),southRail:Part[]=[[0,.32,6.45,13,.64,.5],[-6.6,.32,6.1,.5,.64,1.2]];
const breathCandles:Part[]=[[-5,.6,-7.1,2.2,2.2,2.2],[5,.6,-7.1,2.2,2.2,2.2],[-7.15,.6,3.4,2.2,2.2,2.2]];
function HallOfBreaths({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 return <>
  <Floor parts={grid12} color="#6c7186"/>
  <group userData={{blocksLabels:true}}>
   <Shell ctx={ctx} cols={[[-8.6,-8.6],[8.6,-8.6]]} westCols={[[-8.6,-8.6],[-8.6,-2],[-8.6,4]]} colH={7.6}/>
   <Solid ctx={ctx} parts={breathPipes} geometry={geo.cyl} color="#9ba2b6" jitter={.18} radius={fixed(.35)}/>
   <Solid ctx={ctx} parts={pipePlinths} color="#575c70" jitter={.06} radius={(p)=>Math.min(p[3],p[5])/2}/>
   <Solid ctx={ctx} parts={silentPipe} geometry={geo.cyl} color="#3d4153" jitter={0} radius={fixed(.4)}/>
   <SolidKit ctx={ctx} url={GRAVE.bench} parts={kneelers} radius={fixed(.6)} material={mapTint(MAPS['grave'],OAK,.88)}/>
   <Solid ctx={ctx} parts={southRail} color="#5d6276" jitter={.08} radius={(p)=>Math.min(p[3],p[5])/2}/>
   <SolidKit ctx={ctx} url={GRAVE.candles} parts={breathCandles} radius={fixed(.3)} shadow={false} material={mapTint(MAPS['grave'],'#ffffff',.88)}/>
  </group>
  <group>
   <Instances parts={pipeMouths} color="#0b0d18" material={decal('#0b0d18')} shadow={false}/>
   <Instances parts={silentCrack} color="#0a0b12" material={decal('#0a0b12')} shadow={false}/>
   <Instances parts={noteRings} geometry={ring} color="#9fb6ff" material={decal('#9fb6ff',.55)} shadow={false}/><Instances parts={noteDots} geometry={geo.disc} color="#c8d6ff" material={decal('#c8d6ff',.5)} shadow={false}/>
   <Lancets parts={naveLancets()}/>
   <Shafts parts={[shaft(-1.8,-5.6,13,.75,-.2,.12),shaft(-3.4,1,15,1.1),shaft(2.4,-1.6,15,.95,-.3,.3)]}/>
  </group>
  <pointLight position={[-1.8,3.2,-5.2]} color="#a9bfff" intensity={10} distance={8}/><pointLight position={[0,3.6,-6]} color="#c9d4ff" intensity={8} distance={11}/>
  <Motes count={70} reduced={reduced}/>
 </>;
}

// ── 2 · The Resonance Library: three-tier shelves, books hanging on strings from the gallery beams, the first keeper's score ──
const libraryShelves:Part[]=[-8.6,-6.6,-4.6,4.6,6.6,8.6].flatMap(x=>[0,2,4].map(y=>[x,y,-8.3,1,1,1] as Part)).concat([-4,-2,0,2,4].flatMap(z=>[0,2].map(y=>[-8.3,y,z,1,1,1,Math.PI/2] as Part)));
const caseBacks:Part[]=[-8.6,-6.6,-4.6,4.6,6.6,8.6].map(x=>[x,3.4,-8.12,2.04,6.8,.14] as Part).concat([-4,-2,0,2,4].map(z=>[-8.12,2.4,z,.14,4.8,2.04] as Part));
const galleryBeams:Part[]=[[0,6.6,-6.9,18,.32,.32],[-7.4,6.6,-1,.32,.32,12.4],[0,6.6,-8.4,18,.25,.25]];
const hangingBooks=(n:number,seed:number):Part[]=>Array.from({length:n},(_,i)=>{const k=i+seed*100,alongBack=i%3!==0,t=rand(k);const x=alongBack?-8.4+t*16.8:-7.4+(rand(k+3)-.5)*.6,z=alongBack?-6.9+(rand(k+3)-.5)*.5:-6.6+t*10.4;if(alongBack&&Math.abs(x)<1.4)return null;return [x,2.4+rand(k+5)*3.4,z,.34,.46,.09,rand(k+7)*3] as Part;}).filter((p):p is Part=>!!p);
const booksRed=hangingBooks(22,1),booksBlue=hangingBooks(22,2),booksOchre=hangingBooks(18,3);
const strings:Part[]=[...booksRed,...booksBlue,...booksOchre].map(([x,y,z])=>{const top=6.5,len=top-y-.23;return [x,y+.23+len/2,z,.008,len,.008] as Part;});
const lectern:Part[]=[[0,.55,-6.5,.36,1.1,.36],[0,.08,-6.5,.9,.16,.7],[0,1.16,-6.45,1.2,.07,.8,0,.42]],scorePages:Part[]=[[-.27,1.2,-6.4,.5,.01,.62,0,.42],[.27,1.2,-6.4,.5,.01,.62,0,.42]];
// Score staves follow the lectern's tilt: a line `d` metres down the page sits at y-sin(t)·d, z+cos(t)·d.
const staves:Part[]=Array.from({length:10},(_,i)=>{const s=i<5?-1:1,d=(i%5-2)*.1;return [s*.27,1.207-Math.sin(.42)*d,-6.4+Math.cos(.42)*d,.42,.004,.008,0,.42] as Part;}),missingMeasure:Part[]=[[.45,1.21,-6.4,.1,.004,.5,0,.42]];
const readingTables:Part[]=[[6.7,0,-3,.75,.8,.75],[6.7,0,1.2,.75,.8,.75]],libraryCandles:Part[]=[[6.7,.8,-3.2,2,2,2],[6.7,.8,1,2,2,2],[-.9,0,-6.6,2.4,2.4,2.4],[.9,0,-6.6,2.4,2.4,2.4]];
const runner:Part[]=[[0,.006,-.4,1.5,.01,10.4]];
function ResonanceLibrary({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 return <>
  <Floor parts={grid12} color="#6a6a7d" ground="#14131f"/>
  <group userData={{blocksLabels:true}}>
   <Shell ctx={ctx} wall={DUNGEON.wall} cols={[[-3.2,-7.2],[3.2,-7.2]]} westCols={[]} colH={7.4}/>
   <Solid ctx={ctx} parts={caseBacks} color="#35292a" jitter={.12} radius={(p)=>Math.min(p[3],p[5])/2} shadow={false}/><SolidKit ctx={ctx} url={DUNGEON.shelves} parts={libraryShelves} radius={fixed(.5)} shadow={false}/>
   <Solid ctx={ctx} parts={galleryBeams} color="#3e3330" jitter={.05} radius={(p)=>Math.min(p[3],p[5])/2} shadow={false}/>
   <Solid ctx={ctx} parts={lectern} color="#4b3a33" jitter={.05} radius={fixed(.5)}/>
   <SolidKit ctx={ctx} url={DUNGEON.table} parts={readingTables} radius={fixed(.8)}/>
  </group>
  <group>
   <group userData={{blocksLabels:true}}>
    <Solid ctx={ctx} parts={booksRed} color="#7a3135" jitter={.5} radius={fixed(.2)} shadow={false}/><Solid ctx={ctx} parts={booksBlue} color="#2f4a78" jitter={.5} radius={fixed(.2)} shadow={false}/><Solid ctx={ctx} parts={booksOchre} color="#a07a3c" jitter={.5} radius={fixed(.2)} shadow={false}/>
    <Solid ctx={ctx} parts={strings} geometry={geo.cyl} color="#b9b2a0" radius={fixed(.05)} shadow={false}/>
    <SolidKit ctx={ctx} url={GRAVE.candles} parts={libraryCandles} radius={fixed(.3)} shadow={false} material={mapTint(MAPS['grave'],'#ffffff',.88)}/>
   </group>
   <Instances parts={scorePages} color="#e6dfcc" material={decal('#e6dfcc')} shadow={false}/><Instances parts={staves} color="#3a3530" material={decal('#3a3530')} shadow={false}/>
   <Instances parts={missingMeasure} color="#9fb6ff" material={glow('#9fb6ff',.6)} shadow={false}/>
   <Instances parts={runner} color="#3b2f4a" material={decal('#3b2f4a',.7)} shadow={false}/>
   <Lancets parts={naveLancets(-10.45,[-2,2],5.2,1.1)} color="#b5c4ff"/>
   <Shafts parts={[shaft(0,-6.2,14,.8,-.25,0),shaft(-3,1.4,14,1),shaft(3.2,-1,14,.9,-.3,.1)]} color="#c2ccff"/>
  </group>
  <pointLight position={[0,2.6,-5.6]} color="#cdd6ff" intensity={10} distance={8}/><pointLight position={[6.4,2,-1]} color="#ffcf9a" intensity={5} distance={7}/>
  <Motes count={60} reduced={reduced} color="#e2e4ff"/>
 </>;
}

// ── 3 · The Silent Refectory: long tables of bowls and cups eaten at in silence, hush banners, the child's slate with a joke ──
const tableTops:Part[]=[[-7.2,.78,-.4,1.1,.08,9.4],[0,.78,-7.2,9.4,.08,1.1],[7.1,.62,-.6,1,.07,7.6]],tableLegs:Part[]=[...[-4.4,-.4,3.6].map(z=>[-7.2,.38,z,.9,.76,.14] as Part),...[-4,0,4].map(x=>[x,.38,-7.2,.14,.76,.9] as Part),...[-3.6,2.4].map(z=>[7.1,.3,z,.8,.6,.12] as Part)];
const refectoryBenches:Part[]=[...[-4,-1.4,1.2,3.8].map(z=>[-8.3,0,z,2.8,1.7,2,Math.PI/2] as Part),...[-3,-.2,2.6].map(z=>[-6.15,0,z,2.8,1.7,2,-Math.PI/2] as Part),...[-3.4,0,3.4].map(x=>[x,0,-8.3,2.8,1.7,2,0] as Part),...[-3.4,-.6,2.2].map(z=>[8.15,0,z,2.4,1.4,2,Math.PI/2] as Part)];
const plates:Part[]=[...[-4.6,-3.4,-2.2,-1,.2,1.4,2.6,3.8].map((z,i)=>[-7.2+(i%2?.28:-.28),.82,z,1.6,1.6,1.6] as Part),...[-3.8,-2.6,-1.4,1.4,2.6,3.8].map((x,i)=>[x,.82,-7.2+(i%2?.28:-.28),1.6,1.6,1.6] as Part)];
const chalices:Part[]=[[-7,.82,-3.9,1.8,1.8,1.8],[-7.4,.82,-.4,1.8,1.8,1.8],[-7.1,.82,2.4,1.8,1.8,1.8],[-2,.82,-7.4,1.8,1.8,1.8],[2,.82,-7,1.8,1.8,1.8],[7.1,.66,-2,1.8,1.8,1.8]];
const hushBanners:Part[]=[-8,-4,4,8].map(x=>[x,2.2,-10.3,3,3,3,Math.PI/2] as Part).concat([-6,-2,2].map(z=>[-9.9,2,z,2.6,2.6,2.6,0] as Part));
const slate:Part[]=[[-7.05,1.15,1.6,.06,.62,.86]],slateFrame:Part[]=[[-7.07,1.15,1.6,.05,.7,.94]];
const chalk:Part[]=[[-7.01,1.34,1.42,.01,.03,.4],[-7.01,1.25,1.5,.01,.03,.56],[-7.01,1.16,1.38,.01,.03,.32],[-7.01,.98,1.84,.01,.1,.1],[-7.01,.98,1.7,.01,.1,.03]];
const hushMarks:Part[]=[[0,.012,-1.8,1.1,.01,.03],[0,.012,1.8,1.1,.01,.03],[0,.012,0,.03,.01,4.4]];
function SilentRefectory({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 return <>
  <Floor parts={longSlabs} color="#6b6c7a" jitter={.14} ground="#16151d"/>
  <group userData={{blocksLabels:true}}>
   <Shell ctx={ctx} wall={DUNGEON.wall} h={2.1} cols={[[-5.6,-8.8],[-1.8,-8.8],[1.8,-8.8],[5.6,-8.8]]} westCols={[]} colH={6.4}/>
   <Solid ctx={ctx} parts={tableTops} color="#5a4337" jitter={.08} radius={(p)=>Math.min(p[3],p[5])/2}/><Solid ctx={ctx} parts={tableLegs} color="#3e2f28" jitter={.08} radius={fixed(.3)} shadow={false}/>
   <SolidKit ctx={ctx} url={GRAVE.bench} parts={refectoryBenches} radius={fixed(.6)} material={mapTint(MAPS['grave'],OAK,.88)}/>
   <SolidKit ctx={ctx} url={CASTLE.banner} parts={hushBanners} radius={fixed(.4)} shadow={false} material={mapTint(MAPS['castle'],'#9aa6c8',.88)}/>
   <Solid ctx={ctx} parts={slateFrame} color="#4b3a2e" jitter={0} radius={fixed(.3)} shadow={false}/>
  </group>
  <group>
   <group userData={{blocksLabels:true}}>
    <SolidKit ctx={ctx} url={GRAVE.plate} parts={plates} radius={fixed(.25)} shadow={false} material={mapTint(MAPS['grave'],'#d9deea',.88)}/><SolidKit ctx={ctx} url={GRAVE.chalice} parts={chalices} radius={fixed(.2)} shadow={false} material={mapTint(MAPS['grave'],'#e8dcc0',.88)}/>
    <Solid ctx={ctx} parts={slate} color="#24262c" material={mat('#23252b',.9)} radius={fixed(.3)} shadow={false}/>
   </group><Instances parts={chalk} color="#e9ecf2" material={decal('#e9ecf2',.9)} shadow={false}/>
   <Instances parts={hushMarks} color="#b8c3e6" material={decal('#b8c3e6',.25)} shadow={false}/>
   {[[-7.2,.9,-2.2],[-7.2,.9,1.6],[0,.9,-7.2],[7.1,.74,-.4]].map((p,i)=><Flame key={i} position={p as [number,number,number]} size={.28} reduced={reduced}/>)}
   <Lancets parts={naveLancets(-10.45,[-6,-2,2,6],4,1)} color="#a8b8e8"/>
   <Shafts parts={[shaft(-2.6,-1.4,13,.9),shaft(2.2,1.6,13,.9,-.3,.18)]} color="#b8c6f0" opacity={.06}/>
  </group>
  <pointLight position={[-6.4,2,0]} color="#ffc98c" intensity={8} distance={8}/><pointLight position={[0,2,-6.4]} color="#ffd4a0" intensity={7} distance={8}/>
  <Motes count={40} reduced={reduced} speed={.08}/>
 </>;
}

// ── 4 · The Choir of Stone: the fifth tuning stone on its six-socket plinth, tiers of bound stone singers around it ──
const STONE_C:[number,number]=[0,-8.6];
const plinth:Part[]=[[STONE_C[0],.35,STONE_C[1],1.7,.7,1.7],[STONE_C[0],1,STONE_C[1],1.1,.6,1.1]];
const sockets:Part[]=Array.from({length:6},(_,i)=>{const a=i*Math.PI/3+Math.PI/6;return [STONE_C[0]+Math.cos(a)*1.38,.74,STONE_C[1]+Math.sin(a)*1.38,.16,.1,.16] as Part;});
const tierArc=(R:number,h:number,from=Math.PI-.35,to=Math.PI*2+.35,n=12):Part[]=>Array.from({length:n},(_,i)=>{const a=from+(to-from)*(i+.5)/n,len=R*(to-from)/n+.05;return [STONE_C[0]+Math.cos(a)*R,h/2,STONE_C[1]+Math.sin(a)*R,len,h,1.15,yaw(-Math.sin(a),Math.cos(a))] as Part;});
const tiers:Part[]=[...tierArc(4,.5),...tierArc(5.1,1),...tierArc(6.2,1.5)];
const singerSpots:[number,number,number][]=[...[0,1,2,3,4,5,6].map(i=>[4.55,.5,Math.PI-.2+i*(Math.PI+.4)/6] as [number,number,number]),...[0,1,2,3,4,5,6,7].map(i=>[5.65,1,Math.PI-.25+(i+.5)*(Math.PI+.5)/8] as [number,number,number])];
const singers=singerSpots.map(([R,base,a])=>[STONE_C[0]+Math.cos(a)*R,base,STONE_C[1]+Math.sin(a)*R] as const).filter(([,,z])=>z<-6.2);
const singerBodies:Part[]=singers.map(([x,y,z])=>[x,y+.95,z,.42,1.9,.42]),singerHeads:Part[]=singers.map(([x,y,z])=>[x,y+2.08,z,.22,.24,.22]),singerBands:Part[]=singers.flatMap(([x,y,z])=>[[x,y+.5,z,2,2,2,0,Math.PI/2],[x,y+1.2,z,1.05,1.05,1.05,0,Math.PI/2]] as Part[]);
const westStatues:Part[]=[-4.6,-1.4,1.8].map(z=>[-7.7,0,z,2.6,6.6,2.6] as Part),bindingChains:Part[]=singers.map(([x,,z])=>{const dx=STONE_C[0]-x,dz=STONE_C[1]-z,len=Math.hypot(dx,dz)-1.5;return [x+dx/2*(len/(len+1.5)),.02,z+dz/2*(len/(len+1.5)),len,.01,.05,yaw(dx,dz)] as Part;});
const spokes:Part[]=Array.from({length:6},(_,i)=>{const t=(i-2.5)*.22,d=1.8+3.6;return [STONE_C[0]+Math.sin(t)*d,.011,STONE_C[1]+Math.cos(t)*d,.05,.01,7.2,t] as Part;});
const kneelStones:Part[]=[[6.3,.2,-4.2,.5,.4,.5],[6.6,.2,-2.6,.5,.4,.5],[6.3,.2,3.4,.5,.4,.5],[6.6,.2,4.8,.5,.4,.5]],stoneCandles:Part[]=kneelStones.map(([x,,z])=>[x,.4,z,1.8,1.8,1.8] as Part);
function ChoirOfStone({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 const stone=useRef<THREE.Mesh>(null);
 useFrame(({clock})=>{if(stone.current&&!reduced)stone.current.rotation.y=clock.elapsedTime*.35;});
 return <>
  <Floor parts={checkA} color="#6d7287" extra={[checkB,'#4c5064']} ground="#10131f"/>
  <group userData={{blocksLabels:true}}>
   <Shell ctx={ctx} z={-15.5} h={2.8} cols={[[-9.6,-9],[9.6,-9]]} westCols={[[-9.6,-9],[-9.6,-3],[-9.6,3]]} colH={8.2}/>
   <Solid ctx={ctx} parts={tiers} color="#5f6479" jitter={.1} radius={fixed(.7)}/>
   <Solid ctx={ctx} parts={plinth} geometry={hex} color="#4e5266" jitter={.05} radius={fixed(1.8)}/>
   <Solid ctx={ctx} parts={singerBodies} geometry={geo.cone} color="#8c92a6" jitter={.12} flat radius={fixed(.45)}/><Solid ctx={ctx} parts={singerHeads} geometry={orb} color="#8c92a6" jitter={.12} flat radius={fixed(.3)} shadow={false}/>
   <SolidKit ctx={ctx} url={GRAVE.obelisk} parts={westStatues} radius={fixed(.5)} shadow={false} material={mapTint(MAPS['grave'],'#aab2c8',.88)}/>
   <Solid ctx={ctx} parts={kneelStones} color="#5a5e70" radius={fixed(.45)} shadow={false}/><SolidKit ctx={ctx} url={GRAVE.candles} parts={stoneCandles} radius={fixed(.3)} shadow={false} material={mapTint(MAPS['grave'],'#ffffff',.88)}/>
  </group>
  <group>
   <group userData={{blocksLabels:true}}><Solid ctx={ctx} parts={singerBands} geometry={geo.link} color="#4c5058" roughness={.5} metalness={.7} radius={fixed(.35)} shadow={false}/></group>
   <Instances parts={bindingChains} color="#2d3038" material={decal('#2b2e36',.8)} shadow={false}/>
   <Instances parts={sockets} geometry={orb} color="#9fe0ff" material={glow('#9fe0ff',.9)} shadow={false}/>
   <Instances parts={spokes} color="#9fc9ff" material={decal('#9fc9ff',.18)} shadow={false}/>
   <mesh ref={stone} position={[STONE_C[0],2.25,STONE_C[1]]} raycast={noRaycast}><octahedronGeometry args={[.5]}/><meshStandardMaterial color="#cfe6ff" emissive="#5fa8ff" emissiveIntensity={1.5}/></mesh>
   <Lancets parts={naveLancets(-14.95,[-6,-2,2,6],5.4,1.5)} color="#a0c0ff"/>
   <Shafts parts={[shaft(0,-7.6,16,1.1,-.12,0),shaft(-3.6,1.2,15,.9),shaft(3.6,.4,15,.9,-.3,-.18)]} color="#a8ceff"/>
  </group>
  <pointLight position={[0,2.6,-7.4]} color="#8cc4ff" intensity={16} distance={10}/><pointLight position={[-5,3,-1]} color="#c7d2ff" intensity={5} distance={8}/>
  <Motes count={60} reduced={reduced}/>
 </>;
}

// ── 5 · The Pilgrim's Stair: a stair turning around a shaft of blue light, Oren's company memorial sealed in the west wall ──
const WELL:[number,number]=[0,-11.6];
const spiral:Part[]=Array.from({length:52},(_,i)=>{const a=Math.PI*.5-i*.22,R=3.5;return [WELL[0]+Math.cos(a)*R,-.4+i*.27,WELL[1]+Math.sin(a)*R,1.9,.2,.72,yaw(Math.cos(a),Math.sin(a))] as Part;}).filter(p=>p[2]<-6.8);
const newel:Part[]=Array.from({length:7},(_,i)=>{const a=Math.PI*.5-i*1.65;return [WELL[0]+Math.cos(a)*4.55,7,WELL[1]+Math.sin(a)*4.55,.22,14,.22] as Part;}).filter(p=>p[2]<-6.4);
const wellRim:Part[]=[[WELL[0],.08,WELL[1],2.7,2.7,2.7,0,Math.PI/2]],wellDark:Part[]=[[WELL[0],.012,WELL[1],2.6,1,2.6]];
const memorial:Part[]=[[-7.5,0,-.48,5,5,5,Math.PI/2]],companyMark:Part[]=[[-7.04,1.95,-.48,.42,1,.42,0,0,-Math.PI/2]],markBars:Part[]=[[-7.03,1.95,-.48,.01,.62,.08,.6],[-7.03,1.95,-.48,.01,.62,.08,-.6]];
const sealBands:Part[]=[[-7.05,1.85,-.48,.04,.12,3.2],[-7.05,1.1,-.48,.04,.12,3.2]];
const plaques:Part[]=[-5.2,-4.2,-3.2,2.6,3.6,4.6].map(z=>[-7.3,0,z,1.6,1.6,1.6,Math.PI/2] as Part);
const pilgrimRail:Part[]=[-3,-1,1,3].map(z=>[6.4,0,z,2,1.1,2,Math.PI/2] as Part);
const worn:Part[]=[[.6,.008,1.6,.9,1,3.4,.2],[.2,.009,-1.6,.8,1,3.4,-.1],[.4,.01,-4.6,.9,1,2.6,.05]];
const stairCandles:Part[]=[[-2.6,0,-7.3,2.2,2.2,2.2],[2.8,0,-7.6,2.2,2.2,2.2],[-7.1,0,-1.9,2.2,2.2,2.2],[-7.1,0,4.1,2.2,2.2,2.2]];
function PilgrimStair({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 return <>
  <Floor parts={grid12} color="#5e6a82" jitter={.24} ground="#0b1222"/>
  <group userData={{blocksLabels:true}}>
   <Shell ctx={ctx} z={-17} h={3} cols={[[-6.6,-7.2],[6.6,-7.2]]} westCols={[[-6.6,-7.2],[-8.6,-3],[-8.6,5]]} colH={8}/>
   <Solid ctx={ctx} parts={spiral} color="#7a8399" jitter={.12} radius={fixed(.85)}/>
   <Solid ctx={ctx} parts={newel} geometry={geo.cyl} color="#4a5064" radius={fixed(.3)} shadow={false}/>
   <SolidKit ctx={ctx} url={GRAVE.crypt} parts={memorial} radius={fixed(1.6)} material={mapTint(MAPS['grave'],STONE,.88)}/>
   <SolidKit ctx={ctx} url={GRAVE.plaque} parts={plaques} radius={fixed(.45)} shadow={false} material={mapTint(MAPS['grave'],'#b6bdd2',.88)}/>
   <SolidKit ctx={ctx} url={GRAVE.fence} parts={pilgrimRail} radius={fixed(.5)} shadow={false} material={mat('#4d515c',.5,.6)}/>
  </group>
  <group>
   <Instances parts={wellRim} geometry={hoop} color="#6c7489" shadow={false}/><Instances parts={wellDark} geometry={geo.disc} color="#03050c" material={decal('#03050c')} shadow={false}/>
   {/* The blue shaft the stair turns around, rising out of the dark well past the top of the nave. Static. */}
   <mesh position={[WELL[0],7,WELL[1]]} scale={[2,24,2]} geometry={geo.cyl} material={glow('#4f8dff',.16)} raycast={noRaycast}/><mesh position={[WELL[0],7,WELL[1]]} scale={[1.1,24,1.1]} geometry={geo.cyl} material={glow('#a9ceff',.22)} raycast={noRaycast}/>
   <Instances parts={companyMark} geometry={geo.disc} color="#c9a14a" material={mat('#c9a14a',.4,.7)} shadow={false}/><Instances parts={markBars} color="#3b2a1c" material={decal('#3b2a1c')} shadow={false}/>
   <group userData={{blocksLabels:true}}><Solid ctx={ctx} parts={sealBands} color="#5d5f66" roughness={.5} metalness={.7} radius={fixed(.1)} shadow={false}/></group>
   <Instances parts={worn} geometry={geo.disc} color="#8fa2c8" material={decal('#8fa2c8',.18)} shadow={false}/>
   <group userData={{blocksLabels:true}}><SolidKit ctx={ctx} url={GRAVE.candles} parts={stairCandles} radius={fixed(.3)} shadow={false} material={mapTint(MAPS['grave'],'#ffffff',.88)}/></group>
   <Lancets parts={naveLancets(-16.45,[-8,-4,4,8],6,1.4)} color="#7ea6ff"/>
   <Shafts parts={[shaft(-2.8,.6,15,1,-.3,.25),shaft(2.6,-2,15,.9,-.34,.1)]} color="#8fb4ff"/>
  </group>
  <pointLight position={[WELL[0],2,WELL[1]+2.5]} color="#5d9bff" intensity={22} distance={14}/><pointLight position={[-6,2.4,-.5]} color="#ffd29a" intensity={5} distance={6}/>
  <Motes count={80} reduced={reduced} color="#bcd4ff" speed={.16}/>
 </>;
}

// ── 6 · The Unfinished Duet: two pulpits facing across the nave, one gold and one silver, and the descent door split in halves ──
const pulpit=(x:number,z:number):Part[]=>[[x,.25,z,1.2,.5,1.2],[x,1.35,z,.95,1.3,.95],[x,2.05,z,1.05,.1,1.05],[x,3.2,z,.12,2.4,.12]];
const pulpitGold=pulpit(-6.4,-6.9),pulpitSilver=pulpit(6.4,-6.9),boards:Part[]=[[-6.4,4.4,-6.9,1.2,.22,1.2],[6.4,4.4,-6.9,1.2,.22,1.2]],boardCones:Part[]=[[-6.4,4.75,-6.9,.22,.5,.22],[6.4,4.75,-6.9,.22,.5,.22]];
const pulpitStairs:Part[]=[[-7.4,.3,-5.9,.6,.6,.8,.6],[-7.9,.7,-6.5,.6,1.4,.8,.6],[7.4,.3,-5.9,.6,.6,.8,-.6],[7.9,.7,-6.5,.6,1.4,.8,-.6]];
const doorFrame:Part[]=[[0,3.5,-9.6,3.15,3.15,3.15]],keyholes:Part[]=[[-1.1,3.3,-9.47,.12,.36,.01],[1.1,3.3,-9.47,.12,.36,.01]];
const duetCrack:Part[]=Array.from({length:9},(_,i)=>{const z=-5.4+i*1.25,x=(i%2?.18:-.18);return [x,.012,z,.06,.01,1.32,(i%2?.28:-.28)] as Part;});
const duetPews:Part[]=[-3.4,-1,1.4,3.8].map(z=>[6.6,0,z,2,1.5,2,Math.PI/2] as Part);
const duetBanners:Part[]=[[-9.9,2.4,-4,2.8,2.8,2.8,0],[-9.9,2.4,2,2.8,2.8,2.8,0]];
function UnfinishedDuet({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 return <>
  <Floor parts={westHalf} color="#76705f" extra={[eastHalf,'#646b82']} ground="#120f1c"/>
  <group userData={{blocksLabels:true}}>
   <Shell ctx={ctx} cols={[[-4.2,-8.2],[4.2,-8.2]]} westCols={[[-8.8,-7.6],[-8.8,-2],[-8.8,3.6]]} colH={7}/>
   <Solid ctx={ctx} parts={pulpitGold} geometry={geo.cyl} color="#6b5a3e" jitter={.06} radius={fixed(.7)}/><Solid ctx={ctx} parts={pulpitSilver} geometry={geo.cyl} color="#5c6478" jitter={.06} radius={fixed(.7)}/>
   <Solid ctx={ctx} parts={boards} geometry={hex} color="#4a4048" radius={fixed(.7)} shadow={false}/><Solid ctx={ctx} parts={boardCones} geometry={geo.cone} color="#3d3644" radius={fixed(.7)} shadow={false}/>
   <Solid ctx={ctx} parts={pulpitStairs} color="#585b6a" radius={fixed(.4)}/>
   <Solid ctx={ctx} parts={doorFrame} geometry={hoop} color="#7c8296" radius={fixed(.5)} shadow={false}/>
   <SolidKit ctx={ctx} url={GRAVE.bench} parts={duetPews} radius={fixed(.6)} material={mapTint(MAPS['grave'],OAK,.88)}/>
   <SolidKit ctx={ctx} url={CASTLE.banner} parts={duetBanners} radius={fixed(.4)} shadow={false} material={mapTint(MAPS['castle'],'#c9b88a',.88)}/>
  </group>
  <group>
   {/* The two halves of the descent key's door: gold on the west, silver on the east, a dark seam between them. */}
   <mesh position={[-.07,3.5,-9.5]} scale={3} geometry={halfLeft} material={mat('#b8913e',.35,.8)} raycast={noRaycast}/><mesh position={[.07,3.5,-9.5]} scale={3} geometry={halfRight} material={mat('#aab6c8',.3,.85)} raycast={noRaycast}/>
   <mesh position={[0,3.5,-9.55]} scale={[.16,6.2,.05]} geometry={geo.box} material={mat('#07080c',1)} raycast={noRaycast}/>
   <Instances parts={keyholes} color="#08090d" material={decal('#08090d')} shadow={false}/>
   <Instances parts={duetCrack} color="#0c0d14" material={decal('#0c0d14',.85)} shadow={false}/>
   <Lancets parts={naveLancets(-10.45,[-8,-4],4.4,1.25)} color="#ffd79a"/><Lancets parts={naveLancets(-10.45,[4,8],4.4,1.25)} color="#a9c0ff"/>
   <Shafts parts={[shaft(-2.6,0,14,1,-.3,.2)]} color="#ffd8a0" opacity={.06}/><Shafts parts={[shaft(2.6,-.6,14,1,-.3,-.2)]} color="#a9c4ff"/>
   <Flame position={[-6.4,2.3,-6.9]} size={.3} reduced={reduced}/>
  </group>
  <pointLight position={[-5.6,3,-6]} color="#ffc878" intensity={12} distance={9}/><pointLight position={[5.6,3,-6]} color="#a8c4ff" intensity={12} distance={9}/>
  <Motes count={50} reduced={reduced}/>
 </>;
}

// ── 7 · The Last Conductor: the great organ, Aras's cage of sound on its podium, the bell gallery, shattered pipes ──
const organPipes:Part[]=Array.from({length:31},(_,i)=>{const x=-8.25+i*.55;return pipe(x,-9.1+(i%2)*.35,4.6+(8.6-Math.abs(x))*.85+rand(i+9)*.4,.21);});
const organCase:Part[]=[[0,1.7,-9.9,18.4,3.4,1.2],[0,3.5,-9.3,18.4,.24,.5],[-9.4,5.2,-9.9,1,10.4,1.2],[9.4,5.2,-9.9,1,10.4,1.2]];
const organMouths:Part[]=organPipes.map(([x,y,z,r])=>[x,y*.3+.4,z+r+.01,r*.8,.3,.01] as Part);
const podium:Part[]=[[0,.25,-7.4,1.6,.5,1.6]],cageBars:Part[]=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return [Math.cos(a)*1.3,2.3,-7.4+Math.sin(a)*1.3,.04,3.6,.04] as Part;});
const galleryDeck:Part[]=[[-8.2,5.6,-1,2.4,.3,12.6]],galleryRail:Part[]=[[-7.05,6.15,-1,.1,.1,12.6],...Array.from({length:13},(_,i)=>[-7.05,5.9,-7.2+i*1.03,.08,.5,.08] as Part)],galleryBrackets:Part[]=[-6.6,-3,.6,4.2].map(z=>[-7.6,4.9,z,.3,1.3,.3,0,0,.6] as Part);
const bellBeam:Part[]=[[-8.2,8.6,-1,.3,.3,12.6]],gallBells:Part[]=[-5.6,-2.4,.8,4].map(z=>bell(-8.2,7.5,z,.8)),bellRopes:Part[]=[-5.6,-2.4,.8,4].map(z=>[-8.2,8.1,z,.02,.6,.02] as Part);
const shattered:Part[]=[[6.7,.2,-3.6,.2,2.6,.2,.3,Math.PI/2],[7.3,.22,-1.4,.22,2.2,.22,-.4,Math.PI/2],[6.6,.18,1.6,.18,1.8,.18,.9,Math.PI/2],[7.2,.2,3.8,.2,2.4,.2,-.2,Math.PI/2]],shards:Part[]=[[6.6,0,-2.4,2,2,2,.5],[7,0,.4,2.2,2.2,2.2,1.8],[6.4,0,2.8,1.8,1.8,1.8,3]];
const soundRings=[1.5,1.75,2].map((r,i)=>({r,tilt:[.25,-.5,.9][i]}));
function LastConductor({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 const rings=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(!rings.current||reduced)return;rings.current.children.forEach((c,i)=>{c.rotation.y=clock.elapsedTime*(.2+i*.12)*(i%2?-1:1);});});
 return <>
  <Floor parts={checkA} color="#4f5368" extra={[checkB,'#383b4d']} jitter={.1} ground="#0e0c18"/>
  <group userData={{blocksLabels:true}}>
   <Shell ctx={ctx} wall={DUNGEON.wall} z={-11.6} h={3} cols={[]} westCols={[[-9.6,-7.6],[-9.6,-1],[-9.6,5.6]]} colH={8.6}/>
   <Solid ctx={ctx} parts={organPipes} geometry={geo.cyl} color="#b9bdca" roughness={.4} metalness={.45} jitter={.1} radius={fixed(.3)}/>
   <Solid ctx={ctx} parts={organCase} color="#3a2c2c" jitter={.06} radius={(p)=>Math.min(p[3],p[5])/2} shadow={false}/>
   <Solid ctx={ctx} parts={podium} geometry={hex} color="#4a4658" radius={fixed(1.6)}/><Solid ctx={ctx} parts={cageBars} geometry={geo.cyl} color="#c0b48a" roughness={.4} metalness={.7} radius={fixed(.1)} shadow={false}/>
   <Solid ctx={ctx} parts={galleryDeck} color="#40363a" jitter={.05} radius={side}/><Solid ctx={ctx} parts={galleryRail} color="#5b5050" radius={fixed(.1)} shadow={false}/><Solid ctx={ctx} parts={galleryBrackets} color="#40363a" radius={fixed(.2)} shadow={false}/>
   <Solid ctx={ctx} parts={bellBeam} color="#33292a" radius={side} shadow={false}/><Solid ctx={ctx} parts={gallBells} geometry={geo.bell} color="#9a7a45" roughness={.4} metalness={.7} radius={fixed(.8)} shadow={false}/>
   <Solid ctx={ctx} parts={shattered} geometry={geo.cyl} color="#8d929e" roughness={.4} metalness={.7} radius={fixed(.35)}/>
   <SolidKit ctx={ctx} url={GRAVE.debris} parts={shards} radius={fixed(.6)} shadow={false} material={mapTint(MAPS['grave'],'#9aa0b4',.88)}/>
  </group>
  <group>
   <Instances parts={organMouths} color="#0c0b12" material={decal('#0c0b12')} shadow={false}/><group userData={{blocksLabels:true}}><Solid ctx={ctx} parts={bellRopes} geometry={geo.cyl} color="#8a7a5e" radius={fixed(.05)} shadow={false}/></group>
   {/* Aras's cage of sound: three rings of brass turning around the bars. Still when motion is reduced. */}
   <group ref={rings} position={[0,2.3,-7.4]}>{soundRings.map(({r,tilt},i)=><mesh key={i} rotation={[Math.PI/2+tilt,0,0]} material={glow('#d9c2ff',.75)} raycast={noRaycast}><torusGeometry args={[r,.035,5,40]}/></mesh>)}</group>
   <mesh position={[0,.52,-7.4]} rotation={[-Math.PI/2,0,0]} material={glow('#b48cff',.5)} raycast={noRaycast}><circleGeometry args={[1.3,24]}/></mesh>
   <Lancets parts={naveLancets(-11.05,[-6.4,6.4],6.8,1)} color="#c3a8ff"/>
   <Shafts parts={[shaft(0,-6.8,15,.9,-.18,0),shaft(-3,1.2,15,1,-.3,.25)]} color="#c8b4ff" opacity={.06}/>
  </group>
  <pointLight position={[0,2.6,-6.6]} color="#b48cff" intensity={16} distance={10}/><pointLight position={[-6.6,6,-1]} color="#ffcf8a" intensity={7} distance={9}/>
  <Motes count={50} reduced={reduced} color="#ddd0ff"/>
 </>;
}

// ── 8 · The Door Beneath the Song: the final door with five stones lit and the sixth dark, the bell gallery, the choir's supplies ──
// Five sockets lit around the door's arch for the five stones you carry; the sixth, the machine's core, sits dark at the door's heart.
const finalDoor:Part[]=[[0,0,-9.4,9,9,9]],litSockets:Part[]=Array.from({length:5},(_,i)=>{const a=Math.PI*(.12+i*.19);return [Math.cos(a)*3.9,4+Math.sin(a)*3.9,-8.6,.24,.24,.24] as Part;}),darkSocket:Part[]=[[0,3.3,-8.7,.3,.3,.3]];
const doorPosts:Part[]=[[-4.4,4.8,-8.6,.5,9.6,.5],[4.4,4.8,-8.6,.5,9.6,.5]],bellBar:Part[]=[[0,9.4,-8.6,9.4,.36,.4]],doorBells:Part[]=[bell(-2.6,8.4,-8.6,.85),bell(0,8.2,-8.6,1.05),bell(2.6,8.4,-8.6,.85)];
const stairwell:Part[]=[[-8.1,.011,-1,2.6,1,7.4]],descent:Part[]=Array.from({length:7},(_,i)=>[-8.1,.013,-4.2+i*1.05,2.4,.01,.5] as Part),parapets:Part[]=[[-6.65,.4,-1,.3,.8,7.4],[-9.55,.4,-1,.3,.8,7.4]];
const guideLanterns:Part[]=[[-6.65,.8,-4,2.4,2.4,2.4],[-6.65,.8,-1,2.4,2.4,2.4],[-6.65,.8,2,2.4,2.4,2.4]];
const supplyBarrels:Part[]=[[6.5,0,-3.6,.5,.5,.5],[7.3,0,-2.9,.45,.45,.45],[6.6,0,4.2,.5,.5,.5]],supplyBoxes:Part[]=[[6.6,0,-1.4,.55,.55,.55,.3],[7.4,0,-.4,.5,.5,.5,.9],[6.5,0,1.6,.55,.55,.55,.1],[-1.6,0,6.5,.5,.5,.5,.4],[1.2,0,6.6,.55,.55,.55,1.2]],supplyCrates:Part[]=[[7.6,0,2.6,.6,.6,.6,.2]];
const pathStones:Part[]=[0,1,2,3,4].map(i=>[0,.012,3.8-i*1.9,.3,1,.3] as Part),pathLine:Part[]=[[0,.011,.2,.06,.01,8.2]];
function DoorBeneathSong({ctx,reduced}:{ctx:RoomCtx;reduced:boolean}){
 return <>
  <Floor parts={grid12} color="#646b80" ground="#0f1320"/>
  <group userData={{blocksLabels:true}}>
   <Shell ctx={ctx} z={-11} h={2.6} cols={[[-6.4,-7.8],[6.4,-7.8]]} westCols={[[-6.4,-7.8],[-10.2,-4.6],[-10.2,2.6]]} colH={7.6}/>
   <SolidKit ctx={ctx} url={GRAVE.crypt} parts={finalDoor} radius={fixed(.9)} material={mapTint(MAPS['grave'],'#a9b1c8',.88)}/>
   <Solid ctx={ctx} parts={doorPosts} color="#3f3a3a" radius={fixed(.3)} shadow={false}/><Solid ctx={ctx} parts={bellBar} color="#3a3030" radius={back} shadow={false}/>
   <Solid ctx={ctx} parts={doorBells} geometry={geo.bell} color="#a08048" roughness={.4} metalness={.7} radius={fixed(.9)} shadow={false}/>
   <Solid ctx={ctx} parts={parapets} color="#5b6074" radius={side}/>
   <SolidKit ctx={ctx} url={GRAVE.lantern} parts={guideLanterns} radius={fixed(.3)} shadow={false} material={mapTint(MAPS['grave'],'#b7c7c0',.88)}/>
   <SolidKit ctx={ctx} url={DUNGEON.barrel} parts={supplyBarrels} radius={fixed(.5)}/><SolidKit ctx={ctx} url={DUNGEON.box} parts={supplyBoxes} radius={fixed(.5)}/><SolidKit ctx={ctx} url={DUNGEON.crates} parts={supplyCrates} radius={fixed(.8)}/>
  </group>
  <group>
   <Instances parts={litSockets} geometry={orb} color="#ffe2a0" material={glow('#ffe2a0',.95)} shadow={false}/><Instances parts={darkSocket} geometry={orb} color="#1a1c2a" material={mat('#1b1d2b',.5,.4)} shadow={false}/>
   <Instances parts={stairwell} geometry={geo.disc} color="#04060c" material={decal('#04060c')} shadow={false}/>
   <Instances parts={descent} color="#3a4256" material={decal('#3a4256',.8)} shadow={false}/>
   <Instances parts={pathStones} geometry={geo.disc} color="#ffd88f" material={glow('#ffd88f',.35)} shadow={false}/><Instances parts={pathLine} color="#ffd88f" material={glow('#ffd88f',.12)} shadow={false}/>
   {[-4,-1,2].map(z=><Flame key={z} position={[-6.65,1.25,z]} size={.2} reduced={reduced}/>)}
   <Lancets parts={naveLancets(-10.45,[-8.4,8.4],4.4,1.2)} color="#b6c8ff"/>
   <Shafts parts={[shaft(0,-6.4,15,1.2,-.16,0),shaft(-3.2,1.6,14,.9),shaft(3,-.8,14,.9,-.3,-.2)]}/>
  </group>
  <pointLight position={[0,4.4,-7.6]} color="#ffe0a8" intensity={14} distance={10}/><pointLight position={[-7.4,1.6,-1]} color="#ffc27a" intensity={6} distance={7}/>
  <Motes count={60} reduced={reduced}/>
 </>;
}

const ROOMS:Record<string,(p:{ctx:RoomCtx;reduced:boolean})=>ReactNode>={'choir-1':HallOfBreaths,'choir-2':ResonanceLibrary,'choir-3':SilentRefectory,'choir-4':ChoirOfStone,'choir-5':PilgrimStair,'choir-6':UnfinishedDuet,'choir-7':LastConductor,'choir-8':DoorBeneathSong};
export default function HollowChoir({scene,save,reduced}:RoomProps){const Room=ROOMS[scene]??HallOfBreaths;return <Room key={scene} ctx={{save,scene}} reduced={reduced}/>;}
