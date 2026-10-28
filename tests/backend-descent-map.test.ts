import {test} from 'node:test';
import assert from 'node:assert/strict';
import {descentMap,roomSettled,CHAPTER_ONE,FORK_LINE} from '../client/descent-map.js';
import {CAMPAIGN_MAP} from '../shared/campaign-map.js';
import {ROOM_FORKS} from '../server/playstyle.js';
import {EXPEDITION} from '../shared/campaign.js';
const rooms=(sceneId:string,settled=false)=>descentMap(sceneId,settled).flatMap(d=>d.rooms);
const state=(sceneId:string,id:string,settled=false)=>rooms(sceneId,settled).find(r=>r.id===id)!;

test('the map draws six depths in order with every public room',()=>{
 const map=descentMap('market-3');
 assert.deepEqual(map.map(d=>d.numeral),['I','II','III','IV','V','VI']);
 assert.deepEqual(map.map(d=>d.rooms.length),[6,8,8,8,8,8]);
 assert.deepEqual(map.flatMap(d=>d.rooms.map(r=>r.id)),[...CHAPTER_ONE.map(r=>r.id),...CAMPAIGN_MAP.map(r=>r.id)]);
 assert.deepEqual(map.map(d=>d.state),['past','past','current','ahead','ahead','ahead']);
 assert.equal(map[2].label,'Chapter III, The Ash Market');
});
test('rooms before the current one are cleared and on the path; the rest of the chapter is ahead; later chapters are unlit',()=>{
 const all=rooms('market-3'),at=all.findIndex(r=>r.id==='market-3');
 assert.ok(all.slice(0,at).every(r=>r.state==='cleared'&&r.path&&!r.settled));
 assert.equal(all[at].state,'current');assert.equal(all[at].path,true);
 assert.deepEqual(all.slice(at+1).filter(r=>r.id.startsWith('market')).map(r=>r.state),['ahead','ahead','ahead','ahead','ahead']);
 assert.ok(all.filter(r=>/^(roots|choir|depth)/.test(r.id)).every(r=>r.state==='unlit'&&!r.path&&r.title===null));
 assert.equal(all.filter(r=>r.state==='current').length,1);
});
test('the strip already names this chapter, so ahead rooms keep their titles while unlit rooms stay unnamed',()=>{
 assert.equal(state('market-3','market-7').title,'The Council of Three');
 assert.equal(state('market-3','roots-1').title,null);
 assert.equal(state('market-3','roots-1').label,'Chapter IV, room 1 of 8, not yet reached');
 assert.equal(state('market-3','market-3').label,'The Bone Auction, room 3 of 8, you are here');
 assert.equal(state('market-3','archive-2').label,'The Ink Garden, room 2 of 8, behind you');
});
test('Chapter I opens with every later chapter unlit',()=>{
 const map=descentMap('approach');
 assert.equal(map[0].name,'The Bell Beneath Briarwatch');assert.equal(map[0].state,'current');
 assert.deepEqual(map[0].rooms.map(r=>r.state),['current','ahead','ahead','ahead','ahead','ahead']);
 assert.ok(map.slice(1).every(d=>d.state==='ahead'&&d.rooms.every(r=>r.state==='unlit')));
});
test('a settled room stays current but is marked done; the finished campaign clears the whole path',()=>{
 assert.equal(state('archive-4','archive-4',true).settled,true);
 assert.match(state('archive-4','archive-4',true).label,/you are here, your choice made$/);
 const end=rooms('depth-8',true);
 assert.ok(end.every(r=>r.path)&&end.at(-1)!.state==='current'&&end.at(-1)!.settled);
 assert.equal(roomSettled({mode:'complete',actions:[]}),true);
 assert.equal(roomSettled({mode:'explore',actions:[{id:'exp_next'}]}),true);
 assert.equal(roomSettled({mode:'explore',actions:[{id:'exp_choice:0'}]}),false);
});
test('an unknown scene puts no one anywhere on the map',()=>{
 assert.ok(rooms('nowhere').every(r=>!r.path&&r.state!=='current'));
});
test('exactly the server fork rooms are marked, in every state, with the fork line only',()=>{
 for(const at of ['approach','archive-1','market-5','depth-8']){
  const forks=rooms(at).filter(r=>r.fork).map(r=>r.id);
  assert.deepEqual(forks,ROOM_FORKS.map(f=>f.room));
  for(const r of rooms(at).filter(r=>r.fork))assert.ok(r.label.endsWith('. '+FORK_LINE));
 }
});
test('no fork variant or room description reaches the map, from any room',()=>{
 const variant=ROOM_FORKS.flatMap(f=>Object.values(f.variants).flatMap(v=>[v!.description,...v!.choice,...v!.outcomes,v!.ally?.name,v!.ally?.description])).filter((s):s is string=>!!s);
 const authored=EXPEDITION.flatMap(r=>[r.description,...r.choice,...r.outcomes]);
 for(const at of [...CHAPTER_ONE.map(r=>r.id),...CAMPAIGN_MAP.map(r=>r.id)])for(const settled of [false,true]){
  const json=JSON.stringify(descentMap(at,settled));
  for(const text of [...variant,...authored])assert.ok(!json.includes(text),`${at} leaks “${text.slice(0,40)}…”`);
  assert.doesNotMatch(json,/\b(mercy|force|ally|wary|mira|oren)\b/i);
 }
});
