import {test} from 'node:test';
import assert from 'node:assert/strict';
import {slabs,wallRow,wallColumn} from '../client/rooms/parts.js';
import type {Part} from '../client/rooms/parts.js';

const rand=(i:number)=>{const v=Math.sin(i*12.9898)*43758.5453;return v-Math.floor(v);};
const market=(size:number,pick:(i:number,j:number)=>boolean=()=>true,extent=8.4):Part[]=>{const out:Part[]=[],n=Math.round(extent/size);for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++)if(pick(i,j))out.push([i*size,-.1-rand(i*31+j)*.02,j*size,size-.05,.2,size-.05]);return out;};
const choir=(size:number,pick:(i:number,j:number)=>boolean=()=>true,extent=8.4):Part[]=>{const out:Part[]=[],n=Math.round(extent/size);for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++)if(pick(i,j))out.push([i*size,-.1-rand(i*31+j)*.015,j*size,size-.04,.2,size-.04]);return out;};
const depth=(size:number,extent=8.4,gap=.07,pick:(i:number,j:number)=>boolean=()=>true):Part[]=>{const out:Part[]=[],n=Math.round(extent/size);for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++)if(pick(i,j))out.push([i*size,-.1-rand(i*31+j*7)*.015,j*size,size-gap,.2,size-gap]);return out;};
test('slabs preserve every authored floor formula and ordering',()=>{
 const checker=[(i:number,j:number)=>(i+j)%2===0,(i:number,j:number)=>(i+j)%2!==0];
 for(const [size,pick] of [[1.2,()=>true],[.6,()=>true],[1.2,(i:number,j:number)=>rand(i*7+j*13)>.12],[1.2,(i:number,j:number)=>rand(i*7+j*13)<=.12],...checker.map(p=>[1.2,p])] as [number,(i:number,j:number)=>boolean][])assert.deepEqual(slabs(size,{gap:.05,jitter:.02,seed:(i,j)=>i*31+j,pick}),market(size,pick));
 for(const pick of [()=>true,...checker,(i:number)=>i<0,(i:number)=>i>=0,(_:number,j:number)=>j%2===0])assert.deepEqual(slabs(1.2,{gap:.04,jitter:.015,seed:(i,j)=>i*31+j,pick}),choir(1.2,pick));
 for(const extent of [8.4,6])assert.deepEqual(slabs(1.2,{extent,gap:.07,jitter:.015,seed:(i,j)=>i*31+j*7}),depth(1.2,extent));
});
test('wall builders preserve every authored row and column',()=>{
 const back=(z:number,xs:number[],sy=1):Part[]=>xs.map(x=>[x,0,z,1,sy,1]),side=(x:number,zs:number[],sy=1):Part[]=>zs.map(z=>[x,0,z,1,sy,1,Math.PI/2]);
 const rows:[number,number[]][]=[[-7.2,[-8,-4,4,8]],[-7.2,[0]],[-7.2,[-4,4]],[-7.2,[-8,8]],[-7.2,[-8,-4,0,8]],[-7.2,[4]],[-9.6,[0]],[-8.4,[-4.2,4.2]],[-8.4,[0]],[-7.2,[-8,-4,8]],[-8.9,[-4,4]],[-8.9,[0]]];
 const cols:[number,number[],number?][]=[[-7.8,[-4.7,-.7,3.3]],[7.6,[-5.2,-2.4,.4,3.2,6]],[7.8,[-4.7,-.7,3.3],.28],[-7.8,[-4.7,3.3]],[7.8,[-4.7,-.7,3.3],.3],[-7.8,[-.7]],[7.6,[-5,-2,1,4]],[-8.6,[-4.7,-.7,3.3]],[7.8,[-4.7,-.7,3.3],.26]];
 for(const args of rows)assert.deepEqual(wallRow(...args),back(...args));for(const args of cols)assert.deepEqual(wallColumn(...args),side(...args));
});
