import {useEffect,useState} from 'react';
import {Dialog} from './Modal';
import QuestJournal from './QuestJournal';
import StoryBoxBacklog from './StoryBoxBacklog';
import {api} from './api';
import type {PublicSave,Speaker,Dialogue,ActionOption} from '../shared/types';

export default function JournalDialog({open,save,dialogue,aiReady,onClose,onChoose,speak}:{open:boolean;save:PublicSave|null;dialogue:Dialogue|null;aiReady:boolean;onClose:()=>void;onChoose:(action:ActionOption)=>void;speak:(dialogue:Dialogue)=>void}){
 const[history,setHistory]=useState<{id:string;playerText:string;replyText:string;createdAt:string;speaker:Speaker}[]>([]);
 useEffect(()=>{if(open&&save)api<{history:typeof history}>('/api/saves/'+save.id+'/dialogues').then(d=>setHistory(d.history)).catch(()=>setHistory([]));},[open,save?.id,dialogue]);
 if(!open)return null;
 return <Dialog className="journal" label="Adventure journal" onClose={onClose}><button data-autofocus aria-label="Close journal" className="close" onClick={onClose}>×</button><h2>Your journal</h2>{save?<><QuestJournal save={save} onChoose={onChoose}/><h3>Discoveries</h3>{save.facts.length?save.facts.map(f=><p key={f.id} className="fact">◇ {f.text}</p>):<p className="muted">Your discoveries will be written here.</p>}<h3>Conversations</h3>{history.length?history.map(h=><div key={h.id} className="conversation-entry">{h.playerText&&<p><b>You:</b> {h.playerText}</p>}<p><b>{h.speaker.toUpperCase()}:</b> {h.replyText}</p><button disabled={!aiReady} title={!aiReady?'Enable an AI mode in settings to play voice':undefined} onClick={()=>speak({id:h.id,speaker:h.speaker,text:h.replyText,source:'ai',createdAt:h.createdAt})}>▷ Listen again</button></div>):<p className="muted">Your conversations appear here after you talk to the party.</p>}<StoryBoxBacklog save={save}/></>:<p>Begin your descent to write the first page.</p>}</Dialog>;
}
