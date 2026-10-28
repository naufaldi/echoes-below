import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bandFor,checkBreakdown,oddsFor,signed,successChance} from '../shared/odds.js';
const close=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} ≠ ${expected}`);
test('a check succeeds on d20 + modifier ≥ DC, one face in twenty each',()=>{
 close(successChance({dc:10,modifier:0}),11/20);
 close(successChance({dc:13,modifier:3}),11/20);
 close(successChance({dc:15,modifier:-1}),5/20);
 close(successChance({dc:10,modifier:2}),13/20);
});
test('checks have no natural rules: an easy DC always succeeds and an impossible one never does',()=>{
 close(successChance({dc:5,modifier:4}),1);
 close(successChance({dc:25,modifier:4}),0);
 close(successChance({dc:21,modifier:0}),0);
});
test('attacks always hit on a natural 20 and always miss on a natural 1',()=>{
 close(successChance({dc:30,modifier:2,critOn:20}),1/20);
 close(successChance({dc:2,modifier:5,critOn:20}),19/20);
 close(successChance({dc:30,modifier:0,critOn:19}),2/20);
 close(successChance({dc:12,modifier:4,critOn:20}),13/20);
});
test('advantage keeps the higher die, disadvantage the lower, and both cancel',()=>{
 close(successChance({dc:11,modifier:0,advantage:'Help'}),1-(10/20)**2);
 close(successChance({dc:11,modifier:0,disadvantage:'Guarded'}),(10/20)**2);
 close(successChance({dc:11,modifier:0,advantage:'Help',disadvantage:'Guarded'}),10/20);
 close(successChance({dc:30,modifier:0,critOn:20,advantage:'Aim'}),1-(19/20)**2);
 close(successChance({dc:25,modifier:0,advantage:'Evidence'}),0);
});
test('a bonus die averages over its faces outside the advantage formula',()=>{
 const each=[1,2,3,4].map(b=>(20-(12-b)+1)/20);
 close(successChance({dc:12,modifier:0,bonusDie:4}),each.reduce((a,b)=>a+b)/4);
 close(successChance({dc:12,modifier:0,bonusDie:4,advantage:'Help'}),each.map(p=>1-(1-p)**2).reduce((a,b)=>a+b)/4);
});
test('bands: Likely ≥ 70%, Risky 35–69%, Long shot < 35%',()=>{
 assert.equal(bandFor(100),'Likely');assert.equal(bandFor(70),'Likely');assert.equal(bandFor(69),'Risky');
 assert.equal(bandFor(35),'Risky');assert.equal(bandFor(34),'Long shot');assert.equal(bandFor(0),'Long shot');
});
test('the band follows the rounded figure the player sees',()=>{
 // p = .45 with advantage is 69.75%: shown as 70%, so it must read Likely, not "Risky (70%)".
 assert.deepEqual(oddsFor({dc:12,attribute:'insight',modifier:0,advantage:'Evidence'}),{percent:70,band:'Likely'});
 assert.deepEqual(oddsFor({dc:10,attribute:'insight',modifier:0}),{percent:55,band:'Risky'});
 assert.deepEqual(oddsFor({dc:16,attribute:'presence',modifier:0}),{percent:25,band:'Long shot'});
});
test('without a public modifier there are no odds, only the DC',()=>{
 assert.equal(oddsFor({dc:13,attribute:'agility'}),null);
 assert.equal(oddsFor(undefined),null);
 assert.equal(oddsFor({dc:13,attribute:'agility',modifier:0})?.percent,40);
});
test('signed modifiers print a true minus sign',()=>{assert.equal(signed(3),'+3');assert.equal(signed(-1),'−1');assert.equal(signed(0),'+0');});
test('the breakdown lists ability, proficiency, help and advantage',()=>{
 assert.deepEqual(checkBreakdown({dc:9,attribute:'might',modifier:4,parts:[{label:'Might',value:3},{label:'Proficiency',value:1}],advantage:'Evidence',dcHelp:3}),['Might +3','Proficiency +1','Help: DC −3','Advantage: Evidence']);
 assert.deepEqual(checkBreakdown({dc:13,attribute:'attack',modifier:1,parts:[{label:'Strength',value:-1},{label:'Proficiency',value:2}],bonusDie:4,advantage:'Help',disadvantage:'Guarded',critOn:20}),['Strength −1','Proficiency +2','Bless +1d4','Advantage: Help','Disadvantage: Guarded','They cancel out']);
 assert.deepEqual(checkBreakdown({dc:13,attribute:'agility'}),[]);
});
