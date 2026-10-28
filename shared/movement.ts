export type Point=[number,number];
/** Consume movement along ordered waypoints, never straight through a corner. */
export function advanceMovement(position:Point,points:Point[],distance:number):{position:Point;remaining:Point[]}{
 if(!Number.isFinite(distance)||distance<0)throw new Error('Movement distance must be finite and nonnegative.');
 let current:Point=[...position],index=0,budget=distance;
 while(index<points.length){const target=points[index];const length=Math.hypot(target[0]-current[0],target[1]-current[1]);if(length<=budget){current=[...target];budget-=length;index++;}else{const ratio=length?budget/length:0;current=[current[0]+(target[0]-current[0])*ratio,current[1]+(target[1]-current[1])*ratio];break;}}
 return{position:current,remaining:points.slice(index)};
}
/** Echo measures movement in metres; every surface shows feet, as Curated does (#98). 1 m ≈ 3.28 ft, rounded to D&D's 5 ft steps; any movement left reads at least 5 ft, never 0. */
export const feetFromMetres=(metres:number)=>metres<=0?0:Math.max(5,Math.round(metres*3.28084/5)*5);
