import {useEffect,useRef,type ReactNode} from 'react';
import {focusedActions,actionRows,verbGroups,bestChoice,answersStory,type ActionRow} from './action-focus';
import TacticalControls from './TacticalControls';
import {actorDisplayName} from '../shared/visual-identity';
import {oddsFor,checkBreakdown,type Odds} from '../shared/odds';
import {feetFromMetres} from '../shared/movement';
import type {ActionOption,PublicCheck,PublicSave} from '../shared/types';

/** How a choice was made: a number key or a keyboard press opens its confirmation without motion. */
export type Choose=(a:ActionOption,from?:HTMLElement,keyboard?:boolean)=>void;
const checkName=(c:PublicCheck)=>c.attribute==='attack'?`Defense ${c.dc}`:`${c.attribute} · DC ${c.dc}`;
const edge=(c:PublicCheck)=>c.advantage&&!c.disadvantage?' · advantage':c.disadvantage&&!c.advantage?' · disadvantage':'';
/** Band word with the exact figure revealed on hover or focus; the figure stays in the accessible text. */
export function OddsBand({odds,always=false}:{odds:Odds;always?:boolean}){
 return <span className={'odds'+(always?' always':'')} data-band={odds.band==='Long shot'?'long':odds.band.toLowerCase()}>{odds.band}<b className="odds-pct"> {odds.percent}%</b></span>;
}
function CheckTag({row,party}:{row:ActionRow;party:{id:string;name:string}[]}){
 const check=row.kind==='single'?row.action.check:row.check;if(!check)return null;
 const best=bestChoice(row,party),members=row.kind==='choices'&&row.options.every(o=>party.some(m=>m.id===o.id));
 return <><small>{checkName(check)}{edge(check)}{members?' · one try each':''}</small>{best&&<span className="odds-line" title={checkBreakdown(best.action.check!).join(' · ')}>{best.name&&check.attribute!=='attack'&&<span className="odds-who">{members&&row.kind==='choices'&&row.options.length>1?'Best: ':''}{best.name}</span>}<OddsBand odds={best.odds}/></span>}</>;
}
/** The action panel (#62): story choices grouped under Look, Talk, Act and Move. Combat keeps one ordered list. Number keys 1–9 pick rows in the order shown. */
/** `reading`: the story box has not reached its last page, so replies to it stay visible but disabled. */
/** `onReveal`: the panel is a closed drawer (narrow windows, #97); a number key that needs to focus a choice opens it first. */
export default function ActionPanel({save,selected,onSelect,busy,pendingId,keysEnabled,reading=false,onChoose,onReveal,children}:{save:PublicSave;selected:string;onSelect:(id:string)=>void;busy:boolean;pendingId?:string;keysEnabled:boolean;reading?:boolean;onChoose:Choose;onReveal?:()=>void;children?:ReactNode}){
 const available=save.actions.filter(a=>a.kind!=='inventory'&&a.kind!=='quest').filter(a=>!save.tactical||save.mode!=='combat'||a.kind!=='move');
 const focusResult=focusedActions(available,selected),rows=actionRows(focusResult.actions.filter(a=>!a.id.startsWith('checkin:')),save.party,{tend:save.mode!=='combat'});
 const groups=save.mode==='combat'?[{verb:null,rows}]:verbGroups(rows),ordered=groups.flatMap(g=>g.rows);
 const list=useRef<HTMLDivElement>(null),keyed=useRef<ActionRow[]>([]),reveal=useRef(onReveal);keyed.current=ordered;reveal.current=onReveal;
 useEffect(()=>{if(!keysEnabled)return;
  const press=(e:KeyboardEvent)=>{
   if(e.altKey||e.ctrlKey||e.metaKey||e.repeat||!/^[1-9]$/.test(e.key))return;
   const target=e.target as HTMLElement|null;if(target?.closest?.('input,textarea,select,[contenteditable="true"],[role="dialog"]'))return;
   const n=Number(e.key),row=keyed.current[n-1],el=list.current?.querySelector<HTMLElement>(`[data-key="${n}"]`);if(!row||!el)return;e.preventDefault();
   if(row.kind==='single'){if(!(el as HTMLButtonElement).disabled)onChoose(row.action,el,true);return;}
   // A row with several members or targets moves focus to its best choice; Enter then picks it.
   const best=bestChoice(row,save.party),choice=el.querySelector<HTMLElement>(`[data-option="${best?.action.id??row.options[0]!.action.id}"]`)??el;if(!choice.getClientRects().length&&reveal.current){reveal.current();requestAnimationFrame(()=>choice.focus());}else choice.focus();
  };
  addEventListener('keydown',press);return()=>removeEventListener('keydown',press);},[keysEnabled,onChoose,save.party]);
 let n=0;
 const render=(r:ActionRow)=>{const key=++n,cap=key<=9?<kbd className="key-cap" aria-hidden="true">{key}</kbd>:null,shortcut=key<=9?String(key):undefined;
  if(r.kind==='single'){const held=reading&&answersStory(r.action);return <button key={r.action.id} data-key={key} aria-keyshortcuts={shortcut} className={'action'+(r.action.dangerous?' dangerous':'')+(pendingId===r.action.id?' chosen':'')+(held?' waiting':'')} disabled={busy||held} onClick={e=>onChoose(r.action,e.currentTarget,e.detail===0)}><span className="action-main"><strong>{r.action.label}</strong>{held?<small className="read-on">Read on to answer</small>:<CheckTag row={r} party={save.party}/>}</span>{cap}</button>;}
  const best=bestChoice(r,save.party);
  return <div key={r.key} data-key={key} className="action member-action" role="group" aria-label={r.label}><span className="action-main"><strong>{r.label}</strong><CheckTag row={r} party={save.party}/><span className="member-choices">{r.options.map(o=>{const odds=oddsFor(o.action.check);return <button key={o.id} data-option={o.action.id} aria-keyshortcuts={o.action.id===(best?.action.id??r.options[0]!.action.id)?shortcut:undefined} className={(o.action.dangerous?'dangerous':'')+(pendingId===o.action.id?' chosen':'')+(best?.action.id===o.action.id&&r.options.length>1?' best':'')} disabled={busy} onClick={e=>onChoose(o.action,e.currentTarget,e.detail===0)} aria-label={o.action.label+(odds?`, ${odds.band} ${odds.percent}%`:'')}>{odds&&<i className="odds-dot" data-band={odds.band==='Long shot'?'long':odds.band.toLowerCase()} aria-hidden="true"/>}{o.name}</button>;})}</span></span>{cap}</div>;};
 return <aside className="actions-panel" id="actions-panel"><div className="panel-label">{save.mode==='combat'?(save.activeReaction?'REACTION':save.turn?.actorId==='hero'?'YOUR TURN':'ACTIVE TURN'):'WHAT WILL YOU DO?'}{save.mode==='combat'?<span className="turn-chip"><i aria-hidden="true">↻</i>Round {save.turn?.round??1}</span>:<span>◇</span>}</div>{save.mode==='combat'&&!save.tactical&&<div className="turn-state"><span className={'turn-chip '+(save.turn?.actionRemaining?'ready':'spent')}><i aria-hidden="true">{save.turn?.actionRemaining?'●':'○'}</i>Action {save.turn?.actionRemaining?'ready':'spent'}</span><span className="turn-chip"><i aria-hidden="true">⇢</i>{feetFromMetres(save.turn?.movementM??0)} ft move</span></div>}{save.tactical&&<TacticalControls save={save} onChoose={onChoose} disabled={busy}/>}<label className="target-select"><span className="field-label">FOCUS</span><select aria-label="Choose target" value={selected} onChange={e=>onSelect(e.target.value)}><option value="">All available actions</option>{save.mode!=='combat'&&save.scene.entities.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}{save.enemies.map(e=><option key={e.id} value={e.id}>{actorDisplayName(e,save.enemies)} · {e.hp} HP</option>)}{save.party.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>{selected&&!focusResult.hasTargetActions&&!busy&&<p className="focus-empty" role="status">No action is currently available for this focus. {save.mode==='combat'?(save.actions.some(a=>a.id==='tactical:auto')?'Advance the active creature’s turn with its Let act button below.':'Check range, line of sight and remaining actions.'):'Choose another focus or show all actions.'}<button onClick={()=>onSelect('')}>Show all actions</button></p>}<div className="action-count">{rows.length} available {rows.length===1?'action':'actions'}{rows.length>8?' · scroll to explore':''}</div><div className="action-list" ref={list}>{groups.map(g=>g.verb?<section key={g.verb} className="verb-group" aria-label={g.verb}><h3 className="verb-label">{g.verb}</h3>{g.rows.map(render)}</section>:g.rows.map(render))}</div>{children}</aside>;
}
