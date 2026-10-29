import type {ActionOption,PublicSave} from '../shared/types.js';
import {oddsFor,type Odds} from '../shared/odds.js';
/** Keep global controls usable without silently substituting a different target. */
export function focusedActions(available:ActionOption[],selected:string){
 const matches=(a:ActionOption)=>a.targetId===selected||a.actorId===selected;
 return {actions:selected?available.filter(a=>!a.targetId||matches(a)):available,hasTargetActions:!selected||available.some(matches)};
}
export type ActionRow={kind:'single';action:ActionOption}|{kind:'choices';key:string;label:string;check?:ActionOption['check'];options:{id:string;name:string;action:ActionOption}[]};
type Member={id:string;name:string;hp?:number;maxHp?:number};
const choiceName=(a:ActionOption)=>a.label.replace(/^(Move to the |Move |Attack )/,'').replace(/^Approach /,'→ ');
/** Exploration recovery: Echo's focus heals and personal potion, Curated's Cure Wounds, Second Wind and potions. Combat keeps its own ordered list. */
export const healAction=(a:Pick<ActionOption,'id'|'kind'>)=>a.kind==='heal'||a.id==='potion';
/** Class healing first, then Second Wind, then a potion: renewable resources before the pack. */
const HEAL_ORDER=[/^(campheal|recover:cure):/,/^recover:wind:/,/^(potion$|recover:potion:)/];
const healRank=(a:ActionOption)=>{const i=HEAL_ORDER.findIndex(r=>r.test(a.id));return i<0?HEAL_ORDER.length:i;};
/**
 * One "Tend wounds" row (#96) instead of a row per healer, target and potion. Chips read giver → target. Duplicates collapse:
 * one potion per target (the target's own when they carry one) and the lowest Cure Wounds slot per healer and target.
 * The most hurt member's best option comes first, so its number key and the default focus pick it.
 */
export function tendWounds(heals:ActionOption[],party:Member[]):ActionRow|null{
 if(!heals.length)return null;
 const member=(id:string)=>party.find(m=>m.id===id),name=(id:string)=>member(id)?.name??id;
 const hurt=(id:string)=>{const m=member(id);return m?.maxHp?Math.max(0,m.hp??0)/m.maxHp:1;};
 const chips=new Map<string,{name:string;action:ActionOption;giver:string;target:string}>();
 for(const a of heals){const giver=a.actorId??'hero',target=a.targetId??giver,rank=healRank(a),potion=rank===2;
  const key=potion?'potion:'+target:`${rank}:${giver}:${target}`,held=chips.get(key);
  if(held&&!(potion&&giver===target&&held.giver!==target))continue;
  chips.set(key,{giver,target,action:a,name:potion?`Potion → ${name(target)}`:rank===1?`Second Wind · ${name(giver)}`:giver===target?`${name(giver)} heals self`:`${name(giver)} heals ${name(target)}`});}
 const options=[...chips.values()].map((c,i)=>({...c,i})).sort((a,b)=>hurt(a.target)-hurt(b.target)||healRank(a.action)-healRank(b.action)||a.i-b.i);
 return {kind:'choices',key:'tend',label:'Tend wounds',options:options.map(o=>({id:o.action.id,name:o.name,action:o.action}))};
}
/**
 * One row per decision with several targets: a check every party member may attempt ("Inspect tracks · Alden/Mira/Oren"), attacks, and moves. The engine still receives the chosen option's own action id.
 * With `tend`, every heal joins one Tend wounds row where the first heal was listed.
 */
export function actionRows(actions:ActionOption[],party:Member[],{tend=false}:{tend?:boolean}={}):ActionRow[]{
 const member=(a:ActionOption)=>{const p=party.find(m=>a.id.endsWith(':'+m.id)&&a.label.endsWith(' · '+m.name));return p?{key:a.id.slice(0,-p.id.length-1),label:a.label.slice(0,-p.name.length-3),id:p.id,name:p.name}:undefined;};
 const grouped=(a:ActionOption)=>member(a)??(a.kind==='attack'||a.kind==='move'?{key:'kind:'+a.kind,label:a.kind==='attack'?'Attack':'Move',id:a.id,name:choiceName(a)}:undefined);
 const heals=tend?actions.filter(healAction):[],tended=tendWounds(heals,party);
 const rows:ActionRow[]=[];
 for(const a of actions){
  if(tended&&heals.includes(a)){if(a===heals[0])rows.push(tended);continue;}
  const g=grouped(a);const row=g&&rows.find(r=>r.kind==='choices'&&r.key===g.key&&r.label===g.label);
  if(g&&row&&row.kind==='choices')row.options.push({id:g.id,name:g.name,action:a});
  else if(g&&actions.filter(b=>{const o=grouped(b);return o?.key===g.key&&o.label===g.label;}).length>1)rows.push({kind:'choices',key:g.key,label:g.label,check:a.check,options:[{id:g.id,name:g.name,action:a}]});
  else rows.push({kind:'single',action:a});}
 return rows;
}
/** A companion's reply waits until the question has been read (#96): the story box's last page, or a skip. */
export const answersStory=(a:Pick<ActionOption,'id'>)=>a.id.startsWith('bond_reply:');
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
/** The action panel's rows in the order shown (#62): exploration under Look, Talk, Act and Move, combat as one list; check-ins sit with the party, inventory and quests in their own panels. A finished chapter lists nothing (#113). The guide's odds sample reads the same rows (#119). */
export function panelRows(save:Pick<PublicSave,'actions'|'mode'|'tactical'|'party'>,selected:string){const available=save.mode==='complete'?[]:save.actions.filter(a=>a.kind!=='inventory'&&a.kind!=='quest').filter(a=>!save.tactical||save.mode!=='combat'||a.kind!=='move'),rowsOf=(list:ActionOption[])=>actionRows(list.filter(a=>!a.id.startsWith('checkin:')),save.party,{tend:save.mode!=='combat'});const focus=focusedActions(available,selected),rows=rowsOf(focus.actions),groups:{verb:Verb|null;rows:ActionRow[]}[]=save.mode==='combat'?[{verb:null,rows}]:verbGroups(rows);return {focus,many:rowsOf(available).length>6,groups,ordered:groups.flatMap(g=>g.rows)};}
/** The row's member label: attacks name no member, while a choice between party members names the best. */
export function oddsWho(row:ActionRow,party:{id:string;name:string}[],best:Best){const check=row.kind==='single'?row.action.check:row.check;return check?.attribute==='attack'?'':(row.kind==='choices'&&row.options.length>1&&row.options.every(o=>party.some(m=>m.id===o.id))?'Best: ':'')+best.name;}
export interface Best {id:string;name:string;action:ActionOption;odds:Odds}
/** The best-placed member (or target) for a row's check: the highest public odds, ties keeping the listed order. Null when the row advertises no odds. */
export function bestChoice(row:ActionRow,party:{id:string;name:string}[]):Best|null{
 const candidates=row.kind==='single'?[{id:row.action.actorId??'',name:party.find(m=>m.id===row.action.actorId)?.name??'',action:row.action}]:row.options;
 let best:Best|null=null;
 for(const c of candidates){const odds=oddsFor(c.action.check);if(odds&&(!best||odds.percent>best.odds.percent))best={...c,odds};}
 return best;
}
