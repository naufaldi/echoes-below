import {test} from 'node:test';
import assert from 'node:assert/strict';
import {facePoints,yawToward,turnToward} from '../client/actor-facing.js';
import type {Actor,Entity} from '../shared/types.js';
const actor=(id:string,side:Actor['side'],position:[number,number],hp=10):Actor=>({id,name:id,classId:side==='enemy'?'goblin':'guardian',backgroundId:'delver',appearanceId:'ember',side,hp,maxHp:10,defense:12,focus:0,maxFocus:0,potions:0,rations:0,attributes:{might:0,agility:0,insight:0,presence:0},position,guard:false,aim:false});
const entity=(id:string,kind:Entity['kind'],position:[number,number]):Entity=>({id,name:id,description:'',kind,position} as Entity);
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≈ ${b}`);

test('yaw points a +z-forward model at the target; engine y maps to world −z',()=>{near(yawToward([0,0],[0,-5]),0);near(yawToward([0,0],[0,5]),Math.PI);near(yawToward([0,0],[5,0]),Math.PI/2);near(yawToward([0,0],[-5,0]),-Math.PI/2);});

test('turning takes the short way round and snaps when asked',()=>{near(turnToward(Math.PI-.1,-Math.PI+.1,1),Math.PI+.1);near(turnToward(0,1,.5),.5);near(turnToward(0,Math.PI/2,1),Math.PI/2);});

test('in a fight each side faces its nearest living foe',()=>{const party=[actor('hero','party',[0,0]),actor('mira','party',[3,0])];const enemies=[actor('far','enemy',[0,6]),actor('near','enemy',[3,2]),actor('dead','enemy',[0,1],0)];const face=facePoints({party,enemies,entities:[],combat:true,selected:''});assert.deepEqual(face.get('hero'),[3,2]);assert.deepEqual(face.get('mira'),[3,2]);assert.deepEqual(face.get('near'),[3,0]);assert.deepEqual(face.get('far'),[0,0]);});

test('exploring, the party faces the selected thing, else the nearest person, else into the room — never the camera',()=>{const party=[actor('hero','party',[0,1])];const npc=entity('scrit','npc',[2,4]),door=entity('door','door',[-3,5]);
 assert.deepEqual(facePoints({party,enemies:[],entities:[npc,door],combat:false,selected:'door'}).get('hero'),[-3,5]);
 assert.deepEqual(facePoints({party,enemies:[],entities:[npc,door],combat:false,selected:'hero'}).get('hero'),[2,4]);
 const empty=facePoints({party,enemies:[],entities:[door],combat:false,selected:''}).get('hero')!;near(yawToward([0,1],empty),Math.PI);
 assert.deepEqual(facePoints({party,enemies:[],entities:[npc],combat:false,selected:''}).get('npc:scrit'),[0,1]);});
