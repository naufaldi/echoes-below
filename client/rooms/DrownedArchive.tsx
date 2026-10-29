import {fixed} from './parts';
import {useEffect,useMemo,type ReactElement,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Solid,SolidKit,type RoomCtx,Instances,KitInstances,Flame,chain,mat,decal,geo,noRaycast,rand,type Part,type RoomProps} from './kit';

// Drowned Archive rooms (archive-1 … archive-8), #47: a flooded library. Each room is an island of floor in black water.
// The play footprint (±5.4 m) carries only floors and decals; every solid piece stands outside it, tall pieces at −x/−z, and the
// camera side (+x/+z) stays low. Contract, helpers and budget: ./README.md. Kit files: kaykit-dungeon (starter) and kaykit-archive.
// Local helpers (not in kit.tsx): Tint (instanced pieces from a colour palette), Water (the dark water surface, #82), Lamps (lanterns over the water) and Boat.
const PI=Math.PI,WATER=-.45;
const plane=new THREE.PlaneGeometry(1,1).rotateX(-PI/2),ball=new THREE.SphereGeometry(1,10,7),arc=new THREE.TorusGeometry(1,.05,5,20,PI),gem=new THREE.OctahedronGeometry(1),wheel=new THREE.TorusGeometry(.8,.07,6,20);
const extra=new Map<string,THREE.Material>();
/** Unlit glow (lantern panes, the tuning stone, painted stars). Shared by key like kit.mat. */
function glow(color:string,opacity=1){const key='glow'+color+opacity;let m=extra.get(key);if(!m){m=new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1,side:THREE.DoubleSide});extra.set(key,m);}return m;}
/** Glossy wet film over a floor: the sluice current, puddles and spilled ink. */
function sheen(color:string,opacity=.85){const key='sheen'+color+opacity;let m=extra.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.06,metalness:.55,transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});extra.set(key,m);}return m;}
const span=(from:number,to:number,step:number)=>Array.from({length:Math.round((to-from)/step)+1},(_,i)=>+(from+i*step).toFixed(3));
/** Floor tiles on the cell grid. Kit floors top out at +0.05 m, so they sit at y −0.06 to stay under actor and marker rings. */
const tiles=(xs:number[],zs:number[],s:number,y=-.06,sy=1):Part[]=>xs.flatMap(x=>zs.map(z=>[x,y,z,s,sy,s] as Part));
const row=(xs:number[],z:number,y=0,s=1,ry=0):Part[]=>xs.map(x=>[x,y,z,s,s,s,ry]);
const col=(zs:number[],x:number,y=0,s=1,ry=PI/2):Part[]=>zs.map(z=>[x,y,z,s,s,s,ry]);
/** Book spines from a to b along a shelf board at height y. */
function books(ax:number,az:number,bx:number,bz:number,y:number,seed:number):Part[]{const len=Math.hypot(bx-ax,bz-az),ry=-Math.atan2(bz-az,bx-ax),out:Part[]=[];let t=.05,i=0;while(t<len-.08){const r=rand(seed+i*1.7),w=.05+r*.06,h=.2+rand(seed+i*2.3)*.15,u=(t+w/2)/len;if(rand(seed+i*4.1)>.07)out.push([ax+(bx-ax)*u,y+h/2,az+(bz-az)*u,w,h,.17,ry,0,rand(seed+i*5.3)>.88?.18:0]);t+=w+.012;i++;}return out;}
/** Shelf boards plus books along a wall, facing the room (n = unit normal toward the room). */
function shelving(ax:number,az:number,bx:number,bz:number,n:[number,number],levels:number[],seed:number){const ry=-Math.atan2(bz-az,bx-ax),len=Math.hypot(bx-ax,bz-az),[nx,nz]=n,o=.22;
 return {boards:levels.map(y=>[(ax+bx)/2+nx*o,y,(az+bz)/2+nz*o,len,.05,.42,ry] as Part),books:levels.flatMap((y,k)=>books(ax+nx*o,az+nz*o,bx+nx*o,bz+nz*o,y+.025,seed+k*37))};}

/** Instanced pieces coloured from a palette: books, masks, drawers. One draw call, no shadow, not raycast. */
function Tint({parts,colors,geometry=geo.box,roughness=.9,metalness=0}:{parts:Part[];colors:string[];geometry?:THREE.BufferGeometry;roughness?:number;metalness?:number}){
 const mesh=useMemo(()=>{const m=new THREE.InstancedMesh(geometry,mat('#ffffff',roughness,metalness),parts.length),o=new THREE.Object3D(),c=new THREE.Color();
  parts.forEach(([x,y,z,sx,sy,sz,ry=0,rx=0,rz=0],i)=>{o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(sx,sy,sz);o.updateMatrix();m.setMatrixAt(i,o.matrix);m.setColorAt(i,c.set(colors[Math.floor(rand(i*7.3+x+z)*colors.length)]));});
  m.receiveShadow=true;m.raycast=noRaycast;m.computeBoundingSphere();return m;},[parts,colors,geometry,roughness,metalness]);
 useEffect(()=>()=>{mesh.dispose();},[mesh]);return parts.length?<primitive object={mesh}/>:null;
}
type P=RoomProps;
/** Thin floor marks (no shadow, not raycast). Opaque marks use a depth-writing unlit material: an opaque kit decal (depthWrite off) can be painted over by whichever mesh three.js sorts after it. */
function Marks({parts,color,opacity=1,material,geometry=plane}:{parts:Part[];color:string;opacity?:number;material?:THREE.Material;geometry?:THREE.BufferGeometry}){return <Instances parts={parts} geometry={geometry} color={color} jitter={0} shadow={false} material={material??(opacity<1?decal(color,opacity):glow(color))}/>;}

// ── Water (#82): one opaque plane per room. Tiling ripple normals, generated in code, break the lamps into glints; they drift unless reduced. ──
let ripples:THREE.DataTexture|undefined;
/** Ripple normals: a sum of waves with whole-number frequencies, so the 128 px tile wraps without a seam. Built once. */
function rippleMap(){
 if(ripples)return ripples;const N=128,data=new Uint8Array(N*N*4),waves=[[3,1,1,.3],[-2,4,.8,1.1],[5,-3,.5,2],[1,6,.45,.7],[7,2,.3,4],[-6,5,.25,3],[9,-7,.15,5.2]];
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){let dx=0,dy=0;for(const [kx,ky,a,f] of waves){const c=a*2*PI*Math.cos(2*PI*(kx*x+ky*y)/N+f);dx+=c*kx;dy+=c*ky;}const n=new THREE.Vector3(-dx*.02,-dy*.02,1).normalize(),i=(y*N+x)*4;data[i]=(n.x*.5+.5)*255;data[i+1]=(n.y*.5+.5)*255;data[i+2]=(n.z*.5+.5)*255;data[i+3]=255;}
 ripples=new THREE.DataTexture(data,N,N);ripples.wrapS=ripples.wrapT=THREE.RepeatWrapping;ripples.repeat.set(12,12);ripples.magFilter=THREE.LinearFilter;ripples.minFilter=THREE.LinearMipmapLinearFilter;ripples.generateMipmaps=true;ripples.needsUpdate=true;return ripples;
}
/** Water: low metalness (with no environment map, metal reads black) and a soft roughness so each lamp spreads into a sheen. Shared per colour. */
function waterMat(color:string){const key='water'+color;let m=extra.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.32,metalness:.15,normalMap:rippleMap(),normalScale:new THREE.Vector2(.3,.3)});extra.set(key,m);}return m;}
function Water({level=WATER,color='#0b171c',reduced}:{level?:number;color?:string;reduced:boolean}){
 useFrame((_,dt)=>{if(reduced)return;const t=rippleMap().offset;t.set((t.x+dt*.012)%1,(t.y+dt*.007)%1);});
 return <mesh position={[0,level,0]} scale={[90,1,90]} geometry={plane} material={waterMat(color)} receiveShadow raycast={noRaycast}/>;
}
/** Where water meets stone: flat strips of width w hugging each face of the plinth blocks, just above the surface. */
const lap=(blocks:Part[],w:number,level=WATER+.004):Part[]=>blocks.flatMap(([x,,z,sx,,sz])=>[[x,level,z-sz/2-w/2,sx+w*2,1,w],[x,level,z+sz/2+w/2,sx+w*2,1,w],[x-sx/2-w/2,level,z,w,1,sz],[x+sx/2+w/2,level,z,w,1,sz]] as Part[]);
/** Dark water around the island and the plinth the floor sits on, with a pale wet line and a lighter band (three stacked strips) at the stone. */
function Basin({plinth,color='#3a4140',water,edge='#8fb1ae',reduced}:{plinth:Part[];color?:string;water?:string;edge?:string;reduced:boolean}){
 const {line,band}=useMemo(()=>({line:lap(plinth,.09),band:[.35,.9,1.8].flatMap(w=>lap(plinth,w))}),[plinth]);
 return <><Water color={water} reduced={reduced}/><Instances parts={plinth} color={color} jitter={.06} shadow={false}/>
  <Marks parts={band} color={edge} material={decal(edge,.035)}/><Marks parts={line} color={edge} material={decal(edge,.38)}/></>;
}
// Lanterns over the water: [x, lantern y, z, hanging?]. Posts rise from the water; hanging lanterns ride a chain up into the dark.
type Lamp=[number,number,number,boolean?];
function Lamps({at,lit=2,color='#ffc477'}:{at:Lamp[];lit?:number;color?:string}){
 const {posts,metal,panes,links}=useMemo(()=>{const posts:Part[]=[],metal:Part[]=[],panes:Part[]=[],links:Part[]=[];
  at.forEach(([x,y,z,hang])=>{if(hang)links.push(...chain(x,z,y+.3,y+7));else posts.push([x,(y-.2+WATER-.3)/2,z,.07,y-.2-WATER+.3,.07]);metal.push([x,y-.19,z,.26,.06,.26],[x,y+.2,z,.3,.07,.3],[x,y+.29,z,.12,.1,.12]);panes.push([x,y,z,.19,.32,.19]);});
  return {posts,metal,panes,links};},[at]);
 return <group>
  {posts.length>0&&<Instances parts={posts} geometry={geo.cyl} color="#2f2a24" shadow={false}/>}
  {links.length>0&&<Instances parts={links} geometry={geo.link} color="#3e4446" roughness={.5} metalness={.7} shadow={false}/>}
  <Instances parts={metal} color="#2b2722" roughness={.6} metalness={.5} shadow={false}/><Instances parts={panes} color={color} material={glow(color)} shadow={false}/>
  {at.slice(0,lit).map(([x,y,z])=><pointLight key={x+':'+z} position={[x,y,z]} color={color} intensity={6} distance={7} decay={2}/>)}
 </group>;
}
// A flat-bottomed ferry boat, in its own local space (long axis z).
const boatParts:Part[]=[[0,.08,0,.95,.16,3],[-.5,.3,0,.1,.42,3,0,0,.22],[.5,.3,0,.1,.42,3,0,0,-.22],[0,.3,1.52,.95,.42,.1],[0,.3,-1.52,.95,.42,.1],[0,.36,.7,1,.06,.32],[0,.36,-.8,1,.06,.32]];
function Boat({position,ry=0,list=.08,children}:{position:[number,number,number];ry?:number;list?:number;children?:ReactNode}){return <group position={position} rotation={[0,ry,list]} userData={{blocksLabels:true}}><Instances parts={boatParts} color="#4b3826"/>{children}</group>;}

const K={
 wall:'/assets/env/kaykit-dungeon/wall.glb',arched:'/assets/env/kaykit-dungeon/wall_arched.glb',broken:'/assets/env/kaykit-dungeon/wall_broken.glb',gated:'/assets/env/kaykit-dungeon/wall_gated.glb',
 tile:'/assets/env/kaykit-dungeon/floor_tile_small.glb',tileBroken:'/assets/env/kaykit-dungeon/floor_tile_small_broken_A.glb',tileLarge:'/assets/env/kaykit-dungeon/floor_tile_large.glb',
 stairs:'/assets/env/kaykit-dungeon/stairs.glb',pillar:'/assets/env/kaykit-dungeon/pillar.glb',barrel:'/assets/env/kaykit-dungeon/barrel_large.glb',box:'/assets/env/kaykit-dungeon/box_large.glb',crates:'/assets/env/kaykit-dungeon/crates_stacked.glb',torch:'/assets/env/kaykit-dungeon/torch_mounted.glb',banner:'/assets/env/kaykit-dungeon/banner_thin_brown.glb',
 pillarDeco:'/assets/env/kaykit-archive/pillar_decorated.glb',wallPillar:'/assets/env/kaykit-archive/wall_pillar.glb',window:'/assets/env/kaykit-archive/wall_window_closed.glb',
 bed:'/assets/env/kaykit-archive/bed_frame.glb',grate:'/assets/env/kaykit-archive/floor_tile_big_grate.glb',woodDark:'/assets/env/kaykit-archive/floor_wood_large_dark.glb',
 table:'/assets/env/kaykit-archive/table_long.glb',chair:'/assets/env/kaykit-archive/chair.glb',candles:'/assets/env/kaykit-archive/candle_triple.glb',coins:'/assets/env/kaykit-archive/coin_stack_medium.glb',barrier:'/assets/env/kaykit-archive/barrier_column.glb',
};
// The difficult row (cells [1..7,4], world z = 0) is the archive's current in every room; each room dresses it differently.
const current=(w=1.05,y=.004):Part[]=>[[-2.4,y,0,3.6,1,w],[2.4,y,0,3.6,1,w]];
const cellLines=(c:number[]):Part[]=>[...c.map(x=>[x,.003,0,.04,1,10.8] as Part),...c.map(z=>[0,.003,z,10.8,1,.04] as Part)];

// ── 1 · The Sluice Stair: Briarwatch's stair comes down to a wet landing; the sluice opens in the west wall and its current runs across the room into open water ──
const s1All=tiles(span(-6,4.8,1.2),span(-6,4.8,1.2),.6),s1Tiles=s1All.filter((_,i)=>rand(i*3.7)>.18),s1Broken=s1All.filter((_,i)=>rand(i*3.7)<=.18);
const s1Plinth:Part[]=[[-.6,-.33,-.6,12,.54,12]],s1Steps:Part[]=[[0,-.17,5.75,11,.2,.7],[.4,-.3,6.4,10,.2,.6],[5.75,-.17,-.6,.7,.2,12],[6.4,-.3,-.2,.6,.2,11]];
const s1Walls:Part[]=[...row([-5,-9,5,9],-7.1),...row([-5,5],-7.1,4),...col([-9.1],-3.4,0,1),...col([-9.1],3.4,0,1),...col([-4.6,-8.6],-7.1)],s1Gate:Part[]=[[-7.1,0,-.6,1,1,1,PI/2]],s1Broken2:Part[]=[[-7.1,0,3.4,1,.55,1,PI/2]];
const s1Stairs:Part[]=[[0,0,-11.4,1.2,1.2,1.2]],s1Torches:Part[]=[[-4,2.2,-6.6,1,1,1],[4,2.2,-6.6,1,1,1]],s1Crates:Part[]=[[-6.1,0,-6.1,.55,.55,.55,.4]],s1Barrels:Part[]=[[-6.1,0,-4.4,.4,.4,.4],[-6.2,0,2.6,.42,.42,.42]];
const s1Spokes:Part[]=[[-6.52,2.9,-.6,.08,1.6,.08],[-6.52,2.9,-.6,.08,.08,1.6],[-6.52,2.9,-.6,.1,.22,.22]],s1Plates:Part[]=[-1.35,-.6,.15].map(z=>[-6.56,3.7,z,.04,.3,.55] as Part),s1Numerals:Part[]=[-1.35,-.6,.15].flatMap((z,i)=>[0,1,2].slice(0,i+1).map(k=>[-6.53,3.7,z-.12+k*.12,.02,.18,.04] as Part));
const s1Current=current(),s1Bridge:Part[]=[[0,.006,0,1.3,1,1.25]],s1Spill:Part[]=[[6.2,WATER+.005,0,2.4,1,1.1],[-6.85,.004,0,.6,1,1.05]];
const s1Pages:Part[]=Array.from({length:9},(_,i)=>[(rand(i)-.5)*9,WATER+.01+rand(i+3)*.004,6.2+rand(i+5)*2.4,.22,.01,.3,rand(i+9)*PI] as Part).concat(Array.from({length:6},(_,i)=>[6.3+rand(i+20)*2.4,WATER+.01,-5+rand(i+30)*9,.22,.01,.3,rand(i+40)*PI] as Part));
const s1Posts:Part[]=[[6.2,.15,-3.4,.13,1.3,.13],[9.6,.5,-7.4,.16,2,.16],[6.2,-.05,5.8,.12,.9,.12]];
// The ferry chain runs from the front post to the far post, skimming the current.
const s1Chain:Part[]=Array.from({length:44},(_,i)=>{const t=i/43,x=6.2+(9.6-6.2)*t,z=5.8+(-7.4-5.8)*t;return (i%2?[x,WATER+.25-Math.sin(t*PI)*.18,z,1,1,1,0,PI/2]:[x,WATER+.25-Math.sin(t*PI)*.18,z,1,1,1,Math.atan2(5.8+7.4,9.6-6.2)]) as Part;});
const s1Lamps:Lamp[]=[[7.8,1.6,2.6],[2.8,1.4,7.6],[-3.8,1.5,7.2],[9.6,1.9,-6.2]];
function SluiceStair({p}:{p:P}){
 const force=!!p.save?.scene.description.includes('gaff');
 return <>
  <Basin plinth={s1Plinth} reduced={p.reduced}/>
  <KitInstances url={K.tile} parts={s1Tiles} shadow={false}/><KitInstances url={K.tileBroken} parts={s1Broken} shadow={false}/>
  <Instances parts={s1Steps} color="#4f5753" jitter={.1} shadow={false}/>
  <group><Marks parts={s1Current} color="#2f6f80" material={sheen('#2f6f80',.72)}/><Marks parts={s1Spill} color="#123039" material={sheen('#16404b',.6)}/><Marks parts={s1Bridge} color="#7a807a"/><Marks parts={s1Pages} color="#8f8a74" opacity={.6}/></group>
  <group userData={{blocksLabels:true}}>
   <SolidKit ctx={p} url={K.wall} parts={s1Walls} radius={fixed(.5)}/><SolidKit ctx={p} url={K.gated} parts={s1Gate} radius={fixed(.5)}/><SolidKit ctx={p} url={K.broken} parts={s1Broken2} radius={fixed(.5)}/><SolidKit ctx={p} url={K.stairs} parts={s1Stairs} radius={fixed(.6)}/>
   <SolidKit ctx={p} url={K.torch} parts={s1Torches} shadow={false} radius={fixed(.5)}/><SolidKit ctx={p} url={K.crates} parts={s1Crates} radius={fixed(.6)}/><SolidKit ctx={p} url={K.barrel} parts={s1Barrels} radius={fixed(.5)}/>
   {/* The sluice: a wheel on the gate and three brass plates whose numbers are a date. */}
   <mesh position={[-6.5,2.9,-.6]} rotation={[0,PI/2,0]} geometry={wheel} material={mat('#6f5a3a',.5,.6)} castShadow/>
   <Instances parts={s1Spokes} color="#5b4a32" roughness={.5} metalness={.6} shadow={false}/><Instances parts={s1Plates} color="#a7884f" roughness={.4} metalness={.7} shadow={false}/><Instances parts={s1Numerals} color="#2a2117" material={glow('#2a2117')} shadow={false}/>
   <Instances parts={s1Posts} geometry={geo.cyl} color="#3a2f25"/><Instances parts={s1Chain} geometry={geo.link} color="#48504f" roughness={.5} metalness={.7} shadow={false}/>
   {/* Track B fork: mercy brings the boat to the landing with a lantern held high; force leaves it chained to the far post with a gaff hook across the thwarts. */}
   {force?<Boat position={[8.4,WATER-.05,-5.6]} ry={.55} list={.14}><mesh position={[0,.5,0]} rotation={[PI/2,0,.4]} material={mat('#5c4a33')}><cylinderGeometry args={[.035,.035,2.6,5]}/></mesh><mesh position={[.3,.5,1.25]} rotation={[0,0,.4]} material={mat('#6b6f6c',.4,.7)}><torusGeometry args={[.12,.025,4,8,PI*1.3]}/></mesh></Boat>
    :<Boat position={[6.95,WATER-.05,-1.4]} list={.12}><mesh position={[0,1.2,1.3]} material={mat('#5c4a33')}><cylinderGeometry args={[.035,.035,2,5]}/></mesh><mesh position={[0,2.25,1.3]} material={glow('#ffd28a')}><boxGeometry args={[.2,.3,.2]}/></mesh><pointLight position={[0,2.3,1.3]} color="#ffc777" intensity={7} distance={7}/></Boat>}
  </group>
  <Lamps at={s1Lamps} lit={force?3:2}/>
  <Flame position={[-4,3.05,-6.1]} size={.5} reduced={p.reduced}/><Flame position={[4,3.05,-6.1]} size={.5} reduced={p.reduced}/><pointLight position={[0,3.4,-5.8]} color="#ffb46b" intensity={8} distance={9}/>
 </>;
}

// ── 2 · The Ink Garden: no masonry; shelf towers rise out of a bed of black reeds, every leaf a copied sentence ──
const inkFloor=tiles(span(-6,6,1.2),span(-6,6,1.2),1.17,-.07,.12),inkPlinth:Part[]=[[0,-.33,0,13.4,.54,13.4]];
/** A free-standing bookcase in world space: sides, back, top, boards and books; it faces local +z, turned by ry about its base. */
function bookcase(cx:number,y0:number,cz:number,ry:number,w:number,h:number,seed:number){const c=Math.cos(ry),s=Math.sin(ry),frame:Part[]=[],shelf:Part[]=[];
 const at=(lx:number,ly:number,lz:number):[number,number,number]=>[cx+lx*c+lz*s,y0+ly,cz-lx*s+lz*c];
 frame.push([...at(-w/2,h/2,0),.1,h,.5,ry],[...at(w/2,h/2,0),.1,h,.5,ry],[...at(0,h/2,-.22),w,h,.06,ry],[...at(0,h,0),w+.12,.1,.56,ry]);
 for(let y=.35,k=0;y<h-.3;y+=.58,k++){frame.push([...at(0,y,0),w,.05,.5,ry]);const [ax,,az]=at(-w/2+.06,0,.02),[bx,,bz]=at(w/2-.06,0,.02);shelf.push(...books(ax,az,bx,bz,y0+y+.025,seed+k*13));}
 return {frame,shelf};}
const inkCases=[...[[-6.6,WATER-.2,5],[-4.2,WATER,6.4],[-1.4,WATER-.3,7.4],[1.4,WATER-.1,6.8],[4.2,WATER-.25,5.6],[6.6,WATER,4.2]].map(([x,y,h],i)=>bookcase(x,y,-7.3,0,2.4,h,100+i*50)),...[[-4.4,5.2],[-1.6,4.4],[1.2,3.6],[4,2.6]].map(([z,h],i)=>bookcase(-7.3,WATER-.15*i,z,PI/2,2.4,h,500+i*50)),bookcase(7.5,-1.4,-3,-PI/2,2.4,2.8,800)];
const inkFrames=inkCases.flatMap(c=>c.frame),inkBooks=inkCases.flatMap(c=>c.shelf);
function reedBand(n:number,seed:number,x0:number,x1:number,z0:number,z1:number,h0:number,h1:number):Part[]{return Array.from({length:n},(_,i)=>{const x=x0+rand(seed+i)*(x1-x0),z=z0+rand(seed+i+.37)*(z1-z0),h=h0+rand(seed+i+.71)*(h1-h0);return [x,WATER+h/2,z,.026,h,.026,0,(rand(seed+i+.13)-.5)*.3,(rand(seed+i+.53)-.5)*.3] as Part;});}
const inkReeds=[...reedBand(150,1,-9.5,9.5,-9.6,-6.8,1.2,2.6),...reedBand(110,200,-9.6,-6.8,-6.8,7.4,1,2.4),...reedBand(60,400,6.8,8.8,-7,6,.5,1.3),...reedBand(60,600,-7,6.6,6.8,8.4,.4,1)];
const inkLeaves:Part[]=inkReeds.filter((_,i)=>rand(i*1.9)>.4).map(([x,y,z,,h],i)=>[x+.06,y+h*.32,z,.15,.21,.012,rand(i+3)*PI,0,(rand(i+7)-.5)*.6]);
const inkBed:Part[]=current(1.1),inkStubble:Part[]=Array.from({length:70},(_,i)=>{const x=(i%2?1:-1)*(.8+rand(i)*3.4);return [x,.006,(rand(i+50)-.5)*.9,.04,1,.16+rand(i+90)*.14,rand(i+20)*PI] as Part;}),inkPages:Part[]=Array.from({length:10},(_,i)=>[(rand(i+3)-.5)*12,WATER+.01,6.9+rand(i+8)*1.6,.24,1,.32,rand(i)*PI] as Part);
const inkLamps:Lamp[]=[[-6.9,1.7,5.6],[6.9,1.3,-5.2],[-2.8,3.4,-6.6,true],[2.8,3.2,-6.6,true]];
function InkGarden({p}:{p:P}){
 return <>
  <Basin plinth={inkPlinth} color="#2e2a22" water="#09130f" edge="#93a98c" reduced={p.reduced}/>
  <Tint parts={inkFloor} colors={['#3b3326','#342d22','#40372a','#2f2a20','#3a3a2a']} roughness={1}/>
  <group><Marks parts={inkBed} color="#141c17" opacity={.92}/><Marks parts={inkStubble} color="#0b100d"/><Marks parts={inkPages} color="#8f8a74" opacity={.6}/></group>
  <group userData={{blocksLabels:true}}>
   <Solid ctx={p} parts={inkFrames} color="#3c2e22" radius={fixed(.3)}/>
  </group>
  <Tint parts={inkBooks} colors={['#2d3d33','#3b4a3c','#1f2a24','#55634f','#7d7a62','#2a3530']} roughness={.85}/>
  <Instances parts={inkReeds} geometry={geo.cyl} color="#2c3b31" jitter={.4} shadow={false}/>
  <Tint parts={inkLeaves} colors={['#bdbca2','#a9ad94','#d0cbb0','#8e9c86']}/>
  <Lamps at={inkLamps} lit={3} color="#ffcf86"/>
  <pointLight position={[0,4,-5.5]} color="#7fd1a8" intensity={7} distance={12}/>
 </>;
}

// ── 3 · The Bell Index: a catalogue hall of bronze drawers; the bronze librarian stands in its alcove between suspended chains and bells not yet forged ──
const idxC=span(-6.6,5.4,2.4),idxFloor=tiles(idxC,idxC,.6),idxPlinth:Part[]=[[-.6,-.33,-.6,14.4,.54,14.4]];
const idxInlay=cellLines(span(-5.4,5.4,1.2)),idxGutter=current(.5,.005);
const idxWalls:Part[]=[...row([-5.5,5.5],-7.1),...row([-5.5,5.5],-7.1,4),[0,0,-9.8,1.5,1,1],[0,4,-9.8,1.5,1,1],...col([-8.2],-3,0,1),...col([-8.2],3,0,1),...col([-4.6,-.6,3.4,-8.6],-7.6),...col([-4.6,-.6],-7.6,4)];
function drawers(ax:number,az:number,bx:number,bz:number,y0:number,rows:number,seed:number):Part[]{const len=Math.hypot(bx-ax,bz-az),ry=-Math.atan2(bz-az,bx-ax),n=Math.floor(len/.76),out:Part[]=[];for(let r=0;r<rows;r++)for(let c=0;c<n;c++){if(rand(seed+r*31+c)<.03)continue;const u=(c+.5)/n;out.push([ax+(bx-ax)*u,y0+r*.5,az+(bz-az)*u,.7,.44,.32,ry]);}return out;}
const idxDrawers=[...drawers(-7.4,-6.45,-3.6,-6.45,.3,7,1),...drawers(3.6,-6.45,7.4,-6.45,.3,7,2),...drawers(-6.95,-6.2,-6.95,3.6,.3,7,3).map(([x,y,z,sx,sy,sz])=>[x,y,z,sx,sy,sz,PI/2] as Part)];
const idxPulls:Part[]=idxDrawers.map(([x,y,z,,,,ry=0])=>[x+Math.sin(ry)*.17,y-.09,z+Math.cos(ry)*.17,.22,.06,.03,ry]),idxCards:Part[]=idxDrawers.map(([x,y,z,,,,ry=0])=>[x+Math.sin(ry)*.165,y+.08,z+Math.cos(ry)*.165,.3,.12,.01,ry]),idxBacking:Part[]=[[-5.5,2,-6.64,3.9,3.9,.06],[5.5,2,-6.64,3.9,3.9,.06],[-7.13,1.8,-1.3,.06,3.5,9.9]];
const idxBronze:Part[]=[[0,.4,-8.2,2.2,.8,1.8],[0,5,-8.2,1.7,.55,.75],[-.88,3.95,-8.05,.24,1.8,.24,0,-.12,.1],[.88,3.95,-8.05,.24,1.8,.24,0,-.12,-.1],[0,3.05,-7.85,.5,.3,.3]],idxRobe:Part[]=[[0,2.9,-8.2,1.2,4.2,1]],idxHead:Part[]=[[0,5.75,-8.15,.4,.5,.4]],idxEyes:Part[]=[[-.13,5.82,-7.76,.09,.035,.02],[.13,5.82,-7.76,.09,.035,.02]];
const idxChains:Part[]=[...chain(-1.75,-6.9,2.4,11),...chain(1.75,-6.9,2.4,11),...chain(-4.2,-6,3.5,11),...chain(4.2,-6,3.5,11),...chain(7.4,-5.6,WATER,11),...chain(-7.8,-6.8,WATER,11)];
const idxBells:Part[]=[[-1.75,1.8,-6.9,.6,.6,.6],[1.75,1.8,-6.9,.6,.6,.6]],idxUnforged:Part[]=[[-4.2,2.9,-6,.45,.45,.45],[4.2,2.9,-6,.45,.45,.45],[0,6.2,-7.4,.8,.8,.8]];
const idxLamps:Lamp[]=[[7.4,1.5,-1.8],[3.2,1.4,7.4],[-7.6,1.6,5.6]];
function BellIndex({p}:{p:P}){
 const bronze=mat('#8a6a3c',.35,.75);
 return <>
  <Basin plinth={idxPlinth} color="#38352e" reduced={p.reduced}/>
  <KitInstances url={K.tileLarge} parts={idxFloor} shadow={false}/>
  <group><Marks parts={idxInlay} color="#9a7a45" opacity={.55}/><Marks parts={idxGutter} color="#6b5531" material={sheen('#5a4528',.9)}/>
   {[[2.15,2.25],[3.9,3.97]].map(([a,b])=><mesh key={a} position={[0,.005,0]} rotation={[-PI/2,0,0]} material={decal('#a88a52',.5)} raycast={noRaycast}><ringGeometry args={[a,b,48]}/></mesh>)}
  </group>
  <group userData={{blocksLabels:true}}>
   <SolidKit ctx={p} url={K.wallPillar} parts={idxWalls} radius={fixed(.5)}/>
   <Instances parts={idxBacking} color="#14100c" shadow={false}/><Tint parts={idxDrawers} colors={['#3b2a1c','#46311f','#3f2d1d','#4a3522']} roughness={.7}/><Instances parts={idxPulls} color="#d4ad62" roughness={.3} metalness={.85} shadow={false}/><Instances parts={idxCards} color="#ddd4bb" material={glow('#ddd4bb')} shadow={false}/>
   {/* The bronze librarian: silent, hands held out for the missing drawer. */}
   <Instances parts={idxBronze} color="#8a6a3c" material={bronze}/><Instances parts={idxRobe} geometry={geo.cone} color="#8a6a3c" material={bronze}/><Instances parts={idxHead} geometry={ball} color="#8a6a3c" material={bronze}/>
   <Instances parts={idxEyes} color="#9ff0dc" material={glow('#9ff0dc')} shadow={false}/>
   <Instances parts={idxBells} geometry={geo.bell} color="#94744a" material={mat('#94744a',.4,.75)} shadow={false}/>
  </group>
  <Instances parts={idxUnforged} geometry={geo.bell} color="#d9c08a" material={glow('#d9c08a',.22)} shadow={false}/>
  <Instances parts={idxChains} geometry={geo.link} color="#4f5658" roughness={.5} metalness={.7} shadow={false}/>
  <Lamps at={idxLamps} lit={2} color="#ffbe6e"/>
  <pointLight position={[0,5,-6.2]} color="#86e3cc" intensity={10} distance={9}/><pointLight position={[-4.5,3.6,-4.8]} color="#ffcf91" intensity={6} distance={9}/>
 </>;
}

// ── 4 · The Flooded Infirmary: a tiled ward; cots float pinned against the ceiling under the inverted pocket, the triage board on the back wall ──
const infA:Part[]=[],infB:Part[]=[];span(-6,6,1.2).forEach((x,i)=>span(-6,4.8,1.2).forEach((z,k)=>((i+k)%2?infA:infB).push([x,-.07,z,1.17,.12,1.17])));
const infPlinth:Part[]=[[0,-.36,-.6,13.4,.5,12.2]],infGrates:Part[]=[-3.6,-2.4,-1.2,1.2,2.4,3.6].map(x=>[x,-.022,0,.29,.4,.29] as Part),infPuddles:Part[]=[[2.6,.004,-3.4,2.2,1,1.3,.4],[-4.4,.004,3.8,1.6,1,1,1.2],[4.6,.004,4.2,1.2,1,.8,.3],[-1.2,.004,-5.4,2.6,1,.7]];
const infWalls:Part[]=[...row([-6,-2,2,6],-7.1),...col([-4.6,-.6,3.4],-7.1)],infLow:Part[]=[[7.1,0,-3.6,1,1,1,PI/2],[7.1,0,.4,1,1,1,PI/2]];
const infCots:Part[]=[[-6.3,0,-3.4,.8,.8,.8],[-6.3,0,.2,.8,.8,.8],[-6.3,0,3.8,.8,.8,.8,0,0,.06],[-3.4,6.4,-7.6,.8,.8,.8,PI/2,0,PI],[1.4,6.5,-7.4,.8,.8,.8,PI/2,.08,PI],[5.6,6.3,-7.7,.8,.8,.8,PI/2,-.06,PI],[-7.6,6.4,-1.6,.8,.8,.8,.1,0,PI],[7.8,-1.25,-1.2,.8,.8,.8,.3,.25,.2]];
const infPocket:Part[]=[[0,5.4,-7.4,17,2.6,3],[-7.6,5.4,-1.6,2,2.6,10]],infCurtains:Part[]=[[-6.15,1.2,-1.6,.03,2,1.4],[-6.15,1.2,2,.03,2,1.4],[-3.8,1.25,-6.5,1.6,2.1,.03],[.4,1.25,-6.5,1.6,2.1,.03]],infRails:Part[]=[[-6.15,2.3,.2,.04,.04,7.4],[-1.7,2.4,-6.5,7.6,.04,.04]];
const infBoard:Part[]=[[4,2.3,-6.52,2.6,1.6,.08]],infChalk:Part[]=[...span(1.9,2.9,.2).map(y=>[3.35,y,-6.47,1,.035,.01] as Part),...span(1.9,2.9,.2).map(y=>[4.65,y,-6.47,1,.035,.01] as Part),[4,2.4,-6.47,.03,1.3,.01],[4,3,-6.47,2.3,.03,.01]];
const infBottles:Part[]=[...books(5.3,-6.45,7,-6.45,.9,11),...books(5.3,-6.45,7,-6.45,1.55,12)].map(([x,y,z,w,h])=>[x,y,z,w*.9,h*.9,w*.9] as Part),infShelf:Part[]=[[6.15,.88,-6.45,1.9,.05,.4],[6.15,1.53,-6.45,1.9,.05,.4]];
const infLamps:Lamp[]=[[7.6,1.6,3.8],[2.6,1.5,7.6]];
function FloodedInfirmary({p}:{p:P}){
 return <>
  <Basin plinth={infPlinth} color="#46524f" water="#0a1b20" edge="#9fcfcf" reduced={p.reduced}/>
  <Instances parts={infA} color="#a9b8ab" jitter={.08} roughness={.5} shadow={false}/><Instances parts={infB} color="#c9d0c2" jitter={.08} roughness={.5} shadow={false}/>
  <KitInstances url={K.grate} parts={infGrates} shadow={false}/>
  <group><Marks parts={infPuddles} color="#2b5560" material={sheen('#24505b',.55)}/><Marks parts={current(1.05,.003)} color="#2b5560" material={sheen('#1f4650',.45)}/></group>
  <group userData={{blocksLabels:true}}>
   <SolidKit ctx={p} url={K.window} parts={infWalls} radius={fixed(.5)}/><SolidKit ctx={p} url={K.barrier} parts={infLow} radius={fixed(.5)}/>
   <SolidKit ctx={p} url={K.bed} parts={infCots} radius={fixed(.7)}/>
   <Instances parts={infBoard} color="#1d2724"/><Instances parts={infChalk} color="#d8dccd" material={decal('#d8dccd',.85)} shadow={false}/>
   <Instances parts={infShelf} color="#59625a"/><Tint parts={infBottles} geometry={geo.cyl} colors={['#5d8a7a','#a1b8a4','#7c5a3e','#c9c6a8']} roughness={.3}/>
   <Instances parts={infCurtains} color="#8fa79a" shadow={false}/><Instances parts={infRails} color="#6f7770" metalness={.6} shadow={false}/>
  </group>
  {/* The inverted pocket hangs above the walls, never over the play floor: World draws the mechanism's own pocket over the cot. */}
  <Instances parts={infPocket} color="#4aa8b8" material={glow('#3f9fb0',.16)} shadow={false}/>
  <Lamps at={infLamps} lit={1} color="#f6e2b0"/>
  <pointLight position={[0,5,-6.2]} color="#7fe0e8" intensity={9} distance={11}/><pointLight position={[4,3.2,-5.6]} color="#ffe6b8" intensity={5} distance={6}/>
 </>;
}

// ── 5 · The Witness Vault: a walled vault of polished stone; masks cover the walls and Tavin's hangs cracked at the centre ──
const vaultC=span(-6.6,5.4,2.4),vaultFloor=tiles(vaultC,vaultC,.6),vaultPlinth:Part[]=[[-.6,-.33,-.6,14.4,.54,14.4]];
const vaultWalls:Part[]=[...row([-6,-2,2,6],-7.1),...row([-6,-2,2,6],-7.1,4),...col([-4.6,-.6,3.4],-7.1),...col([-4.6,-.6],-7.1,4),...[-4.6,-.6,3.4].map(z=>[7.1,0,z,1,.35,1,PI/2] as Part)],vaultPillars:Part[]=[[-7,0,-7,1,1.6,1,PI/4],[7,0,-7,1,1.3,1,-PI/4]];
const mask=(x:number,y:number,z:number,ry:number,i:number):Part=>{const s=.85+rand(i*3.1)*.3;return [x,y+(rand(i)-.5)*.12,z,.27*s,.36*s,.09,ry,0,(rand(i+7)-.5)*.25];};
const vaultMasks:Part[]=[...span(-6,6,1).flatMap((x,a)=>span(1.3,5.3,1).map((y,k)=>[x,y,k,a] as const)).filter(([x,,k],i)=>!(Math.abs(x)<.5&&k===2)&&rand(i*5.7)>.06).map(([x,y],i)=>mask(x,y,-6.52,0,i)),...span(-5.6,3.4,1).flatMap(z=>span(1.3,4.3,1).map(y=>[z,y] as const)).filter((_,i)=>rand(i*4.3+9)>.06).map(([z,y],i)=>mask(-6.52,y,z,PI/2,i+200))];
const maskFeatures=(m:Part[]):Part[]=>m.flatMap(([x,y,z,,,,ry=0])=>{const nx=Math.sin(ry)*.105,nz=Math.cos(ry)*.105,ex=Math.cos(ry)*.1,ez=-Math.sin(ry)*.1;return [[x-ex+nx,y+.07,z-ez+nz,.1,.055,.02,ry],[x+ex+nx,y+.07,z+ez+nz,.1,.055,.02,ry],[x+nx,y-.15,z+nz,.12,.03,.02,ry]] as Part[];});
const tavin:Part[]=[[0,2.94,-6.45,.38,.48,.15]],vaultFeatures=maskFeatures([...vaultMasks,[0,2.94,-6.39,.38,.48,.15]]),tavinCrack:Part[]=[[.05,2.98,-6.29,.02,.42,.01,0,0,.4],[-.06,2.86,-6.29,.015,.2,.01,0,0,-.5]];
const vaultInlay:Part[]=[[-2.4,.004,0,3.6,1,.12],[2.4,.004,0,3.6,1,.12],...span(-4.2,4.2,1.2).filter(x=>x).map(x=>[x,.005,0,.32,1,.32,PI/4] as Part)];
const vaultRibs:Part[]=[-4,0,4].map(x=>[x,4.1,-6.5,2.1,2.1,2.1,0] as Part),vaultStands:Part[]=[[-6.1,0,-6.1,1.3,1.3,1.3],[6.1,0,-6.1,1.3,1.3,1.3]];
function WitnessVault({p}:{p:P}){
 return <>
  <Basin plinth={vaultPlinth} color="#24282e" water="#0b1219" edge="#a9b6c6" reduced={p.reduced}/>
  <KitInstances url={K.tileLarge} parts={vaultFloor} shadow={false} material={mat('#3a404a',.22,.3)}/>
  <group><Marks parts={vaultInlay} color="#c9d2dc" opacity={.4}/>{[[3.3,3.36],[4.9,4.94]].map(([a,b])=><mesh key={a} position={[0,.005,0]} rotation={[-PI/2,0,0]} material={decal('#aeb9c6',.35)} raycast={noRaycast}><ringGeometry args={[a,b,48]}/></mesh>)}</group>
  <group userData={{blocksLabels:true}}>
   <SolidKit ctx={p} url={K.wall} parts={vaultWalls} radius={fixed(.5)}/><SolidKit ctx={p} url={K.pillarDeco} parts={vaultPillars} radius={fixed(.9)}/><SolidKit ctx={p} url={K.candles} parts={vaultStands} radius={fixed(.3)} shadow={false}/>
   <Tint parts={vaultMasks} geometry={ball} colors={['#d9d2c0','#c8c1ae','#b9b4a6','#e2dccb','#9d978a']} roughness={.55}/>
   <Instances parts={vaultFeatures} color="#121417" material={glow('#121417')} shadow={false}/>
   <Instances parts={tavin} geometry={ball} color="#e9e4d4" material={mat('#ece6d4',.4)} shadow={false}/><Instances parts={tavinCrack} color="#1a1c1f" material={glow('#1a1c1f')} shadow={false}/>
   <Instances parts={vaultRibs} geometry={arc} color="#5d636d" shadow={false}/>
  </group>
  <Flame position={[-6.1,.9,-6.1]} size={.3} reduced={p.reduced}/><Flame position={[6.1,.9,-6.1]} size={.3} reduced={p.reduced}/>
  <pointLight position={[0,3,-5.2]} color="#cfe4ff" intensity={9} distance={7}/><pointLight position={[-5.6,1.6,-5.6]} color="#ffcf91" intensity={5} distance={7}/><pointLight position={[5.6,1.6,-5.6]} color="#ffcf91" intensity={5} distance={7}/>
 </>;
}

// ── 6 · The Glass Causeway: a glass bridge over deep water, no walls; shadows pace beneath it and the route runs on toward the archivist ──
const GLASS_WATER=-3.2;
const glassPanes:Part[]=[...tiles(span(-4.8,4.8,1.2),span(-4.8,4.8,1.2),1.16,-.07,.12).map(([x,y,z])=>[x,y,z,1.16,.12,1.16] as Part),...span(-1.2,1.2,1.2).flatMap(x=>span(-15.6,-6,1.2).map(z=>[x,-.07,z,1.16,.12,1.16] as Part)),...span(-1.2,1.2,1.2).flatMap(x=>[6,7.2].map(z=>[x,-.07,z,1.16,.12,1.16] as Part))];
const glassFrame:Part[]=[[0,-.2,0,11,.22,11],[0,-.2,-11.4,3.8,.22,10.2],[0,-.2,6.6,3.8,.22,2.4]],glassGirders:Part[]=[...span(-4.8,4.8,2.4).map(x=>[x,-.6,0,.25,.5,10.8] as Part),[0,-.6,-11.4,.3,.5,10]];
const glassSeams=[...cellLines(span(-4.2,4.2,1.2)),[0,.003,0,10.8,1,.05] as Part];
const glassPiers:Part[]=[[-5.6,(GLASS_WATER-.2)/2,-5.6,.5,-GLASS_WATER,.5],[5.6,(GLASS_WATER-.2)/2,-5.6,.5,-GLASS_WATER,.5],[-5.6,(GLASS_WATER-.2)/2,5.6,.5,-GLASS_WATER,.5],[5.6,(GLASS_WATER-.2)/2,5.6,.5,-GLASS_WATER,.5],[0,(GLASS_WATER-.2)/2,-10.8,.5,-GLASS_WATER,.5]];
const glassRuins:Part[]=[[-8.2,GLASS_WATER,-3.6,1,1.5,1],[7.8,GLASS_WATER,-9.6,1,1.3,1],[-7.4,GLASS_WATER,4.4,1,1.05,1],[-4.6,GLASS_WATER,-13,1,1.6,1]];
// Shapes beneath the glass: four silhouettes for a party of three, and larger shapes pacing in the deep water.
const glassShadows:Part[]=[[2,.004,3.2,.28,1,.5,.2],[3.1,.004,3.4,.28,1,.5,.1],[4.2,.004,3.1,.28,1,.5,.3],[-1,.004,-1.6,.28,1,.5,.6]],glassHeads:Part[]=glassShadows.map(([x,y,z,,,,r=0])=>[x+Math.sin(r)*.66,y,z+Math.cos(r)*.66,.15,1,.15] as Part);
const glassDeep:Part[]=[[-7.6,GLASS_WATER+.05,-.8,1.4,.2,.7,.3],[7.2,GLASS_WATER+.05,2.2,1.2,.2,.6,-.5],[3.6,GLASS_WATER+.05,-8.8,1.5,.2,.7,1],[-3.2,GLASS_WATER+.05,-7.8,1.3,.2,.6,.8]];
const glassRails:Part[]=[...span(-16,-6.4,1.6).flatMap(z=>[[-1.95,.5,z,.07,1,.07],[1.95,.5,z,.07,1,.07]] as Part[]),[-5.9,.5,-5.9,.09,1,.09],[5.9,.5,-5.9,.09,1,.09],[-5.9,.5,5.9,.09,1,.09],[-1.95,.5,5.9,.09,1,.09],[1.95,.5,5.9,.09,1,.09]];
const glassRope:Part[]=[[-1.95,.95,-11.2,.025,.025,9.7],[1.95,.95,-11.2,.025,.025,9.7],[-5.9,.95,0,.025,.025,11.8],[-3.92,.95,-5.9,3.95,.025,.025],[3.92,.95,-5.9,3.95,.025,.025]];
/** Pale wet rings where the piers and the drowned pillars break the surface. */
const lapRing=new THREE.RingGeometry(1,1.18,24).rotateX(-PI/2),glassLap:Part[]=[...glassPiers.map(([x,,z])=>[x,GLASS_WATER+.004,z,.52,1,.52] as Part),...glassRuins.map(([x,,z])=>[x,GLASS_WATER+.004,z,.62,1,.62] as Part)];
const glassArch:Part[]=[[0,0,-16.8,1,1,1]],glassLamps:Lamp[]=[[-1.95,1.3,-8,false],[1.95,1.3,-12.8,false],[-5.9,1.4,5.9],[5.9,1.4,-5.9]];
function GlassCauseway({p}:{p:P}){
 return <>
  <Water level={GLASS_WATER} color="#06111a" reduced={p.reduced}/><Instances parts={glassLap} geometry={lapRing} color="#9cc8d8" material={decal('#9cc8d8',.3)} shadow={false}/>
  <Instances parts={glassPanes} color="#8cc4c9" jitter={.14} roughness={.06} metalness={.35} shadow={false}/>
  <Instances parts={glassFrame} color="#3d4a4f" metalness={.5} roughness={.4} shadow={false}/><Instances parts={glassGirders} color="#2e383c" metalness={.5} shadow={false}/><Instances parts={glassPiers} geometry={geo.cyl} color="#3a4448" shadow={false}/>
  <group><Marks parts={glassSeams} color="#cdf6ff" opacity={.35}/><Marks parts={glassShadows} geometry={geo.disc} color="#0a1a22" opacity={.28}/><Marks parts={glassHeads} geometry={geo.disc} color="#0a1a22" opacity={.28}/><Marks parts={current(1.05,.003)} color="#bff0f6" opacity={.12}/></group>
  <Instances parts={glassDeep} geometry={ball} color="#010203" material={decal('#010203',.85)} shadow={false}/>
  <group userData={{blocksLabels:true}}>
   <SolidKit ctx={p} url={K.pillar} parts={glassRuins} radius={fixed(.8)}/><SolidKit ctx={p} url={K.arched} parts={glassArch} radius={fixed(.5)}/>
   <Solid ctx={p} parts={glassRails} geometry={geo.cyl} color="#4a3d2c" radius={fixed(.1)} shadow={false}/>
  </group>
  <Instances parts={glassRope} color="#9b8455" shadow={false}/>
  <mesh position={[0,1.6,-17.2]} raycast={noRaycast}><planeGeometry args={[2.2,3]}/><meshBasicMaterial color="#ffb366"/></mesh>
  <Lamps at={glassLamps} lit={2} color="#bfe8ff"/>
  <pointLight position={[0,2.2,-15.6]} color="#ffaa5c" intensity={10} distance={10}/><pointLight position={[0,-1.6,0]} color="#4fb6c8" intensity={8} distance={9}/>
 </>;
}

// ── 7 · The Keeper of Debts: Archivist Sel's gilded office; the tuning stone turns inside a bronze rib cage in the alcove behind his desk ──
const debtC=span(-6.6,5.4,2.4),debtFloor=tiles(debtC,debtC,.6),debtPlinth:Part[]=[[-.6,-.33,-.6,14.4,.54,14.4]];
const debtWalls:Part[]=[...row([-5.5,5.5],-7.1),...row([-5.5,5.5],-7.1,4),[0,0,-9.8,1.5,1,1],[0,4,-9.8,1.5,1,1],...col([-8.2],-3,0,1),...col([-8.2],3,0,1),...col([-4.6,-.6,3.4,-8.6],-7.6),...col([-4.6,-.6],-7.6,4)];
const debtShelf=shelving(-7.05,-6.2,-7.05,3.6,[1,0],[.55,1.3,2.05,2.8,3.55],5),debtShelf2=shelving(-7.4,-6.6,-3.6,-6.6,[0,1],[.55,1.3,2.05,2.8],9),debtShelf3=shelving(3.6,-6.6,7.4,-6.6,[0,1],[.55,1.3,2.05,2.8],13);
const debtBoards=[...debtShelf.boards,...debtShelf2.boards,...debtShelf3.boards],debtBooks=[...debtShelf.books,...debtShelf2.books,...debtShelf3.books];
const debtRibs:Part[]=Array.from({length:8},(_,i)=>[0,2.3,-7.6,1.9,1.35,1.4,i*PI/4,0,PI/2] as Part),debtHoops:Part[]=[[0,1.05,-7.6,1.05,1.05,1.05],[0,3.55,-7.6,1.05,1.05,1.05]],debtSpine:Part[]=[[0,2.3,-7.6,.07,4.2,.07],[0,.15,-7.6,2.6,.3,2.6]];
const debtGilt:Part[]=[[0,.004,-5.5,11,1,.08],[0,.004,5.5,11,1,.08],[-5.5,.004,0,.08,1,11],[5.5,.004,0,.08,1,11]],debtLedger:Part[]=Array.from({length:34},(_,i)=>[(i%2?1:-1)*(.8+rand(i)*3.5),.005,(rand(i+11)-.5)*.95,.2,1,.27,rand(i+4)*PI] as Part);
const debtDesk:Part[]=[[-6.35,0,-2.4,.7,.85,.7]],debtChair:Part[]=[[-7.4,0,-2.4,.9,.9,.9,-PI/2]],debtCandles:Part[]=[[-6.3,.85,-1.5,.8,.8,.8],[6.4,1.15,-5.9,.8,.8,.8]],debtCoins:Part[]=[[6.3,0,-4.4,.8,.8,.8],[-6.2,0,4.8,.7,.7,.7,1]],debtBanners:Part[]=[[-1.2,1.6,-9.8,1,1,1],[1.2,1.6,-9.8,1,1,1]];
const debtLectern:Part[]=[[6.3,.55,-5.9,.12,1.1,.12],[6.3,1.12,-5.9,.8,.05,.6,0,.5]],debtContract:Part[]=[[6.3,1.16,-5.88,.6,.01,.45,0,.5]],debtStrike:Part[]=[[6.3,1.18,-5.86,.5,.01,.03,.3,.5]],debtStacks:Part[]=[[-6.5,1.0,-3.4,.3,.3,.4],[-6.2,.95,-3.0,.3,.2,.4,.2],[-6.4,.92,-2.2,.45,.14,.32,.5]];
function KeeperOfDebts({p}:{p:P}){
 const bronze=mat('#b08a4c',.3,.85);
 return <>
  <Basin plinth={debtPlinth} color="#2d241b" water="#11130f" edge="#b9aa86" reduced={p.reduced}/>
  <KitInstances url={K.woodDark} parts={debtFloor} shadow={false}/>
  <group><Marks parts={debtGilt} color="#c9a45c" opacity={.7}/><Marks parts={debtLedger} color="#d7ccb0" opacity={.9}/>{[[1.55,1.62]].map(([a,b])=><mesh key={a} position={[0,.005,0]} rotation={[-PI/2,0,0]} material={decal('#c9a45c',.6)} raycast={noRaycast}><ringGeometry args={[a,b,40]}/></mesh>)}</group>
  <group userData={{blocksLabels:true}}>
   <SolidKit ctx={p} url={K.wall} parts={debtWalls} radius={fixed(.5)}/><SolidKit ctx={p} url={K.banner} parts={debtBanners} shadow={false} radius={fixed(.5)}/>
   <Instances parts={debtBoards} color="#4a3423"/><Tint parts={debtBooks} colors={['#6f2b22','#3f2a1f','#8a6a32','#2f3a2c','#5b2430','#a68c5a']} roughness={.8}/>
   {/* The rib cage: bronze ribs around the second tuning stone. */}
   <Instances parts={debtRibs} geometry={arc} color="#b08a4c" material={bronze}/><Instances parts={debtHoops} geometry={arc} color="#b08a4c" material={bronze} shadow={false}/><Instances parts={debtSpine} geometry={geo.cyl} color="#b08a4c" material={bronze}/>
   <mesh position={[0,2.3,-7.6]} scale={[.32,.5,.32]} geometry={gem} material={glow('#8ff0d6')} raycast={noRaycast}/>
   <SolidKit ctx={p} url={K.table} parts={debtDesk} radius={fixed(.6)}/><SolidKit ctx={p} url={K.chair} parts={debtChair} radius={fixed(.5)}/><SolidKit ctx={p} url={K.candles} parts={debtCandles} radius={fixed(.3)} shadow={false}/><SolidKit ctx={p} url={K.coins} parts={debtCoins} radius={fixed(.5)}/>
   <Tint parts={debtStacks} colors={['#6f2b22','#3f2a1f','#8a6a32']}/>
   <Instances parts={debtLectern} color="#3d2a1c"/><Instances parts={debtContract} color="#e2d7b8" shadow={false}/><Instances parts={debtStrike} color="#8e1f1a" material={glow('#8e1f1a')} shadow={false}/>
  </group>
  <Flame position={[-6.3,1.6,-1.5]} size={.22} reduced={p.reduced}/><Flame position={[6.4,1.9,-5.9]} size={.22} reduced={p.reduced}/>
  <pointLight position={[0,2.3,-7]} color="#8ff0d6" intensity={9} distance={7}/><pointLight position={[-5.8,2,-1.6]} color="#ffbf6e" intensity={7} distance={8}/><pointLight position={[5.8,2.2,-5.2]} color="#ffbf6e" intensity={6} distance={8}/>
 </>;
}

// ── 8 · The Ferry of Names: a plank landing under a sky painted on wet stone; the ferryman waits at the moorings, warm light through the far arch ──
// Dock boards run across the landing, 0.3 m wide and staggered row by row.
const ferryFloor:Part[]=span(-7.65,6.45,.3).flatMap((z,k)=>span(-7.8+(k%2?1.2:0),6.6,2.4).map(x=>{const a=Math.max(x,-7.8),b=Math.min(x+2.4,6.6);return [(a+b)/2,-.065+rand(k*9+x)*.01,z,b-a-.03,.1,.27] as Part;}).filter(p=>p[3]>.3)),ferryPlinth:Part[]=[[-.6,-.36,-.6,14.4,.46,14.4]];
const ferryPilings:Part[]=[...span(-7.2,6,1.2).map(z=>[6.75,-.5,z,.14,1,.14] as Part),...span(-7.2,6,1.2).map(x=>[x,-.5,6.75,.14,1,.14] as Part)];
const ferryBollards:Part[]=[[6.15,.3,-4.2,.16,.6,.16],[6.15,.3,-.6,.16,.6,.16],[6.15,.3,3,.16,.6,.16],[-3,.3,6.15,.16,.6,.16],[2.4,.3,6.15,.16,.6,.16]],ferryRopes:Part[]=[[6.6,.12,-3.4,.04,.04,1.8,.6],[6.6,.12,-1.4,.04,.04,1.8,-.6]];
const ferryWalk:Part[]=[...span(-7.5,-11.4,-.6).map((z,i)=>[3.9+(-z-7.5)*.2,-.08,z,1.3,.08,.5,rand(i)*.06] as Part)],ferryWalkPosts:Part[]=[[3.2,-.4,-8,.1,.9,.1],[4.6,-.4,-8,.1,.9,.1],[3.6,-.4,-10.4,.1,.9,.1],[5,-.4,-10.4,.1,.9,.1]];
const ferryArch:Part[]=[[4.5,WATER,-12.2,1,1.05,1,-.2]],ferryCargo:Part[]=[[-6.2,0,-6,.55,.55,.55,.3]],ferryBoxes:Part[]=[[-6.2,0,-3.9,.45,.45,.45,.2],[-6.1,0,-2.6,.4,.4,.4,-.3],[-6.3,.65,-3.6,.35,.35,.35,.8]],ferryBarrels:Part[]=[[-6.3,0,4.4,.42,.42,.42]];
const ferryCurrent=current(.9,.004);
const ferryLamps:Lamp[]=[[2.6,1.5,7.6],[-3.8,1.5,7.4],[8.4,1.6,4.2],[-7.6,1.8,-8.2]];
// The painted sky: a curved wall of wet stone behind the landing, dusk-blue overhead fading to warm at the waterline.
function PaintedSky(){
 const geometry=useMemo(()=>{const g=new THREE.CylinderGeometry(13.5,13.5,14,48,12,true,PI*.72,PI*.98),c=new THREE.Color(),top=new THREE.Color('#1b2a4a'),mid=new THREE.Color('#3f5a78'),low=new THREE.Color('#c48a55'),pos=g.attributes.position,colors:number[]=[];
  for(let i=0;i<pos.count;i++){const t=(pos.getY(i)+7)/14;c.copy(low).lerp(mid,THREE.MathUtils.smoothstep(t,.02,.3)).lerp(top,THREE.MathUtils.smoothstep(t,.3,.85)).multiplyScalar(.9+rand(i)*.1);colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return g;},[]);
 const material=useMemo(()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.15,side:THREE.BackSide}),[]);
 useEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
 return <mesh position={[0,6.55,-.5]} geometry={geometry} material={material} raycast={noRaycast}/>;
}
const skyStars:Part[]=Array.from({length:90},(_,i)=>{const a=PI*.74+rand(i)*PI*.94,y=5+rand(i+300)*7.5,r=13.4;return [Math.sin(a)*r,y,Math.cos(a)*r-.5,.05+rand(i+9)*.06,.05+rand(i+9)*.06,.05] as Part;}),skyStrokes:Part[]=Array.from({length:9},(_,i)=>{const a=PI*.8+rand(i+50)*PI*.8,y=3+rand(i+60)*3.4,r=13.35;return [Math.sin(a)*r,y,Math.cos(a)*r-.5,2.4+rand(i+70)*2.6,.22,.05,a] as Part;}),skyMoon:Part[]=[[Math.sin(PI*1.12)*13.3,9.4,Math.cos(PI*1.12)*13.3-.5,.9,.9,.1]];
function FerryOfNames({p}:{p:P}){
 return <>
  <Basin plinth={ferryPlinth} color="#2f2820" water="#0b1120" edge="#a6aec6" reduced={p.reduced}/>
  <Tint parts={ferryFloor} colors={['#5b4a3a','#4f4033','#62503e','#463a2f','#6b5a47','#54473b']} roughness={.8}/>
  <Instances parts={ferryPilings} geometry={geo.cyl} color="#3b2d20" shadow={false}/><Instances parts={ferryWalk} color="#6a5137" jitter={.2} shadow={false}/><Instances parts={ferryWalkPosts} geometry={geo.cyl} color="#3b2d20" shadow={false}/>
  <group><Marks parts={ferryCurrent} color="#1d2b33" material={sheen('#1b2a33',.55)}/>{[[1.15,1.2],[2.3,2.34]].map(([a,b])=><mesh key={a} position={[0,.005,0]} rotation={[-PI/2,0,0]} material={decal('#82e2cc',.32)} raycast={noRaycast}><ringGeometry args={[a,b,40]}/></mesh>)}</group>
  <PaintedSky/>
  <Instances parts={skyStars} geometry={ball} color="#f4ead0" material={glow('#f4ead0',.85)} shadow={false}/><Instances parts={skyStrokes} color="#e3c49a" material={glow('#e3c49a',.18)} shadow={false}/><Instances parts={skyMoon} geometry={ball} color="#f6ecd2" material={glow('#f6ecd2',.9)} shadow={false}/>
  <group userData={{blocksLabels:true}}>
   <Solid ctx={p} parts={ferryBollards} geometry={geo.cyl} color="#3b2d20" radius={fixed(.2)}/><Instances parts={ferryRopes} geometry={geo.cyl} color="#9b8455" shadow={false}/>
   <SolidKit ctx={p} url={K.arched} parts={ferryArch} radius={fixed(.5)}/><SolidKit ctx={p} url={K.crates} parts={ferryCargo} radius={fixed(.6)}/><SolidKit ctx={p} url={K.box} parts={ferryBoxes} radius={fixed(.5)}/><SolidKit ctx={p} url={K.barrel} parts={ferryBarrels} radius={fixed(.5)}/>
   {/* The ferryman waits in his boat, pole in hand, lantern on the prow. */}
   <Boat position={[7.3,WATER-.05,-2.4]} list={.03}>
    <mesh position={[0,.95,-.6]} scale={[.32,1.1,.32]} geometry={geo.cone} material={mat('#2a2a30')}/><mesh position={[0,1.6,-.6]} scale={.17} geometry={ball} material={mat('#3a3640')}/>
    <mesh position={[.3,1.4,-.5]} rotation={[.15,0,-.12]} material={mat('#5c4a33')}><cylinderGeometry args={[.03,.03,3.2,5]}/></mesh>
    <mesh position={[0,.85,1.4]} material={glow('#ffd28a')}><boxGeometry args={[.18,.26,.18]}/></mesh>
   </Boat>
  </group>
  <mesh position={[4.5,1.2,-12.35]} rotation={[0,-.2,0]} raycast={noRaycast}><planeGeometry args={[2.2,2.6]}/><meshBasicMaterial color="#ff9a4a"/></mesh>
  <Lamps at={ferryLamps} lit={2}/>
  <pointLight position={[7.3,1,-1]} color="#ffc777" intensity={6} distance={6}/><pointLight position={[4.4,1.8,-10.6]} color="#ff9045" intensity={12} distance={11}/>
 </>;
}

const ROOMS:Record<string,(props:{p:P})=>ReactElement>={'archive-1':SluiceStair,'archive-2':InkGarden,'archive-3':BellIndex,'archive-4':FloodedInfirmary,'archive-5':WitnessVault,'archive-6':GlassCauseway,'archive-7':KeeperOfDebts,'archive-8':FerryOfNames};
export default function DrownedArchive(props:RoomProps){const Room=ROOMS[props.scene]??SluiceStair;return <Room key={props.scene} p={props}/>;}
