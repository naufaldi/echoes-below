import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,legalActions,publicSave,checkPhrase,type Save} from '../server/game.js';
import {runProfile,type Profile,type Rules} from '../scripts/playstyle-profiles.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {COMPANION_STORIES} from '../shared/companion-stories.js';

/** #64 / ROADMAP §6: engine text the player reads (action labels and descriptions, the room, log lines, journal facts) never uses system words. */
const BANNED=/\b(engine|presentation|saved|server|AI charge|authored|recorded)\b/i;
const TICK=/\bticks?\b/i;
/** "A Insight check", or a lowercase skill after the article ("A agility check"). */
const ARTICLE=/\b[Aa] [AEIOUaeiou]\w* (check|save)\b|\b[Aa]n? (insight|agility|might|presence|arcana|athletics|perception|stealth|investigation) (check|save)\b/;
/** Story uses of the same words, allowed verbatim: a chapter name and three in-world sentences. */
const FICTION=['The Engine of Hunger','saved his boat','had saved for another rescue','recorded in a hurried hand'];

function scan(where:string,text:string,found:string[]){
 const story=FICTION.reduce((t,phrase)=>t.split(phrase).join(''),text);
 for(const [name,pattern] of [['system word',BANNED],['tick',TICK],['article',ARTICLE]] as const)if(pattern.test(story))found.push(`${where} (${name}): ${text}`);
}
function audit(profile:Profile,rules:Rules){
 const found:string[]=[],seen=new Set<string>();let levelUps=0;
 const look=(s:Save)=>{
  const view=publicSave(s);
  for(const a of view.actions){scan(`${s.sceneId} label ${a.id}`,a.label,found);scan(`${s.sceneId} description ${a.id}`,a.description,found);}
  for(const [field,text] of [['title',view.scene.title],['description',view.scene.description],['objective',view.scene.objective]] as const)if(text)scan(`${s.sceneId} ${field}`,text,found);
  for(const l of s.logs)if(!seen.has(l.id)){seen.add(l.id);scan(`${s.sceneId} log`,l.text,found);if(l.prose)scan(`${s.sceneId} prose`,l.prose,found);if(l.levelUp)levelUps++;}
  for(const f of s.facts){scan(`fact ${f.id}`,f.text,found);if(/\bthe hero\b/i.test(f.text))found.push(`fact ${f.id} (hero name): ${f.text}`);}
 };
 const run=runProfile(profile,rules,'guardian',look);
 return {found:[...new Set(found)],levelUps,run};
}
for(const rules of ['echo-v1',CURATED_RULES_VERSION] as const)for(const profile of ['diplomatic','aggressive'] as const)
 test(`#64: a full ${profile} ${rules} run shows no system words, ticks or article errors`,()=>{
  const {found,levelUps,run}=audit(profile,rules);
  assert.equal(run.mode,'complete');
  assert.deepEqual(found,[]);
  assert.ok(levelUps>0,'level-ups carry the structured levelUp field');
 });

const echo=()=>createSave({name:'Aria',classId:'guardian',backgroundId:'envoy',appearanceId:'moon'});
const tactical=()=>createSave({name:'Aria',classId:'guardian',backgroundId:'envoy',appearanceId:'moon',rulesVersion:CURATED_RULES_VERSION});
test('#64 U2: a check takes "an" before a vowel and a capitalised skill',()=>{
 assert.equal(checkPhrase('insight'),'An Insight check');assert.equal(checkPhrase('agility'),'An Agility check');
 assert.equal(checkPhrase('might'),'A Might check');assert.equal(checkPhrase('presence'),'A Presence check');
});
test('#64 G8: the opening camp names nobody the party has not met; the cookfire names Scrit',()=>{
 for(const [s,id] of [[echo(),'rest'],[tactical(),'camp:long']] as const){const a=legalActions(s).find(a=>a.id===id)!;assert.equal(a.dangerous,true);assert.match(a.description,/Closes: the last ration, which someone below may need\.$/);assert.doesNotMatch(a.description,/Scrit|Vark/);}
 const s=echo();s.sceneId='cookfire';s.flags.tracks=true;assert.match(legalActions(s).find(a=>a.id==='fight')!.description,/Closes: .*ration to Scrit.*seal negotiation with Vark/);
});
test('#64 U4: an Echo level-up is its own line with the gains, and the outcome before it stays clean',()=>{
 let s=echo();s.xp=290;s=applyAction(s,'tracks:hero',()=>20);
 const i=s.logs.findIndex(l=>l.levelUp);assert.ok(i>0);const l=s.logs[i]!;
 assert.deepEqual(l.levelUp,{level:2,maxHp:6,focus:1});assert.deepEqual(publicSave(s).logs.find(x=>x.id===l.id)?.levelUp,l.levelUp,'the client view keeps it');assert.equal(l.speaker,'dm');assert.match(l.text,/^Level 2!/);
 assert.ok(s.logs.slice(0,i).every(x=>!/Level 2/.test(x.text)&&!/Level 2/.test(x.prose??'')));
});
test('#64 U7: a companion memory in the journal uses the hero’s name; older facts are left as they were',()=>{
 for(const story of COMPANION_STORIES)for(const choice of [0,1] as const){
  let s=createSave({name:'Aria',classId:'cleric',raceId:'elf',backgroundId:'envoy',appearanceId:'moon'});s.relationships[story.speaker]=story.threshold;if(story.fact)s.facts.push({id:story.fact,text:'Witnessed event.'});
  s=applyAction(applyAction(s,`bond_begin:${story.id}`,()=>15),`bond_reply:${choice}`,()=>15);
  const fact=s.facts.find(f=>f.id===`bond:${story.id}`)!;assert.doesNotMatch(fact.text,/\bthe hero\b/i,fact.text);
  if(/\bthe hero\b/.test(story.memory[choice]))assert.match(fact.text,/Aria/);
 }
 const old=echo();old.facts.push({id:'bond:oren-promise',text:'Oren and the hero agree to admit limits honestly without using them as excuses.'});
 assert.equal(publicSave(old).facts.at(-1)!.text,'Oren and the hero agree to admit limits honestly without using them as excuses.');
});
