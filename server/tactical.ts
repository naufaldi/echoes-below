import type {Actor,ActionOption,ClassId} from '../shared/types.js';
import {CURATED_RULES_VERSION,CURATED_CLASS_IDS,makeCharacter,modifier,spendAction,spendSlot,takeDamage,heal,deathSave,type CuratedClass} from '../shared/curated-rules.js';
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
 if(!s.tactical)return;for(const a of members(s)){const c=s.tactical.actors[a.id];if(!c)continue;a.hp=c.hp;a.maxHp=c.maxHp;a.defense=c.armorClass;
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
function beginTurn(s:Save){members(s).find(a=>a.id===s.turn!.actorId)!.guard=false;const c=s.tactical!.actors[s.turn!.actorId];c.economy={action:true,bonus:true,reaction:true,movementFeet:c.speedFeet};s.tactical!.takeover=null;s.tactical!.started=false;}
function gridFor(s:Save,id:string){const t=s.tactical!;return{...t.grid,blocked:[...t.grid.blocked,...members(s).filter(a=>a.id!==id&&a.hp>0).map(a=>t.cells[a.id])]};}
function range(s:Save,a:string,b:string){const cells=s.tactical!.cells;return Math.max(Math.abs(cells[a][0]-cells[b][0]),Math.abs(cells[a][1]-cells[b][1]))*5;}
function optionsForActor(s:Save,id:string){
 const t=s.tactical!,a=members(s).find(a=>a.id===id)!,c=t.actors[id],result:ActionOption[]=[];
 if(c.hp<=0)return[option(c.death.stable?'tactical:end':'tactical:death',c.death.stable?'Skip unconscious turn':'Resolve death save','check',id)];
 const ranged=['wizard','cleric','rogue'].includes(c.classId)&&a.side==='party';const targets=members(s).filter(x=>x.side!==a.side&&x.hp>0);
 if(c.economy.action)for(const target of targets){if(range(s,id,target.id)<=(ranged?60:5)&&lineOfSight(t.grid,t.cells[id],t.cells[target.id]))result.push(option('tactical:attack:'+target.id,`${ranged?'Ranged attack':'Attack'} · ${actorDisplayName(target,s.enemies)}`,'attack',id,target.id));}
 if(c.economy.action){result.push(option('tactical:dodge','Dodge','defend',id));if(a.potions>0)for(const ally of s.party.filter(x=>x.hp<x.maxHp&&!t.actors[x.id].dead&&range(s,id,x.id)<=5))result.push(option('tactical:potion:'+ally.id,'Give healing potion · '+ally.name,'heal',id,ally.id));
  if(c.classId==='cleric'&&c.slots[0]>0)for(const ally of s.party.filter(x=>x.hp<x.maxHp&&!t.actors[x.id].dead&&range(s,id,x.id)<=5))result.push(option('tactical:cure:'+ally.id,'Cure Wounds · '+ally.name,'heal',id,ally.id,'Spend an action and one rank-1 spell slot to restore 2d8 + Wisdom health.'));
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
function resolve(s:Save,id:string,dice:Dice){
 const t=s.tactical!,actorId=s.turn!.actorId,a=members(s).find(a=>a.id===actorId)!;let c=t.actors[actorId];const [,kind,targetId]=id.split(':');
 if(kind==='end'){record(s,`${a.name} ends their turn.`,actorId);nextTurn(s);return;}
 if(kind==='death'){const r=rollD20(dice,0,'Death save');t.actors[actorId]=deathSave(c,r.kept);projectTactical(s);record(s,`${a.name} makes a death save: ${r.kept}.`,actorId,[r]);nextTurn(s);return;}
 if(kind==='move'){const target=targetId.split(',').map(Number) as Cell;const path=findPath(gridFor(s,actorId),t.cells[actorId],target,c.economy.movementFeet);if(!path)throw new GameError(422,'PATH','That route is blocked or exceeds your movement.');t.cells[actorId]=target;c.economy.movementFeet-=path.costFeet;record(s,`${a.name} moves ${path.costFeet} feet.`,actorId);}
 else if(kind==='dodge'){t.actors[actorId]=spendAction(c,'action');a.guard=true;record(s,`${a.name} dodges until their next turn.`,actorId);}
 else if(kind==='potion'||kind==='cure'){t.actors[actorId]=spendAction(c,'action');let r=damageRoll(dice,kind==='cure'?8:4,kind==='cure'?modifier(c.abilities.wisdom):2,'Healing');const second=dice(kind==='cure'?8:4);r.values.push(second);r.kept+=second;r.total+=second;
  if(kind==='cure')t.actors[actorId]=spendSlot(t.actors[actorId],1);else a.potions--;t.actors[targetId]=heal(t.actors[targetId],r.total);record(s,`${a.name} heals ${members(s).find(x=>x.id===targetId)!.name} for ${r.total}.`,actorId,[r]);
 }else if(kind==='attack'){
  t.actors[actorId]=spendAction(c,'action');const target=members(s).find(x=>x.id===targetId)!;const ranged=a.side==='party'&&c.classId!=='fighter';const ability=c.classId==='wizard'?'intelligence':c.classId==='cleric'?'wisdom':c.classId==='rogue'?'dexterity':'strength';const mod=modifier(c.abilities[ability]);
  const r=rollD20(dice,mod+c.proficiency,'Attack',false,target.guard);const hit=r.kept===20||(r.kept!==1&&r.total>=target.defense);const rolls=[r];let damage=0;
  if(hit){const d=damageRoll(dice,ranged?6:8,['wizard','cleric'].includes(c.classId)&&a.side==='party'?0:mod,'Damage',r.kept===20);damage=d.total;rolls.push(d);let saveTotal:number|undefined;const victim=t.actors[targetId];if(victim.concentration){const cr=rollD20(dice,modifier(victim.abilities.constitution),'Concentration');rolls.push(cr);saveTotal=cr.total;}t.actors[targetId]=takeDamage(victim,damage,r.kept===20,saveTotal);if(target.side==='enemy'&&t.actors[targetId].hp===0)t.actors[targetId].dead=true;}
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
