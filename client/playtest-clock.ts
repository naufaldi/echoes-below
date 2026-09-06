export type PlayPhase='exploration'|'combat'|'conversation'|'waiting';
export interface PlayTiming {exploration:number;combat:number;conversation:number;waiting:number;excluded:number;}
export const emptyTiming=():PlayTiming=>({exploration:0,combat:0,conversation:0,waiting:0,excluded:0});
export interface ClockState {sceneId?:string|null;visible:boolean;focused:boolean;playing:boolean;phase:PlayPhase;}
const IDLE_MS=120_000,MAX_OBSERVED_GAP=5_000;
/** Monotonic, observed foreground intervals only. No wall-clock session duration claims. */
export class PlayClock {
 readonly timing=emptyTiming();
 readonly sceneTimings:Record<string,PlayTiming>=Object.create(null);
 private last:number;private input:number;
 constructor(now:number,private state:ClockState){this.last=now;this.input=now;}
 tick(now:number){
  const elapsed=Math.max(0,now-this.last);
  const observed=this.state.visible&&this.state.focused&&this.state.playing&&elapsed<=MAX_OBSERVED_GAP;
  const counted=observed?Math.max(0,Math.min(now,this.input+IDLE_MS)-this.last):0;
  if(this.state.sceneId){const room=this.sceneTimings[this.state.sceneId]??=emptyTiming();room[this.state.phase]+=counted;room.excluded+=elapsed-counted;}
  this.timing[this.state.phase]+=counted;this.timing.excluded+=elapsed-counted;this.last=now;
 }
 transition(now:number,next:ClockState){this.tick(now);this.state=next;}
 activity(now:number){this.tick(now);this.input=now;}
}
export function activeMilliseconds(t:PlayTiming){return t.exploration+t.combat+t.conversation;}
export function validTiming(value:unknown):value is PlayTiming{return !!value&&typeof value==='object'&&Object.keys(emptyTiming()).every(key=>typeof (value as Record<string,unknown>)[key]==='number'&&Number.isFinite((value as Record<string,number>)[key])&&(value as Record<string,number>)[key]!>=0);}
export function sumTiming(rows:PlayTiming[]){return rows.reduce((total,row)=>{for(const key of Object.keys(total) as (keyof PlayTiming)[])total[key]+=row[key];return total;},emptyTiming());}
