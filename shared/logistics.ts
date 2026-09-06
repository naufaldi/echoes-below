import type {Actor} from './types.js';
export const ITEMS={chain:{name:'Chain mail',slot:'armor',ac:16},leather:{name:'Leather armor',slot:'armor',ac:11},robes:{name:'Travel robes',slot:'armor',ac:10},shield:{name:'Shield',slot:'shield',ac:2},ward_cloak:{name:'Keeper’s ward cloak',slot:'cloak',ac:1}} as const;
export type ItemId=keyof typeof ITEMS;
export interface Loadout {armor:'chain'|'leather'|'robes';shield:boolean;cloak:boolean}
export interface Logistics {owned:Record<ItemId,number>;equipped:Record<string,Loadout>;shortRests:string[];longRests:string[];arcaneRecovery:string[];rewards:string[]}
export function initialLogistics(party:Actor[]):Logistics{const owned:Logistics['owned']={chain:0,leather:0,robes:1,shield:0,ward_cloak:0};const equipped:Logistics['equipped']={};for(const a of party){const heavy=a.classId==='guardian'||a.classId==='cleric';const armor=heavy?'chain':a.classId==='scout'?'leather':'robes';owned[armor]++;if(heavy)owned.shield++;equipped[a.id]={armor,shield:heavy,cloak:false};}return{owned,equipped,shortRests:[],longRests:[],arcaneRecovery:[],rewards:[]};}
export function usedCopies(l:Logistics,item:ItemId,exceptActor?:string){return Object.entries(l.equipped).filter(([id,e])=>id!==exceptActor&&(item==='shield'?e.shield:item==='ward_cloak'?e.cloak:e.armor===item)).length;}
