import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildApp} from '../server/app.js';
import {Storage} from '../server/storage.js';
import {createSave} from '../server/game.js';
import worker from '../hosted/worker.js';
import {Store,hash,type Database,type Statement} from '../hosted/db.js';
class DB implements Database{
 sql=new DatabaseSync(':memory:');constructor(){for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())this.sql.exec(readFileSync('drizzle/'+file,'utf8'));}
 prepare(query:string):Statement{let values:unknown[]=[];const self=this;return {bind(...args){values=args;return this;},async first<T>(){return (self.sql.prepare(query).get(...values as never[])??null) as T|null;},async all<T>(){return{results:self.sql.prepare(query).all(...values as never[]) as T[]};},async run(){const result=self.sql.prepare(query).run(...values as never[]);return{meta:{changes:Number(result.changes)}};}};}
 async batch(statements:Statement[]){this.sql.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());this.sql.exec('COMMIT');return r;}catch(e){this.sql.exec('ROLLBACK');throw e;}}
}
const id='11111111-1111-4111-8111-111111111111',commandId='22222222-2222-4222-8222-222222222222';
const input={name:'Aria',classId:'cleric',raceId:'elf',backgroundId:'envoy',appearanceId:'moon'} as const;
const body={actionId:'enter',expectedRevision:0,commandId,companionPlans:{mira:'guard'}};
test('local persisted command hash pins parsed command key order',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'echo-hash-')),database=join(dir,'save.sqlite'),storage=new Storage(database),s=createSave(input);s.id=id;storage.put(s);
 const app=await buildApp({database,ai:false,dice:n=>n});
 try{const token=(await app.inject({url:'/api/session'})).json().csrfToken;const response=await app.inject({method:'POST',url:`/api/saves/${id}/actions`,headers:{'x-csrf-token':token},payload:body});assert.equal(response.statusCode,200,response.body);assert.equal(storage.db.prepare('SELECT hash FROM commands WHERE id=?').get(commandId)!.hash,'4123d2254337cea66a2395e9def80f2a20020816c3e4f1cf29391fd0d5b0f1ce');}
 finally{await app.close();storage.close();rmSync(dir,{recursive:true,force:true});}
});
test('hosted persisted command hash pins id and parsed command key order',async()=>{
 const db=new DB(),env={DB:db,ASSETS:{async fetch(){return new Response('game');}}};
 try{const session=await worker.fetch(new Request('https://game.test/api/session'),env),cookie=session.headers.get('set-cookie')!.split(';')[0],token=cookie.slice('__Host-echo='.length),csrf=(await session.json() as {csrfToken:string}).csrfToken,s=createSave(input);s.id=id;await new Store(db,await hash('owner:'+token)).create(s);
 const response=await worker.fetch(new Request(`https://game.test/api/saves/${id}/actions`,{method:'POST',headers:{cookie,'content-type':'application/json','x-csrf-token':csrf},body:JSON.stringify(body)}),env);assert.equal(response.status,200,await response.text());assert.equal(db.sql.prepare('SELECT hash FROM commands WHERE id=?').get(commandId)!.hash,'06f5b84ca8d4e5f0d74179a7a717f318e95474d31696ce395b643793831663bd');}
 finally{db.sql.close();}
});
