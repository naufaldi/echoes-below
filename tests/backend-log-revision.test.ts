import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,publicSave} from '../server/game.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {narrationFor,narrationSpeakerFor} from '../client/session.js';
test('quest completion belongs to the action that earned it, never the next conversation',()=>{
 let s=createSave({name:'Revision QA',classId:'guardian',backgroundId:'delver',appearanceId:'ember',rulesVersion:CURATED_RULES_VERSION});
 s=applyAction(s,'enter',()=>1);const previous=s;
 s=applyAction(s,'ledge',()=>1);
 const reward=s.logs.find(l=>l.text==='Quest complete: The road beneath Briarwatch.');assert.ok(reward);assert.equal(reward.revision,s.revision);
 const priorIds=new Set(previous.logs.map(l=>l.id));assert.ok(s.logs.filter(l=>!priorIds.has(l.id)).every(l=>l.revision===s.revision));
 const resumed=JSON.parse(JSON.stringify(s));const spoken=applyAction(resumed,'scrit-talk',()=>1);
 assert.doesNotMatch(narrationFor(publicSave(spoken)),/Quest complete/);
 assert.equal(narrationSpeakerFor(publicSave(spoken)),'Scrit');
 assert.deepEqual(s.logs.filter(l=>priorIds.has(l.id)),previous.logs);
});
