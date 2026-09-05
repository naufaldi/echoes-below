import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave} from '../server/game.js';
import {CAMPAIGN_CONSEQUENCES} from '../server/campaign-consequences.js';
import {EXPEDITION} from '../shared/campaign.js';
const dice=(s:number)=>s===20?20:1;
const newSave=()=>createSave({name:'Aria',classId:'cleric',backgroundId:'envoy',appearanceId:'moon',raceId:'elf'});

test('every linked opportunity follows its actual source decision and stays hidden elsewhere',()=>{
 for(const link of CAMPAIGN_CONSEQUENCES){
  let s=newSave();s.sceneId=link.source;s=applyAction(s,`exp_choice:${link.choice}`,dice);
  assert.ok(!publicSave(s).scene.description.includes(link.arrival));
  s.sceneId=link.target;s=JSON.parse(JSON.stringify(s));
  assert.ok(legalActions(s).some(a=>a.id==='exp_ally:'+link.id),link.id);
  assert.ok(publicSave(s).scene.description.includes(link.arrival));
  const alternate=newSave();alternate.sceneId=link.source;
  const other=applyAction(alternate,`exp_choice:${1-link.choice}`,dice);other.sceneId=link.target;
  assert.ok(!legalActions(other).some(a=>a.id==='exp_ally:'+link.id));
  assert.throws(()=>applyAction(other,'exp_ally:'+link.id,dice));
 }
});
test('aid has a concrete once-only effect and remains applied after reload',()=>{
 for(const link of CAMPAIGN_CONSEQUENCES){
  let s=newSave();s.sceneId=link.target;s.flags[`${link.source}:choice:${link.choice}`]=true;
  s.party.forEach(a=>{a.hp=2;a.focus=0;});
  const potions=s.party.map(a=>a.potions);const baseDC=legalActions(s).find(a=>a.id==='exp_choice:0')!.check!.dc;
  s=applyAction(s,'exp_ally:'+link.id,dice);s=JSON.parse(JSON.stringify(s));
  assert.equal(s.facts.filter(f=>f.id==='consequence:'+link.id).length,1);
  assert.throws(()=>applyAction(s,'exp_ally:'+link.id,dice));
  assert.ok(!publicSave(s).scene.entities.some(e=>e.id==='ally:'+link.id));
  if(link.effect==='supplies')assert.deepEqual(s.party.map(a=>a.potions),potions.map(n=>n+1));
  if(link.effect==='healing'){assert.ok(s.party.every(a=>a.hp===a.maxHp));assert.ok(s.party.every(a=>a.focus===0));}
  if(link.effect==='preparation'){assert.equal(legalActions(s).find(a=>a.id==='exp_choice:0')!.check!.dc,baseDC!-3);}
  if(link.effect==='diversion'){
   // Keep all actors alive long enough to inspect the initial authoritative roster.
   s.party.forEach(a=>{a.hp=999;a.maxHp=999;});s=applyAction(s,'exp_fight',dice);
   const room=EXPEDITION.find(r=>r.id===link.target)!;assert.equal(s.enemies.length,(room.enemy==='vark'?2:3)-1);
  }
 }
});
test('testimony changes the actual check, not just its displayed difficulty',()=>{
 const link=CAMPAIGN_CONSEQUENCES.find(c=>c.id==='apprentice-testimony')!;
 let s=newSave();s.sceneId=link.target;s.flags[`${link.source}:choice:${link.choice}`]=true;
 const before=legalActions(s).find(a=>a.id==='exp_choice:0')!;const modifier=s.party[0]!.attributes.presence;
 const roll=before.check!.dc-modifier-1;
 const failed=applyAction(s,'exp_choice:0',()=>roll);assert.ok(!failed.flags[`${s.sceneId}:resolved`]);
 s=applyAction(s,'exp_ally:'+link.id,dice);s=applyAction(s,'exp_choice:0',()=>roll);
 assert.ok(s.flags[`${s.sceneId}:resolved`]);assert.ok(s.logs.some(l=>l.text.includes(`vs DC ${before.check!.dc-3}`)));
});
test('old combat-completed saves retain their recorded ending and continuation',()=>{
 const s=newSave();s.sceneId='archive-7';s.flags['archive-7:resolved']=true;s.facts.push({id:'decision:archive-7',text:'The party forced the way open.'});
 assert.ok(legalActions(s).some(a=>a.id==='exp_next'));assert.ok(!legalActions(s).some(a=>a.id.startsWith('exp_choice')));
 assert.equal(publicSave(s).facts[0]!.text,'The party forced the way open.');
});
