import {readFileSync,readdirSync,statSync,existsSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative,dirname,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=resolve(root,'public'),built=resolve(root,process.argv[2]??'dist/client');
const files=directory=>readdirSync(directory).flatMap(name=>{const path=resolve(directory,name);return statSync(path).isDirectory()?files(path):[path];});
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const verified=new Set();
function verifyCopy(path){
 const name=relative(source,path);if(name.startsWith('..'))throw Error(`Asset escapes public directory: ${name}`);
 if(!existsSync(path))throw Error(`Missing source dependency: ${name}`);
 const destination=resolve(built,name);if(!existsSync(destination))throw Error(`Missing bundled dependency: ${name}`);
 const bytes=readFileSync(path);if(digest(bytes)!==digest(readFileSync(destination)))throw Error(`Bundled bytes differ: ${name}`);
 verified.add(name);return bytes;
}
function dependency(model,uri){
 if(uri.startsWith('data:')){const comma=uri.indexOf(',');if(comma<0)throw Error('Malformed data URI');return Buffer.from(uri.slice(comma+1),uri.slice(0,comma).endsWith(';base64')?'base64':'utf8');}
 if(/^[a-z]+:|^\/\//i.test(uri))throw Error(`Remote dependency requires explicit acquisition: ${relative(source,model)}`);
 return verifyCopy(resolve(dirname(model),decodeURIComponent(uri)));
}
const models=files(resolve(source,'assets')).filter(p=>['.glb','.gltf'].includes(extname(p)));
const report=[];
for(const model of models){
 const bytes=verifyCopy(model);let document,binary;
 if(extname(model)==='.glb'){
  if(bytes.length<20||bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw Error(`Invalid GLB header: ${model}`);
  for(let offset=12;offset<bytes.length;){const size=bytes.readUInt32LE(offset),type=bytes.readUInt32LE(offset+4);if(offset+8+size>bytes.length)throw Error(`Truncated GLB: ${model}`);const chunk=bytes.subarray(offset+8,offset+8+size);if(type===0x4e4f534a)document=JSON.parse(chunk.toString());if(type===0x004e4942)binary=chunk;offset+=8+size;}
 }else document=JSON.parse(bytes.toString());
 if(document?.asset?.version!=='2.0')throw Error(`Unsupported glTF version: ${model}`);
 const buffers=(document.buffers??[]).map(buffer=>{const data=buffer.uri?dependency(model,buffer.uri):binary;if(!data||data.length<buffer.byteLength)throw Error(`Missing/truncated buffer: ${model}`);return data;});
 for(const view of document.bufferViews??[]){if(!buffers[view.buffer]||(view.byteOffset??0)+view.byteLength>buffers[view.buffer].length)throw Error(`Out-of-range buffer view: ${model}`);}
 for(const image of document.images??[]){if(image.uri){if(!dependency(model,image.uri).length)throw Error(`Empty image: ${model}`);}else if(!document.bufferViews?.[image.bufferView])throw Error(`Missing embedded image: ${model}`);}
 report.push({path:relative(source,model),bytes:bytes.length,sha256:digest(bytes),meshes:document.meshes?.length??0,skins:document.skins?.length??0,animations:document.animations?.length??0,images:document.images?.length??0});
}
// Verify literal model references too: scanning existing files alone cannot catch a typo in rendering code.
for(const name of ['shared/visual-identity.ts','client/DungeonDressing.tsx']){
 const text=readFileSync(resolve(root,name),'utf8');
 for(const match of text.matchAll(/['"]([^'"\n]+\.(?:glb|gltf))['"]/g)){
  const path=match[1];verifyCopy(resolve(source,path.startsWith('/assets/')?path.slice(1):'assets/expansion/'+path));
 }
}
mkdirSync(resolve(root,'data'),{recursive:true});
writeFileSync(resolve(root,'data/asset-bundle-verification.json'),JSON.stringify({scope:'Bundled bytes, model references and glTF dependencies; not visual pose or shader acceptance',models:report,verifiedFiles:verified.size},null,2)+'\n');
console.log(`Verified ${models.length} models and ${verified.size} bundled files, including external glTF dependencies.`);
