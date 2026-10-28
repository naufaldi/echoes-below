import type {ActionOption} from '../shared/types.js';
import {oddsFor,type Odds} from '../shared/odds.js';
/** Keep global controls usable without silently substituting a different target. */
export function focusedActions(available:ActionOption[],selected:string){
 const matches=(a:ActionOption)=>a.targetId===selected||a.actorId===selected;
 return {actions:selected?available.filter(a=>!a.targetId||matches(a)):available,hasTargetActions:!selected||available.some(matches)};
}
export type ActionRow={kind:'single';action:ActionOption}|{kind:'choices';key:string;label:string;check?:ActionOption['check'];options:{id:string;name:string;action:ActionOption}[]};
const choiceName=(a:ActionOption)=>a.label.replace(/^(Move to the |Move |Attack )/,'').replace(/^Approach /,'→ ');
/** One row per decision with several targets: a check every party member may attempt ("Inspect tracks · Alden/Mira/Oren"), attacks, and moves. The engine still receives the chosen option's own action id. */
export function actionRows(actions:ActionOption[],party:{id:string;name:string}[]):ActionRow[]{
 const member=(a:ActionOption)=>{const p=party.find(m=>a.id.endsWith(':'+m.id)&&a.label.endsWith(' · '+m.name));return p?{key:a.id.slice(0,-p.id.length-1),label:a.label.slice(0,-p.name.length-3),id:p.id,name:p.name}:undefined;};
 const grouped=(a:ActionOption)=>member(a)??(a.kind==='attack'||a.kind==='move'?{key:'kind:'+a.kind,label:a.kind==='attack'?'Attack':'Move',id:a.id,name:choiceName(a)}:undefined);
 const rows:ActionRow[]=[];
 for(const a of actions){const g=grouped(a);const row=g&&rows.find(r=>r.kind==='choices'&&r.key===g.key&&r.label===g.label);
  if(g&&row&&row.kind==='choices')row.options.push({id:g.id,name:g.name,action:a});
  else if(g&&actions.filter(b=>{const o=grouped(b);return o?.key===g.key&&o.label===g.label;}).length>1)rows.push({kind:'choices',key:g.key,label:g.label,check:a.check,options:[{id:g.id,name:g.name,action:a}]});
  else rows.push({kind:'single',action:a});}
 return rows;
}
export type Verb='Look'|'Talk'|'Act'|'Move';
export const VERBS:Verb[]=['Look','Talk','Act','Move'];
const TALK=/^(bond_|checkin:|exp_talk$|exp_ally:|parley:|courier:|scrit|ink:ask$|infirmary:signal$|entrust$)/,LOOK=/^(counterweight:read|infirmary:inspect|ink:inspect|index:read)$/,MOVE=/^(exp_next|continue_campaign)$/;
/** The story verb an exploration action sits under (#62). Authored ids decide first, because the `interact` kind covers talking, looking and acting; then the kind. */
export function verbFor(a:Pick<ActionOption,'id'|'kind'>):Verb{
 if(TALK.test(a.id)||['talk','persuade','offer'].includes(a.kind))return'Talk';
 if(LOOK.test(a.id)||a.kind==='inspect')return'Look';
 if(MOVE.test(a.id)||['move','retreat','run'].includes(a.kind))return'Move';
 return'Act';
}
export const rowAction=(r:ActionRow)=>r.kind==='single'?r.action:r.options[0]!.action;
/** Rows under Look, Talk, Act and Move, in that order; each group keeps the engine's order. Empty groups are dropped. */
export function verbGroups(rows:ActionRow[]):{verb:Verb;rows:ActionRow[]}[]{return VERBS.map(verb=>({verb,rows:rows.filter(r=>verbFor(rowAction(r))===verb)})).filter(g=>g.rows.length>0);}
export interface Best {id:string;name:string;action:ActionOption;odds:Odds}
/** The best-placed member (or target) for a row's check: the highest public odds, ties keeping the listed order. Null when the row advertises no odds. */
export function bestChoice(row:ActionRow,party:{id:string;name:string}[]):Best|null{
 const candidates=row.kind==='single'?[{id:row.action.actorId??'',name:party.find(m=>m.id===row.action.actorId)?.name??'',action:row.action}]:row.options;
 let best:Best|null=null;
 for(const c of candidates){const odds=oddsFor(c.action.check);if(odds&&(!best||odds.percent>best.odds.percent))best={...c,odds};}
 return best;
}
