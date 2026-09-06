import type {ActionOption} from '../shared/types.js';
/** Keep global controls usable without silently substituting a different target. */
export function focusedActions(available:ActionOption[],selected:string){
 const matches=(a:ActionOption)=>a.targetId===selected||a.actorId===selected;
 return {actions:selected?available.filter(a=>!a.targetId||matches(a)):available,hasTargetActions:!selected||available.some(matches)};
}
