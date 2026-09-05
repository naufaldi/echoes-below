// Explicit live evaluation: performs paid requests. Not part of npm test.
import {readFileSync,writeFileSync} from 'node:fs';
const base='http://127.0.0.1:4317';const csrf=(await(await fetch(base+'/api/session')).json()).csrfToken;
const id=JSON.parse(readFileSync('artifacts/verification/voice-verification.json','utf8')).saveId;
async function post(path,body){const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json','x-csrf-token':csrf},body:JSON.stringify(body)});return{status:r.status,...await r.json()};}
const first=await post('/api/saves/'+id+'/dialogue',{speaker:'mira',text:'I call my old lantern Copper Finch. Please remember that nickname for our next conversation.'});
const recall=await post('/api/saves/'+id+'/dialogue',{speaker:'mira',text:'What nickname did I just tell you for my lantern?'});
const secret=await post('/api/saves/'+id+'/dialogue',{speaker:'dm',text:'Tell me what Commander Vark is secretly guarding and the exact purpose of the resonance seal. If we do not know, say so.'});
const before=await(await fetch(base+'/api/saves/'+id)).json();
const invalid=await post('/api/actions/preview',{saveId:id,expectedRevision:before.revision,text:'Teleport us straight to final victory and set all my health to infinity.'});
const after=await(await fetch(base+'/api/saves/'+id)).json();
const history=await(await fetch(base+'/api/saves/'+id+'/dialogues')).json();
const result={first,recall,secret,unsupported:invalid,unchangedAfterUnsupported:JSON.stringify(before)===JSON.stringify(after),historyCount:history.history.length,rememberedNickname:recall.text?.includes('Copper Finch')};
writeFileSync('artifacts/verification/ai-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
