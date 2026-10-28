import {useEffect,useRef,useSyncExternalStore} from 'react';
import {musicModeFor,outcomeCue,parseAudioSettings,sceneCues,type AudioSettings,type MusicMode,type NaturalEvent,type Sfx} from './audio-cues';
import type {PublicSave,PresentationFrame} from '../shared/types';

/** Music, ambience and SFX. Nothing is created or fetched until the first pointer/key gesture; voice stays an HTMLAudioElement owned by App. */
const KEY='echoes-audio',BASE='/assets/audio/',FADE=1.6,DUCK=.3;
const SFX:Record<Sfx,{files:string[];level:number}>={'dice-shake':{files:['sfx/dice-shake.m4a'],level:.7},'die-throw':{files:['sfx/die-throw.m4a'],level:.9},hit:{files:['sfx/hit-1.m4a','sfx/hit-2.m4a'],level:.9},miss:{files:['sfx/miss.m4a'],level:.8},footstep:{files:[1,2,3,4].map(i=>`sfx/footstep-${i}.m4a`),level:.35},'door-open':{files:['sfx/door-open.m4a'],level:.7},'ui-click':{files:['sfx/ui-click.m4a'],level:.5}};
type Loop='explore'|'combat'|'ambience';
const LOOPS:Record<Loop,string>={explore:'music/exploration-in-darkness.m4a',combat:'music/combat-determined-pursuit.m4a',ambience:'ambience/dungeon-ambience.m4a'};
const MIX:Record<MusicMode,Record<Loop,number>>={silent:{explore:0,combat:0,ambience:0},explore:{explore:.55,combat:0,ambience:.8},combat:{explore:0,combat:.6,ambience:.35},calm:{explore:0,combat:0,ambience:.6}};

let settings:AudioSettings=(()=>{try{return parseAudioSettings(localStorage.getItem(KEY));}catch{return parseAudioSettings(null);}})();
const listeners=new Set<()=>void>(),voices=new Set<HTMLAudioElement>();
let graph:{ctx:AudioContext;master:GainNode;music:GainNode;sfx:GainNode}|null=null,mode:MusicMode='silent',ducked=false,stepsUntil=0;
const loops=new Map<Loop,{el:HTMLAudioElement;gain:GainNode;stop?:ReturnType<typeof setTimeout>}>(),buffers=new Map<string,Promise<AudioBuffer|null>>();

const ramp=(param:AudioParam,value:number,seconds:number)=>{const now=graph!.ctx.currentTime;param.cancelScheduledValues(now);param.setValueAtTime(param.value,now);param.linearRampToValueAtTime(value,now+seconds);};
function applyLevels(){
 voices.forEach(el=>el.volume=voiceVolume());
 if(!graph)return;ramp(graph.master.gain,settings.muted?0:settings.master,.08);ramp(graph.music.gain,settings.music*(ducked?DUCK:1),ducked?.25:.8);ramp(graph.sfx.gain,settings.sfx,.08);
}
function applyMode(){
 if(!graph)return;
 for(const loop of Object.keys(LOOPS) as Loop[]){
  const target=MIX[mode][loop];let track=loops.get(loop);
  if(!track){if(!target)continue;const el=new Audio(BASE+LOOPS[loop]);el.loop=true;const gain=graph.ctx.createGain();gain.gain.value=0;graph.ctx.createMediaElementSource(el).connect(gain).connect(graph.music);track={el,gain};loops.set(loop,track);}
  clearTimeout(track.stop);ramp(track.gain.gain,target,FADE);
  if(target){if(track.el.paused)track.el.play().catch(()=>{});}else{const t=track;t.stop=setTimeout(()=>t.el.pause(),FADE*1000+100);}
 }
}
function buffer(file:string){
 let pending=buffers.get(file);
 if(!pending){pending=fetch(BASE+file).then(r=>{if(!r.ok)throw Error(r.statusText);return r.arrayBuffer();}).then(bytes=>graph!.ctx.decodeAudioData(bytes)).catch(()=>{console.warn('Sound unavailable:',file);return null;});buffers.set(file,pending);}
 return pending;
}
function unlock(){
 if(graph)return;removeEventListener('pointerdown',unlock,true);removeEventListener('keydown',unlock,true);
 try{
  const ctx=new AudioContext(),master=ctx.createGain(),music=ctx.createGain(),sfx=ctx.createGain();
  master.gain.value=0;music.gain.value=0;sfx.gain.value=0;music.connect(master);sfx.connect(master);master.connect(ctx.destination);
  graph={ctx,master,music,sfx};void ctx.resume().catch(()=>{});
 }catch{return;}
 applyLevels();applyMode();for(const cue of Object.values(SFX))cue.files.forEach(buffer);
}
if(typeof window!=='undefined'){addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);
 // Primary buttons click, whether pressed by pointer or keyboard.
 document.addEventListener('click',e=>{const b=(e.target as Element|null)?.closest?.('button.primary,button.action');if(b&&!(b as HTMLButtonElement).disabled)playSfx('ui-click');},true);}

export function playSfx(cue:Sfx,delay=0){
 if(!graph||settings.muted||!settings.sfx)return;
 if(cue==='footstep'){const now=graph.ctx.currentTime;if(now<stepsUntil)return;stepsUntil=now+.95;for(let i=0;i<3;i++)play(cue,i*.32);return;}
 play(cue,delay);
}
function play(cue:Sfx,delay:number){
 const {files,level}=SFX[cue],g=graph!;
 void buffer(files[Math.floor(Math.random()*files.length)]).then(data=>{if(!data||graph!==g)return;const source=g.ctx.createBufferSource(),gain=g.ctx.createGain();source.buffer=data;gain.gain.value=level;source.connect(gain).connect(g.sfx);source.start(g.ctx.currentTime+delay);});
}
/** Synthesised, so no new download enters the asset bundle: a natural 20 rings a bright two-partial chime; a natural 1 is a low knock with a short burst of grit, like stone cracking. */
export function playNatural(event:NaturalEvent){
 if(!graph||settings.muted||!settings.sfx)return;const {ctx,sfx}=graph,now=ctx.currentTime;
 const voice=(type:OscillatorType,from:number,to:number,peak:number,length:number,at=0)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(from,now+at);o.frequency.exponentialRampToValueAtTime(to,now+at+length);g.gain.setValueAtTime(0,now+at);g.gain.linearRampToValueAtTime(peak,now+at+.008);g.gain.exponentialRampToValueAtTime(.0001,now+at+length);o.connect(g).connect(sfx);o.start(now+at);o.stop(now+at+length+.02);};
 if(event==='natural-20'){voice('sine',1318.5,1318.5,.22,1.1);voice('sine',1975.5,1975.5,.12,.8,.06);voice('triangle',659.3,659.3,.1,.6);return;}
 voice('sine',110,55,.5,.35);
 const grit=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.12),ctx.sampleRate),data=grit.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length)**3;
 const noise=ctx.createBufferSource(),band=ctx.createBiquadFilter(),g=ctx.createGain();noise.buffer=grit;band.type='bandpass';band.frequency.value=1800;band.Q.value=.9;g.gain.value=.35;noise.connect(band).connect(g).connect(sfx);noise.start(now+.02);
}
/** Dice and outcome sounds for one committed playback frame; the baseline is the state shown before this frame. */
export function playFrameCues(stage:'start'|'reveal',frame:PresentationFrame,baseline:Pick<PublicSave,'party'|'enemies'>){
 if(stage==='start'){if(frame.log.rolls.length)playSfx('dice-shake');return;}
 if(frame.log.rolls.length)playSfx('die-throw');
 const outcome=outcomeCue([...baseline.party,...baseline.enemies],[...frame.party,...frame.enemies],frame.log.text);if(outcome)playSfx(outcome,frame.log.rolls.length?.18:0);
}
export function voiceVolume(){return settings.muted?0:settings.voice*settings.master;}
/** Keeps an AI voice line under its own level, master volume and mute, including changes made while it plays. */
export function bindVoice(el:HTMLAudioElement){if(!voices.has(el))['pause','ended','error'].forEach(type=>el.addEventListener(type,()=>voices.delete(el),{once:true}));voices.add(el);el.volume=voiceVolume();}
export function setAudioSettings(patch:Partial<AudioSettings>){settings=parseAudioSettings(JSON.stringify({...settings,...patch}));try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}applyLevels();listeners.forEach(l=>l());}
export function useAudioSettings(){return useSyncExternalStore(l=>{listeners.add(l);return()=>listeners.delete(l);},()=>settings);}
/** Music follows the save's mode with a crossfade, ducks under a voice line, and room changes play their cues. */
export function useGameAudio(save:PublicSave|null,speaking:boolean){
 const previous=useRef<PublicSave|null>(null),next=musicModeFor(save);
 useEffect(()=>{mode=next;applyMode();},[next]);
 useEffect(()=>{ducked=speaking;applyLevels();},[speaking]);
 useEffect(()=>{for(const cue of sceneCues(previous.current,save))playSfx(cue);previous.current=save;},[save]);
}
