import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyAction,createSave,legalActions,publicSave,type Save} from '../server/game.js';
import {previewSave} from '../server/dev-preview.js';
import {EXPEDITION} from '../shared/campaign.js';
import type {ActionOption,ClassId,BackgroundId} from '../shared/types.js';
// The odds band (#61) is only honest if every advertised term is the one the engine rolls.
// Walk legal play in both rule sets and compare each option's public check with the saved outcome check.
const family=(id:string)=>id.replace(/:.*$/,'').replace(/^tactical$/,'tactical:attack');
function verify(s:Save,a:ActionOption,seen:Set<string>){
 const c=a.check!,before=new Set(s.logs.map(l=>l.id));
 const after=applyAction(s,a.id,sides=>Math.min(sides,10));
 const outcome=after.logs.filter(l=>!before.has(l.id)).find(l=>l.check&&(l.check.kind==='attack'?l.check.targetId===a.targetId:true))?.check;
 assert.ok(outcome,`${a.id} rolled no saved check`);
 assert.equal(outcome.dc,c.dc,`${a.id} DC`);
 assert.equal(outcome.modifier,c.modifier!+(c.bonusDie?Math.min(c.bonusDie,10):0),`${a.id} modifier`);
 assert.equal(c.parts!.reduce((n,p)=>n+p.value,0),c.modifier,`${a.id} parts add up`);
 // The option names every reason (help and a guarded foe); the saved check records only the net effect, as both cancel.
 assert.equal(!!outcome.advantage,!!c.advantage&&!c.disadvantage,`${a.id} advantage`);
 assert.equal(!!outcome.disadvantage,!!c.disadvantage&&!c.advantage,`${a.id} disadvantage`);
 if(c.critOn)assert.equal(outcome.critical??false,outcome.natural>=c.critOn,`${a.id} critical range`);
 seen.add(family(a.id.startsWith('tactical:attack:')?'tactical:attack':a.id));
}
test('every advertised modifier, DC and advantage equals the saved roll',()=>{
 const seen=new Set<string>();let rng=7;const rand=()=>{rng=(rng*1103515245+12345)%2147483648;return rng/2147483648;};
 for(const rulesVersion of ['echo-v1','curated-srd-5.2.1-v1'] as const)for(let seed=0;seed<10;seed++){
  rng=seed+11;let s=createSave({name:'Odds',classId:(['guardian','scout','adept','cleric'] as ClassId[])[seed%4],backgroundId:(['delver','envoy','survivor'] as BackgroundId[])[seed%3],appearanceId:'moon',rulesVersion});
  for(let step=0;step<220;step++){
   const actions=legalActions(s);if(!actions.length)break;
   for(const a of actions.filter(a=>a.check?.modifier!==undefined))verify(s,a,seen);
   const next=actions[Math.floor(rand()*actions.length)]!;try{s=applyAction(s,next.id,sides=>1+Math.floor(rand()*sides));}catch{}
  }
 }
 for(const rules of ['echo','curated'] as const)for(const room of EXPEDITION.slice(0,3)){
  let s=previewSave(room.id,rules);const attempt=()=>legalActions(s).find(a=>a.id==='exp_choice:0'&&a.check);
  if(attempt())verify(s,attempt()!,seen);
  s=applyAction(s,'exp_evidence',sides=>sides);const helped=attempt();
  if(helped){assert.equal(helped.check!.advantage,'Evidence');verify(s,helped,seen);}
 }
 for(const id of ['tracks','inspect','chain','disarm','persuade','distract','pick','negotiate','exp_choice','attack','tactical:attack'])assert.ok(seen.has(id),`no ${id} option was verified`);
});
test('the public save carries only public terms on its options',()=>{
 const s=publicSave(createSave({name:'Odds',classId:'scout',backgroundId:'delver',appearanceId:'moon'}));
 const tracks=s.actions.find(a=>a.id==='tracks:hero')!;
 assert.deepEqual(tracks.check,{dc:10,attribute:'insight',modifier:s.party[0]!.attributes.insight+2,parts:[{label:'Insight',value:s.party[0]!.attributes.insight},{label:'Proficiency',value:2}]});
 const mira=s.actions.find(a=>a.id==='tracks:mira')!;
 assert.deepEqual(Object.keys(mira.check!).sort(),['attribute','dc','modifier','parts']);
});
