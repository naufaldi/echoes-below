import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createSave,applyAction,legalActions,type Save} from '../server/game.js';
import {EXPEDITION} from '../shared/campaign.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import type {ClassId} from '../shared/types.js';
const runs=[];
for(const classId of ['guardian','scout','adept','cleric'] as ClassId[]){
 let s=createSave({name:'Progression audit',classId,backgroundId:'envoy',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
 const milestones:{scene:string;level:number;xp:number}[]=[],choices:string[]=[];
 const act=(id:string)=>{const prior=s.level;s=applyAction(s,id,n=>n);s=JSON.parse(JSON.stringify(s)) as Save;if(s.level!==prior)milestones.push({scene:s.sceneId,level:s.level!,xp:s.xp!});};
 const advance=()=>{for(let i=0;i<12;i++){const option=legalActions(s).find(a=>a.id.startsWith('advance:'));if(!option)return;choices.push(option.id);act(option.id);}throw Error('Advancement loop did not terminate');};
 for(const id of ['enter','counterweight:read','counterweight:pawl','counterweight:weight','counterweight:pin','quick','offer','prison','unlock','ledger','bell','negotiate','secure','continue_campaign'])act(id);
 const rooms=[];
 for(const room of EXPEDITION){
  assert.equal(s.sceneId,room.id);advance();
  rooms.push({scene:s.sceneId,entryLevel:s.level,entryXp:s.xp});
  for(const id of ['exp_evidence','exp_talk','exp_supplies','exp_choice:1'])act(id);
  advance();act('exp_next');
 }
 assert.equal(s.mode,'complete');assert.equal(s.level,8);
 for(const actor of s.party){const c=s.tactical!.actors[actor.id];assert.equal(c.improvements?.length,c.classId==='fighter'?3:2);assert.ok(c.abilities.strength<=20);}
 runs.push({classId,mode:s.mode,level:s.level,xp:s.xp,revisions:s.revision,milestones,choices,rooms});
}
writeFileSync('docs/CAMPAIGN_PROGRESSION.json',JSON.stringify({kind:'Deterministic legal-action traversal, not measured player duration or combat balance',assumptions:'Four classes, existing starting party, maximum dice, peaceful main route, all room evidence and supplies, no injected XP/levels/resources, serialized reload after every action, oldest available ability choices.',runs},null,2)+'\n');
console.log(JSON.stringify(runs.map(({classId,level,xp,revisions,milestones,choices})=>({classId,level,xp,revisions,milestones,improvements:choices.length})),null,2));
