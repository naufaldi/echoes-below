import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,publicSave} from '../server/game.js';
import {ownDialogue,setOwnKey,ownStructured} from '../client/own-ai.js';
const save=()=>publicSave(createSave({name:'QA',classId:'adept',raceId:'human',backgroundId:'delver',appearanceId:'moon'}));
test('opening narration explicitly permits zero discovery references and constrains generated IDs',async()=>{
 const original=globalThis.fetch;setOwnKey('test-only');
 globalThis.fetch=async(_url,init)=>{const body=JSON.parse(init!.body as string);assert.equal(body.text.format.schema.properties.factIds.maxItems,0);assert.match(body.instructions,/factIds/);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({text:'Rain gathers beside the cart.',factIds:[]})}]}]});};
 try{assert.equal(await ownDialogue(save(),'dm','Describe the approach',[]),'Rain gathers beside the cart.');}finally{globalThis.fetch=original;setOwnKey('');}
});
test('incomplete provider output has an actionable error, not a JSON parser error',async()=>{const original=globalThis.fetch;setOwnKey('test-only');globalThis.fetch=async()=>Response.json({status:'incomplete',output:[]});try{await assert.rejects(()=>ownStructured('test',{},{}),/incomplete/i);}finally{globalThis.fetch=original;setOwnKey('');}});
test('unknown world references remain rejected',async()=>{const original=globalThis.fetch;setOwnKey('test-only');globalThis.fetch=async()=>Response.json({status:'completed',output:[{content:[{text:JSON.stringify({text:'Secret invented.',factIds:['invented']})}]}]});try{await assert.rejects(()=>ownDialogue(save(),'dm','Hello',[]),/ground/);}finally{globalThis.fetch=original;setOwnKey('');}});

test('personal key check does not retain candidates and reports invalid or exhausted keys',async()=>{const {verifyOwnKey,ownKeyConfigured}=await import('../client/own-ai.js');const original=globalThis.fetch;setOwnKey('');try{for(const [status,message] of [[401,/rejected this key/],[429,/usage limit/],[403,/permission/]] as const){globalThis.fetch=async()=>new Response('',{status});await assert.rejects(()=>verifyOwnKey('test-only'),message);assert.equal(ownKeyConfigured(),false);}globalThis.fetch=async()=>Response.json({status:'completed'});await verifyOwnKey('test-only');assert.equal(ownKeyConfigured(),false);}finally{globalThis.fetch=original;setOwnKey('');}});
