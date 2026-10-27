import type {PresentationFrame} from '../shared/types.js';
/** Consecutive initiative rolls play as one step: they are already saved, and one confirmation per combatant only delays the first turn. */
export function playbackSteps(frames:PresentationFrame[]):[number,number][]{
 const steps:[number,number][]=[];const initiative=(f?:PresentationFrame)=>f?.log.rolls[0]?.purpose.toLowerCase()==='initiative';
 for(let i=0;i<frames.length;i++){let end=i;if(initiative(frames[i]))while(initiative(frames[end+1]))end++;steps.push([i,end]);i=end;}
 return steps;
}
