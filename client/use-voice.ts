import {useCallback,useEffect,useRef,useState} from 'react';
import {ownKeyConfigured,ownAudio} from './own-ai';
import {api} from './api';
import {bindVoice} from './audio';
import {automaticVoiceAllowed} from './session';
import type {Dialogue} from '../shared/types';

export function useVoice({onError}:{onError:(message:string)=>void}){
 const[voice,setVoice]=useState(()=>localStorage.getItem('echoes-voice')!=='off'),[speaking,setSpeaking]=useState(false);const voiceEnabled=useRef(voice),voiceGeneration=useRef(0),audio=useRef<HTMLAudioElement|null>(null);
 useEffect(()=>{try{localStorage.setItem('echoes-voice',voice?'on':'off');}catch{/* blocked storage: this visit only */}},[voice]);
 useEffect(()=>()=>{voiceGeneration.current++;audio.current?.pause();},[]);
 const stopVoice=useCallback(()=>{voiceGeneration.current++;audio.current?.pause();if(audio.current?.src.startsWith('blob:'))URL.revokeObjectURL(audio.current.src);setSpeaking(false);},[]);
 async function speak(d:Dialogue){stopVoice();const generation=voiceGeneration.current;try{setSpeaking(true);const a=ownKeyConfigured()?{url:await ownAudio(d.text,d.speaker)}:await api<{url:string}>('/api/narrations/'+d.id+'/audio',{});if(generation!==voiceGeneration.current){if(a.url.startsWith('blob:'))URL.revokeObjectURL(a.url);return;}const el=new Audio(a.url);bindVoice(el);audio.current=el;el.onended=()=>{setSpeaking(false);if(a.url.startsWith('blob:'))URL.revokeObjectURL(a.url);};el.onerror=()=>{setSpeaking(false);onError('Voice playback failed. The dialogue is still available to read.');};await el.play();}catch(e){if(generation!==voiceGeneration.current)return;setSpeaking(false);onError(e instanceof Error?e.message:'Voice unavailable.');}}
 const generation=()=>voiceGeneration.current,autoAllowed=(gen:number)=>automaticVoiceAllowed(voiceEnabled.current,gen,voiceGeneration.current);
 const onVoice=(on:boolean)=>{voiceEnabled.current=on;setVoice(on);if(!on)stopVoice();};
 return {voice,speaking,stopVoice,speak,generation,autoAllowed,onVoice};
}
