import {ENEMY_ROLES,type EnemyRole} from '../shared/enemy-roles.js';
import type {Actor} from '../shared/types.js';
interface Encounter {roles:EnemyRole[];boss?:string;chapter:number}
export const CURATED_ENCOUNTERS:Record<string,Encounter>={
 cookfire:{roles:['goblin_guard','goblin_scout'],chapter:1},bell:{roles:['hobgoblin_commander','goblin_guard'],boss:'Commander Vark',chapter:1},
 'archive-1':{roles:['slime_spitter','slime_brute'],chapter:2},'archive-3':{roles:['bone_sentinel','bone_archer'],chapter:2},'archive-6':{roles:['cavern_hunter','venom_stalker'],chapter:2},'archive-7':{roles:['bone_warden','bone_archer'],boss:'Archivist Sel',chapter:2},
 'market-1':{roles:['goblin_guard','goblin_scout'],chapter:3},'market-3':{roles:['bone_sentinel','bone_archer'],chapter:3},'market-6':{roles:['slime_brute','resonant_adept'],chapter:3},'market-7':{roles:['hobgoblin_commander','goblin_scout'],boss:'Council Marshal Rusk',chapter:3},
 'roots-1':{roles:['cavern_hunter','venom_stalker'],chapter:4},'roots-3':{roles:['slime_spitter','cavern_hunter'],chapter:4},'roots-6':{roles:['bone_warden','venom_stalker'],boss:'The Rootbound Warden',chapter:4},'roots-7':{roles:['bone_sentinel','bone_archer'],chapter:4},
 'choir-1':{roles:['bone_sentinel','resonant_adept'],chapter:5},'choir-4':{roles:['resonant_adept','bone_warden'],chapter:5},'choir-6':{roles:['cavern_hunter','venom_stalker'],chapter:5},'choir-7':{roles:['resonant_adept','bone_sentinel'],boss:'Conductor Aras',chapter:5},
 'depth-1':{roles:['bone_warden','bone_archer'],chapter:6},'depth-2':{roles:['goblin_guard','goblin_scout'],chapter:6},'depth-3':{roles:['slime_brute','slime_spitter'],chapter:6},'depth-4':{roles:['resonant_adept','bone_sentinel'],chapter:6},'depth-6':{roles:['core_colossus','venom_stalker'],chapter:6},'depth-7':{roles:['core_colossus','resonant_adept'],boss:'The Heart’s Custodian',chapter:6},
};
export function encounterEnemies(sceneId:string,template:Actor,diversion:number,alarm:boolean):Actor[]{
 const encounter=CURATED_ENCOUNTERS[sceneId];if(!encounter)return[];
 const roles=[...encounter.roles];if(sceneId==='bell'&&alarm)roles.push('goblin_scout');if(diversion&&roles.length>1)roles.pop();
 return roles.map((role,i)=>{const p=ENEMY_ROLES[role],hp=p.hp+(encounter.chapter-1)*5+(encounter.boss&&i===0&&sceneId!=='bell'?12:0);return{...template,id:sceneId==='bell'?(i===0?'vark':`sentry-${i}`):sceneId==='cookfire'?`guard-${i+1}`:`${sceneId}-foe-${i+1}`,name:i===0&&encounter.boss?encounter.boss:p.name,enemyRole:role,classId:p.model,hp,maxHp:hp,defense:p.ac,potions:0,rations:0,attributes:{might:p.bonus,agility:Math.floor((p.dex-10)/2),insight:0,presence:0},position:[i*2-1,2]};});
}
