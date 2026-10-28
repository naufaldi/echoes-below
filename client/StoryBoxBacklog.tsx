import {useMemo} from 'react';
import type {PublicSave} from '../shared/types';
import {MechTag} from './NarrativePassage';
import {NamePlate} from './StoryBox';
import {storyLines,type StoryLine} from './story-pages';

/** The journal as the full backlog (#60): every line so far, newest first, in the same three voices as the story box. */
export default function StoryBoxBacklog({save}:{save:PublicSave}){
 // A tag-only line (XP the engine reports on its own) joins the line before it rather than standing alone.
 const lines=useMemo(()=>storyLines(save.logs,save,{rollTags:true}).reduce<StoryLine[]>((all,l)=>{const prev=all.at(-1);if(!l.text&&prev){all[all.length-1]={...prev,tag:[...(prev.tag??[]),...(l.tag??[])]};return all;}all.push(l);return all;},[]).reverse(),[save]);
 return <><h3 id="journal-backlog">The story so far</h3><div className="journal-logs" aria-label="Backlog">{lines.length?lines.map(l=><div key={l.key} className={'backlog-line '+l.voice}>{l.voice==='character'&&l.speakerId&&<NamePlate speakerId={l.speakerId} name={l.name??l.speakerId} cast={save}/>}{l.text&&<p className={l.voice==='narrator'?'voice-narrator':'voice-character'}>{l.text}</p>}{l.tag&&<MechTag parts={l.tag}/>}</div>):<p className="muted">Your story begins with your first step.</p>}</div></>;
}
