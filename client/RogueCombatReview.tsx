import {useEffect,useState} from 'react';
import World from './World';
import {cueFor,type WorldCue} from './combat-cue';
import type {PublicSave} from '../shared/types';
/** Local-only rendering fixture: real engine outcomes through the real game World, no live save mutation. */
export default function RogueCombatReview(){
 const [fixture,setFixture]=useState<{before:PublicSave;after:PublicSave;moved:PublicSave;dodged:PublicSave;hurt:PublicSave}>(),[save,setSave]=useState<PublicSave>(),[cue,setCue]=useState<WorldCue>(),[n,setN]=useState(0);
 useEffect(()=>{fetch('/__rogue-combat-fixture.json').then(r=>r.json()).then(f=>{setFixture(f);setSave(f.before);});},[]);
 if(!fixture||!save)return <p>Loading local combat review…</p>;
 function shoot(){if(!fixture)return;const a=structuredClone(fixture.after),log=a.logs.at(-1)!;log.id+='-review-'+n;setN(n+1);setSave(a);setCue(cueFor(log.id,log.speaker,log.animation,log.text,[...fixture.before.party,...fixture.before.enemies],[...a.party,...a.enemies]));}
 function melee(){if(!fixture)return;const a=structuredClone(fixture.before);a.logs.push({...fixture.after.logs.at(-1)!,id:'melee-review-'+n,speaker:'hero',animation:'melee',text:'Elf Rogue QA previews a dagger reaction.'});setN(n+1);setSave(a);setCue(undefined);}
 return <div style={{position:'fixed',inset:0,background:'#17231f'}}><World save={save} selected="hero" onSelect={()=>{}} reduced={false} heroClass="scout" heroRace="elf" heroAppearance="moss" companions={{mira:{classId:'scout',raceId:'elf',appearanceId:'moss'},oren:{classId:'guardian',raceId:'dwarf',appearanceId:'ember'}}} focus={null} cue={cue}/><div style={{position:'absolute',left:20,top:20,padding:16,background:'#101a18',color:'#fff'}}><strong>LOCAL PROTOTYPE · actual Echoes Below renderer</strong><p>Experimental rig: clips render; motion quality and licensing still under review.</p>{(['ember','moss','moon'] as const).map(p=><button key={p} onClick={()=>{const next=structuredClone(save);next.party[0].appearanceId=p;setSave(next);}}>Palette {p}</button>)}<button onClick={shoot}>Play ranged attack</button><button onClick={melee}>Preview melee reaction</button><button onClick={()=>{const a=structuredClone(fixture.dodged);a.logs.at(-1)!.id+='-dodge-'+n;setN(n+1);setSave(a);setCue(undefined);}}>Play dodge</button><button onClick={()=>{setSave(fixture.hurt);setCue(undefined);}}>Preview hit</button><button onClick={()=>{setSave(fixture.moved);setCue(undefined);}}>Play movement</button><button onClick={()=>{setSave(fixture.before);setCue(undefined);}}>Reset</button></div></div>;
}
