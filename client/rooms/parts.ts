export type Part=[number,number,number,number,number,number,number?,number?,number?];// x,y,z,sx,sy,sz,ry,rx,rz

export const rand=(i:number)=>{const v=Math.sin(i*12.9898)*43758.5453;return v-Math.floor(v);};
export const thin=(p:Part)=>Math.min(p[3],p[5])/2,fixed=(r:number)=>()=>r;
export function slabs(size:number,{extent=8.4,gap,jitter,seed,pick=()=>true}:{extent?:number;gap:number;jitter:number;seed:(i:number,j:number)=>number;pick?:(i:number,j:number)=>boolean}):Part[]{const out:Part[]=[],n=Math.round(extent/size);for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++)if(pick(i,j))out.push([i*size,-.1-rand(seed(i,j))*jitter,j*size,size-gap,.2,size-gap]);return out;}
export const wallRow=(z:number,xs:number[],sy=1):Part[]=>xs.map(x=>[x,0,z,1,sy,1]);
export const wallColumn=(x:number,zs:number[],sy=1):Part[]=>zs.map(z=>[x,0,z,1,sy,1,Math.PI/2]);
