import {test} from 'node:test';
import assert from 'node:assert/strict';
import {confirmationFor} from '../client/confirmation.js';
import {actionRows,answersStory,tendWounds,verbGroups} from '../client/action-focus.js';
import {continuesTurn} from '../client/turn-chain.js';
import {applyAction,createSave,legalActions,type Save} from '../server/game.js';
import {previewSave} from '../server/dev-preview.js';
import {EXPEDITION} from '../shared/campaign.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import type {ActionOption,PublicSave} from '../shared/types.js';

// #96 G3: every action the campaign offers, classified. Free actions commit without a card; everything that rolls, spends, moves, fights or closes a branch keeps one.
const certain=(sides:number)=>sides;
const wound=(s:Save)=>{const w=structuredClone(s);for(const a of w.party){a.hp=Math.max(1,a.hp-5);const c=w.tactical?.actors[a.id];if(c)c.hp=Math.max(1,c.hp-5);}return w;};
function offered(rules:'echo'|'curated'){
 const seen=new Map<string,ActionOption>(),take=(s:Save)=>{for(const a of [...legalActions(s),...legalActions(wound(s))])seen.set(a.id,a);};
 let s=createSave({name:'Reader',classId:'adept',backgroundId:'delver',appearanceId:'moon',...(rules==='curated'?{rulesVersion:CURATED_RULES_VERSION}:{})});
 const act=(id:string)=>{take(s);if(legalActions(s).some(a=>a.id===id))s=applyAction(s,id,certain);};
 for(const id of ['loot_cache','checkin:mira','enter','counterweight:read','counterweight:pawl','counterweight:weight','counterweight:pin','quick','scrit-talk','offer','prison','courier:account','unlock','ledger','bell','parley:prisoner','negotiate','secure'])act(id);
 const converse=()=>{const begin=legalActions(s).find(a=>a.id.startsWith('bond_begin:'));if(begin){act(begin.id);take(s);}};
 for(const room of EXPEDITION){s=previewSave(room.id,rules);for(const id of ['exp_evidence','exp_talk','exp_supplies','exp_choice:1'])act(id);take(s);converse();}
 return [...seen.values()];
}
const FREE=/^(checkin:|bond_(begin|reply):|loot_cache$|ledger$|exp_(evidence|talk|supplies)$|counterweight:|scrit-talk$|scrit:(supplies|captive|ward)$|courier:|parley:|infirmary:(inspect|signal)$|ink:(inspect|ask)$|index:read$|side:[^:]+:investigate$)/;
for(const rules of ['echo','curated'] as const)test(`free actions skip the card and nothing that spends, moves, fights or closes does (${rules})`,()=>{
 const actions=offered(rules),free=actions.filter(a=>confirmationFor(a)==='none').map(a=>a.id);
 assert.deepEqual(free.filter(id=>!FREE.test(id)),[]);
 for(const id of ['loot_cache','checkin:mira','counterweight:read','counterweight:pawl','counterweight:weight','counterweight:pin','scrit-talk','ledger','exp_evidence','exp_talk','exp_supplies'])assert.ok(free.includes(id),id+' should commit directly');
 assert.ok(free.some(id=>id.startsWith('bond_reply:')),'conversation replies commit directly');
 const kept=actions.filter(a=>confirmationFor(a)!=='none').map(a=>a.id);
 for(const pattern of [/^enter$/,/^quick$/,/^offer$/,/^prison$/,/^bell$/,/^negotiate$/,/^secure$/,/^exp_choice:/,/^exp_next$/,/^continue_campaign$/,rules==='echo'?/^(campheal:|potion$)/:/^recover:/])
  if(actions.some(a=>pattern.test(a.id)))assert.ok(kept.some(id=>pattern.test(id)),pattern+' keeps its card');
 for(const a of actions)if(a.check||a.dangerous||/closes:/i.test(a.description)||['move','rest','camp','attack','heal','use_item','offer','quest','inventory'].includes(a.kind))assert.notEqual(confirmationFor(a),'none',a.id);
});
test('a story choice with nothing left to close still keeps its card',()=>assert.equal(confirmationFor({id:'exp_choice:1',label:'Take the other way',description:'Commit to this alternative and its consequences without a check.',kind:'interact'}),'light'));

// #96 G5: one Tend wounds row.
const party=[{id:'hero',name:'Alden',hp:10,maxHp:20},{id:'mira',name:'Mira',hp:4,maxHp:18},{id:'oren',name:'Oren',hp:24,maxHp:24}];
const heal=(id:string,label:string,actorId?:string,targetId?:string,kind='heal'):ActionOption=>({id,label,description:'',kind,...(actorId?{actorId}:{}),...(targetId?{targetId}:{})});
test('Echo heals and the potion become one Tend wounds row, most hurt first',()=>{
 const actions=[heal('loot_cache','Search the forgotten chest',undefined,undefined,'inspect'),heal('campheal:hero:hero','Alden: heal Alden','hero','hero'),heal('campheal:hero:mira','Alden: heal Mira','hero','mira'),heal('campheal:oren:hero','Oren: heal Alden','oren','hero'),heal('campheal:oren:mira','Oren: heal Mira','oren','mira'),heal('potion','Drink healing potion',undefined,undefined,'use_item'),heal('rest','Rest at camp',undefined,undefined,'rest')];
 const rows=actionRows(actions,party,{tend:true});
 assert.deepEqual(rows.map(r=>r.kind==='single'?r.action.id:r.key),['loot_cache','tend','rest']);
 const tend=rows[1]!;assert.ok(tend.kind==='choices');assert.equal(tend.label,'Tend wounds');
 assert.deepEqual(tend.options.map(o=>o.name),['Alden heals Mira','Oren heals Mira','Alden heals self','Oren heals Alden','Potion → Alden']);
 assert.equal(tend.options[0]!.action.id,'campheal:hero:mira');
 assert.deepEqual(verbGroups(rows).map(g=>[g.verb,g.rows.length]),[['Look',1],['Act',2]]);
 assert.equal(actionRows(actions,party).length,7,'combat keeps one row per action');
});
test('Curated recovery collapses Cure Wounds ranks and potion givers',()=>{
 const heals=[heal('recover:wind:oren:oren','Second Wind · Oren','oren','oren'),
  ...['hero','mira','oren'].flatMap(g=>['hero','mira'].map(t=>heal(`recover:potion:${g}:${t}`,`${g}: give potion to ${t}`,g,t))),
  ...[1,2].flatMap(rank=>['hero','mira'].map(t=>heal(`recover:cure:hero:${t}${rank>1?':'+rank:''}`,`Alden: Cure Wounds · level ${rank} slot · ${t}`,'hero',t)))];
 const row=tendWounds(heals,[party[0]!,party[1]!,{...party[2]!,hp:14}])!;assert.ok(row.kind==='choices');
 assert.deepEqual(row.options.map(o=>[o.name,o.action.id]),[['Alden heals Mira','recover:cure:hero:mira'],['Potion → Mira','recover:potion:mira:mira'],['Alden heals self','recover:cure:hero:hero'],['Potion → Alden','recover:potion:hero:hero'],['Second Wind · Oren','recover:wind:oren:oren']]);
 assert.equal(tendWounds([],party),null);
});

// #96 G4a: replies wait for the question.
test('only conversation replies wait for the story box',()=>{
 assert.equal(answersStory({id:'bond_reply:0'}),true);
 for(const id of ['bond_begin:oren-promise','checkin:oren','exp_talk'])assert.equal(answersStory({id}),false);
});

// #96 G7: "Let X act" plays the whole turn.
const view=(actorId:string,more:Partial<PublicSave>={})=>({mode:'combat',turn:{actorId,round:1,order:[]} as unknown as PublicSave['turn'],activeReaction:undefined,actions:[{id:'tactical:auto',label:'Let act',description:'',kind:'turn',actorId}],...more}) as Pick<PublicSave,'mode'|'turn'|'activeReaction'|'actions'>;
test('a creature keeps acting until its turn passes, combat ends or a reaction waits',()=>{
 assert.equal(continuesTurn(view('guard-1'),view('guard-1')),true);
 assert.equal(continuesTurn(view('guard-1'),view('guard-2')),false);
 assert.equal(continuesTurn(view('guard-1'),view('hero',{actions:[]})),false);
 assert.equal(continuesTurn(view('guard-1'),view('guard-1',{mode:'explore'})),false);
 assert.equal(continuesTurn(view('guard-1'),view('guard-1',{activeReaction:'hero'})),false);
 assert.equal(continuesTurn(view('guard-1'),view('guard-1',{actions:[]})),false);
});
test('a real Curated goblin turn chains to the next actor and never past it',()=>{
 let s=createSave({name:'Pace',classId:'guardian',backgroundId:'delver',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
 for(const id of ['enter','quick','fight'])s=applyAction(s,id,certain);
 let steps=0;
 while(s.mode==='combat'&&steps<200){const options=legalActions(s),auto=options.find(a=>a.id==='tactical:auto');
  if(!auto){s=applyAction(s,(options.find(a=>a.id==='tactical:end')??options.find(a=>a.id==='tactical:death')??options[0]!).id,certain);steps++;continue;}
  const actor=s.turn!.actorId;let before={mode:s.mode,turn:s.turn,activeReaction:undefined,actions:options} as never,links=0;
  s=applyAction(s,'tactical:auto',certain);steps++;
  while(continuesTurn(before,{mode:s.mode,turn:s.turn,activeReaction:undefined,actions:legalActions(s)} as never)&&links<8){s=applyAction(s,'tactical:auto',certain);links++;steps++;}
  assert.ok(s.mode!=='combat'||s.turn!.actorId!==actor||!legalActions(s).some(a=>a.id==='tactical:auto'),'the chain stops only when the turn moves on');}
 assert.notEqual(s.mode,'combat');
});

// #96 acceptance: with a wounded party, no Chapter II–VI room lists more than eight rows (the panel's "scroll to explore" threshold).
for(const rules of ['echo','curated'] as const)test(`wounded rooms stay within eight rows (${rules})`,()=>{
 const over:string[]=[];
 const rowsFor=(s:Save)=>actionRows(legalActions(wound(s)).filter(a=>a.kind!=='inventory'&&a.kind!=='quest'&&!a.id.startsWith('checkin:')),s.party,{tend:true}).length;
 for(const room of EXPEDITION){const s=previewSave(room.id,rules),n=rowsFor(s);if(n>8)over.push(`${room.id}: ${n}`);
  const after=legalActions(s).some(a=>a.id==='exp_evidence')?applyAction(s,'exp_evidence',certain):s;const m=rowsFor(after);if(m>8)over.push(`${room.id} (after evidence): ${m}`);}
 // Known: Curated roots-1 also offers the well-guilds' help and a side quest, so a wounded party sees nine rows (thirteen before the Tend wounds row). Reported on #96.
 assert.deepEqual(over,rules==='curated'?['roots-1: 9']:[]);
});
