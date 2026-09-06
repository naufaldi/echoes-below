import {ITEMS} from '../shared/logistics.js';
import type {Actor,ActionOption,ClassId} from '../shared/types.js';
import {CURATED_RULES_VERSION,CURATED_CLASS_IDS,classResources,resetTurnResources,makeCharacter,modifier,spendAction,spendSlot,takeDamage,heal,deathSave,type CuratedClass} from '../shared/curated-rules.js';
import {findPath,lineOfSight,type Cell} from '../shared/tactical-grid.js';
import {actorDisplayName} from '../shared/visual-identity.js';
import type {CompanionDirective} from '../shared/tactical-state.js';
import {GameError,log,finishCheck,type Save} from './game.js';
import {rollD20,damageRoll,type Dice} from './rules.js';
const classes=CURATED_CLASS_IDS;
const members=(s:Save)=>[...s.party,...s.enemies];
const option=(id:string,label:string,kind='interact',actorId?:string,targetId?:string,description=label):ActionOption=>({id,label,kind,actorId,targetId,description});
export function initializeTactical(s:Save){
 s.rulesVersion=CURATED_RULES_VERSION;s.tactical={actors:{},cells:{},grid:{width:9,height:9,blocked:[[0,0],[8,0],[0,8],[8,8]],difficult:[[1,4],[7,4]]},directives:{mira:'balanced',oren:'protect'},focusTarget:null,takeover:null};
 for(const a of s.party)s.tactical.actors[a.id]=makeCharacter(classes[a.classId as ClassId]);projectTactical(s,false);
}
export function projectTactical(s:Save,positions=true){
 if(!s.tactical)return;if(s.tactical.effects)s.tactical.effects=s.tactical.effects.filter(e=>s.tactical!.actors[e.sourceId]?.concentration===e.id);for(const a of members(s)){const c=s.tactical.actors[a.id];if(!c)continue;const equipment=s.logistics?.equipped[a.id];if(equipment)c.armorClass=ITEMS[equipment.armor].ac+(equipment.armor==='chain'?0:modifier(c.abilities.dexterity))+(equipment.shield?2:0)+(equipment.cloak?1:0);a.hp=c.hp;a.maxHp=c.maxHp;a.defense=c.armorClass;
  a.attributes={might:modifier(c.abilities.strength),agility:modifier(c.abilities.dexterity),insight:modifier(c.abilities[c.classId==='wizard'?'intelligence':'wisdom']),presence:modifier(c.abilities.charisma)};
  const cell=s.tactical.cells[a.id];if(positions&&cell)a.position=[(cell[0]-4)*1.2,(cell[1]-4)*1.2];
 }
 if(s.turn){const c=s.tactical.actors[s.turn.actorId];s.turn.actionRemaining=c.economy.action;s.turn.movementM=c.economy.movementFeet*.3048;}
}
export function startTacticalCombat(s:Save,dice:Dice){
 const t=s.tactical!;t.takeover=null;t.cells={};
 s.party.forEach((a,i)=>{t.cells[a.id]=[3+i,1];});
 s.enemies.forEach((a,i)=>{const c=makeCharacter('fighter',Math.min(8,s.level??1));c.hp=a.hp;c.maxHp=a.maxHp;c.armorClass=a.defense;c.abilities.strength=10+a.attributes.might*2;c.abilities.dexterity=12;c.dead=false;t.actors[a.id]=c;t.cells[a.id]=[3+i,6];});
 const initiative=members(s).map(a=>{const roll=rollD20(dice,modifier(t.actors[a.id].abilities.dexterity),'Initiative');log(s,`${actorDisplayName(a,s.enemies)} rolls initiative ${roll.total}.`,a.id,[roll]);return{id:a.id,total:roll.total};}).sort((a,b)=>b.total-a.total||a.id.localeCompare(b.id));
 s.turnIndex=0;s.turn={actorId:initiative[0].id,order:initiative.map(a=>a.id),round:1,movementM:0,actionRemaining:true};beginTurn(s);projectTactical(s);
 log(s,'Combat begins. Each creature acts separately. Review the active turn, then choose an action or let the creature act.');
}
function beginTurn(s:Save){members(s).find(a=>a.id===s.turn!.actorId)!.guard=false;const c=s.tactical!.actors[s.turn!.actorId];for(const e of s.tactical!.effects??[]){if(e.sourceId===s.turn!.actorId&&--e.rounds===0)c.concentration=null;}resetTurnResources(c);c.economy={action:true,bonus:true,reaction:true,movementFeet:c.speedFeet};s.tactical!.takeover=null;s.tactical!.started=false;}
function gridFor(s:Save,id:string){const t=s.tactical!;return{...t.grid,blocked:[...t.grid.blocked,...members(s).filter(a=>a.id!==id&&a.hp>0).map(a=>t.cells[a.id])]};}
function range(s:Save,a:string,b:string){const cells=s.tactical!.cells;return Math.max(Math.abs(cells[a][0]-cells[b][0]),Math.abs(cells[a][1]-cells[b][1]))*5;}
function optionsForActor(s:Save,id:string){
 const t=s.tactical!,a=members(s).find(a=>a.id===id)!,c=t.actors[id],result:ActionOption[]=[];
 if(c.hp<=0)return[option(c.death.stable?'tactical:end':'tactical:death',c.death.stable?'Skip unconscious turn':'Resolve death save','check',id)];
 const features=classResources(c);
 if(a.side==='party'){
 if(c.classId==='fighter'&&features.secondWind>0&&c.economy.bonus&&c.hp<c.maxHp)result.push(option('tactical:second_wind','Second Wind · bonus action','heal',id,id,'Restore 1d10 + Fighter level health. Spend one Second Wind use and your bonus action.'));
 if(c.classId==='fighter'&&c.level>=2&&features.actionSurge>0&&!c.economy.action&&features.attacksRemaining===0)result.push(option('tactical:action_surge','Action Surge','feature',id,undefined,'Regain one action. Once per short or long rest.'));
 if(c.classId==='rogue'&&c.level>=2&&c.economy.bonus)result.push(option('tactical:cunning_dash','Cunning Dash · bonus action','feature',id,undefined,'Gain movement equal to your speed, spending your bonus action.'));
 }
 const ranged=['wizard','cleric','rogue'].includes(c.classId)&&a.side==='party';const targets=members(s).filter(x=>x.side!==a.side&&x.hp>0);
 if(c.economy.action||features.attacksRemaining>0)for(const target of targets){if(range(s,id,target.id)<=(ranged?(c.classId==='wizard'?120:c.classId==='rogue'?80:60):5)&&lineOfSight(t.grid,t.cells[id],t.cells[target.id]))result.push(option('tactical:attack:'+target.id,`${ranged?(c.classId==='wizard'?'Fire Bolt':c.classId==='cleric'?'Sacred Flame':'Ranged attack'):'Attack'} · ${actorDisplayName(target,s.enemies)}`,'attack',id,target.id));}
 if(c.economy.action){result.push(option('tactical:dodge','Dodge','defend',id));if(a.potions>0)for(const ally of s.party.filter(x=>x.hp<x.maxHp&&!t.actors[x.id].dead&&range(s,id,x.id)<=5))result.push(option('tactical:potion:'+ally.id,'Give healing potion · '+ally.name,'heal',id,ally.id));
  if(c.classId==='cleric'&&c.slots[0]>0&&!features.slotSpent)for(const ally of s.party.filter(x=>x.hp<x.maxHp&&!t.actors[x.id].dead&&range(s,id,x.id)<=5))result.push(option('tactical:cure:'+ally.id,'Cure Wounds · '+ally.name,'heal',id,ally.id,'Spend an action and one rank-1 spell slot to restore 2d8 + Wisdom health.'));
 }
 if(a.side==='party'&&!features.slotSpent&&c.slots[0]>0){
  if(c.classId==='cleric'&&c.economy.action)result.push(option('tactical:bless','Bless · concentrate','spell',id,undefined,'Spend an action and rank-1 slot. Bless visible party members within 30 feet: +1d4 to attacks and saving throws for up to 10 rounds while you concentrate.'));
  if(c.classId==='wizard'&&c.economy.action)for(const target of targets.filter(x=>range(s,id,x.id)<=120&&lineOfSight(t.grid,t.cells[id],t.cells[x.id])))result.push(option('tactical:missile:'+target.id,'Magic Missile · '+actorDisplayName(target,s.enemies),'spell',id,target.id,'Three darts automatically hit this target for 1d4 + 1 force damage each. Spend one rank-1 slot and an action.'));
  if(c.classId==='cleric'&&c.economy.bonus)for(const ally of s.party.filter(x=>x.hp<x.maxHp&&!t.actors[x.id].dead&&range(s,id,x.id)<=60&&lineOfSight(t.grid,t.cells[id],t.cells[x.id])))result.push(option('tactical:healing_word:'+ally.id,'Healing Word · '+ally.name,'heal',id,ally.id,'Restore 2d4 + Wisdom health. Spend a bonus action and one rank-1 slot.'));
 }
 if(c.economy.movementFeet>=5){const grid=gridFor(s,id);for(let x=0;x<grid.width;x++)for(let y=0;y<grid.height;y++){if(t.cells[id][0]===x&&t.cells[id][1]===y)continue;const path=findPath(grid,t.cells[id],[x,y],c.economy.movementFeet);if(path)result.push(option(`tactical:move:${x},${y}`,`Move to ${x+1}, ${y+1} · ${path.costFeet} ft`,'move',id,undefined,`Follow a legal path of ${path.costFeet} feet. Remaining movement: ${c.economy.movementFeet-path.costFeet} feet.`));}}
 result.push(option('tactical:end','End turn','turn',id));return result;
}
export function tacticalActions(s:Save):ActionOption[]{
 if(!s.turn||!s.tactical)return[];const id=s.turn.actorId,a=members(s).find(a=>a.id===id)!;
 const commands:ActionOption[]=[];
 if(a.side==='party'&&id!=='hero')for(const directive of ['balanced','focus','protect','conserve'] as CompanionDirective[]){if(s.tactical.directives[id]!==directive)commands.push(option('tactical:directive:'+directive,'Tactics · '+directive,'tactics',id));}
 if(id==='hero'||s.tactical.takeover===id)return[...optionsForActor(s,id),...commands];
 return[option('tactical:auto',`Let ${actorDisplayName(a,s.enemies)} act`,'turn',id),...(a.side==='party'&&a.hp>0&&!s.tactical.started?[option('tactical:takeover',`Control ${a.name} for this turn`,'tactics',id),...commands]:[])];
}
function nextTurn(s:Save){if(finishCheck(s))return;const order=s.turn!.order;for(let i=0;i<order.length;i++){s.turnIndex=(s.turnIndex+1)%order.length;if(s.turnIndex===0)s.turn!.round++;const next=order[s.turnIndex],a=members(s).find(a=>a.id===next)!;if(s.tactical!.actors[next].dead||(a.side==='enemy'&&a.hp===0))continue;s.turn!.actorId=next;beginTurn(s);return;}s.mode='defeat';s.turn=null;}
function record(s:Save,...args:Parameters<typeof log> extends [Save,...infer Rest]?Rest:never){projectTactical(s);log(s,...args);}
function savingRoll(s:Save,id:string,dice:Dice,ability:'dexterity'|'constitution',purpose:string){
 const c=s.tactical!.actors[id];const trained=(c.classId==='fighter'&&ability==='constitution')||(c.classId==='rogue'&&ability==='dexterity');
 const bless=(s.tactical!.effects??[]).some(e=>e.targets.includes(id)&&s.tactical!.actors[e.sourceId]?.concentration===e.id)?dice(4):0;
 return rollD20(dice,modifier(c.abilities[ability])+(trained?c.proficiency:0)+bless,purpose+(bless?` (Bless +${bless})`:''));
}
function resolve(s:Save,id:string,dice:Dice){
 const t=s.tactical!,actorId=s.turn!.actorId,a=members(s).find(a=>a.id===actorId)!;let c=t.actors[actorId];const [,kind,targetId]=id.split(':');
 if(kind==='end'){record(s,`${a.name} ends their turn.`,actorId);nextTurn(s);return;}
 if(kind==='death'){const r=rollD20(dice,0,'Death save');t.actors[actorId]=deathSave(c,r.kept);projectTactical(s);record(s,`${a.name} makes a death save: ${r.kept}.`,actorId,[r]);nextTurn(s);return;}
 if(kind==='move'){const target=targetId.split(',').map(Number) as Cell;const path=findPath(gridFor(s,actorId),t.cells[actorId],target,c.economy.movementFeet);if(!path)throw new GameError(422,'PATH','That route is blocked or exceeds your movement.');a.motion={id:`${s.revision}:${actorId}`,points:path.cells.slice(1).map(([x,y])=>[(x-4)*1.2,(y-4)*1.2])};t.cells[actorId]=target;c.economy.movementFeet-=path.costFeet;record(s,`${a.name} moves ${path.costFeet} feet.`,actorId);}
 else if(kind==='second_wind'){const r=damageRoll(dice,10,c.level,'Second Wind');const f=classResources(c);t.actors[actorId]=heal(spendAction(c,'bonus'),r.total);t.actors[actorId].features={...f,secondWind:f.secondWind-1};record(s,`${a.name} uses Second Wind and restores up to ${r.total} health.`,actorId,[r]);}
 else if(kind==='action_surge'){const f=classResources(c);c.features={...f,actionSurge:f.actionSurge-1};c.economy.action=true;record(s,`${a.name} uses Action Surge to regain an action.`,actorId);}
 else if(kind==='cunning_dash'){t.actors[actorId]=spendAction(c,'bonus');t.actors[actorId].economy.movementFeet+=c.speedFeet;record(s,`${a.name} uses Cunning Dash, gaining ${c.speedFeet} feet of movement.`,actorId);}
 else if(kind==='bless'){t.actors[actorId]=spendSlot(spendAction(c,'action'),1);t.actors[actorId].features={...classResources(c),slotSpent:true};const effectId=`bless:${actorId}:${s.revision}`;t.actors[actorId].concentration=effectId;t.effects=[...(t.effects??[]).filter(e=>e.sourceId!==actorId),{id:effectId,sourceId:actorId,kind:'bless',rounds:10,targets:s.party.filter(x=>x.hp>0&&range(s,actorId,x.id)<=30&&lineOfSight(t.grid,t.cells[actorId],t.cells[x.id])).map(x=>x.id)}];record(s,`${a.name} casts Bless and begins concentrating.`,actorId);}
 else if(kind==='missile'){t.actors[actorId]=spendSlot(spendAction(c,'action'),1);t.actors[actorId].features={...classResources(c),slotSpent:true};const rolls=[];let damage=0;for(let dart=0;dart<3;dart++){const r=damageRoll(dice,4,1,'Magic Missile dart');rolls.push(r);damage+=r.total;const victim=t.actors[targetId];let saveTotal:number|undefined;if(victim.concentration){const check=savingRoll(s,targetId,dice,'constitution','Concentration');rolls.push(check);saveTotal=check.total;}t.actors[targetId]=takeDamage(victim,r.total,false,saveTotal);}const target=members(s).find(x=>x.id===targetId)!;if(target.side==='enemy'&&t.actors[targetId].hp===0)t.actors[targetId].dead=true;record(s,`${a.name} casts Magic Missile at ${actorDisplayName(target,s.enemies)} for ${damage} force damage.`,actorId,rolls);}
 else if(kind==='dodge'){t.actors[actorId]=spendAction(c,'action');a.guard=true;record(s,`${a.name} dodges until their next turn.`,actorId);}
 else if(kind==='potion'||kind==='cure'||kind==='healing_word'){t.actors[actorId]=spendAction(c,kind==='healing_word'?'bonus':'action');let r=damageRoll(dice,kind==='cure'?8:4,kind!=='potion'?modifier(c.abilities.wisdom):2,'Healing');const second=dice(kind==='cure'?8:4);r.values.push(second);r.kept+=second;r.total+=second;if(kind!=='potion'&&c.classId==='cleric'&&c.level>=3){r.modifier+=3;r.total+=3;}
  if(kind!=='potion'){t.actors[actorId]=spendSlot(t.actors[actorId],1);t.actors[actorId].features={...classResources(c),slotSpent:true};}else a.potions--;t.actors[targetId]=heal(t.actors[targetId],r.total);if(kind!=='potion'&&c.classId==='cleric'&&c.level>=6&&targetId!==actorId)t.actors[actorId]=heal(t.actors[actorId],3);record(s,`${a.name} heals ${members(s).find(x=>x.id===targetId)!.name} for ${r.total}.`,actorId,[r]);
 }else if(kind==='attack'&&a.side==='party'&&c.classId==='cleric'){
  t.actors[actorId]=spendAction(c,'action');const target=members(s).find(x=>x.id===targetId)!,victim=t.actors[targetId],r=savingRoll(s,targetId,dice,'dexterity','Sacred Flame · Dexterity save');const rolls=[r],dc=8+c.proficiency+modifier(c.abilities.wisdom);let damage=0;
  if(r.total<dc){for(let i=0;i<(c.level>=5?2:1);i++){const d=damageRoll(dice,8,0,'Radiant damage');rolls.push(d);damage+=d.total;}let saveTotal:number|undefined;if(victim.concentration){const cr=savingRoll(s,targetId,dice,'constitution','Concentration');rolls.push(cr);saveTotal=cr.total;}t.actors[targetId]=takeDamage(victim,damage,false,saveTotal);if(target.side==='enemy'&&t.actors[targetId].hp===0)t.actors[targetId].dead=true;}
  record(s,`${a.name} casts Sacred Flame: ${actorDisplayName(target,s.enemies)} ${r.total>=dc?'saves':'fails'} (${r.total} vs DC ${dc}), ${damage} radiant damage.`,actorId,rolls);
 }else if(kind==='attack'){
  const features=classResources(c);if(features.attacksRemaining>0)c.features={...features,attacksRemaining:features.attacksRemaining-1};else{t.actors[actorId]=spendAction(c,'action');t.actors[actorId].features={...features,attacksRemaining:a.side==='party'&&c.classId==='fighter'&&c.level>=5?1:0};}const target=members(s).find(x=>x.id===targetId)!;const ranged=a.side==='party'&&c.classId!=='fighter';const ability=c.classId==='wizard'?'intelligence':c.classId==='cleric'?'wisdom':c.classId==='rogue'?'dexterity':'strength';const mod=modifier(c.abilities[ability]);
  const threatened=ranged&&members(s).some(x=>x.side!==a.side&&x.hp>0&&range(s,actorId,x.id)<=5);const disadvantage=target.guard||threatened;const blessing=(t.effects??[]).some(e=>e.kind==='bless'&&e.targets.includes(actorId)&&t.actors[e.sourceId].concentration===e.id)?damageRoll(dice,4,0,'Bless'):null;const r=rollD20(dice,mod+c.proficiency+(blessing?.total??0),'Attack',false,disadvantage);const critical=r.kept===20||(a.side==='party'&&c.classId==='fighter'&&c.level>=3&&r.kept===19);const hit=critical||(r.kept!==1&&r.total>=target.defense);const rolls=blessing?[r,blessing]:[r];let damage=0;
  if(hit){const d=damageRoll(dice,ranged?(c.classId==='wizard'?10:6):8,['wizard','cleric'].includes(c.classId)&&a.side==='party'?0:mod,'Damage',critical);damage=d.total;rolls.push(d);if(a.side==='party'&&c.classId==='wizard'&&c.level>=5){const extra=damageRoll(dice,10,0,'Fire Bolt scaling',critical);rolls.push(extra);damage+=extra.total;}if(a.side==='party'&&c.classId==='rogue'&&!classResources(t.actors[actorId]).sneakUsed&&!disadvantage&&s.party.some(ally=>ally.id!==actorId&&ally.hp>0&&range(s,ally.id,targetId)<=5)){for(let i=0;i<Math.ceil(c.level/2);i++){const sneak=damageRoll(dice,6,0,'Sneak Attack',critical);rolls.push(sneak);damage+=sneak.total;}t.actors[actorId].features={...classResources(t.actors[actorId]),sneakUsed:true};}let saveTotal:number|undefined;const victim=t.actors[targetId];if(victim.concentration){const cr=savingRoll(s,targetId,dice,'constitution','Concentration');rolls.push(cr);saveTotal=cr.total;}t.actors[targetId]=takeDamage(victim,damage,critical,saveTotal);if(target.side==='enemy'&&t.actors[targetId].hp===0)t.actors[targetId].dead=true;}
  record(s,`${a.name} attacks ${actorDisplayName(target,s.enemies)}: ${hit?`${damage} damage`:'miss'}.`,actorId,rolls);
 }
 projectTactical(s);finishCheck(s);
}
function chooseAutomatic(s:Save):ActionOption{
 const id=s.turn!.actorId,t=s.tactical!,a=members(s).find(a=>a.id===id)!,options=optionsForActor(s,id),directive=t.directives[id]??'balanced';
 const dying=options.find(o=>o.kind==='heal'&&t.actors[o.targetId!].hp===0);if(dying)return dying;
 const healOption=options.find(o=>o.kind==='heal'&&t.actors[o.targetId!].hp<t.actors[o.targetId!].maxHp/2);if(healOption&&directive!=='conserve')return healOption;
 const attacks=options.filter(o=>o.kind==='attack');if(attacks.length){if(directive==='focus'&&t.focusTarget){const focus=attacks.find(o=>o.targetId===t.focusTarget);if(focus)return focus;}return attacks.sort((a,b)=>t.actors[a.targetId!].hp-t.actors[b.targetId!].hp)[0];}
 if(!t.actors[id].economy.action)return options.find(o=>o.id==='tactical:end')!;
 const foes=members(s).filter(x=>x.side!==a.side&&x.hp>0);const moves=options.filter(o=>o.kind==='move');if(foes.length&&moves.length){const goal=directive==='protect'&&a.side==='party'?t.cells.hero:t.cells[foes.sort((x,y)=>range(s,id,x.id)-range(s,id,y.id))[0].id];moves.sort((a,b)=>{const p=(o:ActionOption)=>o.id.split(':')[2].split(',').map(Number);const dist=(o:ActionOption)=>Math.hypot(p(o)[0]-goal[0],p(o)[1]-goal[1]);return dist(a)-dist(b);});return moves[0];}
 return options.find(o=>o.id==='tactical:death')??options.find(o=>o.id==='tactical:end')!;
}
export function applyTactical(original:Save,id:string,dice:Dice):Save{
 const s=structuredClone(original);s.presentation=[];if(!tacticalActions(s).some(a=>a.id===id))throw new GameError(422,'ACTION','That action is no longer available.');const actorId=s.turn!.actorId;
 if(id==='tactical:takeover'){s.tactical!.takeover=actorId;log(s,'You control this companion until the end of this turn.',actorId);}
 else if(id.startsWith('tactical:directive:')){s.tactical!.directives[actorId]=id.split(':')[2] as CompanionDirective;log(s,`Tactics changed to ${id.split(':')[2]}.`,actorId);}
 else if(id==='tactical:auto'){
  // Resolve one decision per click. A move can be followed by an attack on the next click.
  s.tactical!.started=true;resolve(s,chooseAutomatic(s).id,dice);
 }else{if(id.startsWith('tactical:attack:'))s.tactical!.focusTarget=id.split(':')[2];resolve(s,id,dice);}
 projectTactical(s);s.revision++;s.updatedAt=new Date().toISOString();return s;
}
