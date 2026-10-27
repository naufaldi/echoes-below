import type {GameLog,OutcomeCheck,Roll} from '../shared/types.js';
/** Builds the public check record from a saved d20 roll; `success` always comes from the rule that resolved it. */
export function outcomeCheck(kind:OutcomeCheck['kind'],actorId:string,skill:string,r:Roll,dc:number,success:boolean,extra:{targetId?:string;critical?:boolean;advantage?:boolean;disadvantage?:boolean}={}):OutcomeCheck{
 const advantage=!!extra.advantage&&!extra.disadvantage,disadvantage=!!extra.disadvantage&&!extra.advantage;
 return {kind,actorId,...(extra.targetId?{targetId:extra.targetId}:{}),skill,sides:r.sides,natural:r.kept,modifier:r.modifier,total:r.total,dc,success,...(extra.critical?{critical:true as const}:{}),...(advantage?{advantage:true as const}:{}),...(disadvantage?{disadvantage:true as const}:{})};
}
/** Plain, number-free story lines for attacks and saves. */
export const attackProse=(attacker:string,target:string,hit:boolean,downed:boolean)=>hit?`${attacker} lands a blow on ${target}.${downed?` ${target} goes down.`:''}`:`${target} evades ${attacker}’s attack.`;
export const opportunityProse=(attacker:string,target:string,hit:boolean,downed:boolean)=>hit?`${attacker} lashes out as ${target} moves away and lands a blow.${downed?` ${target} goes down.`:''}`:`${attacker} lashes out as ${target} moves away, but misses.`;
export const sacredFlameProse=(target:string,saved:boolean,downed:boolean)=>saved?`${target} twists away from the sacred flame.`:`Sacred flame sears ${target}.${downed?` ${target} goes down.`:''}`;
export type Outcome=Pick<GameLog,'prose'|'check'>;
