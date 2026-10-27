import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {buildApp} from '../server/app.js';
import {previewSave} from '../server/dev-preview.js';
import {publicSave} from '../server/game.js';
import {roomFork} from '../server/playstyle.js';
import {EXPEDITION} from '../shared/campaign.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
test('scene preview reaches every Chapter II–VI room in both rule sets through legal actions',()=>{
 for(const rules of ['echo','curated'] as const)for(const room of EXPEDITION){
  const s=previewSave(room.id,rules);assert.equal(s.sceneId,room.id);assert.equal(s.mode,'explore',room.id);
  assert.equal(s.rulesVersion,rules==='curated'?CURATED_RULES_VERSION:'echo-v1');assert.equal(!!s.tactical,rules==='curated');
  assert.equal(publicSave(s).scene.id,room.id);assert.ok(!s.flags[`${room.id}:resolved`],room.id);
 }
});
test('the preview choice path flips a companion fork, so both variants of that room can be previewed',()=>{
 assert.equal(roomFork(previewSave('roots-4','echo',0),'roots-4')!.key,'mira');assert.equal(roomFork(previewSave('roots-4','echo',1),'roots-4')!.key,'oren');
 assert.throws(()=>previewSave('approach','echo'),/No Chapter II–VI room/);
});
test('local preview route creates a listed save at the room, needs the CSRF token and refuses non-loopback sockets',async()=>{
 const app=await buildApp({database:':memory:',ai:false,dice:n=>n});
 try{
  const token=(await app.inject({url:'/api/session'})).json().csrfToken,post=(url:string,extra:object={})=>app.inject({url,method:'POST',headers:{'x-csrf-token':token},payload:{},...extra});
  const made=await post('/api/dev/preview/market-5?rules=curated');assert.equal(made.statusCode,200,made.body);const s=made.json();
  assert.equal(s.scene.id,'market-5');assert.equal(s.rulesVersion,CURATED_RULES_VERSION);assert.ok(s.tactical);
  assert.equal((await app.inject({url:'/api/saves/'+s.id})).json().scene.id,'market-5');assert.ok((await app.inject({url:'/api/saves'})).json().saves.some((x:{id:string})=>x.id===s.id));
  assert.equal((await post('/api/dev/preview/depth-8')).json().rulesVersion,'echo-v1');
  assert.equal((await post('/api/dev/preview/nowhere-1')).statusCode,404);assert.equal((await post('/api/dev/preview/archive-1?rules=srd')).statusCode,400);
  assert.equal((await app.inject({url:'/api/dev/preview/archive-1',method:'POST',payload:{}})).statusCode,403);
  const remote=await post('/api/dev/preview/archive-1',{remoteAddress:'192.168.1.5'});assert.equal(remote.statusCode,403);assert.match(remote.json().message,/this computer only/);
  assert.equal((await app.inject({url:'/api/dev/preview/archive-1'})).statusCode,404);
 }finally{await app.close();}
});
test('hosted sources never import or name the local preview route',()=>{
 for(const file of readdirSync('hosted').filter(f=>f.endsWith('.ts'))){const text=readFileSync('hosted/'+file,'utf8');assert.ok(!text.includes('dev-preview')&&!text.includes('/api/dev'),file);}
});
