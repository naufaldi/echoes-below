import {setAudioSettings,useAudioSettings} from './audio';
import type {AudioSettings as Levels} from './audio-cues';

/** Game sound levels; saved in this browser and independent of reduced motion. */
export default function AudioSettings(){
 const s=useAudioSettings();
 const slider=(key:'master'|'music'|'sfx',label:string,hint?:string)=><label className="toggle"><span>{label}{hint&&<small>{hint}</small>}</span><input aria-label={label} type="range" min="0" max="1" step=".05" value={s[key]} disabled={s.muted} onChange={e=>setAudioSettings({[key]:Number(e.target.value)} as Partial<Levels>)}/></label>;
 return <>{slider('master','Master volume','Also scales AI voice')}{slider('music','Music & ambience')}{slider('sfx','Sound effects','Dice, hits, footsteps, doors and buttons')}<label className="toggle"><span>Mute all sound</span><input aria-label="Mute all sound" type="checkbox" checked={s.muted} onChange={e=>setAudioSettings({muted:e.target.checked})}/></label></>;
}
