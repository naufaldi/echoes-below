import {useEffect,useRef,useState} from 'react';
import {SessionBoundary} from './session';
import {wavRecording} from './own-ai';
import {api} from './api';

export function useRecorder({saveId,busy,stopVoice,onText,onError}:{saveId:string|undefined;busy:string;stopVoice:()=>void;onText:(text:string)=>void;onError:(message:string)=>void}){
 const session=useRef(new SessionBoundary()),recorder=useRef<MediaRecorder|null>(null);const[recording,setRecording]=useState(false),[transcribing,setTranscribing]=useState(false);
 useEffect(()=>()=>session.current.invalidate(),[]);
 function cancelRecording(){session.current.invalidate();recorder.current=null;setRecording(false);setTranscribing(false);}
 async function record(){
  if(recording){if(recorder.current?.state==='recording')recorder.current.stop();else cancelRecording();return;}
  if(!saveId||busy||transcribing)return;
  const owner=session.current;owner.invalidate();const generation=owner.capture();
  setRecording(true);stopVoice();
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});
   if(!owner.current(generation)){stream.getTracks().forEach(t=>t.stop());return;}
   owner.own(()=>stream.getTracks().forEach(t=>t.stop()));
   const type=['audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
   if(!type){stream.getTracks().forEach(t=>t.stop());throw new Error('Your browser cannot record supported audio. Please type your action.');}
   const r=new MediaRecorder(stream,{mimeType:type}),chunks:Blob[]=[];const started=Date.now();recorder.current=r;
   let timer:ReturnType<typeof setTimeout>;
   const release=()=>{clearTimeout(timer);stream.getTracks().forEach(t=>t.stop());};
   owner.own(()=>{r.onstop=null;r.ondataavailable=null;if(r.state==='recording')r.stop();release();});
   r.ondataavailable=e=>chunks.push(e.data);
   r.onstop=async()=>{
    release();if(!owner.current(generation))return;const durationSeconds=Math.min(30,(Date.now()-started)/1000);recorder.current=null;setRecording(false);setTranscribing(true);
    try{
     const buffer=await wavRecording(new Blob(chunks,{type}));
     if(!owner.current(generation))return;
     let str='';for(let i=0;i<buffer.length;i++)str+=String.fromCharCode(buffer[i]);
     await owner.deliver(generation,()=>api<{text:string}>('/api/transcriptions',{saveId,audioBase64:btoa(str),mimeType:'audio/wav',durationSeconds}),d=>onText(d.text));
    }catch(e){if(owner.current(generation))onError(e instanceof Error?e.message:'Transcription unavailable. You can type instead.');}
    finally{if(owner.current(generation))setTranscribing(false);}
   };
   r.start();timer=setTimeout(()=>{if(r.state==='recording')r.stop();},30000);
  }catch(e){if(owner.current(generation)){owner.invalidate();setRecording(false);onError(e instanceof Error?e.message:'Microphone unavailable. You can type instead.');}}
 }
 return {recording,transcribing,cancelRecording,record};
}
