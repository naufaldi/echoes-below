import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playbackSteps} from '../client/playback-steps.js';
import {actionRows} from '../client/action-focus.js';
import type {ActionOption,PresentationFrame} from '../shared/types.js';
const frame=(purpose?:string)=>({log:{rolls:purpose?[{purpose}]:[]}} as unknown as PresentationFrame);
const action=(id:string,label:string)=>({id,label,description:'',kind:'inspect',check:{dc:10,attribute:'insight'}} as ActionOption);
test('consecutive initiative rolls become one playback step and other beats stay separate',()=>{
 assert.deepEqual(playbackSteps([frame('Initiative'),frame('Initiative'),frame('Initiative'),frame(),frame('Attack')]),[[0,2],[3,3],[4,4]]);
 assert.deepEqual(playbackSteps([frame('Attack'),frame('Initiative')]),[[0,0],[1,1]]);
});
test('per-member checks group into one row that keeps each member action id',()=>{
 const party=[{id:'hero',name:'Alden'},{id:'mira',name:'Mira'},{id:'oren',name:'Oren'}];
 const rows=actionRows([action('chest','Search the forgotten chest'),action('tracks:hero','Inspect tracks · Alden'),action('tracks:mira','Inspect tracks · Mira'),action('tracks:oren','Inspect tracks · Oren'),action('rest','Rest at camp')],party);
 assert.deepEqual(rows.map(r=>r.kind),['single','choices','single']);
 const group=rows[1];assert.ok(group.kind==='choices');assert.equal(group.label,'Inspect tracks');assert.deepEqual(group.options.map(o=>[o.name,o.action.id]),[['Alden','tracks:hero'],['Mira','tracks:mira'],['Oren','tracks:oren']]);
});
test('a single remaining member keeps its own ordinary row',()=>{
 const rows=actionRows([action('tracks:mira','Inspect tracks · Mira')],[{id:'mira',name:'Mira'}]);
 assert.deepEqual(rows,[{kind:'single',action:action('tracks:mira','Inspect tracks · Mira')}]);
});
test('attacks and moves with several targets become one row each',()=>{
 const act=(id:string,kind:string,label:string)=>({id,kind,label,description:''} as ActionOption);
 const rows=actionRows([act('attack:g1','attack','Attack Goblin sentry'),act('attack:g2','attack','Attack Goblin guard'),act('guard','guard','Guard'),act('move:exit','move','Move to the exit'),act('move:left','move','Move left'),act('move:g2','move','Approach Goblin guard'),act('end_turn','end_turn','End turn')],[]);
 assert.deepEqual(rows.map(r=>r.kind==='choices'?[r.label,r.options.map(o=>o.name)]:r.action.id),[['Attack',['Goblin sentry','Goblin guard']],'guard',['Move',['exit','left','→ Goblin guard']],'end_turn']);
 assert.deepEqual(actionRows([act('attack:g1','attack','Attack Goblin sentry')],[]).map(r=>r.kind),['single']);
});
