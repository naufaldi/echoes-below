import ConfirmCard from './ConfirmCard';
import CreationScreen from './CreationScreen';
import PartyPanel,{PartyExtras} from './PartyPanel';
import TurnOrder from './TurnOrder';
import JournalDialog from './JournalDialog';
import ActionPanel from './ActionPanel';
import {confirmationFor} from './confirmation';
import {naturalEvent,type NaturalEvent} from './audio-cues';
import StoryBox,{storyKey} from './StoryBox';
import {answersStory} from './action-focus';
import {continuesTurn,TURN_CHAIN_LIMIT} from './turn-chain';
import {useBarks} from './use-barks';
import PackPanel from './PackPanel';
import DescentMap,{MapIcon,useMapKey} from './DescentMap';
import {CHAPTER_ONE} from './descent-map';
import EndingPage from './EndingPage';
import ChapterPages,{StoryView,useChapterPage} from './ChapterPage';
import {Overlay} from './Modal';
import {readMotion,reducedMotion,MOTION_KEY,type MotionChoice} from './motion-choice';
import {useOSReducedMotion} from './NarrativePassage';
import {useNarrow} from './narrow-layout';
import {type AIMode} from './ai-mode';
import {usePlaytest} from './use-playtest';
import {useGameTools} from './webmcp';
import {useVoice} from './use-voice';
import {useRecorder} from './use-recorder';
import {usePersonalKey} from './use-personal-key';
import {CAMPAIGN_MAP as EXPEDITION,campaignRoom as expeditionRoom} from '../shared/campaign-map';
import {Component,useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import World from './World';
import {chapterMood} from './ChapterAtmosphere';
import type {WorldRoll} from './WorldDie';
import type {WorldCue} from './CombatCues';
import {TurnPlayback} from './TurnPlayback';
import {useGameAudio,playNatural} from './audio';
import SettingsPanel from './SettingsPanel';
import DebugPanel from './DebugPanel';
import Onboarding from './Onboarding';
import {guideDue,guideSeen,markGuideSeen,oddsSample} from './guide';
import {useReading} from './use-reading';
import {api,ApiFailure,offline,movedOn} from './api';
import type {PublicSave,ClassId,BackgroundId,ActionOption,Dialogue,Preview,Speaker,RaceId,CompanionSetup} from '../shared/types';

const chapters=CHAPTER_ONE.map(r=>r.title);
class SceneBoundary extends Component<{children:ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return{error:true};}render(){return this.state.error?<div className="scene-failure">The 3D scene could not load. Your save is safe. Reload the page to retry.</div>:this.props.children;}}
export default function App(){
 const[save,setSave]=useState<PublicSave|null>(null),[saves,setSaves]=useState<{id:string;name:string;sceneTitle:string;mode:string}[]>([]),[ready,setReady]=useState(false),[aiConfigured,setAIConfigured]=useState(false);
 const[hosted,setHosted]=useState(false);
 const {aiMode,ownConnected,keyDraft,setKeyDraft,keyChecking,keyStatus,reset,changeMode,connectPersonalKey}=usePersonalKey();
 const[playback,setPlayback]=useState<{before:PublicSave;after:PublicSave}|null>(null),[worldRoll,setWorldRoll]=useState<WorldRoll|null>(null),[worldCue,setWorldCue]=useState<WorldCue|null>(null);
 const playbackDone=useRef<(()=>void)|null>(null);
 /** The last passage read to its end (#96), and the passage a commit in this visit ended a chapter on: replies and the chapter card wait for them. */
 const[readKey,setReadKey]=useState(''),[closing,setClosing]=useState('');
 /** The last committed action as a before/after pair, for companion barks (#67); set before its playback starts. */
 const[turnPair,setTurnPair]=useState<{before:PublicSave;after:PublicSave}|null>(null);const {autoAdvance}=useReading();
 /** The journal opened from the story box scrolls to the backlog; focus returns to the story box when it closes. */
 const backlogFocus=useRef(false),keyState=useRef({save:false,blocked:false});
 const[companions,setCompanions]=useState<{mira:CompanionSetup;oren:CompanionSetup}>({mira:{classId:'scout',raceId:'elf',appearanceId:'moss'},oren:{classId:'guardian',raceId:'dwarf',appearanceId:'ember'}});
 const[race,setRace]=useState<RaceId>('human');
 const[name,setName]=useState('Alden'),[classId,setClassId]=useState<ClassId>('adept'),[background,setBackground]=useState<BackgroundId>('delver'),[appearance,setAppearance]=useState<'ember'|'moss'|'moon'>('ember');
 const[selected,setSelected]=useState(''),[busy,setBusy]=useState(''),[error,setError]=useState(''),[failure,setFailure]=useState<''|'offline'|'moved'>(''),[pending,setPending]=useState<ActionOption|null>(null),[preview,setPreview]=useState<Preview|null>(null),[intent,setIntent]=useState(''),[speaker,setSpeaker]=useState<Speaker>('dm');
 const[rulesVersion,setRulesVersion]=useState<PublicSave['rulesVersion']>('echo-v1');
 const[packOpen,setPackOpen]=useState(false);
 const[dialogue,setDialogue]=useState<Dialogue|null>(null),[settings,setSettings]=useState(false),[journal,setJournal]=useState(false),[story,setStory]=useState(false),[motion,setMotion]=useState<MotionChoice>(()=>readMotion(localStorage)),[usage,setUsage]=useState(0);
 /** #97 Reduced motion follows the OS until the player chooses in Settings. */
 const osReduced=useOSReducedMotion(),reduced=reducedMotion(motion,osReduced);
 /** #97 Narrow windows (200% zoom): the action panel is a drawer the player opens, and the party panel's extras move into it. */
 const narrow=useNarrow(),[drawer,setDrawer]=useState(false);
 /** #68 The first-run guide: due once on a new adventure, or reopened from Settings ('again'). */
 const guideStore=useRef((()=>{try{return localStorage;}catch{return null;}})()).current,[guide,setGuide]=useState<''|'again'>(''),[guideDone,setGuideDone]=useState(()=>guideSeen(guideStore));
 const {voice,speaking,stopVoice,speak,generation,autoAllowed,onVoice}=useVoice({onError:setError});
 const {recording,transcribing,cancelRecording,record}=useRecorder({saveId:save?.id,busy,stopVoice,onText:setIntent,onError:setError});
 const previewCommand=useRef<{previewId:string;commandId:string}|null>(null);
 const confirmFrom=useRef<HTMLElement|null>(null),[instantConfirm,setInstantConfirm]=useState(false),[natural,setNatural]=useState<{key:string;event:NaturalEvent;name:string}|null>(null);
 const lock=useRef(false),lastCommand=useRef<{commandId:string;expectedRevision:number;actionId:string}|null>(null);
 function changeAIMode(mode:AIMode){stopVoice();cancelRecording();changeMode(mode);}
 const aiReady=aiMode==='personal'?ownConnected:aiMode==='sponsored'&&aiConfigured;
 const adopt=(s:PublicSave)=>{cancelRecording();stopVoice();setDialogue(null);setIntent('');setSave(s);localStorage.setItem('echoes-save',s.id);setSelected('');};
 useEffect(()=>{Promise.all([api<{ok:boolean;aiConfigured:boolean;hosted?:boolean}>('/api/health'),api<{saves:typeof saves}>('/api/saves')]).then(([h,list])=>{setAIConfigured(h.aiConfigured);setHosted(!!h.hosted);setSaves(list.saves);setReady(true);}).catch(e=>setError(e.message));},[]);
 // Local scene preview (#46): /?scene=archive-3&rules=curated on 127.0.0.1 opens a throwaway save in that room. The hosted Worker has no such route.
 const scenePreview=useRef(false);
 useEffect(()=>{const q=new URLSearchParams(location.search),scene=q.get('scene');if(!ready||hosted||!scene||scenePreview.current||location.hostname!=='127.0.0.1')return;scenePreview.current=true;void run('Opening the scene preview',async()=>{adopt(await api<PublicSave>(`/api/dev/preview/${encodeURIComponent(scene)}?rules=${q.get('rules')==='curated'?'curated':'echo'}&choice=${q.get('choice')==='0'?0:1}`,{}));});},[ready,hosted]);
 useEffect(()=>{let current=true;if(save)api<{campaignUsd:number}>('/api/usage?saveId='+save.id).then(u=>{if(current)setUsage(u.campaignUsd);}).catch(()=>{});return()=>{current=false;};},[save?.id,save?.revision,dialogue,speaking,settings]);
 const[mapOpen,setMapOpen]=useState(false);useMapKey(!!save,mapOpen,setMapOpen);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!lock.current){reconsider();setSettings(false);setJournal(false);stopVoice();}
  // J opens and closes the journal (the backlog) unless a field has the keyboard. Digits belong to the action panel, M to the map.
  const t=e.target as HTMLElement|null;if((e.key==='j'||e.key==='J')&&!e.repeat&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&keyState.current.save&&!keyState.current.blocked&&!t?.closest?.('input,textarea,select,[contenteditable]')){e.preventDefault();setJournal(open=>{if(!open)backlogFocus.current=true;return !open;});}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 keyState.current={save:!!save,blocked:!!playback||!!pending||settings||packOpen||mapOpen};
 useEffect(()=>{if(!journal){if(backlogFocus.current){backlogFocus.current=false;document.querySelector<HTMLElement>('.story-box')?.focus({preventScroll:true});}return;}if(backlogFocus.current)document.getElementById('journal-backlog')?.scrollIntoView({block:'start'});},[journal]);
 const openBacklog=()=>{backlogFocus.current=true;setJournal(true);};
 async function run(label:string,fn:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(label);setError('');try{await fn();setFailure('');}catch(e){setError(e instanceof Error?e.message:'Something interrupted this action.');setFailure(offline(e)?'offline':movedOn(e)?'moved':'');if(e instanceof ApiFailure&&e.status===409&&save){try{adopt(await api<PublicSave>('/api/saves/'+save.id));if(movedOn(e)){setPending(null);setPreview(null);}}catch{}}}finally{lock.current=false;setBusy('');}}
 function returnToTitle(){cancelRecording();stopVoice();setSave(null);api<{saves:typeof saves}>('/api/saves').then(x=>setSaves(x.saves)).catch(()=>{});}
 async function start(){await run('Preparing your adventure',async()=>{adopt(await api<PublicSave>('/api/saves',{name:name.trim()||'Alden',classId,raceId:race,backgroundId:background,appearanceId:appearance,companions,rulesVersion}));});}
 async function resume(id:string){await run('Returning to Briarwatch',async()=>{adopt(await api<PublicSave>('/api/saves/'+id));});}
 async function talk(who:Speaker,text?:string){if(!save)return;await run(who==='dm'?'The Dungeon Master is listening':`${who==='mira'?'Mira':'Oren'} is thinking`,async()=>{stopVoice();const gen=generation();const d=await api<Dialogue>('/api/saves/'+save.id+'/dialogue',{speaker:who,text:text||intent||'What do you think about our situation?'});setDialogue(d);setIntent('');if(autoAllowed(gen))void speak(d);});}
 async function confirm(direct?:ActionOption){const p=direct??pending;if(!save||!p)return;const s=save;const selectedPreview=direct?null:preview;await run('Resolving your action',async()=>{stopVoice();let next:PublicSave;if(selectedPreview){const command=previewCommand.current?.previewId===selectedPreview.previewId?previewCommand.current:{previewId:selectedPreview.previewId,commandId:crypto.randomUUID()};previewCommand.current=command;next=await api<PublicSave>('/api/actions/commit',command);previewCommand.current=null;}else{const body=lastCommand.current?.actionId===p.id&&lastCommand.current.expectedRevision===s.revision?lastCommand.current:{commandId:crypto.randomUUID(),expectedRevision:s.revision,actionId:p.id};lastCommand.current=body;next=await api<PublicSave>('/api/saves/'+s.id+'/actions',body);lastCommand.current=null;}
  // A creature's whole turn plays as one (#96): each further step is an ordinary committed action, and its frames join one playback. An error keeps what already landed.
  let failed:unknown=null;if(s.tactical&&p.id==='tactical:auto'){const frames=[...next.presentation??[]];for(let i=0;i<TURN_CHAIN_LIMIT&&continuesTurn(s,next);i++){try{const more=await api<PublicSave>('/api/saves/'+s.id+'/actions',{commandId:crypto.randomUUID(),expectedRevision:next.revision,actionId:'tactical:auto'});frames.push(...more.presentation??[]);next=more;}catch(e){failed=e;break;}}next={...next,presentation:frames};}
  if(next.mode==='complete'&&s.mode!=='complete')setClosing(storyKey(next,null));
  const shown=next;setPending(null);setPreview(null);setDialogue(null);setTurnPair({before:s,after:shown});if(shown.presentation?.length){await new Promise<void>(resolve=>{playbackDone.current=resolve;setPlayback({before:s,after:shown});});}adopt(shown);if(failed)throw failed;});}
 async function interpret(){if(!save||!intent.trim())return;const from=document.activeElement instanceof HTMLElement?document.activeElement:null;await run('Considering your idea',async()=>{const p=await api<Preview>('/api/actions/preview',{saveId:save.id,expectedRevision:save.revision,text:intent});confirmFrom.current=from;setPreview(p);setPending(p.action);});}
 /** `from` anchors the light confirmation; without it the focused control (a world label, the journal) is only the focus-return target. */
 /** Free, reversible actions (companion check-ins) skip the confirmation (#62). A keyboard choice opens the card without motion. */
 function choose(a:ActionOption,from?:HTMLElement,keyboard=false){if(busy||lock.current||reading&&answersStory(a)||endingWaits)return;setPreview(null);setError('');if(save?.tactical&&a.id==='tactical:auto'||confirmationFor(a)==='none'){void confirm(a);return;}confirmFrom.current=from??(document.activeElement instanceof HTMLElement?document.activeElement:null);setInstantConfirm(keyboard);setPending(a);}
 const chooseRef=useRef(choose);chooseRef.current=choose;const onChoose=useCallback((a:ActionOption,from?:HTMLElement,keyboard=false)=>chooseRef.current(a,from,keyboard),[]);
 const onJournalChoose=useCallback((a:ActionOption)=>{setJournal(false);onChoose(a);},[onChoose]);
 /** TurnPlayback reports only the die; the frame's saved check says whether it landed on a natural 20 or 1 (#61). */
 function presentRoll(roll:WorldRoll|null,after:PublicSave){if(roll?.rolling)setNatural(null);const frame=roll&&!roll.rolling?after.presentation?.find(f=>f.log.id===roll.key):undefined,check=frame?.log.check,event=check&&check.natural===roll?.kept?naturalEvent(check):null;
  if(roll&&event){playNatural(event);setNatural({key:roll.key,event,name:[...after.party,...after.enemies].find(a=>a.id===check!.actorId)?.name??''});}setWorldRoll(roll&&event?{...roll,event}:roll);}
 function reconsider(){const from=confirmFrom.current;setPending(null);setPreview(null);if(from?.isConnected)from.focus();}
 useGameTools(save,!!busy,choose);
 const playtest=usePlaytest({saveId:save?.id??null,sceneId:save?.scene.id??null,completed:save?.mode==='complete'&&save.scene.id==='depth-8',playing:!!save&&save.mode!=='complete'&&!settings,phase:busy&&!playback?'waiting':speaking||recording||transcribing||!!dialogue||!!save?.companionStoryId?'conversation':save?.mode==='combat'?'combat':'exploration'});
 useGameAudio(save,speaking);
 const barks=useBarks(turnPair?.before??null,turnPair?.after??null),settledBark=!playback&&save&&turnPair?.after.id===save.id&&turnPair.after.revision===save.revision?barks.find(b=>b.step===null)??null:null;
 const room=save?expeditionRoom(save.scene.id):undefined,chapterName=room?.chapterName??'The Bell Beneath Briarwatch',mood=save&&save.scene.subtitle.toLowerCase()!==chapterName.toLowerCase()?save.scene.subtitle:'';
 /** Replies wait for the question's last page (#96); the chapter card waits for this visit's closing playback and pages, while a reloaded ending shows at once. */
 const reading=!!save?.companionStoryId&&!dialogue&&readKey!==storyKey(save,null);
 const endingWaits=!!save&&save.mode==='complete'&&(!!playback||!dialogue&&closing===storyKey(save,null)&&readKey!==closing);
 /** #66 Chapter pages wait for playback on the way into a room, and for the closing passage when a chapter ends the save. */
 const chapterPage=useChapterPage(save,!!playback||endingWaits);
 const guideOpen=guide==='again'||guideDue(save,{seen:guideDone,chapterPage:!!chapterPage.page,busy:!!busy||!!playback||settings||journal||story||mapOpen});if(guideOpen)keyState.current.blocked=true;
 /** Past the guide, focus goes where the player was: the story box on a first run, the settings gear when reopened. */
 const closeGuide=()=>{const again=guide==='again';markGuideSeen(guideStore);setGuideDone(true);setGuide('');requestAnimationFrame(()=>document.querySelector<HTMLElement>(again?'.top-controls [aria-label="Open settings"]':'.story-box')?.focus({preventScroll:true}));};
 const partyExtras=save&&<PartyExtras save={save} busy={busy} aiReady={aiReady} setSpeaker={setSpeaker} talk={talk} choose={onChoose} setPackOpen={setPackOpen}/>;
 return <main className={'app '+(!save?'title-mode':'')+(reduced?' reduced':'')} data-chapter={save?chapterMood(save.scene.id).kind:undefined} data-drawer={save&&narrow?drawer?'open':'closed':undefined}>
 {mapOpen&&save&&<DescentMap save={save} onClose={()=>setMapOpen(false)}/>}
 {packOpen&&save?.logistics&&<PackPanel save={save} onChoose={onChoose} onClose={()=>setPackOpen(false)}/>}
 {playback&&<TurnPlayback before={playback.before} after={playback.after} reduced={reduced} autoAdvance={autoAdvance} barks={barks} onFrame={setSave} onRoll={roll=>presentRoll(roll,playback.after)} onCue={setWorldCue} onDone={()=>{setPlayback(null);playbackDone.current?.();playbackDone.current=null;}}/>}
 <div className="world"><SceneBoundary><World onAction={onChoose} save={save} selected={selected} onSelect={setSelected} reduced={reduced} heroClass={classId} heroRace={race} heroAppearance={appearance} companions={companions} focus={dialogue?.speaker??(save?.companionStoryId?.startsWith('mira')?'mira':save?.companionStoryId?.startsWith('oren')?'oren':null)} roll={worldRoll} cue={worldCue}/></SceneBoundary></div><div className="vignette"/>
 <header className="topbar"><button className="brand" aria-label="Echoes Below, return to title" disabled={!!busy} onClick={returnToTitle}><span>Echoes Below</span></button>{save&&<div className="top-center">Chapter {room?.chapter??1}<span> · </span>{chapterName}</div>}<div className="top-controls">{save&&(failure==='offline'?<span className="saved offline" title="Your last choice did not reach the table"><b>○</b> Offline</span>:<span className="saved"><b>●</b> Autosaved</span>)}{save&&<button className="icon-btn" title="Map (M)" aria-label="Open map" onClick={()=>setMapOpen(true)}><MapIcon/></button>}<button className="icon-btn" title="Journal" aria-label="Open journal" onClick={()=>setJournal(!journal)}>☷</button><button className="icon-btn" title="Settings" aria-label="Open settings" onClick={()=>setSettings(!settings)}>⚙</button></div></header>
 {!save&&<p className="title-intro">A bell rings under an abandoned fortress.</p>}
 {!save?<CreationScreen name={name} setName={setName} classId={classId} setClassId={setClassId} race={race} setRace={setRace} appearance={appearance} setAppearance={setAppearance} background={background} setBackground={setBackground} rulesVersion={rulesVersion} setRulesVersion={setRulesVersion} companions={companions} setCompanions={setCompanions} aiMode={aiMode} changeAIMode={mode=>{changeAIMode(mode);if(mode==='personal')setSettings(true);}} aiConfigured={aiConfigured} ownConnected={ownConnected} ready={ready} busy={busy} start={start} resume={resume} saves={saves}/>:<>
 <section className="scene-heading"><div className="scene-title"><h1>{save.scene.title}</h1>{mood&&<p>{mood}</p>}</div>{busy&&!playback&&!narrow&&<div className="busy"><span className="spinner"/>{busy}…</div>}</section>

 <PartyPanel save={save} selected={selected} setSelected={setSelected} narrow={narrow}>{partyExtras}</PartyPanel>
 <TurnOrder save={save} reduced={reduced} narrow={narrow}/>{(!playback||save.mode==='defeat')&&<ActionPanel save={save} onLevelUp={save.logistics?()=>setPackOpen(true):undefined} selected={selected} onSelect={setSelected} busy={!!busy} pendingId={pending?.id} keysEnabled={!busy&&!playback&&!pending&&!settings&&!journal&&!packOpen&&!chapterPage.page&&!guideOpen&&save.mode!=='complete'} reading={reading} onChoose={onChoose} onReveal={()=>setDrawer(true)}>{narrow&&<div className="drawer-party">{partyExtras}</div>}{save.actions.length===0&&save.mode==='defeat'&&<p>Your party has fallen. Return to a checkpoint to try a different approach.</p>}{save.mode==='defeat'&&save.checkpoints.map(c=><button key={c.id} className="primary" onClick={()=>run('Returning to the checkpoint',async()=>adopt(await api<PublicSave>(`/api/saves/${save.id}/checkpoints/${c.id}/restore`,{})))}>{c.label} ↶</button>)}{aiReady?<div className="custom-intent"><label className="field-label" htmlFor="intent">Your own action</label><textarea id="intent" value={intent} maxLength={1000} onChange={e=>setIntent(e.target.value)} placeholder="“Can I distract the guard?”"/><div><button className={'mic '+(recording?'recording':'')} onClick={record} disabled={!recording&&(!!busy||transcribing||!aiReady)} aria-label={recording?'Stop recording':'Record voice'}>{recording?'■ Stop':transcribing?'Transcribing…':'◉ Speak'}</button><button onClick={interpret} disabled={!intent.trim()||!!busy||!aiReady}>Try action</button></div><button className="text-chat" disabled={!!busy||!aiReady} onClick={()=>talk(speaker)}>Ask {speaker==='dm'?'the Dungeon Master':speaker==='mira'?'Mira':'Oren'} instead</button></div>:<div className="custom-intent"><button className="intent-off" onClick={()=>setSettings(true)}>Describe your own action with AI <span>Settings</span></button></div>}</ActionPanel>}
 {!playback&&!chapterPage.page&&!(guideOpen&&!guide)&&<StoryBox save={save} dialogue={dialogue} reduced={reduced} autoAdvance={autoAdvance} active={!pending&&!journal&&!settings&&!packOpen&&!mapOpen&&!busy&&!guideOpen} bark={settledBark} onBacklog={openBacklog} voice={{speaking,ready:aiReady,onToggle:()=>{if(speaking)stopVoice();else if(dialogue)void speak(dialogue);}}} narrate={!dialogue&&aiReady&&!busy?()=>void talk('dm','Describe what we see and what just happened in two atmospheric sentences. Do not add new facts.'):null} onRead={setReadKey} holding={reading||endingWaits}/>}

 <footer className="chapter-track"><button className="track-map" onClick={()=>setMapOpen(true)}><MapIcon/>Map</button>{(save.scene.index<=6?chapters:EXPEDITION.filter(r=>r.chapter===room?.chapter).map(r=>r.title)).map((c,i)=>{const current=save.scene.index<=6?save.scene.index-1:(save.scene.index-7)%8;return <div key={c} role="img" aria-label={c+(i===current?' · current':i<current?' · cleared':' · ahead')} aria-current={i===current?'step':undefined} className={i===current?'current':i<current?'passed':''}><span></span><span className="room-name">{c}</span></div>})}<span className="camera-hint">Drag to orbit · Scroll to zoom</span>{narrow&&save.mode!=='complete'&&<button className="drawer-toggle" aria-expanded={drawer} aria-controls="actions-panel" onClick={()=>setDrawer(!drawer)}>What will you do? <span aria-hidden="true">{drawer?'▾':'▴'}</span></button>}</footer>
 </>}
 {busy&&!playback&&(!save||narrow)&&<div className="busy"><span className="spinner"/>{busy}…</div>}{error&&<div className="error" role="alert"><span>{error}</span>{failure==='moved'&&<button className="error-action" onClick={()=>location.reload()}>Reload</button>}<button onClick={()=>setError('')} aria-label="Dismiss error">×</button></div>}
 <ConfirmCard pending={pending} save={save} busy={busy} instantConfirm={instantConfirm} lock={lock} confirmFrom={confirmFrom} setPending={setPending} setPreview={setPreview} reconsider={reconsider} confirm={confirm}/>
 {natural&&<p key={natural.key} className="sr-only" role="status">{natural.name} rolls a natural {natural.event==='natural-20'?20:1}.</p>}
 {settings&&<SettingsPanel onClose={()=>setSettings(false)} aiMode={aiMode} onAIMode={changeAIMode} sponsored={aiConfigured} connected={ownConnected} aiReady={aiReady} hosted={hosted} keyPanel={aiMode==='personal'&&<section className="key-settings"><label htmlFor="own-key">Your OpenAI API key</label><input id="own-key" type="password" value={keyDraft} onChange={e=>setKeyDraft(e.target.value)} placeholder="Enter your own key" autoComplete="off"/><div><button className="primary" disabled={!keyDraft.trim()||keyChecking} onClick={()=>{stopVoice();cancelRecording();void connectPersonalKey();}}>{keyChecking?'Checking connection…':'Check & connect'}</button><button disabled={!ownConnected&&!keyChecking} onClick={()=>{reset('Disconnected. Your key has been cleared.');stopVoice();}}>Disconnect</button></div><p className="key-status" role="status" aria-live="polite">{keyStatus}</p><small>Connection check sends a tiny paid request to OpenAI to verify model access.</small><p>{ownConnected?'Your key is connected for this open page.':'Your own key is optional.'} It stays in this page’s memory and is sent directly to OpenAI, never to the game’s host. Reloading clears it. OpenAI processes your prompts and audio under its own policies. {hosted?'The host’s allowance uses the host’s own key, kept separately, with a shared limit.':'Local AI uses this computer’s private configuration.'}</p></section>} voice={voice} onVoice={onVoice} speaker={speaker} onSpeaker={setSpeaker} reduced={reduced} onReduced={on=>{const choice=on?'reduced':'full';setMotion(choice);try{localStorage.setItem(MOTION_KEY,choice);}catch{/* blocked storage: the choice lasts this visit */}}} onGuide={()=>{setSettings(false);setGuide('again');}} debug={<DebugPanel usage={usage} hosted={hosted} personal={aiMode==='personal'} playtest={playtest} hasSave={!!save}/>}/>}
 {guideOpen&&<Onboarding sample={oddsSample(save,selected)} onClose={closeGuide}/>}
 <JournalDialog open={journal} save={save} dialogue={dialogue} aiReady={aiReady} onClose={()=>setJournal(false)} onChoose={onJournalChoose} speak={speak}/>
 {story&&save&&<StoryView save={save} onClose={()=>setStory(false)}/>}
 {save&&chapterPage.page&&!journal&&!settings&&!story&&<ChapterPages page={chapterPage.page} save={save} busy={!!busy} onDone={chapterPage.done} onRead={()=>setStory(true)} onContinue={()=>{const a=save.actions.find(a=>a.id==='continue_campaign');if(a)choose(a);}} onRestart={returnToTitle}/>}
 {save?.mode==='complete'&&!endingWaits&&!chapterPage.page&&!journal&&!settings&&!story&&(save.recap?<EndingPage save={save} recap={save.recap} busy={!!busy} onRead={()=>setStory(true)} onRestart={returnToTitle}/>:<Overlay className="ending" labelledBy="chapter-end-title"><div className="eyebrow">THE DESCENT · COMPLETE</div><h2 id="chapter-end-title" tabIndex={-1}>The bell is quiet.<br/><em>Your story isn't.</em></h2><p>{save.ending}</p><div className="ending-actions"><button className="primary" onClick={()=>setStory(true)}>Read your story →</button><button onClick={returnToTitle}>Begin another journey</button></div><small>Six chapters complete. Your journal records the consequences of this journey.</small></Overlay>)}
 </main>;
}
