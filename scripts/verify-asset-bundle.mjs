import {readFileSync,readdirSync,statSync,existsSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative,dirname,extname,sep} from 'node:path';
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
// Audio licensing gate (docs/PRD.md, audio sourcing policy). Checked in the built copy before byte comparison, so an unlisted shipped file fails with its own reason.
const AUDIO_LICENCES=new Set(['CC0-1.0','CC-BY-4.0']),AUDIO_FIELDS=['file','sha256','title','author','source','licence','licenceUrl','retrieved','changes'],AUDIO_BUDGET=15*1024*1024,audioRoot=resolve(built,'assets/audio');
const audioFiles=existsSync(audioRoot)?files(audioRoot).map(p=>relative(audioRoot,p).split(sep).join('/')).filter(name=>name!=='manifest.json'):[];
const audioManifest=existsSync(resolve(audioRoot,'manifest.json'))?JSON.parse(readFileSync(resolve(audioRoot,'manifest.json'),'utf8')):null;
if(audioFiles.length&&!audioManifest)throw Error('Audio files ship without assets/audio/manifest.json');
const audioEntries=new Map((audioManifest?.files??[]).map(entry=>[entry.file,entry]));let audioBytes=0;
for(const name of audioFiles)if(!audioEntries.has(name))throw Error(`Audio file has no manifest entry: assets/audio/${name}`);
for(const entry of audioEntries.values()){
 const missing=AUDIO_FIELDS.find(field=>typeof entry[field]!=='string'||!entry[field].trim());if(missing)throw Error(`Audio manifest entry lacks ${missing}: ${entry.file}`);
 if(!AUDIO_LICENCES.has(entry.licence))throw Error(`Audio licence not allowed: assets/audio/${entry.file} (${entry.licence})`);
 if(entry.licence.startsWith('CC-BY')&&!entry.credit)throw Error(`Attribution licence needs a credit line: assets/audio/${entry.file}`);
 const path=resolve(audioRoot,entry.file);if(!path.startsWith(audioRoot+sep))throw Error(`Audio manifest entry escapes audio directory: ${entry.file}`);
 if(!existsSync(path))throw Error(`Audio manifest entry has no file: assets/audio/${entry.file}`);
 const bytes=readFileSync(path);if(digest(bytes)!==entry.sha256)throw Error(`Audio hash differs from manifest: assets/audio/${entry.file}`);
 verifyCopy(resolve(source,'assets/audio',entry.file));audioBytes+=bytes.length;
}
if(audioManifest)verifyCopy(resolve(source,'assets/audio/manifest.json'));
if(audioBytes>AUDIO_BUDGET)throw Error(`Audio exceeds the ${AUDIO_BUDGET/1024/1024} MB budget: ${(audioBytes/1024/1024).toFixed(1)} MB`);
// Environment kit gate (#46): every file under assets/env/<kit>/ is listed in that kit's manifest.json with a matching hash and a CC0 licence, and env/ stays within one shared budget.
// Listing, licence, hash and budget run on the built copy before byte comparison, so each failure names its own reason.
const ENV_LICENCES=new Set(['CC0-1.0']),ENV_FIELDS=['file','sha256','source','author','licence','retrieved','changes'],ENV_BUDGET=20*1024*1024,envRoot=resolve(built,'assets/env');
const envFiles=existsSync(envRoot)?files(envRoot).map(p=>relative(envRoot,p).split(sep).join('/')):[],envKits=new Map();let envBytes=0;
for(const name of envFiles){
 const [kit,...rest]=name.split('/');if(!rest.length)throw Error(`Environment file outside a kit folder: assets/env/${name}`);
 if(!envKits.has(kit)){const path=resolve(envRoot,kit,'manifest.json');if(!existsSync(path))throw Error(`Environment kit ships without a manifest: assets/env/${kit}/manifest.json`);envKits.set(kit,new Map((JSON.parse(readFileSync(path,'utf8')).files??[]).map(entry=>[entry.file,entry])));}
 envBytes+=statSync(resolve(envRoot,name)).size;const file=rest.join('/');
 if(file!=='manifest.json'&&!envKits.get(kit).has(file))throw Error(`Environment file has no manifest entry: assets/env/${name}`);
}
for(const [kit,entries] of envKits)for(const entry of entries.values()){
 const missing=ENV_FIELDS.find(field=>typeof entry[field]!=='string'||!entry[field].trim());if(missing)throw Error(`Environment manifest entry lacks ${missing}: assets/env/${kit}/${entry.file}`);
 if(!ENV_LICENCES.has(entry.licence))throw Error(`Environment licence not allowed: assets/env/${kit}/${entry.file} (${entry.licence})`);
 const path=resolve(envRoot,kit,entry.file);if(!path.startsWith(resolve(envRoot,kit)+sep))throw Error(`Environment manifest entry escapes its kit: ${kit}/${entry.file}`);
 if(!existsSync(path))throw Error(`Environment manifest entry has no file: assets/env/${kit}/${entry.file}`);
 if(digest(readFileSync(path))!==entry.sha256)throw Error(`Environment hash differs from manifest: assets/env/${kit}/${entry.file}`);
}
if(envBytes>ENV_BUDGET)throw Error(`Environment assets exceed the ${ENV_BUDGET/1024/1024} MB budget: ${(envBytes/1024/1024).toFixed(1)} MB`);
for(const [kit,entries] of envKits){for(const entry of entries.values())verifyCopy(resolve(source,'assets/env',kit,entry.file));verifyCopy(resolve(source,'assets/env',kit,'manifest.json'));}
// Painted portrait gate (CHARACTERS.md §6.2): every file under assets/portraits/ is listed in its manifest with a hash and a licence, named <characterId>-<expression>.png, within 200 KB. The client reads only the manifest, so a listed file must exist.
const portraitRoot=resolve(built,'assets/portraits'),portraitManifest=existsSync(resolve(portraitRoot,'manifest.json'))?JSON.parse(readFileSync(resolve(portraitRoot,'manifest.json'),'utf8')):null,portraitEntries=new Map((portraitManifest?.files??[]).map(entry=>[entry.file,entry]));
for(const name of existsSync(portraitRoot)?files(portraitRoot).map(p=>relative(portraitRoot,p).split(sep).join('/')):[])if(name!=='manifest.json'&&!portraitEntries.has(name))throw Error(`Portrait has no manifest entry: assets/portraits/${name}`);
for(const entry of portraitEntries.values()){
 if(!/^[a-z0-9-]+-(neutral|smile|worried|angry|hurt)\.png$/.test(entry.file??''))throw Error(`Portrait name must be <characterId>-<expression>.png: ${entry.file}`);
 const missing=['sha256','licence'].find(field=>typeof entry[field]!=='string'||!entry[field].trim());if(missing)throw Error(`Portrait manifest entry lacks ${missing}: assets/portraits/${entry.file}`);
 const path=resolve(portraitRoot,entry.file);if(!existsSync(path))throw Error(`Portrait manifest entry has no file: assets/portraits/${entry.file}`);
 const bytes=readFileSync(path);if(digest(bytes)!==entry.sha256)throw Error(`Portrait hash differs from manifest: assets/portraits/${entry.file}`);if(bytes.length>200*1024)throw Error(`Portrait exceeds 200 KB: assets/portraits/${entry.file}`);
 verifyCopy(resolve(source,'assets/portraits',entry.file));
}
if(portraitManifest)verifyCopy(resolve(source,'assets/portraits/manifest.json'));
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
// Model manifest gate (#91): every other file under assets/ (models, glTF buffers, textures) is listed in the manifest.json beside it, with the environment-kit fields, a matching hash and a licence allowed for its folder.
// env/, audio/ and portraits/ have their own gates above; Vite's hashed chunks sit loose in assets/, so a loose file is checked only when it comes from public/assets/. Licence texts and audit notes are paperwork, the same set the credits test skips. Runs after the glTF checks, so a missing or changed model keeps its bundling error.
// Model licences, each allowed for a stated reason:
// - CC0-1.0 in every folder: a public domain dedication with no conditions (KayKit Adventurers, Quaternius RPG Character Pack, Poly Pizza props, Fantasy Props MegaKit).
// - QAL-1.0 only in assets/quaternius/: the Quaternius Asset License grants use and modification inside a game with no credit required, and bars only reselling or redistributing the assets as assets. Imp-animated.glb ships only as part of this game (docs/ASSETS.md).
const MODEL_LICENCES={'CC0-1.0':null,'QAL-1.0':'quaternius'},PAPERWORK=/(\/manifest\.json|\.txt|\/audit-[^/]+\.json|^assets\/audit-index\.json)$/,assetsRoot=resolve(built,'assets'),modelManifests=new Map();
const modelLicence=(folder,licence,what)=>{if(!Object.hasOwn(MODEL_LICENCES,licence)||(MODEL_LICENCES[licence]&&folder!==MODEL_LICENCES[licence]))throw Error(`Model licence not allowed: assets/${folder}/${what} (${licence})`);};
for(const name of files(assetsRoot).map(p=>relative(assetsRoot,p).split(sep).join('/')).filter(name=>!/^(env|audio|portraits)\//.test(name)&&!PAPERWORK.test('assets/'+name)&&(name.includes('/')||existsSync(resolve(source,'assets',name))))){
 const folder=name.includes('/')?name.slice(0,name.lastIndexOf('/')):'',where=folder?`assets/${folder}`:'assets';
 if(!modelManifests.has(folder)){const path=resolve(assetsRoot,folder,'manifest.json');if(!existsSync(path))throw Error(`Model folder ships without a manifest: ${where}/manifest.json`);const listed=JSON.parse(readFileSync(path,'utf8')).files;if(!Array.isArray(listed))throw Error(`Model manifest needs a files list: ${where}/manifest.json`);modelManifests.set(folder,new Map(listed.map(entry=>[entry.file,entry])));}
 if(!modelManifests.get(folder).has(name.slice(folder?folder.length+1:0)))throw Error(`Model file has no manifest entry: assets/${name}`);
}
for(const [folder,entries] of modelManifests){
 for(const entry of entries.values()){
  const missing=ENV_FIELDS.find(field=>typeof entry[field]!=='string'||!entry[field].trim());if(missing)throw Error(`Model manifest entry lacks ${missing}: assets/${folder}/${entry.file}`);
  modelLicence(folder,entry.licence,entry.file);for(const part of entry.includes??[])modelLicence(folder,part.licence,`${entry.file} (${part.work})`);
  const path=resolve(assetsRoot,folder,entry.file);if(!path.startsWith(resolve(assetsRoot,folder)+sep))throw Error(`Model manifest entry escapes its folder: assets/${folder}/${entry.file}`);
  if(!existsSync(path))throw Error(`Model manifest entry has no file: assets/${folder}/${entry.file}`);
  if(digest(readFileSync(path))!==entry.sha256)throw Error(`Model hash differs from manifest: assets/${folder}/${entry.file}`);
  verifyCopy(resolve(source,'assets',folder,entry.file));
 }
 verifyCopy(resolve(source,'assets',folder,'manifest.json'));
}
const modelFiles=[...modelManifests.values()].reduce((n,e)=>n+e.size,0);
// Verify literal model references too: scanning existing files alone cannot catch a typo in rendering code.
// Chapter room files (client/rooms/) must name env models as full '/assets/env/<kit>/<file>' literals so this scan can follow them.
for(const name of ['shared/visual-identity.ts','client/DungeonDressing.tsx','client/ChapterOneRooms.tsx',...readdirSync(resolve(root,'client/rooms')).filter(f=>/\.tsx?$/.test(f)).map(f=>'client/rooms/'+f)]){
 const text=readFileSync(resolve(root,name),'utf8');
 for(const match of text.matchAll(/['"]([^'"\n]+\.(?:glb|gltf))['"]/g)){
  const path=match[1];verifyCopy(resolve(source,path.startsWith('/assets/')?path.slice(1):'assets/expansion/'+path));
 }
}
mkdirSync(resolve(root,'data'),{recursive:true});
writeFileSync(resolve(root,'data/asset-bundle-verification.json'),JSON.stringify({scope:'Bundled bytes, model references and glTF dependencies; not visual pose or shader acceptance',models:report,audio:{files:audioEntries.size,bytes:audioBytes},environment:{kits:[...envKits.keys()],files:[...envKits.values()].reduce((n,e)=>n+e.size,0),bytes:envBytes},modelManifests:{folders:[...modelManifests.keys()],files:modelFiles},verifiedFiles:verified.size},null,2)+'\n');
console.log(`Verified ${models.length} models, ${audioEntries.size} licensed audio files (${(audioBytes/1024/1024).toFixed(1)} MB), ${[...envKits.values()].reduce((n,e)=>n+e.size,0)} CC0 environment files (${(envBytes/1024/1024).toFixed(1)} MB), ${modelFiles} manifest-listed model files and ${verified.size} bundled files, including external glTF dependencies.`);
