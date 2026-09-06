import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {revealedScene} from '../client/playback-scene.js';
test('final exploration outcome reveals committed mechanism state, earlier frames retain their room',()=>{
 let s=createSave({name:'Scene QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});s.sceneId='archive-4';
 for(const step of ['inspect','brace'])s=applyAction(s,'infirmary:'+step,()=>1);
 const before=publicSave(s),after=publicSave(applyAction(s,'infirmary:drain',()=>1)),frame=after.presentation!.at(-1)!;
 assert.equal(revealedScene(before,after,frame,false).infirmary?.drained,false);
 assert.equal(revealedScene(before,after,frame,true).infirmary?.drained,true);
 assert.equal(revealedScene(before,after,{...frame,mode:'combat'},true).infirmary?.drained,false);
});
