import {attackHelped,consumeAttackHelp,expireAttackHelp} from './attack-help.js';
import {opportunityAttackers,opportunityThreats,resolveOpportunity} from './opportunity.js';
import {encounterTerrain} from '../shared/encounter-terrain.js';
import {enemyRole} from '../shared/enemy-roles.js';
import {ITEMS} from '../shared/logistics.js';
import type {Actor,ActionOption,ClassId,AnimationCue,PublicCheck,Roll} from '../shared/types.js';
import {CURATED_RULES_VERSION,CURATED_CLASS_IDS,classResources,resetTurnResources,makeCharacter,modifier,spendAction,spendSlot,takeDamage,heal,deathSave,type CuratedClass} from '../shared/curated-rules.js';
import {findPath,reachable,lineOfSight,approachTarget,type Cell} from '../shared/tactical-grid.js';
import {actorDisplayName} from '../shared/visual-identity.js';
import type {CompanionDirective} from '../shared/tactical-state.js';
import {GameError,log,finishCheck,type Save} from './game.js';
import {rollD20,damageRoll,type Dice} from './rules.js';
import {outcomeCheck,attackProse,sacredFlameProse,type Outcome} from './outcome.js';
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
 const t=s.tactical!;t.takeover=null;t.attackHelp=[];t.cells={};t.grid=encounterTerrain(s.sceneId);
 s.party.forEach((a,i)=>{t.cells[a.id]=[3+i,1];});
 s.enemies.forEach((a,i)=>{const c=makeCharacter('fighter',Math.min(8,s.level??1));c.hp=a.hp;c.maxHp=a.maxHp;c.armorClass=a.defense;c.abilities.strength=10+a.attributes.might*2;c.abilities.dexterity=12;c.dead=false;const role=enemyRole(a);if(role){c.speedFeet=role.speed;c.abilities.dexterity=role.dex;c.features={...classResources(c),secondWind:0,actionSurge:0};}t.actors[a.id]=c;t.cells[a.id]=[3+i,6];});
 for(const a of members(s)){const c=t.actors[a.id];c.economy.reaction=true;c.features={...classResources(c),disengaged:false,sneakUsed:false};}
 const initiative=members(s).map(a=>{const roll=rollD20(dice,modifier(t.actors[a.id].abilities.dexterity),'Initiative');log(s,`${actorDisplayName(a,s.enemies)} rolls initiative ${roll.total}.`,a.id,[roll]);return{id:a.id,total:roll.total};}).sort((a,b)=>b.total-a.total||a.id.localeCompare(b.id));
 s.turnIndex=0;s.turn={actorId:initiative[0].id,order:initiative.map(a=>a.id),round:1,movementM:0,actionRemaining:true};beginTurn(s);projectTactical(s);
 log(s,'Combat begins. Each creature acts separately. Review the active turn, then choose an action or let the creature act.');
}
function beginTurn(s:Save){expireAttackHelp(s,s.turn!.actorId);for(const actor of members(s)){const state=s.tactical!.actors[actor.id];state.features={...classResources(state),sneakUsed:false};}members(s).find(a=>a.id===s.turn!.actorId)!.guard=false;const c=s.tactical!.actors[s.turn!.actorId];for(const e of s.tactical!.effects??[]){if(e.sourceId===s.turn!.actorId&&--e.rounds===0)c.concentration=null;}resetTurnResources(c);c.economy={action:true,bonus:true,reaction:true,movementFeet:c.speedFeet};s.tactical!.takeover=null;s.tactical!.started=false;s.tactical!.dashedThisTurn=false;}
function gridFor(s:Save,id:string){const t=s.tactical!;return{...t.grid,blocked:[...t.grid.blocked,...members(s).filter(a=>a.id!==id&&a.hp>0).map(a=>t.cells[a.id])]};}
function range(s:Save,a:string,b:string){const cells=s.tactical!.cells;return Math.max(Math.abs(cells[a][0]-cells[b][0]),Math.abs(cells[a][1]-cells[b][1]))*5;}
/** The public terms of one attack roll. `resolve()` rolls exactly these, so the odds on the option cannot drift from the outcome (#61). */
function attackTerms(s:Save,actorId:string,targetId:string){
 const t=s.tactical!,a=members(s).find(x=>x.id===actorId)!,c=t.actors[actorId],target=members(s).find(x=>x.id===targetId)!,enemyProfile=enemyRole(a);
 const ranged=a.side==='party'?c.classId!=='fighter':(enemyProfile?.range??5)>10,ability=c.classId==='wizard'?'intelligence':c.classId==='cleric'?'wisdom':c.classId==='rogue'?'dexterity':'strength',mod=enemyProfile?.bonus??modifier(c.abilities[ability]);
 const threatened=ranged&&members(s).some(x=>x.side!==a.side&&x.hp>0&&range(s,actorId,x.id)<=5),blessed=(t.effects??[]).some(e=>e.kind==='bless'&&e.targets.includes(actorId)&&t.actors[e.sourceId].concentration===e.id);
 return{target,enemyProfile,ranged,ability,mod,threatened,disadvantage:target.guard||threatened,blessed,critOn:a.side==='party'&&c.classId==='fighter'&&c.level>=3?19:20};
}
/** A party cleric's attack is Sacred Flame, a save the foe makes, so it advertises no attack odds. */
function attackCheck(s:Save,actorId:string,targetId:string):PublicCheck{
 const x=attackTerms(s,actorId,targetId),proficiency=s.tactical!.actors[actorId].proficiency;
 return{dc:x.target.defense,attribute:'attack',modifier:x.mod+proficiency,parts:[{label:x.enemyProfile?'Attack':x.ability[0].toUpperCase()+x.ability.slice(1),value:x.mod},{label:'Proficiency',value:proficiency}],...(attackHelped(s,actorId,targetId)?{advantage:'Help'}:{}),...(x.target.guard?{disadvantage:'Guarded'}:x.threatened?{disadvantage:'Threatened'}:{}),...(x.blessed?{bonusDie:4}:{}),critOn:x.critOn};
}
function optionsForActor(s:Save,id:string){
 const t=s.tactical!,a=members(s).find(a=>a.id===id)!,c=t.actors[id],result:ActionOption[]=[];
 if(c.hp<=0)return[option(c.death.stable?'tactical:end':'tactical:death',c.death.stable?'Skip unconscious turn':'Resolve death save','check',id)];
 const features=classResources(c);
 if(c.economy.action&&!features.disengaged)result.push(option('tactical:disengage','Disengage · main action','feature',id,undefined,'Spend your action. Your movement provokes no opportunity attacks for the rest of this turn.'));
 if(a.side==='party'){
 if(c.classId==='fighter'&&features.secondWind>0&&c.economy.bonus&&c.hp<c.maxHp)result.push(option('tactical:second_wind','Second Wind · bonus action','heal',id,id,'Restore 1d10 + Fighter level health. Spend one Second Wind use and your bonus action.'));
 if(c.classId==='fighter'&&c.level>=2&&features.actionSurge>0&&!c.economy.action&&features.attacksRemaining===0)result.push(option('tactical:action_surge','Action Surge','feature',id,undefined,'Regain one action. Once per short or long rest.'));
 if(c.classId==='rogue'&&c.level>=2&&c.economy.bonus&&!features.disengaged)result.push(option('tactical:cunning_disengage','Cunning Disengage · bonus action','feature',id,undefined,'Spend your bonus action to avoid opportunity attacks from your movement this turn.'));
 if(c.classId==='rogue'&&c.level>=2&&c.economy.bonus)result.push(option('tactical:cunning_dash','Cunning Dash · bonus action','feature',id,undefined,'Gain movement equal to your speed, spending your bonus action.'));
 }
 const enemyProfile=enemyRole(a);const ranged=a.side==='party'?['wizard','cleric','rogue'].includes(c.classId):(enemyProfile?.range??5)>10;const targets=members(s).filter(x=>x.side!==a.side&&x.hp>0);
 if(c.economy.action)for(const target of targets)if(range(s,id,target.id)<=5&&lineOfSight(t.grid,t.cells[id],t.cells[target.id]))result.push(option('tactical:help:'+target.id,`Help · distract ${actorDisplayName(target,s.enemies)}`,'help',id,target.id,'Spend your main action. The next attack roll by an ally against this foe has advantage, until the start of your next turn. Does not help your own attacks or spells that use saving throws.'));
 if(c.economy.action||features.attacksRemaining>0)for(const target of targets){if(range(s,id,target.id)<=(enemyProfile?.range??(ranged?(c.classId==='wizard'?120:c.classId==='rogue'?80:60):5))&&lineOfSight(t.grid,t.cells[id],t.cells[target.id]))result.push({...option('tactical:attack:'+target.id,`${enemyProfile?.attack??(ranged?(c.classId==='wizard'?'Fire Bolt':c.classId==='cleric'?'Sacred Flame':'Ranged attack'):'Attack')} · ${actorDisplayName(target,s.enemies)}`,'attack',id,target.id),...(a.side==='party'&&c.classId==='cleric'?{}:{check:attackCheck(s,id,target.id)})});}
 if(c.economy.action){if(c.speedFeet>0)result.push(option('tactical:dash','Dash · main action','feature',id,undefined,`Spend your main action to gain ${c.speedFeet} feet of movement this turn. Choose a destination afterward; terrain and occupied cells still apply.`));result.push(option('tactical:dodge','Dodge','defend',id));if(a.potions>0)for(const ally of s.party.filter(x=>x.hp<x.maxHp&&!t.actors[x.id].dead&&range(s,id,x.id)<=5))result.push(option('tactical:potion:'+ally.id,'Give healing potion · '+ally.name,'heal',id,ally.id));
 }
 if(a.side==='party'&&!features.slotSpent)for(let rank=1;rank<=4;rank++){
  if(!(c.slots[rank-1]>0))continue;
  const spellId=(kind:string,target?:string)=>`tactical:${kind}${target?':'+target:''}${rank>1?':'+rank:''}`;
  const cost=`level ${rank} slot`;
  if(c.classId==='cleric'&&c.economy.action){
   result.push(option(spellId('bless'),`Bless · ${cost} · concentrate`,'spell',id,undefined,`Spend an action and one ${cost}. Bless visible party members within 30 feet for up to 10 rounds. Higher slots do not improve the bonus for this three-person party.`));
   for(const ally of s.party.filter(x=>x.hp<x.maxHp&&!t.actors[x.id].dead&&range(s,id,x.id)<=5&&lineOfSight(t.grid,t.cells[id],t.cells[x.id])))result.push(option(spellId('cure',ally.id),`Cure Wounds · ${cost} · ${ally.name}`,'heal',id,ally.id,`Spend an action and one ${cost}. Restore ${rank*2}d8 + Wisdom health, plus supported Life Domain healing.`));
  }
  if(c.classId==='wizard'&&c.economy.action)for(const target of targets.filter(x=>range(s,id,x.id)<=120&&lineOfSight(t.grid,t.cells[id],t.cells[x.id])))result.push(option(spellId('missile',target.id),`Magic Missile · ${cost} · ${actorDisplayName(target,s.enemies)}`,'spell',id,target.id,`${rank+2} darts automatically hit this target for 1d4 + 1 force damage each. Spend one ${cost} and an action.`));
  if(c.classId==='cleric'&&c.economy.bonus)for(const ally of s.party.filter(x=>x.hp<x.maxHp&&!t.actors[x.id].dead&&range(s,id,x.id)<=60&&lineOfSight(t.grid,t.cells[id],t.cells[x.id])))result.push(option(spellId('healing_word',ally.id),`Healing Word · ${cost} · ${ally.name}`,'heal',id,ally.id,`Restore ${rank*2}d4 + Wisdom health, plus supported Life Domain healing. Spend a bonus action and one ${cost}.`));
 }
 if(c.economy.movementFeet>=5){const grid=gridFor(s,id),paths=reachable(grid,t.cells[id],c.economy.movementFeet);for(let x=0;x<grid.width;x++)for(let y=0;y<grid.height;y++){if(t.cells[id][0]===x&&t.cells[id][1]===y)continue;const path=paths.get(`${x},${y}`);if(path){const threats=opportunityThreats(s,id,path.cells);result.push({...option(`tactical:move:${x},${y}`,`Move to ${x+1}, ${y+1} · ${path.costFeet} ft${threats.length?' · threatened':''}`,'move',id,undefined,`Follow a legal path of ${path.costFeet} feet. Remaining movement: ${c.economy.movementFeet-path.costFeet} feet.${threats.length?' Opportunity attack possible from '+threats.map(a=>actorDisplayName(a,s.enemies)).join(', ')+'. Disengage first to avoid it. Being downed stops the move.':''}`),dangerous:threats.length>0});}}}
 result.push(option('tactical:end','End turn','turn',id));return result;
}
export function tacticalActions(s:Save):ActionOption[]{
 if(!s.turn||!s.tactical)return[];const id=s.turn.actorId,a=members(s).find(a=>a.id===id)!;
 const commands:ActionOption[]=[];
 if(a.side==='party'&&a.hp>0){const held=s.tactical.reactionPolicy?.[id]==='hold';commands.push(option('tactical:reaction:'+(held?'automatic':'hold'),held?'Use opportunity reactions automatically':'Hold opportunity reactions','tactics',id,undefined,held?'Use one legal melee reaction automatically when a visible foe leaves reach.':'Decline opportunity attacks for this character until you enable them again. This does not spend the reaction.'));}
 if(a.side==='party'&&id!=='hero')for(const directive of ['balanced','focus','protect','conserve'] as CompanionDirective[]){if(s.tactical.directives[id]!==directive)commands.push(option('tactical:directive:'+directive,'Tactics · '+directive,'tactics',id));}
 if(id==='hero'||s.tactical.takeover===id)return[...optionsForActor(s,id),...commands];
 return[option('tactical:auto',`Let ${actorDisplayName(a,s.enemies)} act`,'turn',id),...(a.side==='party'&&a.hp>0&&!s.tactical.started?[option('tactical:takeover',`Control ${a.name} for this turn`,'tactics',id),...commands]:[])];
}
export function tacticalProposal(s:Save){
 const id=s.turn?.actorId;
 if(!s.tactical||s.mode!=='combat'||!id||id==='hero'||!s.party.some(a=>a.id===id&&a.hp>0)||s.tactical.takeover===id)return undefined;
 return {actorId:id,directive:s.tactical.directives[id]??'balanced',actions:optionsForActor(s,id)};
}
function nextTurn(s:Save){if(finishCheck(s))return;const order=s.turn!.order;for(let i=0;i<order.length;i++){s.turnIndex=(s.turnIndex+1)%order.length;if(s.turnIndex===0)s.turn!.round++;const next=order[s.turnIndex],a=members(s).find(a=>a.id===next)!;expireAttackHelp(s,next);if(s.tactical!.actors[next].dead||(a.side==='enemy'&&a.hp===0))continue;s.turn!.actorId=next;beginTurn(s);return;}s.mode='defeat';s.turn=null;}
function savingRoll(s:Save,id:string,dice:Dice,ability:'dexterity'|'constitution',purpose:string){
 const c=s.tactical!.actors[id];const trained=(c.classId==='fighter'&&ability==='constitution')||(c.classId==='rogue'&&ability==='dexterity');
 const bless=(s.tactical!.effects??[]).some(e=>e.targets.includes(id)&&s.tactical!.actors[e.sourceId]?.concentration===e.id)?dice(4):0;
 return rollD20(dice,modifier(c.abilities[ability])+(trained?c.proficiency:0)+bless,purpose+(bless?` (Bless +${bless})`:''));
}
function resolve(s:Save,id:string,dice:Dice){
 const t=s.tactical!,actorId=s.turn!.actorId,a=members(s).find(a=>a.id===actorId)!;let c=t.actors[actorId];const [,kind,targetId,rankText]=id.split(':');const rank=Number((kind==='bless'?targetId:rankText)??1);
 const animation:AnimationCue|undefined=['missile','bless','cure','healing_word'].includes(kind)?'spell':['potion','second_wind'].includes(kind)?'item':kind==='dodge'?'dodge':kind==='attack'?(a.side==='party'?(['wizard','cleric'].includes(c.classId)?'spell':c.classId==='rogue'?'ranged':'melee'):(enemyRole(a)?.range??5)>10?'ranged':'melee'):undefined;
 const record=(state:Save,text:string,speaker:string,rolls:Roll[]=[],outcome?:Outcome)=>{projectTactical(state);log(state,text,speaker,rolls,'rules',animation,undefined,outcome);};

 if(kind==='end'){record(s,`${a.name} ends their turn.`,actorId);nextTurn(s);return;}
 if(kind==='death'){const r=rollD20(dice,0,'Death save');t.actors[actorId]=deathSave(c,r.kept);projectTactical(s);record(s,`${a.name} makes a death save: ${r.kept}.`,actorId,[r]);nextTurn(s);return;}
 if(kind==='move'){
  const target=targetId.split(',').map(Number) as Cell,path=findPath(gridFor(s,actorId),t.cells[actorId],target,c.economy.movementFeet);
  if(!path)throw new GameError(422,'PATH','That route is blocked or exceeds your movement.');
  let segment:Cell[]=[],segmentCost=0,sequence=0;
  const flush=()=>{if(!segment.length)return;a.motion={id:`${s.revision}:${actorId}:${sequence++}`,points:segment.map(([x,y])=>[(x-4)*1.2,(y-4)*1.2])};record(s,`${a.name} moves ${segmentCost} feet.`,actorId);segment=[];segmentCost=0;};
  for(const next of path.cells.slice(1)){
   const reactors=opportunityAttackers(s,actorId,t.cells[actorId],next);
   if(reactors.length)flush();
   for(const reactor of reactors){if(t.actors[actorId].hp<=0)break;const reaction=resolveOpportunity(s,reactor.id,actorId,dice);projectTactical(s);log(s,reaction.text,reactor.id,reaction.rolls,'rules','melee','reaction',{prose:reaction.prose,check:reaction.check});}
   if(t.actors[actorId].hp<=0){record(s,`${a.name} falls before leaving reach. The remaining movement is cancelled.`,actorId);break;}
   const cost=(t.grid.difficult??[]).some(p=>p[0]===next[0]&&p[1]===next[1])?10:5;
   t.cells[actorId]=next;t.actors[actorId].economy.movementFeet-=cost;segment.push(next);segmentCost+=cost;
  }
  flush();
 }
 else if(kind==='disengage'||kind==='cunning_disengage'){t.actors[actorId]=spendAction(c,kind==='disengage'?'action':'bonus');t.actors[actorId].features={...classResources(c),disengaged:true};record(s,`${a.name} disengages. Movement provokes no opportunity attacks for the rest of this turn.`,actorId);}
 else if(kind==='second_wind'){const r=damageRoll(dice,10,c.level,'Second Wind');const f=classResources(c);t.actors[actorId]=heal(spendAction(c,'bonus'),r.total);t.actors[actorId].features={...f,secondWind:f.secondWind-1};record(s,`${a.name} uses Second Wind and restores up to ${r.total} health.`,actorId,[r]);}
 else if(kind==='action_surge'){const f=classResources(c);c.features={...f,actionSurge:f.actionSurge-1};c.economy.action=true;record(s,`${a.name} uses Action Surge to regain an action.`,actorId);}
 else if(kind==='dash'){t.actors[actorId]=spendAction(c,'action');t.actors[actorId].economy.movementFeet+=c.speedFeet;t.dashedThisTurn=true;record(s,`${a.name} takes Dash, gaining ${c.speedFeet} feet of movement for this turn.`,actorId);}
 else if(kind==='cunning_dash'){t.actors[actorId]=spendAction(c,'bonus');t.actors[actorId].economy.movementFeet+=c.speedFeet;t.dashedThisTurn=true;record(s,`${a.name} uses Cunning Dash, gaining ${c.speedFeet} feet of movement.`,actorId);}
 else if(kind==='bless'){t.actors[actorId]=spendSlot(spendAction(c,'action'),rank);t.actors[actorId].features={...classResources(c),slotSpent:true};const effectId=`bless:${actorId}:${s.revision}`;t.actors[actorId].concentration=effectId;t.effects=[...(t.effects??[]).filter(e=>e.sourceId!==actorId),{id:effectId,sourceId:actorId,kind:'bless',rounds:10,targets:s.party.filter(x=>x.hp>0&&range(s,actorId,x.id)<=30&&lineOfSight(t.grid,t.cells[actorId],t.cells[x.id])).map(x=>x.id)}];record(s,`${a.name} casts Bless (level ${rank} slot) and begins concentrating.`,actorId);}
 else if(kind==='missile'){t.actors[actorId]=spendSlot(spendAction(c,'action'),rank);t.actors[actorId].features={...classResources(c),slotSpent:true};const rolls=[];let damage=0;for(let dart=0;dart<rank+2;dart++){const r=damageRoll(dice,4,1,'Magic Missile dart');rolls.push(r);damage+=r.total;const victim=t.actors[targetId];let saveTotal:number|undefined;if(victim.concentration){const check=savingRoll(s,targetId,dice,'constitution','Concentration');rolls.push(check);saveTotal=check.total;}t.actors[targetId]=takeDamage(victim,r.total,false,saveTotal);}const target=members(s).find(x=>x.id===targetId)!;if(target.side==='enemy'&&t.actors[targetId].hp===0)t.actors[targetId].dead=true;record(s,`${a.name} casts Magic Missile (level ${rank} slot) at ${actorDisplayName(target,s.enemies)} for ${damage} force damage.`,actorId,rolls);}
 else if(kind==='help'){t.actors[actorId]=spendAction(c,'action');t.attackHelp=[...(t.attackHelp??[]).filter(e=>e.sourceId!==actorId||e.targetId!==targetId),{sourceId:actorId,targetId}];record(s,`${a.name} distracts ${actorDisplayName(members(s).find(x=>x.id===targetId)!,s.enemies)}. An ally’s next attack roll against that foe has advantage until ${a.name}’s next turn.`,actorId);}
 else if(kind==='dodge'){t.actors[actorId]=spendAction(c,'action');a.guard=true;record(s,`${a.name} dodges until their next turn.`,actorId);}
 else if(kind==='potion'||kind==='cure'||kind==='healing_word'){t.actors[actorId]=spendAction(c,kind==='healing_word'?'bonus':'action');let r=damageRoll(dice,kind==='cure'?8:4,kind!=='potion'?modifier(c.abilities.wisdom):2,'Healing');for(let i=1;i<(kind==='potion'?2:rank*2);i++){const extra=dice(r.sides);r.values.push(extra);r.kept+=extra;r.total+=extra;}if(kind!=='potion'&&c.classId==='cleric'&&c.level>=3){r.modifier+=2+rank;r.total+=2+rank;}
  if(kind!=='potion'){t.actors[actorId]=spendSlot(t.actors[actorId],rank);t.actors[actorId].features={...classResources(c),slotSpent:true};}else a.potions--;t.actors[targetId]=heal(t.actors[targetId],r.total);if(kind!=='potion'&&c.classId==='cleric'&&c.level>=6&&targetId!==actorId)t.actors[actorId]=heal(t.actors[actorId],2+rank);record(s,`${a.name} heals ${members(s).find(x=>x.id===targetId)!.name} for ${r.total}${kind==='potion'?'':` using a level ${rank} slot`}.`,actorId,[r]);
 }else if(kind==='attack'&&a.side==='party'&&c.classId==='cleric'){
  t.actors[actorId]=spendAction(c,'action');const target=members(s).find(x=>x.id===targetId)!,victim=t.actors[targetId],r=savingRoll(s,targetId,dice,'dexterity','Sacred Flame · Dexterity save');const rolls=[r],dc=8+c.proficiency+modifier(c.abilities.wisdom);let damage=0;
  if(r.total<dc){for(let i=0;i<(c.level>=5?2:1);i++){const d=damageRoll(dice,8,0,'Radiant damage');rolls.push(d);damage+=d.total;}let saveTotal:number|undefined;if(victim.concentration){const cr=savingRoll(s,targetId,dice,'constitution','Concentration');rolls.push(cr);saveTotal=cr.total;}t.actors[targetId]=takeDamage(victim,damage,false,saveTotal);if(target.side==='enemy'&&t.actors[targetId].hp===0)t.actors[targetId].dead=true;}
  record(s,`${a.name} casts Sacred Flame: ${actorDisplayName(target,s.enemies)} ${r.total>=dc?'saves':'fails'} (${r.total} vs DC ${dc}), ${damage} radiant damage.`,actorId,rolls,{prose:sacredFlameProse({id:targetId,name:actorDisplayName(target,s.enemies)},r.total>=dc,t.actors[targetId].hp===0),check:outcomeCheck('save',targetId,'dexterity',r,dc,r.total>=dc)});
 }else if(kind==='attack'){
  const features=classResources(c);if(features.attacksRemaining>0)c.features={...features,attacksRemaining:features.attacksRemaining-1};else{t.actors[actorId]=spendAction(c,'action');t.actors[actorId].features={...features,attacksRemaining:a.side==='party'&&c.classId==='fighter'&&c.level>=5?1:0};}const terms=attackTerms(s,actorId,targetId),{target,enemyProfile,ranged,mod,disadvantage}=terms;
  const blessing=terms.blessed?damageRoll(dice,4,0,'Bless'):null;const advantage=consumeAttackHelp(s,actorId,targetId);const r=rollD20(dice,mod+c.proficiency+(blessing?.total??0),advantage?'Attack · Help':'Attack',advantage,disadvantage);const critical=r.kept>=terms.critOn;const hit=critical||(r.kept!==1&&r.total>=target.defense);const rolls=blessing?[r,blessing]:[r];let damage=0;
  if(hit){const d=damageRoll(dice,enemyProfile?.die??(ranged?(c.classId==='wizard'?10:6):8),['wizard','cleric'].includes(c.classId)&&a.side==='party'?0:mod,'Damage',critical);damage=d.total;rolls.push(d);if(a.side==='party'&&c.classId==='wizard'&&c.level>=5){const extra=damageRoll(dice,10,0,'Fire Bolt scaling',critical);rolls.push(extra);damage+=extra.total;}if(a.side==='party'&&c.classId==='rogue'&&!classResources(t.actors[actorId]).sneakUsed&&(!disadvantage||advantage)&&((advantage&&!disadvantage)||s.party.some(ally=>ally.id!==actorId&&ally.hp>0&&range(s,ally.id,targetId)<=5))){for(let i=0;i<Math.ceil(c.level/2);i++){const sneak=damageRoll(dice,6,0,'Sneak Attack',critical);rolls.push(sneak);damage+=sneak.total;}t.actors[actorId].features={...classResources(t.actors[actorId]),sneakUsed:true};}let saveTotal:number|undefined;const victim=t.actors[targetId];if(victim.concentration){const cr=savingRoll(s,targetId,dice,'constitution','Concentration');rolls.push(cr);saveTotal=cr.total;}t.actors[targetId]=takeDamage(victim,damage,critical,saveTotal);if(target.side==='enemy'&&t.actors[targetId].hp===0)t.actors[targetId].dead=true;}
  record(s,`${a.name} attacks ${actorDisplayName(target,s.enemies)}${enemyProfile?` with ${enemyProfile.attack}`:''}: ${hit?`${damage} damage`:'miss'}.`,actorId,rolls,{prose:attackProse(a,{id:targetId,name:actorDisplayName(target,s.enemies)},hit,hit&&t.actors[targetId].hp===0),check:outcomeCheck('attack',actorId,'attack',r,target.defense,hit,{targetId,critical,advantage,disadvantage})});
 }
 projectTactical(s);finishCheck(s);
}
function chooseAutomatic(s:Save):ActionOption{
 const id=s.turn!.actorId,t=s.tactical!,a=members(s).find(a=>a.id===id)!,options=optionsForActor(s,id),directive=t.directives[id]??'balanced';
 const dying=options.find(o=>o.kind==='heal'&&t.actors[o.targetId!].hp===0);if(dying)return dying;
 const healOption=options.find(o=>o.kind==='heal'&&t.actors[o.targetId!].hp<t.actors[o.targetId!].maxHp/2);if(healOption&&directive!=='conserve')return healOption;
 const creature=t.actors[id],escapeFoes=members(s).filter(x=>x.side!==a.side&&x.hp>0);
 const adjacent=escapeFoes.some(foe=>range(s,id,foe.id)<=5&&lineOfSight(t.grid,t.cells[id],t.cells[foe.id]));
 if(adjacent&&(classResources(creature).disengaged||a.side==='party'&&creature.classId!=='fighter'&&creature.hp<creature.maxHp/2)){
  const score=(cell:Cell)=>Math.min(...escapeFoes.map(foe=>Math.max(Math.abs(cell[0]-t.cells[foe.id][0]),Math.abs(cell[1]-t.cells[foe.id][1]))));
  const current=score(t.cells[id]);
  const escape=options.filter(o=>o.kind==='move').map(o=>({option:o,score:score(o.id.split(':')[2].split(',').map(Number) as Cell)})).filter(o=>o.score>current).sort((x,y)=>y.score-x.score||x.option.id.localeCompare(y.option.id))[0]?.option;
  if(escape){if(classResources(creature).disengaged)return escape;const disengage=options.find(o=>o.id==='tactical:cunning_disengage')??options.find(o=>o.id==='tactical:disengage');if(disengage)return disengage;}
 }
 const attacks=options.filter(o=>o.kind==='attack');if(attacks.length){if(directive==='focus'&&t.focusTarget){const focus=attacks.find(o=>o.targetId===t.focusTarget);if(focus)return focus;}return attacks.sort((a,b)=>t.actors[a.targetId!].hp-t.actors[b.targetId!].hp)[0];}
 if(!t.actors[id].economy.action&&(!t.dashedThisTurn||members(s).some(foe=>foe.side!==a.side&&foe.hp>0&&range(s,id,foe.id)<=5&&lineOfSight(t.grid,t.cells[id],t.cells[foe.id]))))return options.find(o=>o.id==='tactical:end')!;
 const foes=members(s).filter(x=>x.side!==a.side&&x.hp>0);const moves=options.filter(o=>o.kind==='move');if(foes.length&&moves.length){const nearest=foes.sort((x,y)=>range(s,id,x.id)-range(s,id,y.id));const threat=directive==='protect'&&a.side==='party'&&t.actors.hero.hp>0?nearest.find(foe=>range(s,'hero',foe.id)<=10):undefined;const ordered=threat?[threat,...nearest.filter(foe=>foe.id!==threat.id)]:nearest;for(const foe of ordered){const next=approachTarget(gridFor(s,id),t.cells[id],t.cells[foe.id],t.actors[id].economy.movementFeet);if(next){const move=moves.find(o=>o.id===`tactical:move:${next.join(',')}`);if(move)return move;}}return options.find(o=>o.id==='tactical:dodge')??options.find(o=>o.id==='tactical:end')!;}
 const dash=options.find(o=>o.id==='tactical:dash');if(dash&&foes.some(foe=>approachTarget(gridFor(s,id),t.cells[id],t.cells[foe.id],t.actors[id].speedFeet)))return dash;
 return options.find(o=>o.id==='tactical:death')??options.find(o=>o.id==='tactical:end')!;
}
export function applyTactical(original:Save,id:string,dice:Dice):Save{
 const s=structuredClone(original);s.presentation=[];if(!tacticalActions(s).some(a=>a.id===id))throw new GameError(422,'ACTION','That action is no longer available.');const actorId=s.turn!.actorId;
 if(id==='tactical:takeover'){s.tactical!.takeover=actorId;log(s,'You control this companion until the end of this turn.',actorId);}
 else if(id.startsWith('tactical:reaction:')){const policy=id.split(':')[2] as 'hold'|'automatic';s.tactical!.reactionPolicy={...s.tactical!.reactionPolicy,[actorId]:policy};log(s,policy==='hold'?'Opportunity reactions will be held until enabled again.':'Legal opportunity reactions will be used automatically.',actorId);}
 else if(id.startsWith('tactical:directive:')){s.tactical!.directives[actorId]=id.split(':')[2] as CompanionDirective;log(s,`Tactics changed to ${id.split(':')[2]}.`,actorId);}
 else if(id==='tactical:auto'){
  // Resolve one decision per click. A move can be followed by an attack on the next click.
  const proposal=s.plans?.[actorId];
  const allowed=s.party.some(a=>a.id===actorId)&&actorId!=='hero'&&optionsForActor(s,actorId).some(a=>a.id===proposal);
  s.tactical!.started=true;
  if(proposal&&!allowed)log(s,'The proposed tactic is no longer legal. The companion uses its fallback tactics.',actorId);
  resolve(s,allowed?proposal!:chooseAutomatic(s).id,dice);
 }else{if(id.startsWith('tactical:attack:'))s.tactical!.focusTarget=id.split(':')[2];resolve(s,id,dice);}
 projectTactical(s);s.revision++;s.updatedAt=new Date().toISOString();return s;
}
