import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {outcomeCue,parseAudioSettings,musicModeFor,sceneCues,DEFAULT_AUDIO_SETTINGS} from '../client/audio-cues.js';
import type {PublicSave} from '../shared/types.js';

const actor=(id:string,hp:number,position:[number,number]=[0,0])=>({id,hp,position}) as any;
const room=(sceneId:string,party:any[],entities:any[]=[],id='save-1')=>({id,scene:{id:sceneId,entities},party,enemies:[]}) as unknown as PublicSave;
test('a revealed frame sounds a hit on any health loss, else a miss only for the word miss',()=>{
 assert.equal(outcomeCue([actor('goblin',7)],[actor('goblin',3)],'The blade lands.'),'hit');
 assert.equal(outcomeCue([actor('hero',10)],[actor('hero',10)],'The goblin misses Alden.'),'miss');
 assert.equal(outcomeCue([actor('hero',10)],[actor('hero',10)],'Your swing missed.'),'miss');
 assert.equal(outcomeCue([actor('hero',10)],[actor('hero',10)],'You dismiss the warning.'),null);
 assert.equal(outcomeCue([actor('hero',10)],[actor('hero',12)],'Mira drinks a potion.'),null);
 assert.equal(outcomeCue([],[actor('goblin',7)],'A goblin appears.'),null);
});
test('audio settings are clamped, defaulted and survive corrupt storage',()=>{
 assert.deepEqual(parseAudioSettings(null),DEFAULT_AUDIO_SETTINGS);
 assert.deepEqual(parseAudioSettings('{not json'),DEFAULT_AUDIO_SETTINGS);
 assert.deepEqual(parseAudioSettings(JSON.stringify({master:2,music:-1,sfx:.3,muted:true})),{master:1,music:0,sfx:.3,muted:true});
 assert.equal(parseAudioSettings(JSON.stringify({muted:'yes'})).muted,false);
});
test('music follows mode and room cues stay within one save and room',()=>{
 assert.equal(musicModeFor(null),'silent');assert.equal(musicModeFor({mode:'combat'}),'combat');assert.equal(musicModeFor({mode:'explore'}),'explore');assert.equal(musicModeFor({mode:'defeat'}),'calm');
 const a=room('approach',[actor('hero',10,[0,0])],[{id:'gate',kind:'door',open:false}]);
 assert.deepEqual(sceneCues(null,a),[]);
 assert.deepEqual(sceneCues(a,room('hall',[actor('hero',10,[5,5])])),['door-open']);
 assert.deepEqual(sceneCues(a,room('hall',[actor('hero',10,[5,5])],[],'save-2')),[]);
 assert.deepEqual(sceneCues(a,room('approach',[actor('hero',10,[1,0])],[{id:'gate',kind:'door',open:true}])),['door-open','footstep']);
 assert.deepEqual(sceneCues(a,room('approach',[actor('hero',9,[0,0])],[{id:'gate',kind:'door',open:false}])),[]);
});
test('every audio author is credited in game and in the README',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/assets/audio/manifest.json',import.meta.url),'utf8'));
 const app=readFileSync(new URL('../client/App.tsx',import.meta.url),'utf8'),readme=readFileSync(new URL('../README.md',import.meta.url),'utf8');
 for(const f of manifest.files){const author=f.author.replace(/ \(.*\)$/,'');assert.ok(app.includes(author)&&readme.includes(author),author);}
 for(const f of manifest.files.filter((f:any)=>f.licence==='CC-BY-4.0'))assert.ok(app.includes(f.title)&&app.includes('CC-BY 4.0')&&readme.includes(f.title),f.title);
});
