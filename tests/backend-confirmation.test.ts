import {test} from 'node:test';
import assert from 'node:assert/strict';
import {splitCloses,strongConfirmation} from '../client/confirmation.js';
import {closes} from '../server/game.js';
import type {ActionOption} from '../shared/types.js';
const action=(description:string,dangerous?:boolean):ActionOption=>({id:'x',label:'X',description,kind:'interact',actorId:'hero',...(dangerous?{dangerous}:{})});
test('routine checks stay light',()=>{
 assert.equal(strongConfirmation(action('One attempt per character. Insight check, DC 10.')),false);
 assert.deepEqual(splitCloses('One attempt per character. Insight check, DC 10.'),{text:'One attempt per character. Insight check, DC 10.'});
});
test('dangerous actions keep the strong modal',()=>assert.equal(strongConfirmation(action('Begin combat.',true)),true));
test('branch closers keep the strong modal and split out the closed branches',()=>{
 const d=closes('Begin combat against two goblins. Scrit flees if the guards fall.',['the ration to Scrit','the seal negotiation']);
 assert.equal(strongConfirmation(action(d)),true);
 assert.deepEqual(splitCloses(d),{text:'Begin combat against two goblins. Scrit flees if the guards fall.',closes:'Closes: the ration to Scrit; the seal negotiation.'});
});
test('a conditional closer keeps its condition',()=>{
 const d=closes('Agility DC13. Success gains passage, but no supplies. Failure raises alarm.',['the ration to Scrit'],'Success');
 assert.equal(strongConfirmation(action(d)),true);
 assert.deepEqual(splitCloses(d),{text:'Agility DC13. Success gains passage, but no supplies. Failure raises alarm.',closes:'Success closes: the ration to Scrit.'});
});
test('a description that is only the closer has no leading text',()=>assert.deepEqual(splitCloses('Closes: the courier.'),{text:'',closes:'Closes: the courier.'}));
