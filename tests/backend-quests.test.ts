import {EXPEDITION} from '../shared/campaign.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {QUESTS,questProgress} from '../server/quests.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
const fresh=()=>createSave({name:'Quest QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});
test('only discovered quest arcs are visible, with eighteen main and twelve optional definitions',()=>{
 const s=fresh();assert.equal(QUESTS.filter(q=>q.kind==='main').length,18);assert.equal(QUESTS.filter(q=>q.kind==='side').length,12);assert.equal(new Set(QUESTS.map(q=>q.id)).size,30);
 assert.deepEqual(publicSave(s).quests?.map(q=>q.id),['relay-road','relay-trail']);assert.ok(!JSON.stringify(publicSave(s)).includes('Settle the archive'));
});
test('optional evidence completion grants supplies once and persists across another action and reload',()=>{
 let s=applyAction(fresh(),'tracks:hero',n=>n);s=applyAction(s,'enter',n=>n);const before=s.party[0].rations;s=applyAction(s,'chain:hero',n=>n);
 assert.equal(s.party[0].rations,before+2);assert.equal(s.quests?.find(q=>q.id==='relay-trail')?.status,'completed');
 s=applyAction(JSON.parse(JSON.stringify(s)),'ledge',n=>n);assert.equal(s.party[0].rations,before+2);assert.equal(s.quests?.find(q=>q.id==='relay-road')?.status,'completed');
});
test('declining an optional quest survives reload, gives no supplies and does not block travel',()=>{
 let s=applyAction(fresh(),'quest:decline:relay-trail',n=>n);s=applyAction(s,'tracks:hero',n=>n);s=applyAction(s,'enter',n=>n);s=applyAction(s,'chain:hero',n=>n);
 assert.equal(s.party[0].rations,1);assert.equal(questProgress(JSON.parse(JSON.stringify(s))).find(q=>q.id==='relay-trail')?.status,'declined');assert.ok(legalActions(s).some(a=>a.id==='ledge'));assert.throws(()=>applyAction(s,'quest:decline:relay-trail',n=>n));
});
test('failed checks do not complete a quest; leaving its last room closes the opportunity',()=>{
 let s=applyAction(fresh(),'tracks:hero',()=>1);assert.equal(s.quests?.find(q=>q.id==='relay-trail')?.steps[0].done,false);s=applyAction(s,'enter',n=>n);s=applyAction(s,'ledge',n=>n);assert.equal(s.quests?.find(q=>q.id==='relay-trail')?.status,'missed');
});
test('legacy saves retain no quest actions; old preview projections do not grant retroactive rewards',()=>{
 const legacy=createSave({name:'Legacy',classId:'guardian',backgroundId:'delver',appearanceId:'ember'});assert.equal(publicSave(legacy).quests,undefined);assert.ok(!legalActions(legacy).some(a=>a.kind==='quest'));
 let s=fresh();delete s.quests;s.flags.tracks=true;s.flags.maintenance=true;const before=s.party[0].rations;s=applyAction(s,'enter',n=>n);assert.equal(s.party[0].rations,before);assert.equal(s.quests?.find(q=>q.id==='relay-trail')?.status,'completed');
});

test('all quest arcs can complete through the actual peaceful campaign without duplicate story XP',()=>{
 let s=fresh();for(const id of ['tracks:hero','enter','chain:hero','ledge','scrit-talk','offer','prison','unlock','ledger','bell','negotiate','secure','continue_campaign'])s=applyAction(s,id,n=>n);
 for(const room of EXPEDITION){assert.equal(s.sceneId,room.id);const side=legalActions(s).find(a=>a.id.startsWith('side:'));if(side)s=applyAction(s,side.id,n=>n);for(const id of ['exp_evidence','exp_talk','exp_choice:1','exp_next'])s=applyAction(JSON.parse(JSON.stringify(s)),id,n=>n);}
 assert.equal(s.mode,'complete');assert.equal(s.quests?.length,30);assert.ok(s.quests?.every(q=>q.status==='completed'));assert.equal(Object.keys(s.flags).filter(k=>k.startsWith('quest-reward:')).length,12);
});
