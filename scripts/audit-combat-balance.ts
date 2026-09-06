import {writeFileSync} from 'node:fs';
import {createSave,applyAction,legalActions} from '../server/game.js';
import {CURATED_ENCOUNTERS} from '../server/encounters.js';
import {CURATED_RULES_VERSION,CURATED_CLASS_IDS,makeCharacter} from '../shared/curated-rules.js';
import {projectTactical} from '../server/tactical.js';
import type {ClassId,SceneId} from '../shared/types.js';
const seedCount=Number(process.argv[2]??3);
if(!Number.isInteger(seedCount)||seedCount<1||seedCount>20)throw Error('Choose 1–20 seeds per class and encounter.');
const depleted=process.argv[3]==='depleted';
const results=[];
for(const [scene,encounter] of Object.entries(CURATED_ENCOUNTERS)){if(process.argv[4]&&scene!==process.argv[4])continue;
 const level=[1,3,4,5,6,8][encounter.chapter-1];let wins=0,losses=0,unfinished=0,totalSteps=0;
 for(const classId of ['guardian','scout','adept','cleric'] as ClassId[])for(let seed=1;seed<=seedCount;seed++){
  let state=seed*733+scene.length*29;const dice=(sides:number)=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return 1+Math.floor(state/4294967296*sides);};
  let s=createSave({name:'Balance audit',classId,backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});
  s.level=level;s.sceneId=scene as SceneId;for(const a of s.party)s.tactical!.actors[a.id]=makeCharacter(CURATED_CLASS_IDS[a.classId as ClassId],level);projectTactical(s,false);if(depleted){for(const a of s.party){const c=s.tactical!.actors[a.id];c.hp=Math.ceil(c.maxHp/2);c.slots=c.slots.map(n=>Math.floor(n/2));a.potions=0;}projectTactical(s,false);}
  s=applyAction(s,scene==='cookfire'||scene==='bell'?'fight':'exp_fight',dice);
  let steps=0;
  for(;steps<220&&s.mode==='combat';steps++){
   const actions=legalActions(s),t=s.tactical!;
   let choice=actions.find(a=>a.id==='tactical:auto')??actions.find(a=>a.id==='tactical:death');
   const heal=actions.filter(a=>a.kind==='heal'&&a.targetId).sort((a,b)=>t.actors[a.targetId!].hp/t.actors[a.targetId!].maxHp-t.actors[b.targetId!].hp/t.actors[b.targetId!].maxHp)[0];
   choice??=heal&&t.actors[heal.targetId!].hp<t.actors[heal.targetId!].maxHp/2?heal:undefined;
   choice??=actions.find(a=>a.id.startsWith('tactical:missile:'));
   choice??=actions.filter(a=>a.kind==='attack').sort((a,b)=>t.actors[a.targetId!].hp-t.actors[b.targetId!].hp)[0];
   choice??=actions.find(a=>a.id==='tactical:action_surge');
   if(!choice&&t.actors.hero.economy.action){const foes=s.enemies.filter(e=>e.hp>0);const moves=actions.filter(a=>a.kind==='move');choice=moves.sort((a,b)=>{const distance=(id:string)=>{const [x,y]=id.split(':')[2].split(',').map(Number);return Math.min(...foes.map(e=>Math.max(Math.abs(x-t.cells[e.id][0]),Math.abs(y-t.cells[e.id][1]))));};return distance(a.id)-distance(b.id);})[0];}
   choice??=actions.find(a=>a.id==='tactical:end');if(!choice)break;
   s=applyAction(s,choice.id,dice);
  }
  if(s.mode==='combat')console.log(JSON.stringify({scene,classId,seed,turn:s.turn,party:s.party.map(a=>({id:a.id,hp:a.hp,pos:a.position})),enemies:s.enemies.map(a=>({id:a.id,hp:a.hp,pos:a.position})),last:s.logs.slice(-6).map(l=>l.text)}));
  totalSteps+=steps;if(s.mode==='explore')wins++;else if(s.mode==='defeat')losses++;else unfinished++;
 }
 results.push({scene,level,runs:4*seedCount,wins,losses,unfinished,meanSteps:Math.round(totalSteps/(4*seedCount))});
 console.log(`${scene}: ${wins}/${4*seedCount} wins, ${unfinished} unfinished`);
}
const report={depleted,kind:'controlled simulation, not human balance acceptance',assumptions:'Independent encounters; baseline uses fresh HP/resources, depleted scenario uses half HP/slots and zero potions; four hero classes; fixed Rogue/Fighter companions; greedy legal-action hero policy; authored chapter-level assumptions; no encounter attrition or paid AI.',seedCount,results};
if(!process.argv[4])writeFileSync(depleted?'docs/COMBAT_DEPLETED_SIMULATION.json':'docs/COMBAT_SIMULATION.json',JSON.stringify(report,null,2)+'\n');
