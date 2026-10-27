import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {SIDE_ADVENTURES} from '../server/side-adventures.js';
import {playedRoom} from '../server/playstyle.js';
const fresh=()=>createSave({name:'Side QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});
for(const adventure of SIDE_ADVENTURES)for(const choice of [0,1])test(`${adventure.id} route ${choice} requires witnessed evidence and grants its distinct outcome once`,()=>{
 let s=fresh();s.sceneId=adventure.start;
 const command=(phase:string)=>`side:${adventure.id}:${phase}`;
 assert.ok(publicSave(s).scene.entities.some(e=>e.name===adventure.name));
 assert.throws(()=>applyAction(s,command('choose-'+choice),n=>n));
 s=applyAction(s,command('accept'),n=>n);s.sceneId=adventure.finish;
 assert.ok(!legalActions(s).some(a=>a.id===command('choose-'+choice)));
 s.sceneId=adventure.investigate;s=applyAction(s,command('investigate'),n=>n);s=JSON.parse(JSON.stringify(s));s.sceneId=adventure.finish;
 const potions=s.party.reduce((n,a)=>n+a.potions,0);s=applyAction(s,command('choose-'+choice),n=>n);
 assert.equal(s.quests?.find(q=>q.id===adventure.questId)?.status,'completed');
 assert.equal(s.party.reduce((n,a)=>n+a.potions,0),potions+(adventure.choices[choice].potions??0));
 assert.throws(()=>applyAction(s,command('choose-'+choice),n=>n));assert.equal(s.facts.filter(f=>f.id===`side:${adventure.id}:outcome`).length,1);
 if(adventure.choices[choice].preparation){s.sceneId=adventure.choices[choice].preparation as typeof s.sceneId;const room=playedRoom(s,s.sceneId)!;assert.equal(legalActions(s).find(a=>a.id==='exp_choice:0')?.check?.dc,room.dc-3);s=applyAction(s,'exp_choice:0',n=>n);assert.ok(s.logs.some(l=>l.text.includes(`vs DC ${room.dc-3}`)));}
});
test('declining or missing a meeting cannot leak a later NPC or complete the request',()=>{
 let s=fresh();s.sceneId='archive-1';s=applyAction(s,'quest:decline:chapter-2-side-1',n=>n);assert.ok(!legalActions(s).some(a=>a.id.startsWith('side:water-names:')));assert.ok(!publicSave(s).scene.entities.some(e=>e.id==='side:water-names'));
 s=fresh();s.sceneId='archive-3';assert.ok(!publicSave(s).scene.entities.some(e=>e.id==='side:water-names'));assert.throws(()=>applyAction(s,'side:water-names:choose-0',n=>n));
});
test('old checklist progress cannot masquerade as newly authored evidence, while completed saves stay completed',()=>{
 let s=fresh();s.sceneId='archive-1';s.quests=[{id:'chapter-2-side-1',title:'Names',chapter:2,kind:'side',status:'active',steps:[{label:'Record evidence in The Sluice Stair',done:true}],reward:''}];
 assert.equal(publicSave(s).quests?.find(q=>q.id==='chapter-2-side-1')?.steps[0].done,false);
 s.quests[0].status='completed';assert.equal(publicSave(s).quests?.find(q=>q.id==='chapter-2-side-1')?.status,'completed');assert.ok(!legalActions(s).some(a=>a.id.startsWith('side:water-names:')));
});

test('resource-dependent choices disappear with empty supplies while free alternatives remain legal',()=>{
 for(const adventure of SIDE_ADVENTURES.filter(a=>a.choices.some(c=>c.costRations))){let s=fresh();s.sceneId=adventure.start;s=applyAction(s,`side:${adventure.id}:accept`,n=>n);s.sceneId=adventure.investigate;s=applyAction(s,`side:${adventure.id}:investigate`,n=>n);s.sceneId=adventure.finish;s.party.forEach(p=>p.rations=0);const costly=adventure.choices.findIndex(c=>c.costRations),free=adventure.choices.findIndex(c=>!c.costRations);assert.throws(()=>applyAction(s,`side:${adventure.id}:choose-${costly}`,n=>n));assert.ok(legalActions(s).some(a=>a.id===`side:${adventure.id}:choose-${free}`));s=applyAction(s,`side:${adventure.id}:choose-${free}`,n=>n);assert.ok(s.party.every(p=>p.rations>=0));}
});

test('preparation is not offered after its target decision has already been resolved',()=>{for(const a of SIDE_ADVENTURES.filter(a=>a.choices.some(c=>c.preparation===a.finish))){let s=fresh();s.sceneId=a.start;s=applyAction(s,`side:${a.id}:accept`,n=>n);s.sceneId=a.investigate;s=applyAction(s,`side:${a.id}:investigate`,n=>n);s.sceneId=a.finish;s.flags[`${a.finish}:resolved`]=true;const i=a.choices.findIndex(c=>c.preparation===a.finish);assert.ok(!legalActions(s).some(action=>action.id===`side:${a.id}:choose-${i}`));assert.ok(legalActions(s).some(action=>action.id.startsWith(`side:${a.id}:choose-`)));}});
