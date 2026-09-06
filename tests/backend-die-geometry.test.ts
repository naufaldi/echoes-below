import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {createDieGeometry} from '../client/die-geometry.js';
test('each displayed die has the number of outward face planes indicated by its name',()=>{
 for(const sides of [4,6,8,10,12,20]){
  const g=createDieGeometry(sides),flat=g.index?g.toNonIndexed():g,p=flat.getAttribute('position');const planes=new Set<string>();
  for(let i=0;i<p.count;i+=3){const a=new Vector3().fromBufferAttribute(p,i),b=new Vector3().fromBufferAttribute(p,i+1),c=new Vector3().fromBufferAttribute(p,i+2);const n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();assert.ok(n.dot(a)>0,'Face must point outwards');planes.add([...n.toArray(),n.dot(a)].map(v=>Math.round(v*10000)).join(','));}
  assert.equal(planes.size,sides,`D${sides} visible face count`);flat.dispose();g.dispose();
 }
});
test('the D10 surface is closed, with twelve distinct vertices',()=>{
 const g=createDieGeometry(10),p=g.getAttribute('position'),vertices=new Set<string>(),edges=new Map<string,number>();
 for(let i=0;i<p.count;i+=3){const face=[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j)].map(v=>Math.round(v*10000)).join(','));face.forEach(v=>vertices.add(v));for(let j=0;j<3;j++){const key=[face[j],face[(j+1)%3]].sort().join('|');edges.set(key,(edges.get(key)??0)+1);}}
 assert.equal(vertices.size,12);assert.ok([...edges.values()].every(count=>count===2));g.dispose();
});
