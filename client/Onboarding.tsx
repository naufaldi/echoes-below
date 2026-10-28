import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {useModal} from './Modal';
import {OddsBand} from './ActionPanel';
import {oddsFor} from '../shared/odds';
import './onboarding.css';

// #68 First-run guide: four short steps, under a minute, over the real screen. The part a step talks about is lit where it is on screen; Escape or "Skip guide" ends it at any step.
const SAMPLE_ODDS=oddsFor({attribute:'insight',dc:10,modifier:3})!;
/** `pad`: room left around the lit part. A row inside the action list keeps it to the row's own gap, so the ring never crosses the next row or its member chips (#110). */
interface Step{title:string;target:string|null;pad?:number;body:ReactNode;demo?:ReactNode}
const STEPS:Step[]=[
 {title:'Read, then go on',target:'.story-box',body:<>The story is told in a box at the foot of the screen. Press <kbd>Space</kbd> or <kbd>Enter</kbd>, or click <b>Go on</b>: the first press shows the whole page, the next turns it. <kbd>J</kbd> opens the journal, with everything so far.</>,
  demo:<div className="guide-demo guide-story"><p>The gate stands open. Cold air rises from the stair below.</p><span className="guide-next">Go on <span aria-hidden="true">›</span></span></div>},
 {title:'Choose what to do',target:'.actions-panel',body:<>Your choices wait at the side, grouped as <b>Look</b>, <b>Talk</b>, <b>Act</b> and <b>Move</b>. Click one, or press its number, <kbd>1</kbd> to <kbd>9</kbd>. A choice that costs something asks before it happens.</>},
 {title:'Read the odds',target:'.actions-panel .action:has(.odds-line)',pad:2,body:<>A risky choice shows its odds before you commit, and who in the party is best placed to try. Hover the word for the exact chance.</>,
  demo:<div className="guide-demo guide-odds"><span>Insight · DC 10</span><span className="odds-line"><span className="odds-who">Mira</span><OddsBand odds={SAMPLE_ODDS} always/></span></div>},
 {title:'One roll decides',target:null,body:<>When you commit, the die is thrown once, in the room. The roll stands: there are no second tries. A natural 20 or a natural 1 is an event of its own.</>,
  demo:<div className="guide-demo guide-roll"><span className="guide-die" aria-hidden="true">17</span><span className="mech-tag">Insight · 17 + 3 = 20 vs DC 10</span></div>},
];
/** `edge`: the left edge of the panel holding the lit part, so the card sits clear of the whole panel. */
type Spot={top:number;left:number;width:number;height:number;edge:number};
/** The lit target: the first match that is on screen, padded a little. A closed drawer or a missing panel lights nothing. */
function spotFor(selector:string|null,pad=6):Spot|null{
 const el=selector?[...document.querySelectorAll<HTMLElement>(selector)].find(e=>e.getClientRects().length&&!e.closest('.guide')):null;if(!el)return null;
 const r=el.getBoundingClientRect();if(r.width<4||r.height<4||r.bottom<0||r.top>innerHeight)return null;
 return {top:r.top-pad,left:r.left-pad,width:r.width+pad*2,height:r.height+pad*2,edge:(el.closest('.actions-panel')??el).getBoundingClientRect().left-6};
}

export default function Onboarding({onClose}:{onClose:()=>void}){
 const [step,setStep]=useState(0),[spot,setSpot]=useState<Spot|null>(null);
 const card=useRef<HTMLElement>(null);useModal(card,{onClose,initial:'[data-autofocus]'});
 const current=STEPS[step]!,last=step===STEPS.length-1;
 // Back disappears on the first step: focus it left behind moves to Next, so Enter keeps going.
 useEffect(()=>{const el=card.current;if(el&&!el.contains(document.activeElement))el.querySelector<HTMLElement>('[data-autofocus]')?.focus({preventScroll:true});},[step]);
 useLayoutEffect(()=>{const place=()=>setSpot(spotFor(current.target,current.pad));place();addEventListener('resize',place);return()=>removeEventListener('resize',place);},[current.target,current.pad]);

 // Beside a lit part when there is room for the card, otherwise centred above the story box.
 const side=spot&&spot.edge>380?{top:Math.max(76,Math.min(spot.top+spot.height/2-150,innerHeight-360)),left:spot.edge-372}:null;
 return <div className={'guide'+(spot?' lit':'')}>
  {spot&&<div className="guide-spot" style={{top:spot.top,left:spot.left,width:spot.width,height:spot.height}} aria-hidden="true"/>}
  <section ref={card} tabIndex={-1} className="modal guide-card" style={side??undefined} data-side={side?'':undefined} role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-body">
   <div className="eyebrow">HOW TO PLAY · {step+1} OF {STEPS.length}</div>
   <h2 id="guide-title">{current.title}</h2>
   <div id="guide-body" aria-live="polite"><p>{current.body}</p>{current.demo}</div>
   <div className="guide-dots" aria-hidden="true">{STEPS.map((_,i)=><span key={i} className={i===step?'on':i<step?'done':undefined}/>)}</div>
   <div className="guide-actions"><button className="guide-skip" onClick={onClose}>Skip guide</button><span>{step>0&&<button className="guide-back" onClick={()=>setStep(step-1)}>Back</button>}<button data-autofocus className="primary" onClick={()=>last?onClose():setStep(step+1)}>{last?'Begin':'Next'} <span aria-hidden="true">{last?'↗':'›'}</span></button></span></div>
  </section>
 </div>;
}
