import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,publicSave,legalActions} from '../server/game.js';
import {narrationFor,SessionBoundary,automaticVoiceAllowed} from '../client/session.js';
import * as session from '../client/session.js';
const make=()=>createSave({name:'Ash',classId:'guardian',backgroundId:'delver',appearanceId:'ember'});
const dice=(sides:number)=>sides===20?15:Math.ceil(sides/2);
test('authored speaker heading belongs to the displayed narration rather than the last unrelated log',()=>{
 assert.equal(session.narrationSpeakerFor(publicSave(make())),null);
 const checkIn=applyAction(make(),'checkin:mira',dice);
 assert.equal(session.narrationSpeakerFor(publicSave(checkIn)),'Mira');
 const entered=applyAction(checkIn,'enter',dice);
 assert.equal(session.narrationSpeakerFor(publicSave(entered)),null);
});
test('creation and legacy first revision never hide the first action outcome',()=>{
 const fresh=make();assert.ok(fresh.logs.every(l=>l.revision===0));
 assert.equal(narrationFor(publicSave(fresh)),publicSave(fresh).scene.description);
 for(const legacy of [false,true]){
  const s=make();if(legacy)s.logs.forEach(l=>l.revision=1);
  const text=narrationFor(publicSave(applyAction(s,'rest',dice)));
  assert.match(text,/Everyone recovers/);assert.doesNotMatch(text,/My brother|promise I can keep/);
 }
});
test('Scrit conversation, ration response, distraction and scene entry show current outcomes',()=>{
 let s=applyAction(applyAction(make(),'enter',dice),'ledge',dice);
 assert.equal(narrationFor(publicSave(s)),publicSave(s).scene.description);
 s=applyAction(s,'scrit-talk',dice);assert.match(narrationFor(publicSave(s)),/Can you spare a ration/);
 assert.match(narrationFor(publicSave(applyAction(s,'offer',dice))),/Scrit takes the ration/);
 assert.match(narrationFor(publicSave(applyAction(s,'distract',dice))),/Mira knocks a pot/);
});
test('resolved prison gate survives serialization and leaves base content unchanged',()=>{
 let s=make();s.sceneId='prison';s.inventory.guardKey=true;
 assert.equal(publicSave(s).scene.entities.find(e=>e.id==='gate')?.open,undefined);
 s=applyAction(s,'unlock',dice);const view=publicSave(JSON.parse(JSON.stringify(s)));
 assert.equal(view.scene.entities.find(e=>e.id==='gate')?.open,true);
 assert.match(view.scene.entities.find(e=>e.id==='gate')!.name,/open gate/);
 assert.doesNotMatch(view.scene.description,/locked gate/);
 const fresh=make();fresh.sceneId='prison';assert.match(publicSave(fresh).scene.entities.find(e=>e.id==='gate')!.name,/locked gate/);
});
test('combat victory removes fled Scrit and guards from reloaded authoritative scene',()=>{
 let s=applyAction(applyAction(applyAction(make(),'enter',dice),'ledge',dice),'fight',dice);
 for(let n=0;s.mode==='combat'&&n<100;n++){
  const a=legalActions(s);const choice=a.find(x=>x.id.startsWith('attack:'))??a.find(x=>x.id.startsWith('move:')&&x.id!=='move:exit')??a.find(x=>x.id==='end_turn'||x.id==='continue');
  assert.ok(choice);s=applyAction(s,choice.id,dice);
 }
 assert.equal(s.mode,'explore');assert.equal(s.flags.guardsDefeated,true);
 for(const legacy of [false,true]){
  const reloaded=JSON.parse(JSON.stringify(s));if(legacy)delete reloaded.flags.guardsDefeated;
  assert.ok(publicSave(reloaded).scene.entities.every(e=>!['scrit','guards'].includes(e.id)));
 }
});
test('recording boundary releases resources and suppresses stale requests and replies',async()=>{
 const owner=new SessionBoundary();const generation=owner.capture();let released=0,calls=0,result='';
 owner.own(()=>released++);
 let resolve!:(s:string)=>void;const waiting=new Promise<string>(r=>resolve=r);
 const flight=owner.deliver(generation,()=>{calls++;return waiting;},s=>result=s);
 owner.invalidate();assert.equal(released,1);resolve('old A transcript');await flight;assert.equal(result,'');
 await owner.deliver(generation,async()=>{calls++;return 'stale';},s=>result=s);assert.equal(calls,1);
 await owner.deliver(owner.capture(),async()=>{calls++;return 'B transcript';},s=>result=s);assert.equal(result,'B transcript');
});
test('stopped recording delivers editable text independently of unrelated operation lock',async()=>{
 const owner=new SessionBoundary();let result='';
 await owner.deliver(owner.capture(),async()=>'editable transcript',s=>result=s);
 assert.equal(result,'editable transcript');
});
test('automatic voice honors latest mute and cancellation during pending dialogue',()=>{
 assert.equal(automaticVoiceAllowed(true,3,3),true);
 assert.equal(automaticVoiceAllowed(false,3,3),false);
 assert.equal(automaticVoiceAllowed(false,3,4),false);
 assert.equal(automaticVoiceAllowed(true,3,4),false);
});
