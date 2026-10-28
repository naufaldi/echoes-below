import type {PublicSave} from '../shared/types.js';
import {speakerLabel} from '../shared/speaker-label.js';

export function narrationEntries(save:PublicSave) {
  if(save.revision===0)return [];
  // Older saves stamped the two creation exchanges as revision 1.
  const logs=save.logs.filter((l,i)=>!(i<2&&l.revision===1&&l.source==='authored'&&l.speaker===(i===0?'mira':'oren')));
  const current=logs.filter(l=>l.revision===save.revision&&l.source!=='ai');
  let entry=-1;current.forEach((l,i)=>{if(l.speaker==='dm'&&l.source==='authored'&&l.text===save.scene.description)entry=i;});
  // Reward and level-up records must not push the action's narrative out.
  // The passage scrolls, so retain this committed revision in its original order.
  return entry>=0?current.slice(entry):current;
}

export function narrationFor(save:PublicSave):string{return narrationEntries(save).map(l=>l.text).join(' ')||save.scene.description;}
/** Combat shows only the newest events as lines; the journal keeps the full log. `lead` is the actor's name when the line opens with it. */
export function combatEventsFor(save:PublicSave,count=2){
 return narrationEntries(save).slice(-count).map(l=>{const name=l.speaker==='dm'?null:speakerLabel(l,save.party,save.enemies);return {id:l.id,text:l.text,lead:name&&l.text.startsWith(name)?name:null,enemy:save.enemies.some(a=>a.id===l.speaker)};});
}
export function narrationSpeakerFor(save:PublicSave):string|null{
 const entries=narrationEntries(save),first=entries[0];
 if(!first||first.speaker==='dm'||entries.some(l=>l.source!=='authored'||l.speaker!==first.speaker))return null;
 return first.speakerName??save.party.find(a=>a.id===first.speaker)?.name??first.speaker;
}

// Each adoption is a boundary, including a new revision of the same save.
export class SessionBoundary {
  generation=0;
  private cleanup:(()=>void)|null=null;
  capture(){return this.generation;}
  current(generation:number){return generation===this.generation;}
  async deliver<T>(generation:number,request:()=>Promise<T>,accept:(value:T)=>void){
    if(!this.current(generation))return;
    const value=await request();
    if(this.current(generation))accept(value);
  }
  own(cleanup:()=>void){this.cleanup=cleanup;}
  invalidate(){this.generation++;this.cleanup?.();this.cleanup=null;}
}
export function automaticVoiceAllowed(enabled:boolean,started:number,current:number){return enabled&&started===current;}
