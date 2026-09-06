import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,publicSave} from '../server/game.js';
test('every rescue route updates courier identity and places the witness outside the cell after reload',()=>{
 for(const action of ['unlock','pick','force']){
  let s=createSave({name:'Rescue QA',classId:'scout',backgroundId:'delver',appearanceId:'moon'});
  s.sceneId='prison';s.inventory.guardKey=true;
  const initial=publicSave(s).scene.entities.find(e=>e.id==='courier')!;
  assert.equal(initial.name,'Captive courier');assert.deepEqual(initial.position,[0,3]);
  s=applyAction(s,action,n=>n);
  const saved=publicSave(JSON.parse(JSON.stringify(s)));
  const courier=saved.scene.entities.find(e=>e.id==='courier')!;
  assert.equal(courier.name,'Rescued courier');assert.equal(courier.id,initial.id);
  assert.deepEqual(courier.position,[-1.2,1]);assert.match(saved.scene.description,/stands free/);
  assert.equal(saved.scene.entities.find(e=>e.id==='gate')!.open,true);
 }
});
