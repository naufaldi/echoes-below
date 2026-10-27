import InkGarden from './InkGarden';
import InfirmaryMechanism from './InfirmaryMechanism';
import BellIndexConsole from './BellIndexConsole';
import {latestAnimation,animationClip} from '../shared/animation-cues';
import type {AnimationCue} from '../shared/types';
import TacticalTerrain from './TacticalTerrain';
import TacticalOverlay from './TacticalOverlay';
import {chapterMood} from './ChapterAtmosphere';
import {roomFor} from './rooms/registry';
import {Torch} from './rooms/LegacyShell';
import CounterweightMechanism from './CounterweightMechanism';
import {advanceMovement,type Point} from '../shared/movement';
import {facePoints,yawToward,turnToward} from './actor-facing';
import {WorldLabel,WorldLabelProvider,WorldLabelSilhouette} from './WorldLabels';
import IsolatedAsset from './IsolatedAsset';
import {characterAsset,actorHeight,actorDisplayName} from '../shared/visual-identity';
import WorldDie,{type WorldRoll} from './WorldDie';
import CombatCues,{type WorldCue} from './CombatCues';
import SceneFraming from './SceneFraming';
import {useEffect,useMemo,useRef,useState,type ElementRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls,useGLTF,useAnimations,ContactShadows,Billboard} from '@react-three/drei';
import * as THREE from 'three';
import {dressCharacter,raceBreadth} from './character-dress';
import PortraitStudio from './PortraitStudio';
import {npcModelClass} from './portrait-look';
import type {Actor,ActionOption,Entity,PublicSave,Speaker,CompanionSetup} from '../shared/types';

/** Compact always-facing HP bar shown over combatants during combat. */
function HealthBar({hp,maxHp,enemy,height}:{hp:number;maxHp:number;enemy:boolean;height:number}){const ratio=Math.max(0,Math.min(1,hp/Math.max(1,maxHp)));return <Billboard position={[0,height,0]}><mesh renderOrder={10}><planeGeometry args={[.86,.11]}/><meshBasicMaterial color="#0b1412" transparent opacity={.85} depthTest={false}/></mesh><mesh renderOrder={11} position={[-.4*(1-ratio),0,.001]} scale={[ratio,1,1]}><planeGeometry args={[.8,.06]}/><meshBasicMaterial color={enemy?'#d0634c':'#74c2a8'} transparent depthTest={false} toneMapped={false}/></mesh></Billboard>;}

function CharacterModel({actor,selected,onSelect,reduced,labelMode='actor',attackId='',attackCue='melee',showHp=false,face}:{face?:Point,actor:Actor,selected:boolean,onSelect:()=>void,reduced:boolean,labelMode?:'actor'|'entity'|'none',attackId?:string,attackCue?:AnimationCue,showHp?:boolean}){
  const gltf=useGLTF(characterAsset(actor));const [hovered,setHovered]=useState(false);
  const object=useMemo(()=>dressCharacter(gltf.scene,actor),[gltf.scene,actor.appearanceId,actor.classId]);
  const initialPosition=useRef<[number,number,number]>([actor.position[0],0,-actor.position[1]]);const motionSeen=useRef(actor.motion?.id);const waypoints=useRef<Point[]>([]);useEffect(()=>{if(actor.motion?.id&&actor.motion.id!==motionSeen.current){motionSeen.current=actor.motion.id;waypoints.current=actor.motion.points.map(p=>[...p]);}},[actor.motion?.id]);
  const group=useRef<THREE.Group>(null);const {actions}=useAnimations(gltf.animations,object);
  const originalBounds=useMemo(()=>{const b=new THREE.Box3().setFromObject(gltf.scene);return {height:b.getSize(new THREE.Vector3()).y,size:b.getSize(new THREE.Vector3()),min:b.min.y,center:b.getCenter(new THREE.Vector3())};},[gltf.scene]);
  const modelHeight=actorHeight(actor);
  const breadth=raceBreadth(actor.raceId);
  const bounds={scale:modelHeight/Math.max(.001,originalBounds.height),min:originalBounds.min,center:originalBounds.center};
  const [attacking,setAttacking]=useState(false);const attackSeen=useRef(attackId);useEffect(()=>{if(!attackId||attackId===attackSeen.current)return;attackSeen.current=attackId;setAttacking(true);const t=setTimeout(()=>setAttacking(false),1100);return()=>clearTimeout(t);},[attackId]);
  const [moving,setMoving]=useState(false);const [hit,setHit]=useState(false);const hp=useRef(actor.hp);
  useEffect(()=>{if(actor.hp<hp.current){setHit(true);const t=setTimeout(()=>setHit(false),700);hp.current=actor.hp;return()=>clearTimeout(t);}hp.current=actor.hp;},[actor.hp]);
  useEffect(()=>{const name=animationClip(Object.keys(actions),actor.hp<=0?'death':hit?'hit':attacking?attackCue:moving?'walk':'idle',actor);const a=name?actions[name]:undefined;if(!a)return;a.reset();a.setLoop(attacking||hit||actor.hp<=0?THREE.LoopOnce:THREE.LoopRepeat,attacking||hit||actor.hp<=0?1:Infinity);a.clampWhenFinished=attacking||actor.hp<=0;a.fadeIn(.18).play();if(actor.hp<=0){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}return()=>{a.fadeOut(.18);};},[actions,actor.hp,actor.classId,actor.assetId,hit,moving,attacking,attackCue,attackId]);
  useFrame((_,delta)=>{if(!group.current)return;const target=new THREE.Vector3(actor.position[0],0,-actor.position[1]);const dist=group.current.position.distanceTo(target);if(reduced){group.current.position.copy(target);waypoints.current=[];}else if(waypoints.current.length){const next=advanceMovement([group.current.position.x,-group.current.position.z],waypoints.current,Math.min(delta,.1)*3);group.current.position.set(next.position[0],0,-next.position[1]);waypoints.current=next.remaining;}else group.current.position.lerp(target,Math.min(1,delta*3));const now=dist>.05;if(now!==moving)setMoving(now);const here:Point=[group.current.position.x,-group.current.position.z],kaykit=['guardian','scout','adept','cleric'].includes(actor.classId),walking=now&&!reduced;const goal=walking?yawToward(here,waypoints.current[0]??actor.position):face?yawToward(here,face):actor.side==='enemy'||kaykit?0:Math.PI;const r=group.current.rotation;r.y=reduced?goal:turnToward(r.y,goal,Math.min(1,delta*(walking?6:5)));});
  return <group ref={group} onPointerOver={()=>setHovered(true)} onPointerOut={()=>setHovered(false)} position={initialPosition.current} onClick={e=>{e.stopPropagation();onSelect();}}>
    <group scale={[bounds.scale*breadth,bounds.scale,bounds.scale]} position={[-bounds.center.x*bounds.scale*breadth,-bounds.min*bounds.scale,-bounds.center.z*bounds.scale]}><primitive object={object}/></group>
    {labelMode!=='none'&&<WorldLabelSilhouette id={actor.id} radius={actor.hp<=0?modelHeight*.55:Math.max(.55*breadth,Math.max(originalBounds.size.x*breadth,originalBounds.size.z)*bounds.scale/2)} height={actor.hp<=0?.6:modelHeight}/>}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.015,0]}><ringGeometry args={[actor.classId==='vark'?.65:.4,actor.classId==='vark'?.72:.46,40]}/><meshBasicMaterial color={selected?'#f0ce85':actor.side==='enemy'?'#b95642':'#6aada0'} transparent opacity={selected?.9:.35}/></mesh>
    {showHp&&actor.hp>0&&<HealthBar hp={actor.hp} maxHp={actor.maxHp} enemy={actor.side==='enemy'} height={modelHeight+.3}/>}
    {labelMode==='actor'&&(selected||hovered)&&<WorldLabel actor id={'actor:'+actor.id} text={actor.name} priority={selected?100:60} position={[0,actor.hp<=0?.45:modelHeight+(showHp?.45:.2),0]} onSelect={onSelect}/>}
  </group>;
}
function Character(props:Parameters<typeof CharacterModel>[0]){return <IsolatedAsset url={characterAsset(props.actor)} id={props.actor.id} name={props.actor.name} position={[props.actor.position[0],actorHeight(props.actor)+.2,-props.actor.position[1]]}><CharacterModel {...props}/></IsolatedAsset>;}
function Marker({entity,selected,onSelect}:{entity:Entity,selected:boolean,onSelect:()=>void}){const ring=useRef<THREE.Mesh>(null);useFrame(({clock})=>{if(ring.current)ring.current.rotation.z=clock.elapsedTime*.15;});return <group position={[entity.position[0],0,-entity.position[1]]} onClick={e=>{e.stopPropagation();onSelect();}}>
 {entity.kind==='npc'||entity.id==='index-console'||entity.id.startsWith('infirmary-')||entity.id.startsWith('ink-')?null:entity.kind==='camp'?<><mesh position={[0,.2,0]}><coneGeometry args={[.6,.45,7]}/><meshStandardMaterial color="#735744"/></mesh><Torch position={[0,0,0]}/></>:entity.kind==='trap'?<mesh position={[0,.03,0]}><boxGeometry args={[1.2,.08,1.2]}/><meshStandardMaterial color="#89917a" metalness={.4}/></mesh>:entity.kind==='seal'?<mesh position={[0,.65,0]} rotation={[Math.PI/4,0,Math.PI/4]}><octahedronGeometry args={[.35]}/><meshStandardMaterial color="#87ead3" emissive="#3db499" emissiveIntensity={1.5}/></mesh>:entity.kind==='clue'?<mesh position={[0,.3,0]} castShadow><boxGeometry args={[.75,.6,.55]}/><meshStandardMaterial color="#746047"/></mesh>:entity.kind==='door'||entity.kind==='exit'?<mesh rotation={[-Math.PI/2,0,0]} position={[0,.03,0]}><circleGeometry args={[.5,5]}/><meshBasicMaterial color="#bca26c" transparent opacity={.35}/></mesh>:<mesh position={[0,.5,0]}><cylinderGeometry args={[.22,.3,1,7]}/><meshStandardMaterial color="#6b8067"/></mesh>}
 <mesh ref={ring} rotation={[-Math.PI/2,0,0]} position={[0,.04,0]}><ringGeometry args={[.68,.7,32]}/><meshBasicMaterial color={selected?'#f7d691':'#aca07c'} transparent opacity={selected?1:.35}/></mesh>
 <WorldLabel id={'entity:'+entity.id} text={entity.name} priority={selected?100:20} position={[0,(entity.elevation??0)+(entity.kind==='npc'?2.2:entity.kind==='camp'?1.9:1.1),0]} onSelect={onSelect}/>
 </group>;}
const demoActor=(id:string,classId:Actor['classId'],position:[number,number]):Actor=>({id,name:id==='hero'?'Your character':id==='mira'?'Mira':id==='oren'?'Oren':'Goblin guard',classId,backgroundId:'delver',appearanceId:'ember',side:'party',hp:24,maxHp:24,defense:14,focus:2,maxFocus:2,potions:2,rations:1,attributes:{might:3,agility:1,insight:0,presence:1},position,guard:false,aim:false});
function Scene({onAction,save,selected,onSelect,reduced,heroClass,heroRace,heroAppearance,companions,focus,onFrameTime,roll,cue}:{onAction?:(a:ActionOption)=>void;save:PublicSave|null,selected:string,onSelect:(id:string)=>void,reduced:boolean,heroClass:Actor['classId'],heroRace:Actor['raceId'],heroAppearance:string,companions:{mira:CompanionSetup;oren:CompanionSetup},focus:Speaker|null,onFrameTime:(ms:number)=>void,roll?:WorldRoll|null,cue?:WorldCue|null}){
 const frameSamples=useRef<number[]>([]);useFrame((_,delta)=>{if(document.hidden||delta>.5)return;frameSamples.current.push(delta*1000);if(frameSamples.current.length>=180){const sorted=frameSamples.current.slice().sort((a,b)=>a-b);onFrameTime(sorted[Math.floor(sorted.length*.95)]);frameSamples.current=[];}});
 const {camera}=useThree();const orbit=useRef<ElementRef<typeof OrbitControls>>(null);const cameraMotion=useRef(false),userMoved=useRef(false);const cameraTarget=useRef(new THREE.Vector3(9,12,15));useEffect(()=>{cameraTarget.current.copy(!save?new THREE.Vector3(5,5,8):focus?new THREE.Vector3(6,7,10):new THREE.Vector3(9,12,15));cameraMotion.current=true;},[focus,save?.scene.id]);useFrame((_,delta)=>{if(!cameraMotion.current)return;if(reduced)camera.position.copy(cameraTarget.current);else camera.position.lerp(cameraTarget.current,Math.min(1,delta*3));orbit.current?.update();if(camera.position.distanceTo(cameraTarget.current)<.05)cameraMotion.current=false;});
 const party=save?.party??[{...demoActor('hero',heroClass,[0,1]),raceId:heroRace,appearanceId:heroAppearance},{...demoActor('mira',companions.mira.classId,[-2,2]),...companions.mira},{...demoActor('oren',companions.oren.classId,[2,2]),...companions.oren}];
 const face=useMemo(()=>save?facePoints({party:save.party,enemies:save.enemies,entities:save.scene.entities,combat:save.mode==='combat',selected}):new Map<string,Point>(),[save,selected]);
 const sceneId=save?.scene.id??'approach',room=roomFor(sceneId),mood={...chapterMood(sceneId),...room.mood?.(sceneId)};
 return <><color attach="background" args={[mood.background]}/><fog attach="fog" args={[mood.background,...mood.fog]}/><ambientLight intensity={.65} color={mood.ambient}/><hemisphereLight args={['#b9cec5','#64553b',1.1]}/><directionalLight position={[3,12,5]} intensity={2.5} color={mood.sun} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10}/><room.Room scene={sceneId} save={save} reduced={reduced}/>

 {save?.tactical&&save.mode==='combat'&&<TacticalTerrain grid={save.tactical.grid}/>}
 {save?.tactical&&save.mode==='combat'&&<TacticalOverlay save={save} onAction={onAction}/>}
 {save?.scene.inkGarden&&save.mode!=='combat'&&<InkGarden state={save.scene.inkGarden}/>}
 {save?.scene.infirmary&&save.mode!=='combat'&&<InfirmaryMechanism state={save.scene.infirmary}/>}
 {save?.scene.bellIndex&&save.mode!=='combat'&&<BellIndexConsole state={save.scene.bellIndex}/>}
 {save?.scene.counterweight&&<CounterweightMechanism state={save.scene.counterweight} reduced={reduced} onSelect={()=>onSelect('chain')}/>}
 {party.map(a=><Character key={(save?.scene.id??'creation')+a.id} actor={{...a,name:actorDisplayName(a,save?.enemies??[])}} attackId={latestAnimation(save?.logs??[],a)?.id} attackCue={latestAnimation(save?.logs??[],a)?.cue} face={face.get(a.id)} selected={a.id===selected||save?.turn?.actorId===a.id} onSelect={()=>onSelect(a.id)} reduced={reduced} labelMode={save?'actor':'none'} showHp={save?.mode==='combat'}/>)}
 {save?.scene.entities.filter(e=>e.kind==='npc'&&!(save.enemies.length&&['guards','vark'].includes(e.id))).map(e=><group key={'npc-'+e.id} position={[0,e.elevation??0,0]}><Character actor={{...demoActor(e.id,npcModelClass(e),e.position),name:e.name,side:e.id.startsWith('ally:')||e.id.startsWith('side:')?'party':'enemy',appearanceId:e.appearanceId??'moss'}} face={face.get('npc:'+e.id)} selected={selected===e.id} onSelect={()=>onSelect(e.id)} reduced={reduced} labelMode="entity"/></group>)}
 {save?.scene.id==='cookfire'&&save.scene.entities.some(e=>e.id==='guards')&&save.enemies.length===0&&<Character actor={{...demoActor('guard-extra','goblin',[2.4,2.3]),side:'enemy'}} face={face.get('npc:guards')} selected={false} onSelect={()=>onSelect('guards')} reduced={reduced} labelMode="entity"/>}
 {save?.enemies.map(a=><Character key={(save?.scene.id??'creation')+a.id} actor={{...a,name:actorDisplayName(a,save?.enemies??[])}} attackId={latestAnimation(save?.logs??[],a)?.id} attackCue={latestAnimation(save?.logs??[],a)?.cue} face={face.get(a.id)} selected={a.id===selected||save?.turn?.actorId===a.id} onSelect={()=>onSelect(a.id)} reduced={reduced} showHp={save?.mode==='combat'}/>)}

 {save?.mode!=='combat'&&save?.scene.entities.map(e=><Marker key={save.scene.id+e.id} entity={e} selected={e.id===selected} onSelect={()=>onSelect(e.id)}/>)}
 {save&&roll&&<WorldDie key={'die:'+roll.key} roll={roll} save={save} reduced={reduced}/>}
 {save&&cue&&<CombatCues key={'cue:'+cue.key} cue={cue} save={save} reduced={reduced}/>}
 <ContactShadows opacity={.3} scale={20} blur={2} far={5} resolution={256} color="#050d0b"/>
 <SceneFraming save={save} orbit={orbit} reduced={reduced} userMoved={userMoved}/>
 <PortraitStudio paused={!!(roll||cue)}/>
 <OrbitControls ref={orbit} onStart={()=>{cameraMotion.current=false;userMoved.current=true;}} makeDefault target={save?[0,.4,-.5]:[0,1,-1]} enablePan={false} minDistance={save?12:7} maxDistance={25} minPolarAngle={.45} maxPolarAngle={1.15} enableDamping={!reduced} maxAzimuthAngle={Math.PI*.6} minAzimuthAngle={-Math.PI*.6}/>
 </>;
}
export default function World(props:{onAction?:(a:ActionOption)=>void;save:PublicSave|null,selected:string,onSelect:(id:string)=>void,reduced:boolean,heroClass:Actor['classId'],heroRace:Actor['raceId'],heroAppearance:string,companions:{mira:CompanionSetup;oren:CompanionSetup},focus:Speaker|null,onFrameTime:(ms:number)=>void,roll?:WorldRoll|null,cue?:WorldCue|null}){return <Canvas shadows dpr={[1,1.5]} camera={{position:[9,12,15],fov:43}} gl={{antialias:true}}><WorldLabelProvider muteActors={!!(props.roll||props.cue)}><Scene {...props}/></WorldLabelProvider></Canvas>;}
