import {useEffect,useLayoutEffect,useRef,type RefObject} from 'react';
import {confirmationFor,splitCloses} from './confirmation';
import {oddsFor,checkBreakdown} from '../shared/odds';
import {OddsBand} from './ActionPanel';
import type {ActionOption,PublicSave,Preview} from '../shared/types';

export default function ConfirmCard({pending,save,busy,instantConfirm,lock,confirmFrom,setPending,setPreview,reconsider,confirm}:{pending:ActionOption|null;save:PublicSave|null;busy:string;instantConfirm:boolean;lock:RefObject<boolean>;confirmFrom:RefObject<HTMLElement|null>;setPending:(action:ActionOption|null)=>void;setPreview:(preview:Preview|null)=>void;reconsider:()=>void;confirm:()=>void}){
 const confirmPop=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(!pending)confirmFrom.current=null;},[pending]);
 useLayoutEffect(()=>{const el=confirmPop.current;if(!el)return;
  /** Sit beside the action panel, level with the chosen row or chip, and scale out of it. Anything opened elsewhere (scene, journal, free text) is centered. */
  /** The dimmed story box stays readable under it (#96): when they share columns, the card's bottom stops above the box. */
  const place=()=>{const from=confirmFrom.current,panel=from?.isConnected?from.closest('.actions-panel'):null;const p=panel?.getBoundingClientRect(),beside=!!p&&p.left-12>=el.offsetWidth+16;el.dataset.anchor=beside?'panel':'center';if(!from||!p||!beside){el.style.top=el.style.right='';return;}const r=from.getBoundingClientRect(),mid=r.top+r.height/2,story=document.querySelector('.story-box')?.getBoundingClientRect(),right=p.left-12,floor=story&&story.left<right&&story.right>right-el.offsetWidth?story.top-12:innerHeight-16,top=Math.max(76,Math.min(mid-28,floor-el.offsetHeight));el.style.top=top+'px';el.style.right=innerWidth-right+'px';el.style.setProperty('--origin-y',Math.max(14,Math.min(el.offsetHeight-14,mid-top))+'px');};
  /** Only a click outside dismisses: a press that travels 5px or more at any point before release is a camera orbit: the card stays open and Enter still confirms. */
  let press:{id:number;x:number;y:number;drag:boolean}|null=null;
  const down=(e:PointerEvent)=>{const t=e.target as Element;press=!lock.current&&!el.contains(t)&&!t.closest?.('.actions-panel')?{id:e.pointerId,x:e.clientX,y:e.clientY,drag:false}:null;};
  const move=(e:PointerEvent)=>{if(press&&press.id===e.pointerId&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>=5)press.drag=true;};
  const up=(e:PointerEvent)=>{const p=press;press=null;if(!p||p.id!==e.pointerId||lock.current)return;if(p.drag||Math.hypot(e.clientX-p.x,e.clientY-p.y)>=5){if(!el.contains(document.activeElement))el.querySelector<HTMLElement>('.primary')?.focus({preventScroll:true});}else{setPending(null);setPreview(null);}};
  const cancel=()=>{press=null;};
  place();addEventListener('resize',place);document.addEventListener('scroll',place,true);document.addEventListener('pointerdown',down);document.addEventListener('pointermove',move);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',cancel);return()=>{removeEventListener('resize',place);document.removeEventListener('scroll',place,true);document.removeEventListener('pointerdown',down);document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancel);};},[pending]);
 if(!pending)return null;
 const strong=confirmationFor(pending)==='strong',copy=splitCloses(pending.description),check=pending.check,odds=oddsFor(check),breakdown=check?checkBreakdown(check):[],attack=check?.attribute==='attack',note=check&&!attack?(save?.party.some(m=>pending.id.endsWith(':'+m.id))?'One try each. The roll stands.':'One try. The roll stands.'):'';
  const body=<><h2 id="confirm-title">{pending.label}</h2>{copy.text&&<p>{copy.text}</p>}{copy.closes&&<div className="confirm-closes"><b>THIS PATH CLOSES</b>{copy.closes}</div>}{check&&<div className="check-preview"><div className="check-head"><span>{attack?<>Attack · <b>Defense {check.dc}</b></>:<>{check.attribute.charAt(0).toUpperCase()+check.attribute.slice(1)} check · <b>DC {check.dc}</b></>}</span>
{odds&&<OddsBand odds={odds} always/>}</div>{breakdown.length>0&&<div className="breakdown">{breakdown.join(' · ')}</div>}</div>}{note&&<small>{note}</small>}<div className="modal-actions"><button onClick={reconsider} disabled={!!busy}>Reconsider</button><button className="primary" disabled={!!busy} onClick={()=>void confirm()} autoFocus>{busy?'Resolving…':check?'Roll':'Go on'}</button></div></>;
  return strong?<div className="modal-backdrop"><section key={pending.id} className="modal confirm" data-instant={instantConfirm||undefined} role="dialog" aria-modal="true" aria-labelledby="confirm-title">{body}</section></div>:<section key={pending.id} ref={confirmPop} className="confirm-pop" data-instant={instantConfirm||undefined} role="dialog" aria-labelledby="confirm-title">{body}</section>;

}
