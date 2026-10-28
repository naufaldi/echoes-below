import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createSave,applyAction,legalActions,type Save} from '../server/game.js';
import {EXPEDITION} from '../shared/campaign.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import type {ClassId} from '../shared/types.js';
import {runProfile} from './playstyle-profiles.js';
const runs=[];
for(const classId of ['guardian','scout','adept','cleric'] as ClassId[]){
 let s=createSave({name:'Progression audit',classId,backgroundId:'envoy',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
 const milestones:{scene:string;level:number;xp:number}[]=[],choices:string[]=[];
 let peakPotions=0;const act=(id:string)=>{const prior=s.level;s=applyAction(s,id,n=>n);peakPotions=Math.max(peakPotions,...s.party.map(a=>a.potions));s=JSON.parse(JSON.stringify(s)) as Save;if(s.level!==prior)milestones.push({scene:s.sceneId,level:s.level!,xp:s.xp!});};
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
 runs.push({classId,mode:s.mode,level:s.level,xp:s.xp,revisions:s.revision,peakPotions,milestones,choices,rooms});
}
// Track B (B-01, B-02): a diplomatic and an aggressive run must reach different endings through a different room state in every expedition chapter.
const playstyles=(['echo-v1',CURATED_RULES_VERSION] as const).map(rules=>{
 const [a,b]=(['diplomatic','aggressive'] as const).map(profile=>runProfile(profile,rules));
 for(const run of [a!,b!])assert.equal(run.mode,'complete',`${run.profile} ${rules} reaches an ending`);
 assert.notEqual(a!.endingId,b!.endingId,`${rules} endings differ`);
 const chapters=a!.forks.map((fork,i)=>{const other=b!.forks[i]!;assert.equal(fork.room,other.room);assert.notEqual(fork.description,other.description,`${rules} ${fork.room}`);assert.notDeepEqual(fork.choices,other.choices,`${rules} ${fork.room} options`);return {room:fork.room,title:fork.title,diplomatic:fork.variant,aggressive:other.variant};});
 return {rules,endings:{diplomatic:a!.endingId,aggressive:b!.endingId},chapters,runs:[a!,b!].map(({profile,classId,seed,mode,ending,endingId,finalLedger,fights,actions,peakPotions,forks})=>({profile,classId,seed,mode,endingId,ending,finalLedger,fights,actions,peakPotions,forks:forks.map(({room,variant,ledger})=>({room,variant,ledger}))}))};
});
writeFileSync('docs/CAMPAIGN_PROGRESSION.json',JSON.stringify({kind:'Deterministic legal-action traversal, not measured player duration or combat balance',assumptions:'Four classes, existing starting party, maximum dice, peaceful main route, all room evidence and supplies, no injected XP/levels/resources, serialized reload after every action, oldest available ability choices.',runs,playstyleAssumptions:'Guardian hero in both rule sets. Diplomatic: feed Scrit, negotiate, entrust the seal, no fights, first room option with maximum dice. Aggressive: fight every offered battle, force the gate, secure the seal, then the second room option; seeded dice, first surviving seed from a fixed list (recorded per run; Echo seeds 733 and 1466 lose a Chapter II fight, and since #95 seed 2199 loses at choir-3).',playstyles},null,2)+'\n');
console.log(JSON.stringify(playstyles.map(({rules,endings,chapters})=>({rules,endings,chapters})),null,2));
console.log(JSON.stringify(runs.map(({classId,level,xp,revisions,milestones,choices})=>({classId,level,xp,revisions,milestones,improvements:choices.length})),null,2));
