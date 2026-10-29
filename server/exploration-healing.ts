import {classResources,heal,modifier,spendSlot} from '../shared/curated-rules.js';
import type {ActionOption} from '../shared/types.js';
import {resolveOffered,log,type Save} from './game.js';
import {projectTactical} from './tactical.js';
import {damageRoll,type Dice} from './rules.js';
export function explorationHealingActions(s:Save):ActionOption[]{
 if(!s.tactical||s.mode!=='explore'||s.companionStoryId)return[];
 const result:ActionOption[]=[];
 for(const actor of s.party){const c=s.tactical.actors[actor.id];if(c.dead||c.hp<=0)continue;
  const add=(kind:string,target:string,label:string,description:string,rank=1)=>result.push({id:`recover:${kind}:${actor.id}:${target}${rank>1?':'+rank:''}`,actorId:actor.id,targetId:target,label,description,kind:'heal'});
  if(c.classId==='fighter'&&classResources(c).secondWind>0&&c.hp<c.maxHp)add('wind',actor.id,`Second Wind · ${actor.name}`,'Restore 1d10 + Fighter level health. Spend one Second Wind use.');
  for(const target of s.party){const t=s.tactical.actors[target.id];if(t.dead||t.hp>=t.maxHp)continue;
   if(actor.potions>0)add('potion',target.id,`${actor.name}: give potion to ${target.name}`,'Regroup outside combat. Spend one potion to restore 2d4 + 2 health.');
   if(c.classId==='cleric')for(let rank=1;rank<=4;rank++)if(c.slots[rank-1]>0)add('cure',target.id,`${actor.name}: Cure Wounds · level ${rank} slot · ${target.name}`,`Regroup outside combat. Spend one level ${rank} spell slot to restore ${rank*2}d8 + Wisdom health, plus supported Life Domain healing.`,rank);
  }
 }
 return result;
}
export function resolveExplorationHealing(original:Save,id:string,dice:Dice):Save{
 return resolveOffered(original,id,explorationHealingActions,'HEAL_UNAVAILABLE','That recovery is unavailable. Check the character, target and remaining resources.',s=>{
 const[,kind,actorId,targetId,rankText]=id.split(':');const rank=Number(rankText??1);const t=s.tactical!,c=t.actors[actorId],a=s.party.find(a=>a.id===actorId)!;
 const bonus=kind==='wind'?c.level:kind==='cure'?modifier(c.abilities.wisdom)+(c.level>=3?2+rank:0):2;
 const r=damageRoll(dice,kind==='wind'?10:kind==='cure'?8:4,bonus,kind==='wind'?'Second Wind':kind==='cure'?'Cure Wounds':'Healing potion');
 for(let i=1;i<(kind==='wind'?1:kind==='cure'?rank*2:2);i++){const extra=dice(r.sides);r.values.push(extra);r.kept+=extra;r.total+=extra;}
 if(kind==='wind')c.features={...classResources(c),secondWind:classResources(c).secondWind-1};
 if(kind==='cure')t.actors[actorId]=spendSlot(c,rank);if(kind==='potion')a.potions--;
 const before=t.actors[targetId].hp;t.actors[targetId]=heal(t.actors[targetId],r.total);
 if(kind==='cure'&&c.level>=6&&actorId!==targetId)t.actors[actorId]=heal(t.actors[actorId],2+rank);
 projectTactical(s,false);log(s,`${a.name} uses ${r.purpose}${kind==='cure'?` (level ${rank} slot)`: ''} on ${s.party.find(a=>a.id===targetId)!.name}, restoring ${t.actors[targetId].hp-before} health.`,actorId,[r]);
 });
}
