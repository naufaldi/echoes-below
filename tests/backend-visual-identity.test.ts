import {test} from 'node:test';
import assert from 'node:assert/strict';
import {actorDisplayName,characterAsset} from '../shared/visual-identity.js';
test('duplicate enemies retain stable labels when initiative order changes',()=>{
 const a={id:'e-a',name:'Bound skeleton',side:'enemy' as const};const b={...a,id:'e-b'};
 assert.equal(actorDisplayName(a,[b,a]),'Bound skeleton 1');assert.equal(actorDisplayName(b,[a,b]),'Bound skeleton 2');
 assert.equal(actorDisplayName({...a,side:'party'},[a,b]),'Bound skeleton');
});
test('explicit visual identity is independent from rules class and legacy actors retain their model',()=>{
 assert.equal(characterAsset({classId:'guardian'}),'/assets/kaykit/Knight.glb');
 assert.equal(characterAsset({classId:'cleric'}),'/assets/kaykit/Knight.glb');
 assert.equal(characterAsset({classId:'guardian',assetId:'mage'}),'/assets/kaykit/Mage.glb');
});
