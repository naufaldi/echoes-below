import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='http://127.0.0.1:4317';
const csrf=(await(await fetch(base+'/api/session')).json()).csrfToken;
async function req(path,body){const start=performance.now();const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-csrf-token':csrf},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw new Error(JSON.stringify({path,status:r.status,data}));return{data,ms:Math.round(performance.now()-start)};}
const save=(await req('/api/saves',{name:'Voice verification',classId:'adept',backgroundId:'envoy',appearanceId:'moon'})).data;
const dialogue=await req('/api/saves/'+save.id+'/dialogue',{speaker:'dm',text:'Describe the bell and our arrival in one short sentence under fifteen words.'});
const speech=await req('/api/narrations/'+dialogue.data.id+'/audio',{});
const mp3=Buffer.from(await(await fetch(base+speech.data.url)).arrayBuffer());
writeFileSync('artifacts/verification/voice-sample.mp3',mp3);
execFileSync('/usr/bin/afconvert',['-f','WAVE','-d','LEI16','artifacts/verification/voice-sample.mp3','artifacts/verification/voice-sample.wav']);
const {readFileSync}=await import('node:fs');
const transcription=await req('/api/transcriptions',{saveId:save.id,audioBase64:readFileSync('artifacts/verification/voice-sample.wav').toString('base64'),mimeType:'audio/wav',durationSeconds:15});
const replay=await req('/api/narrations/'+dialogue.data.id+'/audio',{});
const usage=(await req('/api/usage?saveId='+save.id)).data;
const result={saveId:save.id,dialogue:dialogue.data.text,transcription:transcription.data.text,dialogueMs:dialogue.ms,speechMs:speech.ms,transcriptionMs:transcription.ms,cachedReplayMs:replay.ms,audioBytes:mp3.length,usage};
writeFileSync('artifacts/verification/voice-verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
