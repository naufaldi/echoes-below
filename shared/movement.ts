export type Point=[number,number];
/** Consume movement along ordered waypoints, never straight through a corner. */
export function advanceMovement(position:Point,points:Point[],distance:number):{position:Point;remaining:Point[]}{
 if(!Number.isFinite(distance)||distance<0)throw new Error('Movement distance must be finite and nonnegative.');
 let current:Point=[...position],index=0,budget=distance;
 while(index<points.length){const target=points[index];const length=Math.hypot(target[0]-current[0],target[1]-current[1]);if(length<=budget){current=[...target];budget-=length;index++;}else{const ratio=length?budget/length:0;current=[current[0]+(target[0]-current[0])*ratio,current[1]+(target[1]-current[1])*ratio];break;}}
 return{position:current,remaining:points.slice(index)};
}
