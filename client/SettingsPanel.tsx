import {useId,type ReactNode} from 'react';
import {setAudioSettings,useAudioSettings} from './audio';
import type {AudioSettings as Levels} from './audio-cues';
import {Dialog} from './Modal';
import Credits from './Credits';
import AIModePicker from './AIModePicker';
import type {AIMode} from './ai-mode';
import NarrativePassage,{useReveal} from './NarrativePassage';
import {setReading,useReading} from './use-reading';
import type {ReadingPause,TextSize,TextSpeed} from './reading-settings';
import type {Speaker} from '../shared/types';
import './settings.css';

// #68 Settings: reading first, then sound, then motion, then how to play, then the credits. Each choice applies at once and stays in this browser.
/** One choice from a few, as a row of pills: a native radio group, so arrow keys move within it and Tab visits it once. */
function Choice<T extends string>({label,hint,value,options,disabled,onChange}:{label:string;hint?:string;value:T;options:readonly (readonly [T,string])[];disabled?:boolean;onChange:(v:T)=>void}){
 const id=useId();
 return <div className={'toggle choice-row'+(disabled?' off':'')}><span id={id}>{label}{hint&&<small>{hint}</small>}</span><div className="segmented" role="radiogroup" aria-labelledby={id}>{options.map(([v,text])=><label key={v}><input type="radio" name={id} value={v} checked={value===v} disabled={disabled} onChange={()=>onChange(v)}/><span>{text}</span></label>)}</div></div>;
}
const SPEED_OPTIONS=[['slow','Slow'],['normal','Normal'],['fast','Fast'],['instant','Instant']] as const satisfies readonly (readonly [TextSpeed,string])[];
const PAUSE_OPTIONS=[['short','Short'],['normal','Normal'],['long','Long']] as const satisfies readonly (readonly [ReadingPause,string])[];
const SIZE_OPTIONS=[['normal','Normal'],['large','Large'],['larger','Larger']] as const satisfies readonly (readonly [TextSize,string])[];
const SAMPLE='A bell rings somewhere beneath the fortress. Mira lifts her lantern; the stair breathes cold air up at you.';

/** A line of story in the box's own type, typed at the chosen speed and size, so a change shows before the panel closes. */
function ReadingSample({still}:{still:boolean}){
 const {count}=useReveal(SAMPLE,still);
 return <div className="reading-sample" aria-hidden="true"><NarrativePassage text={SAMPLE} count={count} className="voice-narrator"/></div>;
}

/** Master, music, effects and mute; the voice level and automatic speech join them only where a voice can speak. */
function SoundSettings({voiceMode,voice,onVoice}:{voiceMode:boolean;voice:boolean;onVoice:(on:boolean)=>void}){
 const s=useAudioSettings();
 const slider=(key:'master'|'music'|'sfx'|'voice',label:string,hint?:string)=><label className="toggle"><span>{label}{hint&&<small>{hint}</small>}</span><input aria-label={label} type="range" min="0" max="1" step=".05" value={s[key]} disabled={s.muted} onChange={e=>setAudioSettings({[key]:Number(e.target.value)} as Partial<Levels>)}/></label>;
 return <>{slider('master','Master volume',voiceMode?'Also scales voices':undefined)}{slider('music','Music & ambience')}{slider('sfx','Sound effects','Dice, hits, footsteps, doors and buttons')}{voiceMode&&<>{slider('voice','Voice volume')}<label className="toggle"><span>Speak AI dialogue automatically<small>AI-generated voices by OpenAI</small></span><input type="checkbox" checked={voice} onChange={e=>onVoice(e.target.checked)}/></label></>}<label className="toggle"><span>Mute all sound</span><input aria-label="Mute all sound" type="checkbox" checked={s.muted} onChange={e=>setAudioSettings({muted:e.target.checked})}/></label></>;
}

export interface SettingsProps{onClose:()=>void;
 aiMode:AIMode;onAIMode:(m:AIMode)=>void;sponsored:boolean;connected:boolean;aiReady:boolean;hosted:boolean;
 /** The own-key form; App keeps the key, which never leaves this page's memory. */
 keyPanel:ReactNode;
 voice:boolean;onVoice:(on:boolean)=>void;speaker:Speaker;onSpeaker:(s:Speaker)=>void;
 reduced:boolean;onReduced:(on:boolean)=>void;
 /** Closes Settings and opens the first-run guide. */
 onGuide:()=>void;
 /** Developer figures; the panel renders them only with `?debug`. */
 debug?:ReactNode}
export default function SettingsPanel({onClose,aiMode,onAIMode,sponsored,connected,aiReady,hosted,keyPanel,voice,onVoice,speaker,onSpeaker,reduced,onReduced,onGuide,debug}:SettingsProps){
 const r=useReading(),voiceMode=aiMode!=='off';
 const note=aiMode==='off'?'Free story mode: the whole adventure and every party conversation, with no key needed. More conversations open up as you explore.':aiMode==='personal'?connected?'Your own key pays for AI dialogue and voice this visit. OpenAI bills those charges; they are not measured here.':'Enter your key above to turn on AI dialogue and voice.':aiReady?'The host’s limited allowance pays for AI dialogue and voice.':'The host’s allowance is not available right now.';
 return <Dialog labelledBy="settings-title" className="settings-panel" onClose={onClose} initial="#settings-title"><button className="close" aria-label="Close settings" onClick={onClose}>×</button><div className="eyebrow">MAKE YOURSELF AT HOME</div><h2 id="settings-title" tabIndex={-1}>Adventure settings</h2>
  <section className="settings-section" aria-labelledby="settings-reading"><h3 id="settings-reading">Reading</h3>
   <ReadingSample still={reduced}/>
   <Choice label="Text speed" hint="How quickly the words appear" value={r.speed} options={SPEED_OPTIONS} onChange={speed=>setReading({speed})}/>
   <label className="toggle"><span>Turn pages automatically<small>Pages move on after a pause for reading</small></span><input type="checkbox" checked={r.autoAdvance} onChange={e=>setReading({autoAdvance:e.target.checked})}/></label>
   <Choice label="Pause before turning" value={r.pause} options={PAUSE_OPTIONS} disabled={!r.autoAdvance} onChange={pause=>setReading({pause})}/>
   <Choice label="Text size" hint="The story and your choices" value={r.size} options={SIZE_OPTIONS} onChange={size=>setReading({size})}/>
   <div className="toggle"><span>First-run guide<small>Reading, choosing and rolling, in under a minute</small></span><button className="settings-button" onClick={onGuide}>Show the guide again</button></div>
  </section>
  <section className="settings-section" aria-labelledby="settings-sound"><h3 id="settings-sound">Sound</h3><SoundSettings voiceMode={voiceMode} voice={voice} onVoice={onVoice}/></section>
  <section className="settings-section" aria-labelledby="settings-motion"><h3 id="settings-motion">Motion</h3><label className="toggle"><span>Reduced motion<small>Gentler camera and movement</small></span><input type="checkbox" checked={reduced} onChange={e=>onReduced(e.target.checked)}/></label></section>
  <section className="settings-section" aria-labelledby="settings-play"><h3 id="settings-play">Play mode</h3>
   <AIModePicker value={aiMode} onChange={onAIMode} sponsored={sponsored} connected={connected} inSettings/>{keyPanel}
   {voiceMode&&<label className="toggle"><span>Talk to</span><select value={speaker} onChange={e=>onSpeaker(e.target.value as Speaker)}><option value="dm">Dungeon Master</option><option value="mira">Mira</option><option value="oren">Oren</option></select></label>}
   <div className="settings-note">{note}{voiceMode&&<><br/>Voice input sends your spoken clip to OpenAI. Dialogue text also uses OpenAI.</>}<br/>{hosted?'Your adventure and conversations are kept online under a private device session. Keep this browser’s cookies to keep access. Your own API key is never included.':'Your adventure is kept on this computer.'}</div>
  </section>
  <details className="settings-about"><summary>About & credits</summary><div className="credits"><Credits/> Asset authors, music and rules attribution.<br/>Echoes Below · Six-chapter expedition v0.2</div></details>
  {debug}
 </Dialog>;
}
