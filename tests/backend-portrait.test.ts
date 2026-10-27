import {test} from 'node:test';
import assert from 'node:assert/strict';
import {portraitLook,portraitKey,resolveOverride,manifestFiles,expressionClip,portraitSubjectFor,npcModelClass} from '../client/portrait-look.js';
import type {Actor,Entity} from '../shared/types.js';
const actor=(patch:Partial<Actor>={}):Actor=>({id:'hero',name:'Ash',classId:'guardian',backgroundId:'delver',appearanceId:'ember',side:'party',hp:24,maxHp:24,defense:14,focus:2,maxFocus:2,potions:2,rations:1,attributes:{might:3,agility:1,insight:0,presence:1},position:[0,0],guard:false,aim:false,...patch} as Actor);
const key=(patch:Partial<Actor>={})=>portraitKey(portraitLook(actor(patch)));
test('portrait cache key changes with the look and only the look',()=>{
 const base=key();
 for(const patch of [{classId:'cleric'},{classId:'adept'},{raceId:'dwarf'},{appearanceId:'moss'},{assetId:'mage'}] as Partial<Actor>[])assert.notEqual(key(patch),base,JSON.stringify(patch));
 for(const patch of [{hp:3},{name:'Other'},{id:'oren'},{position:[4,4]},{focus:0}] as Partial<Actor>[])assert.equal(key(patch),base,JSON.stringify(patch));
 assert.equal(key({raceId:'human'}),base,'a missing race is the human default');
 assert.notEqual(portraitKey(portraitLook(actor()),'worried'),base);
 assert.match(base,/\/assets\/kaykit\/Knight\.glb/);
});
test('painted overrides replace one character and expression, then fall back to neutral, then the render',()=>{
 const files=manifestFiles({files:[{file:'mira-neutral.png',sha256:'x'},{file:'mira-worried.png'},'oren-smile.png',{file:'../escape.png'},{file:'hero-neutral.png'},{file:'scrit-sad.png'},{file:'ilyra-neutral.png'}]});
 assert.equal(resolveOverride('mira','worried',files),'/assets/portraits/mira-worried.png');
 assert.equal(resolveOverride('mira','angry',files),'/assets/portraits/mira-neutral.png');
 assert.equal(resolveOverride('mira','neutral',files),'/assets/portraits/mira-neutral.png');
 assert.equal(resolveOverride('oren','neutral',files),null,'an expression without neutral does not stand in for neutral');
 assert.equal(resolveOverride('oren','smile',files),'/assets/portraits/oren-smile.png');
 assert.equal(resolveOverride('vark','neutral',files),null);
 assert.equal(resolveOverride('hero','neutral',files),null,'the hero always uses the render');
 assert.equal(resolveOverride('index-librarian','hurt',files),'/assets/portraits/ilyra-neutral.png');
 assert.ok(!files.has('../escape.png')&&!files.has('scrit-sad.png'));
 assert.deepEqual([...manifestFiles(null)],[]);assert.deepEqual([...manifestFiles({files:'x'})],[]);
 assert.equal(resolveOverride('mira','neutral',['mira-neutral.png']),'/assets/portraits/mira-neutral.png');
});
test('expression poses use the dialogue clips when present',()=>{
 assert.equal(expressionClip(['Idle','Talk'],'neutral'),undefined,'neutral is the idle pose');
 assert.equal(expressionClip(['Armature|Worried'],'worried'),'Armature|Worried');
 assert.equal(expressionClip(['Idle','Nod'],'smile'),'Nod');
});
test('speaker portraits follow the party, enemies and scene NPCs',()=>{
 const npc=(patch:Partial<Entity>):Entity=>({id:'courier',name:'Courier',kind:'npc',position:[0,0],description:'',...patch} as Entity);
 const save={party:[actor(),actor({id:'mira',classId:'scout',appearanceId:'moss'})],enemies:[actor({id:'goblin-1',classId:'goblin',side:'enemy'})],scene:{entities:[npc({}),npc({id:'index-librarian',modelClassId:'guardian',appearanceId:'bronze'})]}};
 assert.equal(portraitSubjectFor('mira',save)?.classId,'scout');
 assert.equal(portraitSubjectFor('goblin-1',save)?.classId,'goblin');
 assert.deepEqual(portraitSubjectFor('courier',save),{id:'courier',classId:'scout',appearanceId:'moss'});
 assert.equal(portraitSubjectFor('index-librarian',save)?.appearanceId,'bronze');
 assert.equal(portraitSubjectFor('nobody',save),null);
 assert.equal(npcModelClass({id:'vark'}),'vark');assert.equal(npcModelClass({id:'scrit'}),'goblin');
});
