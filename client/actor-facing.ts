import type {Actor,Entity} from '../shared/types.js';
type Point=[number,number];
/** Yaw that turns a +z-forward model at `to`. Points are engine [x,y]; the world puts y at −z. */
export const yawToward=(from:Point,to:Point)=>Math.atan2(to[0]-from[0],-(to[1]-from[1]));
/** Step `from` toward `to` by `t` (0–1) along the shorter arc, so a turn never spins the long way round. */
export function turnToward(from:number,to:number,t:number){const d=((to-from+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return from+d*t;}
const nearest=(from:Point,points:Point[])=>points.reduce<Point|undefined>((best,p)=>!best||Math.hypot(p[0]-from[0],p[1]-from[1])<Math.hypot(best[0]-from[0],best[1]-from[1])?p:best,undefined);
/** Where each standing actor looks, keyed by actor id (scene NPCs as `npc:<id>`). Fights face the nearest living foe. Exploring, the party faces what the player selected, else the nearest person in the room, else straight into the room, away from the default camera; NPCs face the party. The camera orbits freely, so nobody turns to the screen. */
export function facePoints({party,enemies,entities,combat,selected}:{party:Actor[];enemies:Actor[];entities:Entity[];combat:boolean;selected:string}){
 const face=new Map<string,Point>(),alive=(list:Actor[])=>list.filter(a=>a.hp>0).map(a=>a.position);const foes=alive(enemies),friends=alive(party),people=entities.filter(e=>e.kind==='npc').map(e=>e.position),picked=entities.find(e=>e.id===selected)?.position;
 for(const a of party){const target=combat&&foes.length?nearest(a.position,foes):picked??nearest(a.position,people);face.set(a.id,target??[a.position[0],a.position[1]+10]);}
 for(const a of enemies){const target=nearest(a.position,friends);if(target)face.set(a.id,target);}
 for(const e of entities)if(e.kind==='npc'){const target=nearest(e.position,friends);if(target)face.set('npc:'+e.id,target);}
 return face;
}
