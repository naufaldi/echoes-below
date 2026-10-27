import type {ActionOption} from '../shared/types.js';
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
