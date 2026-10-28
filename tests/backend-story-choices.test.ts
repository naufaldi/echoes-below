import {test} from 'node:test';
import assert from 'node:assert/strict';
import {actionRows,bestChoice,verbFor,verbGroups,type Verb} from '../client/action-focus.js';
import {applyAction,createSave,legalActions,type Save} from '../server/game.js';
import {previewSave} from '../server/dev-preview.js';
import {EXPEDITION} from '../shared/campaign.js';
import type {ActionOption} from '../shared/types.js';
// Every exploration action family the engine offers, with the story verb it belongs under (#62).
// A new family fails this test until someone decides where it reads best.
const EXPECTED:Record<string,Verb>={
 tracks:'Look',inspect:'Look',chain:'Look',ledger:'Look',loot_cache:'Look',exp_evidence:'Look',exp_supplies:'Look','counterweight:read':'Look','infirmary:inspect':'Look','ink:inspect':'Look','index:read':'Look',
 checkin:'Talk',bond_begin:'Talk',bond_reply:'Talk',exp_talk:'Talk',exp_ally:'Talk',parley:'Talk',courier:'Talk','scrit-talk':'Talk',scrit:'Talk',persuade:'Talk',negotiate:'Talk',offer:'Talk',entrust:'Talk','ink:ask':'Talk','infirmary:signal':'Talk',
 enter:'Move',bell:'Move',ledge:'Move',cautious:'Move',quick:'Move',prison:'Move',maintenance:'Move',exp_next:'Move',continue_campaign:'Move',
 disarm:'Act',distract:'Act',pick:'Act',force:'Act',fight:'Act',unlock:'Act',secure:'Act',rest:'Act',potion:'Act',campheal:'Act',recover:'Act',camp:'Act',exp_choice:'Act',exp_fight:'Act',exp_rest:'Act',side:'Act',
 'counterweight:pawl':'Act','counterweight:pin':'Act','counterweight:reset':'Act','counterweight:weight':'Act','infirmary:brace':'Act','ink:sleeve':'Act','ink:wick':'Act',
};
const family=(id:string)=>EXPECTED[id.split(':').slice(0,2).join(':')]!==undefined&&!/:(hero|mira|oren)$/.test(id.split(':').slice(0,2).join(':'))?id.split(':').slice(0,2).join(':'):id.split(':')[0]!;
const exploring=(s:Save)=>legalActions(s).filter(a=>s.mode!=='combat'&&a.kind!=='inventory'&&a.kind!=='quest');
test('every exploration action the engine offers sits under its intended verb',()=>{
 const seen=new Map<string,ActionOption>();
 const note=(s:Save)=>exploring(s).forEach(a=>seen.set(family(a.id),a));
 let rng=3;const rand=()=>{rng=(rng*1103515245+12345)%2147483648;return rng/2147483648;};
 for(const rulesVersion of ['echo-v1','curated-srd-5.2.1-v1'] as const)for(let seed=0;seed<8;seed++){
  rng=seed+5;let s=createSave({name:'Verbs',classId:(['guardian','scout','adept','cleric'] as const)[seed%4],backgroundId:(['delver','envoy','survivor'] as const)[seed%3],appearanceId:'moon',rulesVersion});
  for(let step=0;step<160;step++){note(s);const actions=legalActions(s);if(!actions.length)break;const a=actions[Math.floor(rand()*actions.length)]!;try{s=applyAction(s,a.id,sides=>1+Math.floor(rand()*sides));}catch{}}
 }
 for(const rules of ['echo','curated'] as const)for(const room of EXPEDITION)for(const choice of [0,1] as const)note(previewSave(room.id,rules,choice));
 for(const [name,a] of seen){assert.ok(name in EXPECTED,`classify the new action family "${name}" (${a.id}, ${a.kind}: ${a.label})`);assert.equal(verbFor(a),EXPECTED[name],`${a.id} (${a.label})`);}
 for(const verb of ['Look','Talk','Act','Move'] as const)assert.ok([...seen.keys()].some(k=>EXPECTED[k]===verb),`no ${verb} action was seen`);
});
const opt=(id:string,kind:string,extra:Partial<ActionOption>={}):ActionOption=>({id,label:id,description:'',kind,...extra});
test('groups come in Look, Talk, Act, Move order and keep the engine order within each',()=>{
 const rows=actionRows([opt('ledge','move'),opt('disarm','disarm'),opt('ledger','inspect'),opt('persuade','persuade'),opt('force','force'),opt('tracks:hero','inspect')],[]);
 assert.deepEqual(verbGroups(rows).map(g=>[g.verb,g.rows.map(r=>r.kind==='single'?r.action.id:r.key)]),[['Look',['ledger','tracks:hero']],['Talk',['persuade']],['Act',['disarm','force']],['Move',['ledge']]]);
 assert.deepEqual(verbGroups([]),[]);
});
const party=[{id:'hero',name:'Alden'},{id:'mira',name:'Mira'},{id:'oren',name:'Oren'}];
const tracks=(member:{id:string;name:string},modifier:number):ActionOption=>opt(`tracks:${member.id}`,'inspect',{label:`Inspect tracks · ${member.name}`,actorId:member.id,check:{dc:10,attribute:'insight',modifier,parts:[{label:'Insight',value:modifier}]}});
test('a member row names the best-placed member with their odds band',()=>{
 const [row]=actionRows(party.map((m,i)=>tracks(m,[1,4,0][i]!)),party);
 const best=bestChoice(row!,party)!;
 assert.equal(best.name,'Mira');assert.equal(best.action.id,'tracks:mira');assert.deepEqual(best.odds,{percent:75,band:'Likely'});
});
test('ties keep the listed order, and a single check names its own actor',()=>{
 const [row]=actionRows(party.map(m=>tracks(m,2)),party);
 assert.equal(bestChoice(row!,party)!.name,'Alden');
 const persuade=opt('persuade','persuade',{actorId:'hero',check:{dc:13,attribute:'presence',modifier:2,parts:[{label:'Presence',value:2}]}});
 assert.deepEqual(bestChoice({kind:'single',action:persuade},party),{id:'hero',name:'Alden',action:persuade,odds:{percent:50,band:'Risky'}});
});
test('rows without public odds name no best member',()=>{
 assert.equal(bestChoice({kind:'single',action:opt('force','force')},party),null);
 assert.equal(bestChoice({kind:'single',action:opt('pick','interact',{actorId:'hero',check:{dc:13,attribute:'agility'}})},party),null);
});
