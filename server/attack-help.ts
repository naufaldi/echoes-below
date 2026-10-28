import type {Save} from './game.js';
function helpFor(s:Save,attackerId:string,targetId:string){
 const members=[...s.party,...s.enemies],attacker=members.find(a=>a.id===attackerId);
 return(e:{sourceId:string;targetId:string})=>e.targetId===targetId&&e.sourceId!==attackerId&&members.some(a=>a.id===e.sourceId&&a.side===attacker?.side);
}
/** Whether this attack would gain Help's advantage, without spending it (the odds band, #61). */
export const attackHelped=(s:Save,attackerId:string,targetId:string)=>(s.tactical?.attackHelp??[]).some(helpFor(s,attackerId,targetId));
/** Consume every applicable Help benefit on this one attack; advantage never stacks. */
export function consumeAttackHelp(s:Save,attackerId:string,targetId:string):boolean{
 const t=s.tactical!,matching=helpFor(s,attackerId,targetId);
 const helped=(t.attackHelp??[]).some(matching);t.attackHelp=(t.attackHelp??[]).filter(e=>!matching(e));return helped;
}
export function expireAttackHelp(s:Save,actorId:string){if(s.tactical?.attackHelp)s.tactical.attackHelp=s.tactical.attackHelp.filter(e=>e.sourceId!==actorId);}
