import {BoxGeometry,TetrahedronGeometry,OctahedronGeometry,IcosahedronGeometry,DodecahedronGeometry,BufferGeometry,Float32BufferAttribute,Vector3} from 'three';
/** Ten planar kites, alternating between the two poles of a pentagonal trapezohedron. */
function tenSided(){
 const height=1.55,cos=Math.cos(Math.PI/5),ringHeight=height*(1-cos)/(1+cos);
 const ring=Array.from({length:10},(_,i)=>new Vector3(Math.cos(i*Math.PI/5)*1.3,i%2?-ringHeight:ringHeight,Math.sin(i*Math.PI/5)*1.3));
 const positions:number[]=[];
 for(let i=0;i<10;i++){
  const face=[new Vector3(0,i%2?-height:height,0),ring[i],ring[(i+1)%10],ring[(i+2)%10]];
  for(const indices of [[0,1,2],[0,2,3]]){let [a,b,c]=indices.map(j=>face[j]);if(b.clone().sub(a).cross(c.clone().sub(a)).dot(a)<0)[b,c]=[c,b];positions.push(...a.toArray(),...b.toArray(),...c.toArray());}
 }
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;
}
export function createDieGeometry(sides:number){return sides===10?tenSided():sides===12?new DodecahedronGeometry(1.55):sides===6?new BoxGeometry(2,2,2):sides===4?new TetrahedronGeometry(1.55):sides===8?new OctahedronGeometry(1.55):new IcosahedronGeometry(1.55);}
