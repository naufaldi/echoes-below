import {useRef,useState} from 'react';
import {setAIMode,type AIMode} from './ai-mode';
import {setOwnKey,verifyOwnKey} from './own-ai';

export function usePersonalKey(){
 const[aiMode,updateAIMode]=useState<AIMode>('off'),[ownConnected,setOwnConnected]=useState(false),[keyDraft,setKeyDraft]=useState(''),[keyChecking,setKeyChecking]=useState(false),[keyStatus,setKeyStatus]=useState('');const keyAttempt=useRef(0);
 function reset(status:string){keyAttempt.current++;setKeyChecking(false);setOwnKey('');setOwnConnected(false);setKeyDraft('');setKeyStatus(status);}
 function changeMode(mode:AIMode){if(mode!=='personal')reset('');else{keyAttempt.current++;setKeyChecking(false);setKeyStatus('');}setAIMode(mode);updateAIMode(mode);}
 async function connectPersonalKey(){const attempt=++keyAttempt.current;const candidate=keyDraft.trim();setKeyChecking(true);setKeyStatus('Checking OpenAI access…');setOwnKey('');setOwnConnected(false);try{await verifyOwnKey(candidate);if(attempt!==keyAttempt.current)return;setOwnKey(candidate);setOwnConnected(true);setKeyDraft('');setKeyStatus('Connected successfully for this visit. Dialogue is ready. Reloading clears your key.');}catch(e){if(attempt===keyAttempt.current)setKeyStatus(e instanceof Error?e.message:'Connection failed. Try again.');}finally{if(attempt===keyAttempt.current)setKeyChecking(false);}}
 return {aiMode,ownConnected,keyDraft,setKeyDraft,keyChecking,keyStatus,reset,changeMode,connectPersonalKey};
}
