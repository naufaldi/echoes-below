import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,type Save} from '../server/game.js';
import {CAMPAIGN_CONSEQUENCES} from '../server/campaign-consequences.js';
import {CURATED_ENCOUNTERS} from '../server/encounters.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {EXPEDITION} from '../shared/campaign.js';
const win=(n:number)=>n===20?20:1,lose=()=>1;
const echo=()=>createSave({name:'Closer QA',classId:'guardian',backgroundId:'envoy',appearanceId:'moon'});
const tactical=()=>createSave({name:'Closer QA',classId:'guardian',backgroundId:'envoy',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
const action=(s:Save,id:string)=>legalActions(s).find(a=>a.id===id);
const has=(s:Save,id:string)=>!!action(s,id);
const warns=(s:Save,id:string,pattern:RegExp)=>{const a=action(s,id);assert.ok(a,`${id} should be legal`);assert.equal(a.dangerous,true,`${id} should be flagged`);assert.match(a.description,pattern,`${id}: ${a.description}`);};
const quiet=(s:Save,id:string)=>{const a=action(s,id);assert.ok(a,`${id} should be legal`);assert.doesNotMatch(a.description,/closes:/i,`${id}: ${a.description}`);};
const at=(s:Save,scene:Save['sceneId'])=>{s.sceneId=scene;return s;};

test('#13: resting at camp in Echo Rules spends the ration Scrit needs, so it must say so',()=>{
 let s=echo();warns(s,'rest',/Closes: .*ration to Scrit.*seal negotiation with Vark/);
 s=applyAction(s,'rest',win);assert.equal(s.party.reduce((n,a)=>n+a.rations,0),0);
 s=applyAction(applyAction(s,'enter',win),'ledge',win);assert.equal(s.sceneId,'cookfire');
 assert.ok(!has(s,'offer'),'the warning describes a real closure');
});
test('#13: a tactical long rest at the opening camp warns without claiming the ward inquiry is lost',()=>{
 let s=tactical();warns(s,'camp:long',/Closes: .*ration to Scrit/);assert.doesNotMatch(action(s,'camp:long')!.description,/negotiation/);
 s=applyAction(s,'camp:long',win);s=at(s,'cookfire');assert.ok(!has(s,'offer'));
 s=applyAction(s,'scrit-talk',win);for(const q of ['supplies','captive','ward'])s=applyAction(s,`scrit:${q}`,win);assert.equal(s.flags.sealKnowledge,true);
});
test('resting stays quiet when a ration would remain for Scrit or Scrit is already fed',()=>{
 const spare=echo();spare.party[0].rations=2;quiet(spare,'rest');assert.ok(!action(spare,'rest')!.dangerous);
 const long=tactical();long.party[0].rations=4;quiet(long,'camp:long');
 const after=at(tactical(),'aftermath');quiet(after,'camp:long');
});
test('Echo cookfire: force, persuasion and distraction all warn that Scrit cannot be fed afterwards',()=>{
 const s=at(echo(),'cookfire');s.flags.tracks=true;
 for(const id of ['fight','persuade','distract'])warns(s,id,/[Cc]loses: .*ration to Scrit.*seal negotiation with Vark/);
 for(const id of ['persuade','distract']){const next=applyAction(s,id,win);assert.equal(next.flags.passage,true);assert.ok(!has(next,'offer'),id);}
 const fed=applyAction(s,'offer',win);assert.ok(!has(fed,'fight'));
});
test('tactical cookfire: fighting and distracting warn, while persuasion keeps Scrit available',()=>{
 const s=at(tactical(),'cookfire');s.flags.tracks=true;
 warns(s,'fight',/Closes: .*Scrit/);warns(s,'distract',/closes: .*Scrit/);quiet(s,'persuade');
 const slipped=applyAction(s,'distract',win);assert.ok(!has(slipped,'offer')&&!has(slipped,'scrit-talk'));
 const persuaded=applyAction(s,'persuade',win);assert.ok(has(persuaded,'offer')&&has(persuaded,'scrit-talk'));
});
test('tactical: leaving the cookfire with Scrit unfed warns; Echo has nothing left to close',()=>{
 const passage=at(tactical(),'cookfire');passage.flags.tracks=true;const p=applyAction(passage,'persuade',win);
 warns(p,'prison',/Closes: .*ration to Scrit/);assert.ok(!has(applyAction(p,'prison',win),'offer'));
 quiet(applyAction(at(tactical(),'cookfire'),'offer',win),'prison');
 const e=at(echo(),'cookfire');e.flags.tracks=true;quiet(applyAction(e,'persuade',win),'prison');
});
test('prison: leaving the courier behind warns that Vark cannot be negotiated with',()=>{
 for(const make of [echo,tactical]){
  const s=at(make(),'prison');s.flags.sealKnowledge=true;warns(s,'bell',/Closes: .*negotiat/);
  const left=applyAction(s,'bell',win);assert.ok(!has(left,'negotiate'));
  const rescued=applyAction(s,'force',win);quiet(rescued,'bell');assert.ok(has(applyAction(rescued,'bell',win),'negotiate'));
 }
});
test('bell: fighting or using the maintenance entrance warns only while negotiation is open',()=>{
 for(const make of [echo,tactical]){
  const s=at(make(),'bell');s.flags.rescued=true;s.flags.sealKnowledge=true;s.flags.maintenance=true;
  assert.ok(has(s,'negotiate'));warns(s,'fight',/Closes: .*negotiat/);warns(s,'maintenance',/Closes: .*negotiat/);
  const closed=at(make(),'bell');closed.flags.maintenance=true;quiet(closed,'fight');quiet(closed,'maintenance');
 }
});
test('aftermath: securing the seal warns when Scrit could guard it, without naming endings',()=>{
 for(const make of [echo,tactical]){
  const fed=at(make(),'aftermath');fed.flags.fed=true;warns(fed,'secure',/Closes: .*Scrit/);assert.doesNotMatch(action(fed,'secure')!.description,/Promise|Keepers/);
  const done=applyAction(fed,'secure',win);assert.ok(!has(done,'entrust'));
  quiet(at(make(),'aftermath'),'secure');
 }
});
test('campaign rooms: each choice names the later help it gives up',()=>{
 let checked=0;
 for(const make of [echo,tactical])for(const link of CAMPAIGN_CONSEQUENCES){
  const s=at(make(),link.source),other=`exp_choice:${1-link.choice}`,target=EXPEDITION.find(r=>r.id===link.target)!;
  s.flags[`${link.source}:defendersDefeated`]=true;
  const a=action(s,other);if(!a)continue;
  assert.equal(a.dangerous,true,`${link.id}`);assert.match(a.description,new RegExp(`Closes: .*${link.name}.*${target.title}`,'i'),`${link.id}: ${a.description}`);checked++;
 }
 assert.ok(checked>=CAMPAIGN_CONSEQUENCES.length*2-2,`checked ${checked}`);
});
test('campaign rooms: deciding with unused help warns that the help leaves',()=>{
 const link=CAMPAIGN_CONSEQUENCES[0];const s=at(echo(),link.target);s.flags[`${link.source}:choice:${link.choice}`]=true;
 assert.ok(has(s,'exp_ally:'+link.id));warns(s,'exp_choice:1',new RegExp(`Closes: .*${link.name}`,'i'));
 const used=applyAction(s,'exp_ally:'+link.id,win);assert.doesNotMatch(action(used,'exp_choice:1')!.description,new RegExp(link.name,'i'));
});
test('campaign rooms: the one-attempt check says failure closes it, and how to reopen it',()=>{
 const e=at(echo(),'archive-1');warns(e,'exp_choice:0',/Closes: .*defeat the defenders/);
 const failed=applyAction(e,'exp_choice:0',lose);assert.ok(!has(failed,'exp_choice:0'));assert.ok(has(failed,'exp_fight'));
 const room=EXPEDITION.find(r=>!CURATED_ENCOUNTERS[r.id]&&!['archive-2','archive-3','archive-4'].includes(r.id))!;
 const t=at(tactical(),room.id);warns(t,'exp_choice:0',/Closes: this option/);assert.doesNotMatch(action(t,'exp_choice:0')!.description,/defeat the defenders/);
});

const gain=(s:Save,id:string,dice=win)=>{const before=s.xp??0;const next=applyAction(s,id,dice);return {next,xp:(next.xp??0)-before};};
test('fair rewards: a peaceful success earns the same encounter XP that a won fight grants',()=>{
 const room=EXPEDITION[0];
 const peaceful=gain(at(echo(),room.id),'exp_choice:0');
 const fallback=gain(at(echo(),room.id),'exp_choice:1');
 assert.equal(fallback.xp,room.xp+35,'choice 1 is unchanged');
 assert.equal(peaceful.xp,room.xp+35+100,'room XP, the decision fact and the 100 XP a fight win grants');
 assert.equal(peaceful.next.flags[`xp:resolution:${room.id}`],true);
});
test('fair rewards: a won fight keeps its existing total and never stacks the peaceful award',()=>{
 const room=EXPEDITION[0];let s=at(echo(),room.id);
 s=applyAction(s,'exp_choice:0',lose);s=applyAction(s,'exp_fight',win);
 s.enemies.forEach(e=>{e.hp=1;});s.party.forEach(a=>{a.hp=999;a.maxHp=999;});
 for(let i=0;i<200&&s.mode==='combat';i++){const attack=legalActions(s).find(a=>a.kind==='attack')??legalActions(s).find(a=>a.id==='end_turn')!;s=applyAction(s,attack.id,win);}
 assert.equal(s.mode,'explore');assert.equal(s.flags[`xp:encounter:${room.id}`],true);
 const after=gain(s,'exp_choice:0');assert.equal(after.xp,room.xp+35);assert.ok(!after.next.flags[`xp:resolution:${room.id}`]);
});
test('fair rewards: tactical rooms award the peaceful bonus only where a fight is offered',()=>{
 const fightRoom=EXPEDITION.find(r=>CURATED_ENCOUNTERS[r.id]&&!['archive-2','archive-3','archive-4'].includes(r.id))!;
 const quietRoom=EXPEDITION.find(r=>!CURATED_ENCOUNTERS[r.id]&&!['archive-2','archive-3','archive-4'].includes(r.id))!;
 assert.equal(gain(at(tactical(),fightRoom.id),'exp_choice:0').xp,fightRoom.xp+35+100);
 assert.equal(gain(at(tactical(),quietRoom.id),'exp_choice:0').xp,quietRoom.xp+35);
});
test('save compatibility: a pre-change save that already won the fight loads and gets no extra award',()=>{
 for(const make of [echo,tactical]){
  const room=EXPEDITION.find(r=>CURATED_ENCOUNTERS[r.id]&&!['archive-2','archive-3','archive-4'].includes(r.id))!;
  const old=at(make(),room.id);old.flags[`${room.id}:defendersDefeated`]=true;old.flags[`xp:encounter:${room.id}`]=true;
  const loaded=JSON.parse(JSON.stringify(old)) as Save;
  const after=gain(loaded,'exp_choice:0');assert.equal(after.xp,room.xp+35);assert.equal(after.next.flags[`${room.id}:resolved`],true);
 }
});
