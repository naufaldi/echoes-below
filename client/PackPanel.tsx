import {useRef,useState} from 'react';
import {useModal} from './Modal';
import type {ActionOption,PublicSave} from '../shared/types';
import {ABILITIES,modifier,pendingImprovements,type Ability} from '../shared/curated-rules';
import {ITEMS,usedCopies,type ItemId} from '../shared/logistics';
export default function PackPanel({save,onChoose,onClose}:{save:PublicSave;onChoose:(a:ActionOption)=>void;onClose:()=>void}){
 const [actorId,setActorId]=useState('hero');const [first,setFirst]=useState<Ability>('strength'),[second,setSecond]=useState<Ability>('strength');const panel=useRef<HTMLElement>(null);useModal(panel,{onClose});const pack=save.logistics;if(!pack)return null;const actor=save.party.find(a=>a.id===actorId)!;const equipment=pack.equipped[actorId];const gear=save.actions.filter(a=>a.kind==='inventory'&&a.actorId===actorId&&!a.id.startsWith('advance:')),camp=save.actions.filter(a=>a.kind==='camp');
 const character=save.tactical?.actors[actorId],milestone=character?pendingImprovements(character)[0]:undefined;
 const pair=[first,second].sort((a,b)=>ABILITIES.indexOf(a)-ABILITIES.indexOf(b));
 const improvement=save.actions.find(a=>a.id===`advance:${actorId}:${milestone}:${pair[0]}:${pair[1]}`);
 const title=(name:string)=>name[0].toUpperCase()+name.slice(1);
 return <div className="pack-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section className="pack-panel" ref={panel} role="dialog" aria-modal="true" aria-label="Inventory and camp">
 <header><h2>Inventory & camp</h2><button data-autofocus onClick={onClose} aria-label="Close inventory">×</button></header>
 <p>Shared supplies: {save.party.reduce((n,a)=>n+a.potions,0)} potions · {save.party.reduce((n,a)=>n+a.rations,0)} rations</p>
 <label>Party member<select value={actorId} onChange={e=>setActorId(e.target.value)}>{save.party.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
 <p><strong>{actor.name} · AC {actor.defense}</strong><br/>{ITEMS[equipment.armor].name}{equipment.shield?' · Shield':''}{equipment.cloak?' · Keeper’s ward cloak':''}</p>
 <p className="pack-note">Equipment changes your defenses. Outfit models currently follow your class.</p>
 {character&&<section aria-label="Character abilities"><h3>Character abilities</h3><div className="pack-items">{ABILITIES.map(ability=><div key={ability}><strong>{title(ability)}</strong><span>{character.abilities[ability]} · modifier {modifier(character.abilities[ability])>=0?'+':''}{modifier(character.abilities[ability])}</span></div>)}</div>
 {milestone&&<div className="ability-improvement"><h3>Level {milestone} improvement available</h3><p>Add two points to one ability, or one point each to two abilities. Maximum 20. The choice is permanent.</p><label>First point<select value={first} onChange={e=>setFirst(e.target.value as Ability)}>{ABILITIES.map(a=><option key={a} value={a}>{title(a)}</option>)}</select></label><label>Second point<select value={second} onChange={e=>setSecond(e.target.value as Ability)}>{ABILITIES.map(a=><option key={a} value={a}>{title(a)}</option>)}</select></label><p>{[...new Set([first,second])].map(a=>`${title(a)}: ${character.abilities[a]} → ${character.abilities[a]+(a===first?1:0)+(a===second?1:0)}`).join(' · ')}</p><button className="primary" disabled={!improvement} onClick={()=>{if(improvement){onClose();onChoose(improvement);}}}>Review improvement</button>{!improvement&&<p role="status">Choose scores totaling no more than 20. Improvements require exploration and a conscious character.</p>}</div>}</section>}
 <h3>Equipment</h3><div className="pack-items">{(Object.keys(ITEMS) as ItemId[]).filter(id=>pack.owned[id]>0).map(id=><div key={id}><strong>{ITEMS[id].name}</strong><span>{pack.owned[id]} owned · {pack.owned[id]-usedCopies(pack,id)} available</span></div>)}</div>
 <div className="pack-actions">{gear.map(a=><button key={a.id} onClick={()=>{onClose();onChoose(a);}}>{a.label.replace(' · '+actor.name,'')}</button>)}</div>
 <h3>Quest items</h3><p>{[save.inventory.guardKey?'Prison key':null,save.inventory.ledger?'Supply ledger':null,save.inventory.seal?'Resonance seal':null].filter(Boolean).join(' · ')||'No quest items yet.'}</p><small>Quest items stay with the party and cannot be discarded.</small>
 <h3>Camp</h3>{camp.length?<div className="pack-actions">{camp.map(a=><button key={a.id} onClick={()=>{onClose();onChoose(a);}}>{a.label}</button>)}</div>:<p>No rest is available here. Clear a campsite and check your supplies.</p>}
 </section></div>;
}
