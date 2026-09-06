import type {Save} from './game.js';
/** Consume every applicable Help benefit on this one attack; advantage never stacks. */
export function consumeAttackHelp(s:Save,attackerId:string,targetId:string):boolean{
 const t=s.tactical!,members=[...s.party,...s.enemies],attacker=members.find(a=>a.id===attackerId);
 const matching=(e:{sourceId:string;targetId:string})=>e.targetId===targetId&&e.sourceId!==attackerId&&members.some(a=>a.id===e.sourceId&&a.side===attacker?.side);
 const helped=(t.attackHelp??[]).some(matching);t.attackHelp=(t.attackHelp??[]).filter(e=>!matching(e));return helped;
}
export function expireAttackHelp(s:Save,actorId:string){if(s.tactical?.attackHelp)s.tactical.attackHelp=s.tactical.attackHelp.filter(e=>e.sourceId!==actorId);}
