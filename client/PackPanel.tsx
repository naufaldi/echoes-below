import {useEffect,useRef,useState} from 'react';
import type {ActionOption,PublicSave} from '../shared/types';
import {ITEMS,usedCopies,type ItemId} from '../shared/logistics';
export default function PackPanel({save,onChoose,onClose}:{save:PublicSave;onChoose:(a:ActionOption)=>void;onClose:()=>void}){
 const [actorId,setActorId]=useState('hero');const panel=useRef<HTMLElement>(null);useEffect(()=>{const previous=document.activeElement as HTMLElement|null;return()=>previous?.focus();},[]);const pack=save.logistics;if(!pack)return null;const actor=save.party.find(a=>a.id===actorId)!;const equipment=pack.equipped[actorId];const gear=save.actions.filter(a=>a.kind==='inventory'&&a.actorId===actorId),camp=save.actions.filter(a=>a.kind==='camp');
 return <div className="pack-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section className="pack-panel" ref={panel} role="dialog" aria-modal="true" aria-label="Inventory and camp" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose();}if(e.key==='Tab'){const controls=[...panel.current!.querySelectorAll<HTMLElement>('button:not(:disabled),select')];e.preventDefault();const index=controls.indexOf(document.activeElement as HTMLElement);controls[(index+(e.shiftKey?-1:1)+controls.length)%controls.length ]?.focus();}}}>
 <header><h2>Inventory & camp</h2><button autoFocus onClick={onClose} aria-label="Close inventory">×</button></header>
 <p>Shared supplies: {save.party.reduce((n,a)=>n+a.potions,0)} potions · {save.party.reduce((n,a)=>n+a.rations,0)} rations</p>
 <label>Party member<select value={actorId} onChange={e=>setActorId(e.target.value)}>{save.party.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
 <p><strong>{actor.name} · AC {actor.defense}</strong><br/>{ITEMS[equipment.armor].name}{equipment.shield?' · Shield':''}{equipment.cloak?' · Keeper’s ward cloak':''}</p>
 <p className="pack-note">Equipment changes your defenses. Outfit models currently follow your class.</p>
 <div className="pack-items">{(Object.keys(ITEMS) as ItemId[]).filter(id=>pack.owned[id]>0).map(id=><div key={id}><strong>{ITEMS[id].name}</strong><span>{pack.owned[id]} owned · {pack.owned[id]-usedCopies(pack,id)} available</span></div>)}</div>
 <div className="pack-actions">{gear.map(a=><button key={a.id} onClick={()=>{onClose();onChoose(a);}}>{a.label.replace(' · '+actor.name,'')}</button>)}</div>
 <h3>Quest items</h3><p>{[save.inventory.guardKey?'Prison key':null,save.inventory.ledger?'Supply ledger':null,save.inventory.seal?'Resonance seal':null].filter(Boolean).join(' · ')||'No quest items yet.'}</p><small>Quest items stay with the party and cannot be discarded.</small>
 <h3>Camp</h3>{camp.length?<div className="pack-actions">{camp.map(a=><button key={a.id} onClick={()=>{onClose();onChoose(a);}}>{a.label}</button>)}</div>:<p>No rest is available here. Clear a campsite and check your supplies.</p>}
 </section></div>;
}
