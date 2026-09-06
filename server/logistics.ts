import {ITEMS,initialLogistics,usedCopies,type ItemId} from '../shared/logistics.js';
import {modifier,classResources,restoreClassResources,heal} from '../shared/curated-rules.js';
import {GameError,log,type Save} from './game.js';
import {projectTactical} from './tactical.js';
import {damageRoll,type Dice} from './rules.js';
import type {ActionOption} from '../shared/types.js';
export function logisticsFor(s:Save){return s.logistics??initialLogistics(s.party);}
function safeCamp(s:Save){return s.mode==='explore'&&(s.sceneId==='approach'||s.sceneId==='aftermath'||!!s.flags[`${s.sceneId}:resolved`]);}
function option(id:string,label:string,kind='inventory',description=label,actorId?:string):ActionOption{return{id,label,kind,description,actorId};}
export function logisticsActions(s:Save):ActionOption[]{
 if(!s.tactical||s.mode!=='explore'||s.companionStoryId)return[];const l=logisticsFor(s),actions:ActionOption[]=[];
 for(const a of s.party.filter(a=>a.hp>0)){const equipment=l.equipped[a.id];for(const item of Object.keys(ITEMS) as ItemId[]){
  const definition=ITEMS[item];const heavy=a.classId==='guardian'||a.classId==='cleric';if((item==='chain'||item==='shield')&&!heavy||item==='leather'&&a.classId==='adept')continue;
  const wearing=item==='shield'?equipment.shield:item==='ward_cloak'?equipment.cloak:equipment.armor===item;
  if(wearing){if(item==='shield'||item==='ward_cloak')actions.push(option(`gear:remove:${a.id}:${item}`,`Remove ${definition.name} · ${a.name}`,'inventory','Return this item to the shared pack.',a.id));continue;}
  if(usedCopies(l,item,a.id)<l.owned[item])actions.push(option(`gear:equip:${a.id}:${item}`,`Equip ${definition.name} · ${a.name}`,'inventory',`Equip ${definition.name}. Armor class updates immediately; the item stays in the party’s shared inventory.`,a.id));
 }}
 if(safeCamp(s)){
  if(!l.shortRests.includes(s.sceneId))actions.push(option('camp:short','Take a short rest','camp','One hour at this cleared campsite. Injured conscious allies spend one Hit Die. Fighters recover one Second Wind and Action Surge; Wizards can recover a limited number of spell slots once per long rest.'));
  const living=s.party.filter(a=>!s.tactical!.actors[a.id].dead).length;
  if(!l.longRests.includes(s.sceneId)&&s.party.reduce((n,a)=>n+a.rations,0)>=living)actions.push(option('camp:long','Share supplies and take a long rest','camp',`Eight hours at this cleared campsite. Spend ${living} rations. Living allies regain health, spell slots, Hit Dice and class resources. Available once at this campsite.`));
 }
 return actions;
}
export function updateArmor(s:Save){if(!s.tactical||!s.logistics)return;for(const a of s.party){const c=s.tactical.actors[a.id],e=s.logistics.equipped[a.id];c.armorClass=ITEMS[e.armor].ac+(e.armor==='chain'?0:modifier(c.abilities.dexterity))+(e.shield?2:0)+(e.cloak?1:0);}}
export function grantLogisticsLoot(s:Save,previous:Save){if(!s.tactical)return;s.logistics??=logisticsFor(s);const l=s.logistics;
 if(!previous.flags['cache:approach']&&s.flags['cache:approach']&&!l.rewards.includes('approach-cloak')){l.rewards.push('approach-cloak');l.owned.ward_cloak++;log(s,'Inside the chest, beneath the potion, you find a Keeper’s ward cloak. Equip it from Inventory & camp for +1 armor class.');}
}
export function applyLogistics(original:Save,id:string,dice:Dice):Save{
 if(!logisticsActions(original).some(a=>a.id===id))throw new GameError(422,'LOGISTICS','That equipment change or rest is unavailable.');const s=structuredClone(original);s.logistics??=logisticsFor(s);s.presentation=[];const l=s.logistics,t=s.tactical!;
 if(id.startsWith('gear:')){const [,verb,actor,item]=id.split(':');const e=l.equipped[actor];if(item==='shield')e.shield=verb==='equip';else if(item==='ward_cloak')e.cloak=verb==='equip';else e.armor=item as typeof e.armor;updateArmor(s);projectTactical(s,false);log(s,`${s.party.find(a=>a.id===actor)!.name} ${verb==='equip'?'equips':'removes'} ${ITEMS[item as ItemId].name}. Armor class is now ${t.actors[actor].armorClass}.`,actor);}
 else if(id==='camp:short'){
  l.shortRests.push(s.sceneId);s.ticks++;
  for(const a of s.party){let c=t.actors[a.id];if(c.dead||c.hp<=0)continue;
   if(c.hitDice>0&&c.hp<c.maxHp){const r=damageRoll(dice,c.hitDie,modifier(c.abilities.constitution),'Short rest · Hit Die');c=heal(c,Math.max(1,r.total));c.hitDice--;t.actors[a.id]=c;projectTactical(s,false);log(s,`${a.name} spends a Hit Die to restore up to ${Math.max(1,r.total)} health.`,a.id,[r]);}
   const f=classResources(c);if(c.classId==='fighter')c.features={...f,secondWind:Math.min(c.level>=4?3:2,f.secondWind+1),actionSurge:c.level>=2?1:0};
   if(c.classId==='wizard'&&!l.arcaneRecovery.includes(a.id)){let budget=Math.ceil(c.level/2),recovered=0;for(let rank=c.slots.length;rank>=1;rank--)while(rank<=budget&&c.slots[rank-1]<c.maxSlots[rank-1]){c.slots[rank-1]++;budget-=rank;recovered++;}if(recovered){l.arcaneRecovery.push(a.id);log(s,`${a.name} uses Arcane Recovery to recover ${recovered} spell slot${recovered===1?'':'s'}.`,a.id);}}
  }projectTactical(s,false);log(s,'The party rests for an hour. The cleared campsite is quiet. This site’s short rest is now spent.');
 }else{
  let cost=s.party.filter(a=>!t.actors[a.id].dead).length;for(const a of s.party){const used=Math.min(cost,a.rations);a.rations-=used;cost-=used;}
  l.longRests.push(s.sceneId);l.arcaneRecovery=[];s.ticks+=8;
  for(const a of s.party){const c=t.actors[a.id];if(c.dead)continue;c.hp=c.maxHp;c.slots=[...c.maxSlots];c.hitDice=c.level;c.concentration=null;c.death={successes:0,failures:0,stable:false};restoreClassResources(c);}projectTactical(s,false);log(s,'The party shares a meal and sleeps for eight hours. Health, spell slots and class resources are restored. The rations are spent.');
 }
 s.revision++;s.updatedAt=new Date().toISOString();return s;
}
