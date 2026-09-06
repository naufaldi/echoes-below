import {consumeAttackHelp} from './attack-help.js';
import type {Save} from './game.js';
import type {Actor,Roll} from '../shared/types.js';
import {classResources,modifier,spendAction,takeDamage,type Ability} from '../shared/curated-rules.js';
import {enemyRole} from '../shared/enemy-roles.js';
import {lineOfSight,type Cell} from '../shared/tactical-grid.js';
import {actorDisplayName} from '../shared/visual-identity.js';
import {rollD20,damageRoll,type Dice} from './rules.js';
const members=(s:Save)=>[...s.party,...s.enemies];
const distance=(a:Cell,b:Cell)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))*5;
/** Curated fixed melee loadouts; ranged weapons and cantrips never become reactions. */
function melee(s:Save,a:Actor){
 const c=s.tactical!.actors[a.id],role=enemyRole(a);
 if(a.side==='enemy'&&role&&role.range<=10)return{name:role.attack,reach:role.range,die:role.die,mod:role.bonus,finesse:false};
 const ability:Ability=c.classId==='rogue'||a.enemyRole==='goblin_scout'||a.enemyRole==='bone_archer'||a.enemyRole==='venom_stalker'?'dexterity':'strength';
 const name=a.side==='party'?({fighter:'Longsword',rogue:'Dagger',wizard:'Quarterstaff',cleric:'Mace'}[c.classId]):a.enemyRole==='slime_spitter'?'Pseudopod':a.enemyRole==='venom_stalker'?'Fangs':a.enemyRole==='resonant_adept'?'Quarterstaff':'Dagger';
 const die=name==='Longsword'?8:['Quarterstaff','Mace'].includes(name)?6:4;
 return{name,reach:5,die,mod:modifier(c.abilities[ability]),finesse:name==='Dagger'};
}
export function opportunityAttackers(s:Save,moverId:string,from:Cell,to:Cell):Actor[]{
 const t=s.tactical!,mover=members(s).find(a=>a.id===moverId)!;
 if(classResources(t.actors[moverId]).disengaged||t.actors[moverId].hp<=0)return[];
 return members(s).filter(a=>{const c=t.actors[a.id],cell=t.cells[a.id];return a.side!==mover.side&&cell&&c.hp>0&&!c.dead&&c.economy.reaction&&t.reactionPolicy?.[a.id]!=='hold'&&distance(cell,from)<=melee(s,a).reach&&distance(cell,to)>melee(s,a).reach&&lineOfSight(t.grid,cell,from);}).sort((a,b)=>{const order=s.turn?.order??[];return order.indexOf(a.id)-order.indexOf(b.id)||a.id.localeCompare(b.id);});
}
export function opportunityThreats(s:Save,moverId:string,path:Cell[]){
 const threats=new Map<string,Actor>();for(let i=1;i<path.length;i++)for(const a of opportunityAttackers(s,moverId,path[i-1],path[i]))threats.set(a.id,a);return [...threats.values()];
}
export function resolveOpportunity(s:Save,attackerId:string,targetId:string,dice:Dice){
 const t=s.tactical!,a=members(s).find(a=>a.id===attackerId)!,target=members(s).find(a=>a.id===targetId)!,c=t.actors[attackerId],profile=melee(s,a);
 t.actors[attackerId]=spendAction(c,'reaction');
 const blessed=(t.effects??[]).some(e=>e.kind==='bless'&&e.targets.includes(attackerId)&&t.actors[e.sourceId]?.concentration===e.id);
 const blessing=blessed?damageRoll(dice,4,0,'Bless'):null;
 const disadvantage=target.guard&&t.actors[targetId].speedFeet>0;
 const advantage=consumeAttackHelp(s,attackerId,targetId);
 const r=rollD20(dice,profile.mod+c.proficiency+(blessing?.total??0),advantage?'Opportunity attack · Help':'Opportunity attack',advantage,disadvantage),rolls:Roll[]=blessing?[r,blessing]:[r];
 const critical=r.kept===20||(a.side==='party'&&c.classId==='fighter'&&c.level>=3&&r.kept===19),hit=critical||(r.kept!==1&&r.total>=t.actors[targetId].armorClass);let damage=0;
 if(hit){const d=damageRoll(dice,profile.die,profile.mod,profile.name+' damage',critical);rolls.push(d);damage=Math.max(0,d.total);
  if(a.side==='party'&&c.classId==='rogue'&&profile.finesse&&!classResources(c).sneakUsed&&(!disadvantage||advantage)&&((advantage&&!disadvantage)||members(s).some(ally=>ally.id!==a.id&&ally.side===a.side&&t.actors[ally.id].hp>0&&distance(t.cells[ally.id],t.cells[targetId])<=5))){
   for(let i=0;i<Math.ceil(c.level/2);i++){const sneak=damageRoll(dice,6,0,'Sneak Attack',critical);rolls.push(sneak);damage+=sneak.total;}t.actors[attackerId].features={...classResources(t.actors[attackerId]),sneakUsed:true};
  }
  const victim=t.actors[targetId];let saveTotal:number|undefined;
  if(victim.concentration&&damage>0){const bless=(t.effects??[]).some(e=>e.targets.includes(targetId)&&t.actors[e.sourceId]?.concentration===e.id)?dice(4):0;const cr=rollD20(dice,modifier(victim.abilities.constitution)+(victim.classId==='fighter'?victim.proficiency:0)+bless,'Concentration'+(bless?` (Bless +${bless})`:''));rolls.push(cr);saveTotal=cr.total;}
  t.actors[targetId]=takeDamage(victim,damage,critical,saveTotal);if(target.side==='enemy'&&t.actors[targetId].hp===0)t.actors[targetId].dead=true;
 }
 return{text:`${actorDisplayName(a,s.enemies)} makes an opportunity attack with ${profile.name} against ${actorDisplayName(target,s.enemies)}: ${hit?`${damage} damage`:'miss'}.`,rolls};
}
