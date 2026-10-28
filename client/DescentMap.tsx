import {useEffect,useLayoutEffect,useMemo,useRef,useState,type KeyboardEvent as KeyPress} from 'react';
import {descentMap,roomSettled,FORK_LINE,type MapRoom} from './descent-map';
import type {PublicSave} from '../shared/types';
import {useModal} from './Modal';

// #63 Descent map: a page of the journal with the way down inked on it. Read-only; it never travels.
type Point={x:number;y:number;row:number};
const NAV=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
const note:Record<MapRoom['state'],string>={cleared:'Behind you.',current:'You are here.',ahead:'Ahead, in this chapter.',unlit:'Not yet reached.'};

/** A switchback path: straight along a depth, then a curve out past the row's end and down into the next. */
function trail(p:Point[]){return p.map((b,i)=>{if(!i)return `M${b.x} ${b.y}`;const a=p[i-1];if(a.row===b.row)return `L${b.x} ${b.y}`;const out=a.row%2?-72:72;return `C${a.x+out} ${a.y} ${b.x+out} ${b.y} ${b.x} ${b.y}`;}).join(' ');}
/** Arrow keys move by what the eye sees: along a row to the nearest neighbour that way, or to the nearest node in the row above or below. */
function step(points:Point[],from:number,key:string){
 if(key==='Home')return 0;if(key==='End')return points.length-1;
 const a=points[from];if(!a)return from;const near=(row:number,dir=0)=>points.map((p,i)=>({p,i})).filter(({p})=>p.row===row&&(!dir||(p.x-a.x)*dir>1)).sort((m,n)=>Math.abs(m.p.x-a.x)-Math.abs(n.p.x-a.x))[0]?.i??from;
 return key==='ArrowLeft'?near(a.row,-1):key==='ArrowRight'?near(a.row,1):near(a.row+(key==='ArrowDown'?1:-1));
}

/** `M` opens and closes the map. Held keys, modified keys and typing never toggle it, and it never opens over another dialog. */
export function useMapKey(enabled:boolean,open:boolean,setOpen:(open:boolean)=>void){
 useEffect(()=>{if(!enabled)return;const key=(e:KeyboardEvent)=>{
  if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.key.toLowerCase()!=='m')return;
  const t=e.target as HTMLElement|null;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;
  if(!open&&document.querySelector('[aria-modal="true"]'))return;
  e.preventDefault();setOpen(!open);};
 window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[enabled,open,setOpen]);
}
export const MapIcon=()=><svg className="map-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 3h8c2.6 0 2.6 4 0 4H6c-2.6 0-2.6 4 0 4h6c2.6 0 2.6 4 0 4H5"/><circle cx="4" cy="15" r="1.5"/></svg>;
const ForkMark=()=><svg className="map-fork" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 11V6.5M6 6.5 2.5 1.5M6 6.5l3.5-5"/></svg>;

export default function DescentMap({save,onClose}:{save:PublicSave;onClose:()=>void}){
 const settled=roomSettled(save),map=useMemo(()=>descentMap(save.scene.id,settled),[save.scene.id,settled]),rooms=map.flatMap(d=>d.rooms);
 const at=Math.max(0,rooms.findIndex(r=>r.state==='current'));
 const[focus,setFocus]=useState(rooms[at].id),[hover,setHover]=useState<string|null>(null),[sheet,setSheet]=useState<{w:number;h:number;points:Point[]}>({w:0,h:0,points:[]});
 const panel=useRef<HTMLElement>(null),page=useRef<HTMLDivElement>(null);
 // Open on "you are here"; Escape closes, Tab stays inside (the close button and the focused room) and focus returns to whatever opened the map (#97).
 useModal(panel,{onClose,initial:'[aria-current]'});
 // Node centres in the page's own pixels. The panel enters scaled, so divide the scale back out.
 useLayoutEffect(()=>{const el=page.current;if(!el)return;const measure=()=>{const box=el.getBoundingClientRect(),k=box.width/el.offsetWidth||1;
  setSheet({w:el.offsetWidth,h:el.offsetHeight,points:[...el.querySelectorAll<HTMLElement>('.map-node')].map(n=>{const r=n.getBoundingClientRect();return {x:(r.left+r.width/2-box.left)/k,y:(r.top+r.height/2-box.top)/k,row:Number(n.dataset.row)};})});};
  measure();const resize=new ResizeObserver(measure);resize.observe(el);return()=>resize.disconnect();},[map]);
 function keys(e:KeyPress<HTMLElement>){
  const from=rooms.findIndex(r=>r.id===(document.activeElement as HTMLElement|null)?.dataset.id);if(from<0||!NAV.includes(e.key))return;
  e.preventDefault();const id=rooms[step(sheet.points,from,e.key)].id;setFocus(id);page.current?.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus();
 }
 const shown=rooms.find(r=>r.id===(hover??focus))??rooms[at],depth=map.find(d=>d.rooms.includes(shown))!;
 return <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={panel} className="modal descent-map" role="dialog" aria-modal="true" aria-labelledby="descent-map-title" onKeyDown={keys}>
  <button aria-label="Close map" className="close" onClick={onClose}>×</button>
  <div className="eyebrow">THE WAY DOWN</div><h2 id="descent-map-title">The descent</h2>
  <div className="map-page" ref={page}>
   {sheet.points.length>0&&<svg className="map-trail" width={sheet.w} height={sheet.h} aria-hidden="true"><filter id="map-ink"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter><path className="ahead" d={trail(sheet.points.slice(at))}/><path className="taken" d={trail(sheet.points.slice(0,at+1))}/></svg>}
   <ol className="map-depths">{map.map((d,row)=><li key={d.chapter} className={'map-depth '+d.state+(row%2?' reverse':'')}>
    <div className="map-depth-name" aria-hidden="true"><span>{d.numeral}</span>{d.name}</div>
    <ol className="map-rooms" aria-label={d.label}>{d.rooms.map(r=><li key={r.id} data-id={r.id} className={'map-room '+r.state+(r.settled?' settled':'')} tabIndex={r.id===focus?0:-1} aria-label={r.label} aria-current={r.state==='current'?'location':undefined} onFocus={()=>setFocus(r.id)} onPointerEnter={()=>setHover(r.id)} onPointerLeave={()=>setHover(null)}>
     <span className="map-node" data-row={row}>{r.state==='cleared'||r.settled?'✓':r.state==='unlit'?'':r.number}{r.fork&&<ForkMark/>}</span>{r.title&&<span className="map-room-name">{r.title}</span>}
    </li>)}</ol>
   </li>)}</ol>
  </div>
  <footer className="map-caption" aria-hidden="true"><div><small>CHAPTER {depth.numeral} · ROOM {shown.number}</small><strong>{shown.title??'An unlit room'}</strong><p>{note[shown.state]}{shown.settled&&' Your choice here is made.'}{shown.fork&&<em> {FORK_LINE}.</em>}</p></div>
   <ul className="map-legend"><li><span className="map-node">✓</span>Behind you</li><li><span className="map-node here"/>You are here</li><li><ForkMark/>{FORK_LINE}</li></ul></footer>
 </section></div>;
}
