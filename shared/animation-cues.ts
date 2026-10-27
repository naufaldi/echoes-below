import type {Actor,AnimationCue,GameLog} from './types.js';
/** How an attack without a saved cue is presented: adepts and clerics cast, scouts shoot, everyone else strikes. */
export const attackCue=(classId:Actor['classId']):AnimationCue=>classId==='adept'||classId==='cleric'?'spell':classId==='scout'?'ranged':'melee';
export function latestAnimation(logs:GameLog[],actor:Pick<Actor,'id'|'classId'>):{id:string;cue:AnimationCue}|undefined{
 for(let i=logs.length-1;i>=0;i--){const log=logs[i];if(log.speaker!==actor.id||log.source==='ai')continue;
  if(log.animation)return{id:log.id,cue:log.animation};
  // Echo attacks and older saves have no cue; their attacks remain presentable.
  if(log.text.includes(' attacks '))return{id:log.id,cue:attackCue(actor.classId)};
 }
}
export function animationClip(names:string[],state:AnimationCue|'idle'|'walk'|'hit'|'death',actor:Pick<Actor,'classId'|'assetId'>):string|undefined{
 const model=actor.assetId??({slime:'slime',spider:'spider',skeleton:'skeleton',goblin:'imp',vark:'imp'} as Record<string,string>)[actor.classId];
 const candidates:Record<string,string[]>={idle:['Idle','Idle_Loop','Spider_Idle'],walk:['Walking_A','Walk','Spider_Walk'],hit:['Hit_A','Hit','HitReact','HitRecieve','RecieveHit'],death:['Death_A','Death','Spider_Death'],spell:['Spellcast_Shoot','Spell1','Interact'],ranged:['1H_Ranged_Shoot','Bow_Shoot','Attack','Bite_Front','Sword','Spider_Attack'],melee:['1H_Melee_Attack_Slice_Diagonal','Attack','Bite_Front','Sword','Spider_Attack','Punch'],item:['Use_Item','Interact'],dodge:['Block','Duck']};
 if(['melee','ranged'].includes(state)&&model==='slime')candidates[state]=['Bite_Front','Bite_InPlace'];
 if(['melee','ranged'].includes(state)&&model==='spider')candidates[state]=['Spider_Attack'];
 for(const candidate of candidates[state]){const match=names.find(name=>name.toLowerCase()===candidate.toLowerCase())??names.find(name=>name.split('|').some(part=>part.toLowerCase()===candidate.toLowerCase()));if(match)return match;}
 return undefined;
}
