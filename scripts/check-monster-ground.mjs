import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {AnimationMixer,Box3,LoopOnce} from 'three';
// Geometry-only audit: texture pixels do not affect vertex positions.
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});globalThis.ProgressEvent=class{constructor(type,data){this.type=type;Object.assign(this,data);}};
const bytes=readFileSync(new URL('../public/assets/quaternius/Imp-animated.glb',import.meta.url));
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const sample=()=>{gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(n=>{if(n.isSkinnedMesh){n.skeleton.update();n.computeBoundingBox();}});const box=new Box3().setFromObject(gltf.scene);return{min:box.min.toArray(),max:box.max.toArray()};};
const standing=sample();const mixer=new AnimationMixer(gltf.scene);const clip=gltf.animations.find(a=>a.name==='Death');const action=mixer.clipAction(clip);action.setLoop(LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.update(clip.duration);const fallen=sample();
console.log(JSON.stringify({standing,fallen,height:standing.max[1]-standing.min[1],fallenClearance:fallen.min[1]-standing.min[1]},null,2));
if(Math.abs(fallen.min[1]-standing.min[1])>.02)throw new Error('Death pose must contact the same ground plane within 2 cm of source-model units.');
