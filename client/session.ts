import type {PublicSave} from '../shared/types.js';

export function narrationFor(save:PublicSave):string {
  if(save.revision===0)return save.scene.description;
  // Older saves stamped the two creation exchanges as revision 1.
  const logs=save.logs.filter((l,i)=>!(i<2&&l.revision===1&&l.source==='authored'&&l.speaker===(i===0?'mira':'oren')));
  const current=logs.filter(l=>l.revision===save.revision&&l.source!=='ai');
  let entry=-1;current.forEach((l,i)=>{if(l.speaker==='dm'&&l.source==='authored'&&l.text===save.scene.description)entry=i;});
  return (entry>=0?current.slice(entry):current).slice(-3).map(l=>l.text).join(' ')||save.scene.description;
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
