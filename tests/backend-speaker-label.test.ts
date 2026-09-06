import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,log} from '../server/game.js';
import {speakerLabel} from '../shared/speaker-label.js';
test('journal snapshots preserve canonical speaker names after enemies leave the scene',()=>{
 const s=createSave({name:'Hero name',classId:'guardian',backgroundId:'delver',appearanceId:'ember'});
 s.enemies=['sentry-1','sentry-2'].map(id=>({...s.party[0],id,name:'Goblin sentry',side:'enemy',classId:'goblin'}));log(s,'A guard moves.','sentry-1');const entry=s.logs.at(-1)!;assert.equal(entry.speakerName,'Goblin sentry 1');s.enemies=[];assert.equal(speakerLabel(entry,s.party,s.enemies),'Goblin sentry 1');
});
test('old logs retain readable names without exposing technical IDs',()=>{
 assert.equal(speakerLabel({speaker:'sentry-1',source:'rules'},[]),'Goblin sentry');assert.equal(speakerLabel({speaker:'foe-internal-88',source:'rules'},[]),'Creature');assert.equal(speakerLabel({speaker:'Elian, the ferry clerk',source:'authored'},[]),'Elian, the ferry clerk');
});
