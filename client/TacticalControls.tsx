import {useState} from 'react';
import type {PublicSave,ActionOption} from '../shared/types';
export default function TacticalControls({save,onChoose,disabled}:{save:PublicSave;onChoose:(action:ActionOption)=>void;disabled:boolean}){
 const [destination,setDestination]=useState('');const t=save.tactical;if(!t||!save.turn)return null;
 const c=t.actors[save.turn.actorId],actor=[...save.party,...save.enemies].find(a=>a.id===save.turn!.actorId)!;const moves=save.actions.filter(a=>a.kind==='move');const picked=moves.find(a=>a.id===destination)??moves[0];
 return <section className="tactical-controls" aria-label="Tactical turn"><strong>{actor.name}'s turn</strong><div>{c.economy.action?'Action ready':'Action spent'} · {c.economy.bonus?'Bonus ready':'Bonus spent'} · {c.economy.movementFeet} ft</div>{c.slots.length>0&&<small>Spell slots {c.slots.map((n,i)=>`${i+1}: ${n}/${c.maxSlots[i]}`).join(' · ')}</small>}{moves.length>0&&<><label>Move destination<select aria-label="Move destination" value={picked?.id??''} onChange={e=>setDestination(e.target.value)}>{moves.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select></label><button disabled={disabled||!picked} onClick={()=>picked&&onChoose(picked)}>Preview movement</button><small>Or select a highlighted floor tile.</small></>}</section>;
}
