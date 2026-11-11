import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Group,Object3D} from 'three';
import {registerRangedSocket,rangedPresentation} from '../client/rogue-preview.js';
test('release metadata and animated socket are sampled in world coordinates, not actor centre',()=>{
 const world=new Group(),model=new Group(),socket=new Object3D();socket.name='Arrow_Release';model.userData.rangedReleaseSeconds=38/48;model.add(socket);world.add(model);world.position.set(3,0,2);model.scale.setScalar(2);socket.position.set(1,1,0);
 const cleanup=registerRangedSocket('qa',model);assert.equal(rangedPresentation('qa').releaseSeconds,38/48);assert.deepEqual(rangedPresentation('qa').origin()?.toArray(),[5,2,2]);socket.position.x=2;assert.deepEqual(rangedPresentation('qa').origin()?.toArray(),[7,2,2]);cleanup();assert.equal(rangedPresentation('qa').releaseSeconds,0);assert.equal(rangedPresentation('qa').origin(),undefined);
});
test('old model cleanup never removes newer model registration for same actor',()=>{const a=new Group(),b=new Group();b.userData.rangedReleaseSeconds=.5;const ca=registerRangedSocket('qa',a),cb=registerRangedSocket('qa',b);ca();assert.equal(rangedPresentation('qa').releaseSeconds,.5);cb();});

import {animationClip} from '../shared/animation-cues.js';
test('prototype canonical clips resolve and shipped names remain fallbacks',()=>{const names=['Bow_Shoot','Idle','Walk','Attack_Melee','Hit','Dodge','Death','Use_Item'];for(const [state,name] of [['idle','Idle'],['walk','Walk'],['ranged','Bow_Shoot'],['melee','Attack_Melee'],['hit','Hit'],['dodge','Dodge'],['death','Death'],['item','Use_Item']] as const)assert.equal(animationClip(names,state,{classId:'scout'}),name);assert.equal(animationClip(['Attack_Melee','1H_Melee_Attack_Slice_Diagonal'],'melee',{classId:'scout'}),'Attack_Melee');assert.equal(animationClip(['Attack_Ranged','Bow_Shoot'],'ranged',{classId:'scout'}),'Attack_Ranged');assert.equal(animationClip(['1H_Melee_Attack_Slice_Diagonal'],'melee',{classId:'scout'}),'1H_Melee_Attack_Slice_Diagonal');});

import {Mesh,MeshStandardMaterial,BoxGeometry,Color} from 'three';
import {dressCharacter} from '../client/character-dress.js';
test('contract palette recolours only Accent and never modifies original materials',()=>{
 const g=new Group(),accent=new MeshStandardMaterial({color:'#ffffff'}),body=new MeshStandardMaterial({color:'#9a7359'});accent.name='Accent';body.name='Body';g.add(new Mesh(new BoxGeometry(),[accent,body]));const dressed=dressCharacter(g,{classId:'scout',appearanceId:'moss'},true);const [a,b]=(dressed.children[0] as Mesh).material as MeshStandardMaterial[];assert.equal(a.color.getHexString(),new Color('#bdd3ac').getHexString());assert.equal(b.color.getHexString(),body.color.getHexString());assert.equal(accent.color.getHexString(),'ffffff');assert.notEqual(a,accent);assert.notEqual(b,body);
});
