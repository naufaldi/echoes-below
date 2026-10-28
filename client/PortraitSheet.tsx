import {useEffect,useState,useSyncExternalStore} from 'react';
import {Canvas} from '@react-three/fiber';
import PortraitStudio,{setPortraitReadback} from './PortraitStudio';
import {usePortrait} from './Portrait';
import {portraitTimings,subscribePortraits,portraitVersion} from './portrait-store';
import type {PortraitSubject} from './portrait-look';
/** Local contact sheet for CHARACTERS.md §6.3: every class, the companions' defaults, palettes, races, enemies and NPCs, with snapshot timings. `?portraits&sync` measures a blocking readback instead. */
const S=(id:string,classId:PortraitSubject['classId'],appearanceId='ember',raceId?:PortraitSubject['raceId']):PortraitSubject=>({id,classId,appearanceId,raceId});
const SHEET:[string,PortraitSubject][]=[
 ['Hero · Fighter',S('hero','guardian')],['Hero · Rogue',S('hero','scout')],['Hero · Wizard',S('hero','adept')],['Hero · Cleric',S('hero','cleric')],
 ['Mira (default)',S('mira','scout','moss','elf')],['Oren (default)',S('oren','guardian','ember','dwarf')],['Mira · Wizard',S('mira','adept','moss')],['Oren · Cleric',S('oren','cleric','ember')],
 ['Fighter · ember',S('hero','guardian','ember')],['Fighter · moss',S('hero','guardian','moss')],['Fighter · moon',S('hero','guardian','moon')],['Rogue · moon',S('hero','scout','moon')],
 ['Fighter · dwarf',S('hero','guardian','ember','dwarf')],['Fighter · elf',S('hero','guardian','ember','elf')],['Wizard · halfling',S('hero','adept','ember','halfling')],['Cleric · elf · moon',S('hero','cleric','moon','elf')],
 ['Goblin',S('goblin-1','goblin','moss')],['Commander Vark',S('vark','vark','moss')],['Skeleton',S('skeleton-1','skeleton','moss')],['Slime',S('slime-1','slime','moss')],['Spider',S('spider-1','spider','moss')],
 ['Courier (NPC)',S('courier','scout','ash')],['Ilyra (NPC)',S('index-librarian','guardian','bronze')],['Archive apprentice (NPC)',S('ink-apprentice','adept','moon')],
];
function Tile({label,subject}:{label:string;subject:PortraitSubject}){const {url,ready,source}=usePortrait(subject);return <figure style={{margin:0,width:192}}><div style={{width:192,height:192,borderRadius:6,background:'repeating-conic-gradient(#2a2f2c 0 25%,#202422 0 50%) 0 0/24px 24px',display:'grid',placeItems:'center',color:'#8a8f86'}}>{ready&&url?<img src={url} alt={label} style={{width:192,height:192,display:'block'}}/>:'…'}</div><figcaption style={{fontSize:12,marginTop:6,display:'flex',justifyContent:'space-between',gap:8}}><span>{label}</span>{ready&&<span style={{display:'flex',gap:6,alignItems:'center'}}><span style={{opacity:.55}}>{source}</span>{url&&<img src={url} alt="" style={{width:42,height:42,borderRadius:'50%',border:'1px solid #555',background:'#3b3326',objectFit:'cover'}}/>}</span>}</figcaption></figure>;}
const ms=(n:number)=>n.toFixed(2);
export default function PortraitSheet(){
 const [sync]=useState(()=>new URLSearchParams(location.search).has('sync'));useEffect(()=>setPortraitReadback(sync?'sync':'async'),[sync]);
 useSyncExternalStore(subscribePortraits,portraitVersion);const timings=[...portraitTimings()],warm=timings.slice(1),avg=(f:(t:typeof timings[number])=>number,list=warm)=>list.length?list.reduce((n,t)=>n+f(t),0)/list.length:0,max=(f:(t:typeof timings[number])=>number,list=warm)=>Math.max(0,...list.map(f));
 return <main style={{background:'#121614',color:'#e8e2d4',minHeight:'100vh',padding:24,fontFamily:'system-ui,sans-serif'}}>
  <h1 style={{fontSize:20,fontWeight:500,margin:'0 0 4px'}}>Portrait contact sheet</h1><p style={{fontSize:12,opacity:.7,margin:'0 0 18px'}}>512×512 renders from the in-game models, shown at 192 px and in the 42 px party circle. Readback: {sync?'sync':'async'}. Canvases on page: <b data-canvas-count>{typeof document==='undefined'?0:document.querySelectorAll('canvas').length}</b></p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,192px)',gap:'18px 16px'}}>{SHEET.map(([label,subject])=><Tile key={label} label={label} subject={subject}/>)}</div>
  <section data-timings style={{fontSize:12,marginTop:24,fontVariantNumeric:'tabular-nums'}}><b>{timings.length}/{SHEET.length} snapshots.</b> Cold (first): {timings[0]?`first-use draw ${ms(timings[0].warmMs)} ms, compile wait ${ms(timings[0].compileMs)} ms`:'–'}. In-frame snapshot (render, output pass, readback {sync?'':'issue'}): all <b>{ms(avg(t=>t.renderMs,timings))} ms</b> average, max <b>{ms(max(t=>t.renderMs,timings))} ms</b>. Idle time, warm average: prepare {ms(avg(t=>t.prepareMs))} ms, first-use draw {ms(avg(t=>t.warmMs))} ms (max {ms(max(t=>t.warmMs))}); compile wait {ms(avg(t=>t.compileMs))} ms. Async: readback wait {ms(avg(t=>t.readbackMs))} ms, PNG encode {ms(avg(t=>t.encodeMs))} ms.
   <pre data-timings-json style={{display:'none'}}>{JSON.stringify(timings)}</pre></section>
  <Canvas style={{position:'fixed',right:0,bottom:0,width:8,height:8}} gl={{antialias:true}}><PortraitStudio/></Canvas>
 </main>;
}
