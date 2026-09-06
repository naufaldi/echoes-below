import {ABILITIES,improveCharacter,pendingImprovements,type Ability} from '../shared/curated-rules.js';
import type {ActionOption} from '../shared/types.js';
import {GameError,log,type Save} from './game.js';
import {projectTactical} from './tactical.js';
const title=(name:string)=>name[0].toUpperCase()+name.slice(1);
export function advancementActions(s:Save):ActionOption[]{
 if(!s.tactical||s.mode!=='explore'||s.companionStoryId)return[];
 return s.party.flatMap(actor=>{
  const c=s.tactical!.actors[actor.id];if(!c||c.hp<=0||c.dead)return[];
  // Offer the oldest pending milestone first, keeping one clear choice per member.
  const level=pendingImprovements(c)[0];if(!level)return[];
  return ABILITIES.flatMap((first,i)=>ABILITIES.slice(i).flatMap(second=>{
   if(c.abilities[first]+(first===second?2:1)>20||c.abilities[second]+(first===second?2:1)>20)return[];
   const bonus=first===second?`${title(first)} +2`:`${title(first)} +1, ${title(second)} +1`;
   return[{id:`advance:${actor.id}:${level}:${first}:${second}`,kind:'inventory',actorId:actor.id,label:`${bonus} · ${actor.name}`,description:`Spend ${actor.name}’s level ${level} Ability Score Improvement. ${bonus}. This permanent choice is saved with the character. Scores cannot exceed 20.`}];
  }));
 });
}
export function applyAdvancement(original:Save,id:string):Save{
 const choice=advancementActions(original).find(a=>a.id===id);if(!choice)throw new GameError(422,'ADVANCEMENT','That ability improvement is unavailable.');
 const s=structuredClone(original),[,actor,level,first,second]=id.split(':');s.presentation=[];
 s.tactical!.actors[actor]=improveCharacter(s.tactical!.actors[actor],{level:Number(level),first:first as Ability,second:second as Ability});
 projectTactical(s,false);log(s,`${choice.label}. Level ${level} improvement saved.`,actor);
 s.revision++;s.updatedAt=new Date().toISOString();return s;
}
