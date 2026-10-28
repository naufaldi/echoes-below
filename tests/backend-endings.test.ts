import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve,relative,sep,dirname} from 'node:path';
import {createSave,publicSave,type Save} from '../server/game.js';
import {ENDINGS} from '../server/playstyle.js';
import {ENDING_IDS} from '../shared/endings.js';
import {EXPEDITION} from '../shared/campaign.js';
import {runProfile} from '../scripts/playstyle-profiles.js';
import {ENDINGS_FOUND_KEY,endingSlots,readFound,recordFound} from '../client/endings-found.js';
import {endingParagraphs,recapRows} from '../client/ending-recap.js';
import {CREDITS,SRD_NOTICE} from '../client/asset-credits-data.js';
import {LICENCE_FILE_CREDITS,authorName,buildCredits,licenceLabel} from '../client/asset-credits.js';

test('#69 the client knows every ending by id, and only by id',()=>{
 assert.deepEqual([...ENDING_IDS].sort(),Object.keys(ENDINGS).sort());
});

/** One run per profile; echo-v1 is the published campaign. */
const runs=(['diplomatic','reserved','aggressive','breaker'] as const).map(p=>runProfile(p,'echo-v1'));
test('#69 the four playstyle profiles reach the four endings, and each finished save carries its recap',()=>{
 assert.deepEqual(runs.map(r=>r.endingId),['open-relay','long-way-home','iron-watch','broken-chain']);
 for(const run of runs){
  const view=publicSave(run.save),recap=view.recap!;
  assert.equal(view.mode,'complete');assert.equal(recap.endingId,run.endingId);assert.equal(recap.title,ENDINGS[run.endingId as keyof typeof ENDINGS].title);
  assert.ok(view.ending!.startsWith(recap.title+'. '));
  assert.deepEqual({stance:recap.stance,spared:recap.spared,fought:recap.fought,companion:recap.companion,mira:recap.mira,oren:recap.oren,scrit:recap.scrit},{stance:run.finalLedger.stance,spared:run.finalLedger.mercy,fought:run.finalLedger.force,companion:run.finalLedger.companion,mira:run.finalLedger.mira,oren:run.finalLedger.oren,scrit:run.finalLedger.scrit});
  const [ending,last]=endingParagraphs(view,recap.title);
  assert.equal(ending,ENDINGS[recap.endingId].text);assert.ok(EXPEDITION.at(-1)!.outcomes.includes(last),'the final room closes the page');
  const rows=Object.fromEntries(recapRows(view,recap).map(r=>[r.key,r]));
  assert.equal(rows.rooms.tag,'Rooms cleared · 46 of 46');assert.equal(rows.choices.tag,`Choices · ${EXPEDITION.length}`);
 }
 assert.deepEqual(runs.map(r=>publicSave(r.save).recap!.scrit),['guardian','stranger','scattered','scattered']);
});

test('#69 the recap stays private until the descent is over',()=>{
 const run=runs[0],mid=structuredClone(run.save) as Save;mid.mode='explore';mid.ending=null;
 assert.equal(publicSave(mid).recap,undefined,'standing in the final room');
 const legacy=structuredClone(run.save) as Save;legacy.ending=EXPEDITION.at(-1)!.outcomes[0];
 assert.equal(publicSave(legacy).recap,undefined,'a Release 1 ending without a title keeps its old page');
 const fresh=createSave({name:'Aria',classId:'cleric',backgroundId:'envoy',appearanceId:'moon'});fresh.mode='complete';fresh.sceneId='aftermath';fresh.ending='A Promise Shared';
 assert.equal(publicSave(fresh).recap,undefined,'Chapter I’s close is not the campaign’s');
});

/** A localStorage stand-in; two readers over one backing map are a page before and after a reload. */
const backing=()=>{const map=new Map<string,string>();return {map,store:{getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);}}};};
test('#69 endings found survive a reload, in a fixed order, without naming locked endings',()=>{
 const {map,store}=backing();
 assert.deepEqual(readFound(store),[]);
 recordFound(store,{id:'iron-watch',title:'The Iron Watch'});recordFound(store,{id:'open-relay',title:'The Open Relay'});recordFound(store,{id:'iron-watch',title:'The Iron Watch'});
 const reloaded={getItem:(k:string)=>new Map(map).get(k)??null,setItem:()=>{}};
 assert.deepEqual(readFound(reloaded),[{id:'open-relay',title:'The Open Relay'},{id:'iron-watch',title:'The Iron Watch'}]);
 const slots=endingSlots(readFound(reloaded));
 assert.deepEqual(slots.map(s=>s.found),[true,false,false,true]);
 assert.deepEqual(slots.filter(s=>!s.found),[{found:false},{found:false}],'a locked slot carries no id or title');
 map.set(ENDINGS_FOUND_KEY,'{not json');assert.deepEqual(readFound(store),[]);
 map.set(ENDINGS_FOUND_KEY,JSON.stringify([{id:'secret-ending',title:'?'},{id:'broken-chain'},{id:'long-way-home',title:'The Long Way Home'}]));
 assert.deepEqual(readFound(store),[{id:'long-way-home',title:'The Long Way Home'}],'unknown and untitled entries are dropped');
 const refusing={getItem:()=>null,setItem:()=>{throw Error('QuotaExceededError');}};
 assert.deepEqual(recordFound(refusing,{id:'broken-chain',title:'The Broken Chain'}),[{id:'broken-chain',title:'The Broken Chain'}],'storage that refuses still shows this ending');
});

const root=resolve(dirname(new URL(import.meta.url).pathname),'..'),pub=resolve(root,'public');
const walk=(dir:string):string[]=>readdirSync(dir).flatMap(n=>{const p=resolve(dir,n);return statSync(p).isDirectory()?walk(p):[p];});
const shipped=walk(resolve(pub,'assets')).map(p=>relative(pub,p).split(sep).join('/'));
const manifests=shipped.filter(p=>p.endsWith('/manifest.json')).map(path=>({path,json:JSON.parse(readFileSync(resolve(pub,path),'utf8'))}));
type Entry=Record<string,string|undefined>;
test('#69 credits name the author and licence of every file in every manifest',()=>{
 assert.ok(manifests.length>=11,'every manifest under public/assets is read');
 let checked=0;
 for(const {path,json} of manifests){
  const dir=path.replace(/\/manifest\.json$/,''),m=(Array.isArray(json)?{}:json) as Entry,entries=(Array.isArray(json)?json:json.files) as Entry[];
  for(const e of entries){
   const file=`${dir}/${e.file??e.path!.split('/').pop()}`,author=e.author??e.creator??m.author,licence=e.licence??e.license??m.licence;
   assert.ok(author&&licence,`${file} names an author and licence`);
   const credit=CREDITS.find(c=>c.files.includes(file));
   assert.ok(credit,`${file} is credited`);assert.equal(credit.author,authorName(author!),file);assert.equal(credit.licence,licenceLabel(licence!),file);
   if(e.credit)assert.equal(credit.credit,e.credit,`${file} keeps its attribution line verbatim`);
   checked++;
  }
 }
 assert.ok(checked>100);
 assert.deepEqual(CREDITS,buildCredits(manifests),'client/asset-credits-data.ts is current: run node scripts/generate-credits.mjs');
 assert.ok(CREDITS.some(c=>c.section==='Music'&&c.work==='In Darkness'&&c.licence==='CC BY 4.0'&&c.credit?.includes('Of Far Different Nature')));
});
test('#69 every shipped asset is credited, from a manifest or its bundled licence file',()=>{
 const credited=new Set(CREDITS.flatMap(c=>c.files)),paperwork=/(\/manifest\.json|\.txt|\/audit-[^/]+\.json|^assets\/audit-index\.json)$/;
 assert.deepEqual(shipped.filter(p=>!paperwork.test(p)&&!credited.has(p)),[]);
 for(const c of LICENCE_FILE_CREDITS){
  const text=readFileSync(resolve(pub,c.licenceFile),'utf8');
  assert.ok(text.includes(c.author),`${c.licenceFile} names ${c.author}`);assert.ok(text.includes(c.mark),`${c.licenceFile} grants ${c.licence}`);
  for(const f of c.files)assert.ok(shipped.includes(f),`${f} ships`);
 }
 assert.equal(SRD_NOTICE,readFileSync(resolve(pub,'SRD-NOTICE.txt'),'utf8').split(/\n\s*\n/)[0].trim());
 assert.match(SRD_NOTICE,/SRD 5\.2\.1.*Creative Commons Attribution 4\.0/s);
});
