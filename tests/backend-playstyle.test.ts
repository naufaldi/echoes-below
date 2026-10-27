import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave,type Save} from '../server/game.js';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Storage} from '../server/storage.js';
import {CHOICE_TRUST,ENDINGS,ROOM_FORKS,playstyleLedger,roomFork,selectEnding} from '../server/playstyle.js';
import {EXPEDITION,expeditionRoom} from '../shared/campaign.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {runProfile,type ProfileRun} from '../scripts/playstyle-profiles.js';
const dice=(s:number)=>s===20?20:Math.ceil(s/2);
const newSave=()=>createSave({name:'Aria',classId:'cleric',backgroundId:'envoy',appearanceId:'moon',raceId:'elf'});
const at=(s:Save,id:string,flags:Record<string,boolean>)=>{Object.assign(s.flags,flags);s.sceneId=id as Save['sceneId'];s.mode='explore';return s;};

test('#15 archive-8 credits Scrit’s people only when Scrit was befriended',()=>{
 const decision=(flags:Record<string,boolean>,seal=true)=>{const s=at(newSave(),'archive-8',flags);s.inventory.seal=seal;return applyAction(s,'exp_choice:0',dice).facts.find(f=>f.id==='decision:archive-8')!.text;};
 assert.doesNotMatch(decision({passage:true,guardsDefeated:true}),/Scrit/,'Scrit fled after the cookfire fight');
 assert.doesNotMatch(decision({passage:true,guardsDistracted:true,negotiated:true}),/Scrit/,'Scrit was never befriended');
 assert.match(decision({passage:true,fed:true,negotiated:true},false),/Scrit’s people/,'Scrit guards the seal');
 assert.match(decision({passage:true,fed:true,negotiated:true}),/Scrit’s people/,'Scrit was fed but the party kept the seal');
});
const DIPLOMATIC={fed:true,passage:true,sealKnowledge:true,rescued:true,negotiated:true,'trust:scrit':true,'trust:rescue':true,'trust:vark':true};
const AGGRESSIVE={guardsDefeated:true,passage:true,rescued:true,alarm:true,'trust:rescue':true};
/** Resolves every room before `until` the way a playstyle would, using only flags Release 1 already wrote. */
const resolved=(until:string,style:'mercy'|'force',choice:0|1)=>Object.fromEntries(EXPEDITION.slice(0,EXPEDITION.findIndex(r=>r.id===until)).flatMap(r=>[[`${r.id}:resolved`,true],[`${r.id}:choice:${choice}`,true],...(style==='force'?[[`${r.id}:defendersDefeated`,true]]:[])]));

test('ledger reads Chapter I and earlier rooms only, from flags Release 1 already records',()=>{
 const kind=at(newSave(),'archive-1',DIPLOMATIC);kind.inventory.seal=false;
 assert.deepEqual(playstyleLedger(kind),{mercy:2,force:0,stance:'mercy',mira:0,oren:3,companion:'oren',scrit:'guardian'});
 const harsh=at(newSave(),'archive-1',AGGRESSIVE);harsh.inventory.seal=true;
 assert.deepEqual(playstyleLedger(harsh),{mercy:0,force:2,stance:'force',mira:0,oren:1,companion:'oren',scrit:'scattered'});
 const persuaded=at(newSave(),'archive-1',{passage:true,negotiated:true});assert.equal(playstyleLedger(persuaded).scrit,'stranger');assert.equal(playstyleLedger(persuaded).mercy,2);
 const kept=at(newSave(),'archive-1',DIPLOMATIC);kept.inventory.seal=true;assert.equal(playstyleLedger(kept).scrit,'friend');
 const later=at(newSave(),'choir-4',{...DIPLOMATIC,...resolved('choir-4','mercy',0),'choir-4:defendersDefeated':true,'choir-5:defendersDefeated':true});
 assert.equal(playstyleLedger(later,'choir-4').force,0,'the fork room and later rooms do not count');
 assert.equal(playstyleLedger(later).force,2);
 // Curated rooms without an authored fight cannot count as mercy: the party had no fight to decline.
 const curated=createSave({name:'Aria',classId:'cleric',backgroundId:'envoy',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
 Object.assign(curated.flags,{'archive-1:resolved':true,'archive-2:resolved':true});curated.sceneId='archive-3';
 assert.equal(playstyleLedger(curated,'archive-3').mercy,1);
});

test('each chapter fork selects its variant from the ledger and keeps it while the party is in the room',()=>{
 assert.deepEqual(ROOM_FORKS.map(f=>expeditionRoom(f.room)!.chapter),[2,3,4,5,6]);
 for(const fork of ROOM_FORKS){
  const kind=at(newSave(),fork.room,{...DIPLOMATIC,...resolved(fork.room,'mercy',0)});kind.inventory.seal=false;
  const harsh=at(newSave(),fork.room,{...AGGRESSIVE,...resolved(fork.room,'force',1)});harsh.inventory.seal=true;
  const a=roomFork(kind,fork.room)!,b=roomFork(harsh,fork.room)!;
  assert.notEqual(a.key,b.key,fork.room);
  const viewA=publicSave(kind),viewB=publicSave(harsh);
  assert.equal(viewA.scene.description,a.variant.description);assert.equal(viewB.scene.description,b.variant.description);assert.notEqual(viewA.scene.description,viewB.scene.description);
  const labels=(s:Save)=>legalActions(s).filter(o=>o.id.startsWith('exp_choice')).map(o=>o.label);
  assert.deepEqual(labels(kind),a.variant.choice);assert.notDeepEqual(labels(kind),labels(harsh));
  assert.equal(legalActions(kind).find(o=>o.id==='exp_choice:0')!.check!.dc,expeditionRoom(fork.room)!.dc+a.variant.dc);
  if(a.variant.ally)assert.ok(viewA.scene.entities.some(e=>e.name===a.variant.ally!.name));
  // Winning a fight inside the fork room must not flip which version of the room the party is standing in.
  kind.flags[`${fork.room}:defendersDefeated`]=true;assert.equal(roomFork(kind,fork.room)!.key,a.key);
  const done=applyAction(kind,'exp_choice:0',dice);assert.equal(done.facts.find(f=>f.id===`decision:${fork.room}`)!.text,a.variant.outcomes[0]);
  assert.equal(publicSave(done).scene.description,a.variant.description);
 }
});

test('ending comes from the whole run, while the final room still writes its closing',()=>{
 const finish=(flags:Record<string,boolean>,seal:boolean,heart:0|1,last:0|1)=>{const s=at(newSave(),'depth-8',{...flags,[`depth-7:choice:${heart}`]:true,'depth-8:resolved':true,[`depth-8:choice:${last}`]:true});s.inventory.seal=seal;return applyAction(s,'exp_next',dice);};
 const mercy={...DIPLOMATIC,...resolved('depth-8','mercy',0)},force={...AGGRESSIVE,...resolved('depth-8','force',1)};
 // Same Heart Below and First Morning decisions; only the earlier run differs.
 const kind=finish(mercy,false,0,0),harsh=finish(force,true,0,0);
 assert.equal(kind.mode,'complete');assert.equal(harsh.mode,'complete');
 assert.match(kind.ending!,/^The Open Relay\. /);assert.match(harsh.ending!,/^The Broken Chain\. /);
 assert.match(finish(force,true,1,0).ending!,/^The Iron Watch\. /);
 const {fed:_fed,...unfed}=mercy;assert.match(finish(unfed,true,0,0).ending!,/^The Long Way Home\. /);
 const last=EXPEDITION.at(-1)!;const home=finish(mercy,false,0,0).ending!,below=finish(mercy,false,0,1).ending!;
 assert.ok(home.endsWith(last.outcomes[0]));assert.ok(below.endsWith(last.outcomes[1]));assert.notEqual(home,below);
 assert.equal(new Set(Object.values(ENDINGS).map(e=>e.title)).size,4);
});

test('Release 1 saves load from storage, map into the ledger and continue to a computed ending',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'echoes-trackb-'));const storage=new Storage(join(dir,'save.sqlite'));
 try{
  // A Release 1 snapshot: no Track B fields, only the flags and inventory that release already wrote.
  const mid=at(newSave(),'archive-1',{...AGGRESSIVE});mid.inventory.seal=true;storage.put(mid);
  let s=storage.read(mid.id);assert.equal(playstyleLedger(s).stance,'force');
  assert.equal(publicSave(s).scene.description,roomFork(s,'archive-1')!.variant.description);
  s=applyAction(s,'exp_choice:1',dice);s=applyAction(s,'exp_next',dice);assert.equal(s.sceneId,'archive-2');
  const late=at(newSave(),'depth-8',{...DIPLOMATIC,...resolved('depth-8','mercy',0),'depth-8:resolved':true,'depth-8:choice:1':true});late.inventory.seal=false;storage.put(late);
  const ended=applyAction(storage.read(late.id),'exp_next',dice);assert.equal(ended.mode,'complete');assert.equal(selectEnding(ended).id,'open-relay');assert.match(ended.ending!,/^The Open Relay\. /);
  // A run already completed under Release 1 keeps the ending it was shown.
  const complete=at(newSave(),'depth-8',{...AGGRESSIVE,'depth-8:resolved':true,'depth-8:choice:0':true});complete.mode='complete';complete.ending=EXPEDITION.at(-1)!.outcomes[0];storage.put(complete);
  assert.equal(publicSave(storage.read(complete.id)).ending,EXPEDITION.at(-1)!.outcomes[0]);
 }finally{storage.close();await rm(dir,{recursive:true,force:true});}
});

/** A full profile run takes seconds, so the B-01/B-02 and #57 checks share one run per profile and rule set. */
const runs=new Map<string,ProfileRun>();
const profile=(p:Parameters<typeof runProfile>[0],rules:Parameters<typeof runProfile>[1])=>{const key=`${p}:${rules}`;if(!runs.has(key))runs.set(key,runProfile(p,rules));return runs.get(key)!;};
for(const rules of ['echo-v1',CURATED_RULES_VERSION] as const)test(`B-01/B-02 diplomatic and aggressive ${rules} runs reach different endings through different rooms`,()=>{
 const a:ProfileRun=profile('diplomatic',rules),b:ProfileRun=profile('aggressive',rules);
 for(const run of [a,b]){assert.equal(run.mode,'complete',`${run.profile} reaches the ending`);assert.ok(run.ending);}
 assert.notEqual(a.ending,b.ending);assert.notEqual(a.endingId,b.endingId);
 assert.equal(a.fights,0);assert.ok(b.fights>=20);
 for(const chapter of [2,3,4,5,6]){
  const fa=a.forks.find(f=>expeditionRoom(f.room)!.chapter===chapter)!,fb=b.forks.find(f=>expeditionRoom(f.room)!.chapter===chapter)!;
  assert.equal(fa.room,fb.room);assert.notEqual(fa.description,fb.description,`chapter ${chapter} description`);assert.notDeepEqual(fa.choices,fb.choices,`chapter ${chapter} options`);
 }
});

test('#57 room choices raise Mira or Oren trust by what the choice means, not by its index',()=>{
 assert.deepEqual(Object.keys(CHOICE_TRUST).sort(),EXPEDITION.map(r=>r.id).sort(),'every room is tagged');
 const after=(id:string,choice:0|1)=>{const l=playstyleLedger(at(newSave(),'depth-8',{[`${id}:resolved`]:true,[`${id}:choice:${choice}`]:true}));return {mira:l.mira,oren:l.oren};};
 assert.deepEqual(after('archive-2',0),{mira:1,oren:0},'sharing the lantern is mercy');
 assert.deepEqual(after('archive-6',1),{mira:0,oren:1},'Oren securing the line is protection');
 assert.deepEqual(after('market-1',0),{mira:0,oren:1},'sponsoring the refugees is protection, though it is the first option');
 assert.deepEqual(after('market-3',0),{mira:0,oren:1},'returning the fallen soldier’s shield is Oren’s duty');
 assert.deepEqual(after('market-7',1),{mira:1,oren:0},'restitution instead of a public accounting is mercy, though it is the second option');
 assert.deepEqual(after('archive-3',1),{mira:0,oren:0},'leaving the vigil intact earns neither');
 assert.deepEqual(after('roots-1',1),{mira:0,oren:0},'cutting the irrigation line earns neither');
 // Index-only counting would send Mira in here: every earlier pick is a first option, but each one protects or keeps a duty.
 const guarded=at(newSave(),'roots-4',Object.fromEntries(['archive-4','market-1','market-3','market-7','roots-3'].flatMap(id=>[[`${id}:resolved`,true],[`${id}:choice:0`,true]])));
 assert.deepEqual([playstyleLedger(guarded,'roots-4').mira,playstyleLedger(guarded,'roots-4').oren],[0,5]);
 assert.equal(roomFork(guarded,'roots-4')!.key,'oren');
});

for(const rules of ['echo-v1',CURATED_RULES_VERSION] as const)test(`#57 diplomatic and aggressive ${rules} runs earn different companions and reach roots-4 with them`,()=>{
 const a=profile('diplomatic',rules),b=profile('aggressive',rules);
 assert.equal(a.finalLedger.companion,'mira');assert.equal(b.finalLedger.companion,'oren');
 assert.ok(a.finalLedger.mira>b.finalLedger.mira,'the diplomatic run earns more of Mira’s trust');assert.ok(b.finalLedger.oren>a.finalLedger.oren,'the aggressive run earns more of Oren’s trust');
 const roots=(run:ProfileRun)=>run.forks.find(f=>f.room==='roots-4')!;
 assert.equal(roots(a).variant,'mira');assert.equal(roots(b).variant,'oren');assert.notEqual(roots(a).description,roots(b).description);
});

test('#57 Release 1 saves standing at roots-4 load and meet the same companion they did before',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'echoes-trust-'));const storage=new Storage(join(dir,'save.sqlite'));
 try{
  // Release 1 shape: Chapter I flags and room choice flags only, with no trust written for any room.
  const kind=at(newSave(),'roots-4',{...DIPLOMATIC,...resolved('roots-4','mercy',0)});kind.inventory.seal=false;storage.put(kind);
  const harsh=at(newSave(),'roots-4',{...AGGRESSIVE,...resolved('roots-4','force',1)});harsh.inventory.seal=true;storage.put(harsh);
  for(const [save,companion] of [[kind,'mira'],[harsh,'oren']] as const){
   const s=storage.read(save.id),before=JSON.stringify(s);
   assert.equal(roomFork(s,'roots-4')!.key,companion);assert.equal(publicSave(s).scene.description,roomFork(s,'roots-4')!.variant.description);
   assert.equal(JSON.stringify(s),before,'reading trust writes nothing to the save');
   const done=applyAction(s,'exp_choice:0',dice);assert.equal(done.facts.find(f=>f.id==='decision:roots-4')!.text,roomFork(s,'roots-4')!.variant.outcomes[0]);
  }
 }finally{storage.close();await rm(dir,{recursive:true,force:true});}
});
