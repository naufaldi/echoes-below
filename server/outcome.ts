import type {GameLog,OutcomeCheck,Roll} from '../shared/types.js';
/** Builds the public check record from a saved d20 roll; `success` always comes from the rule that resolved it. */
export function outcomeCheck(kind:OutcomeCheck['kind'],actorId:string,skill:string,r:Roll,dc:number,success:boolean,extra:{targetId?:string;critical?:boolean;advantage?:boolean;disadvantage?:boolean}={}):OutcomeCheck{
 const advantage=!!extra.advantage&&!extra.disadvantage,disadvantage=!!extra.disadvantage&&!extra.advantage;
 return {kind,actorId,...(extra.targetId?{targetId:extra.targetId}:{}),skill,sides:r.sides,natural:r.kept,modifier:r.modifier,total:r.total,dc,success,...(extra.critical?{critical:true as const}:{}),...(advantage?{advantage:true as const}:{}),...(disadvantage?{disadvantage:true as const}:{})};
}
/** Plain, number-free story lines. The player's hero is always "you" (ROADMAP §6); everyone else is named. */
export interface Named{id:string;name:string}
const you=(a:Named)=>a.id==='hero';
const downLine=(t:Named)=>you(t)?' You go down.':` ${t.name} goes down.`;
export const attackProse=(a:Named,t:Named,hit:boolean,downed:boolean)=>hit?`${you(a)?`You land a blow on ${t.name}`:`${a.name} lands a blow on ${you(t)?'you':t.name}`}.${downed?downLine(t):''}`:you(t)?`You evade ${a.name}’s attack.`:`${t.name} evades ${you(a)?'your':`${a.name}’s`} attack.`;
export const opportunityProse=(a:Named,t:Named,hit:boolean,downed:boolean)=>`${you(a)?`You lash out as ${t.name} moves away`:`${a.name} lashes out as ${you(t)?'you move':`${t.name} moves`} away`}${hit?` and ${you(a)?'land':'lands'} a blow.${downed?downLine(t):''}`:`, but ${you(a)?'miss':'misses'}.`}`;
export const sacredFlameProse=(t:Named,saved:boolean,downed:boolean)=>saved?`${you(t)?'You twist':`${t.name} twists`} away from the sacred flame.`:`Sacred flame sears ${you(t)?'you':t.name}.${downed?downLine(t):''}`;
export const trapProse=(a:Named)=>`The plate drops. A dart strikes ${you(a)?'you':a.name}. The chain crashes; the mechanism is spent.`;
export type Outcome=Pick<GameLog,'prose'|'check'>;
