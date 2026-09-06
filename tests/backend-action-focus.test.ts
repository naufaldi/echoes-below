import {test} from 'node:test';
import assert from 'node:assert/strict';
import {focusedActions} from '../client/action-focus.js';
import type {ActionOption} from '../shared/types.js';
const actions:ActionOption[]=[
 {id:'attack:a',label:'Attack A',description:'',kind:'attack',actorId:'hero',targetId:'a'},
 {id:'heal:mira',label:'Heal Mira',description:'',kind:'heal',actorId:'hero',targetId:'mira'},
 {id:'dodge',label:'Dodge',description:'',kind:'defend',actorId:'hero'},
 {id:'end',label:'End turn',description:'',kind:'turn',actorId:'hero'}];
test('unreachable selected enemy never exposes attacks against another target',()=>{
 assert.deepEqual(focusedActions(actions,'b').actions.map(a=>a.id),['dodge','end']);
 assert.equal(focusedActions(actions,'b').hasTargetActions,false);
});
test('target focus retains only matching targeted actions plus common controls',()=>{
 assert.deepEqual(focusedActions(actions,'a').actions.map(a=>a.id),['attack:a','dodge','end']);
 assert.equal(focusedActions(actions,'a').hasTargetActions,true);
 assert.deepEqual(focusedActions(actions,'mira').actions.map(a=>a.id),['heal:mira','dodge','end']);
});
test('actor focus and cleared focus show that actor actions without mutating options',()=>{
 assert.deepEqual(focusedActions(actions,'hero').actions,actions);
 assert.deepEqual(focusedActions(actions,'').actions,actions);
 assert.equal(actions.length,4);
 assert.deepEqual(focusedActions([],'a').actions,[]);
});
