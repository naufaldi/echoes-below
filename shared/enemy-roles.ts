import type {Actor} from './types.js';
export const ENEMY_ROLES={
 goblin_guard:{name:'Goblin guard',model:'goblin',hp:8,ac:13,speed:30,range:5,die:6,bonus:2,attack:'Spear',dex:14},
 goblin_scout:{name:'Goblin scout',model:'goblin',hp:7,ac:12,speed:35,range:60,die:6,bonus:2,attack:'Shortbow',dex:16},
 hobgoblin_commander:{name:'Hobgoblin commander',model:'vark',hp:28,ac:15,speed:30,range:5,die:8,bonus:3,attack:'Command blade',dex:12},
 bone_sentinel:{name:'Bone sentinel',model:'skeleton',hp:14,ac:16,speed:20,range:5,die:8,bonus:2,attack:'Guard blade',dex:10},
 bone_archer:{name:'Bone archer',model:'skeleton',hp:10,ac:12,speed:30,range:80,die:6,bonus:3,attack:'Bone bow',dex:16},
 bone_warden:{name:'Bone warden',model:'skeleton',hp:24,ac:15,speed:25,range:10,die:10,bonus:3,attack:'Warden glaive',dex:12},
 slime_spitter:{name:'Acid spitter',model:'slime',hp:12,ac:10,speed:20,range:30,die:6,bonus:2,attack:'Acid glob',dex:10},
 slime_brute:{name:'Slime brute',model:'slime',hp:22,ac:9,speed:20,range:5,die:10,bonus:2,attack:'Slam',dex:8},
 cavern_hunter:{name:'Cavern hunter',model:'spider',hp:12,ac:13,speed:40,range:5,die:6,bonus:3,attack:'Fangs',dex:16},
 venom_stalker:{name:'Venom stalker',model:'spider',hp:10,ac:12,speed:30,range:30,die:4,bonus:3,attack:'Venom spit',dex:14},
 resonant_adept:{name:'Resonant adept',model:'adept',hp:18,ac:12,speed:25,range:60,die:8,bonus:3,attack:'Resonant bolt',dex:14},
 core_colossus:{name:'Core colossus',model:'vark',hp:36,ac:16,speed:20,range:10,die:12,bonus:4,attack:'Core hammer',dex:8},
} as const;
export type EnemyRole=keyof typeof ENEMY_ROLES;
export function enemyRole(actor:Pick<Actor,'enemyRole'>){return actor.enemyRole?ENEMY_ROLES[actor.enemyRole]:undefined;}
