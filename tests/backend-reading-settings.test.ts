import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_READING,LEGACY_AUTO_ADVANCE_KEY,READING_KEY,loadReading,pageBudget,parseReading,readingPause,saveReading} from '../client/reading-settings.js';
import {GUIDE_KEY,guideDue,guideSeen,markGuideSeen,oddsSample} from '../client/guide.js';
import {PAGE_CHARS,readingDelay} from '../client/story-pages.js';
import {createSave,publicSave} from '../server/game.js';
import {panelRows,bestChoice,oddsWho} from '../client/action-focus.js';
import type {PublicSave} from '../shared/types.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';

/** A Storage stand-in; `blocked` throws on every call, like a browser with storage turned off. */
function store(items:Record<string,string>={},blocked=false){
 const guard=()=>{if(blocked)throw new Error('SecurityError');};
 return {items,getItem:(k:string)=>{guard();return items[k]??null;},setItem:(k:string,v:string)=>{guard();items[k]=v;},removeItem:(k:string)=>{guard();delete items[k];}};
}

test('#68: a new browser reads at normal speed and size, with auto-advance off',()=>{
 assert.deepEqual(loadReading(store()),DEFAULT_READING);
 assert.deepEqual(DEFAULT_READING,{speed:'normal',autoAdvance:false,pause:'normal',size:'normal'});
});
test('#68: settings persist per browser and come back field by field',()=>{
 const s=store();saveReading(s,{speed:'fast',autoAdvance:true,pause:'long',size:'larger'});
 assert.deepEqual(loadReading(s),{speed:'fast',autoAdvance:true,pause:'long',size:'larger'});
 assert.deepEqual(parseReading(JSON.stringify({speed:'warp',autoAdvance:'yes',pause:'long',size:2})),{...DEFAULT_READING,pause:'long'},'unknown values fall back one by one');
 assert.deepEqual(parseReading('{not json'),DEFAULT_READING);
});
test('#68: the old auto-advance key moves into the new record once, and is removed',()=>{
 const s=store({[LEGACY_AUTO_ADVANCE_KEY]:'on'});
 assert.equal(loadReading(s).autoAdvance,true);
 assert.equal(s.items[LEGACY_AUTO_ADVANCE_KEY],undefined);
 assert.equal(JSON.parse(s.items[READING_KEY]!).autoAdvance,true);
 assert.equal(loadReading(store({[LEGACY_AUTO_ADVANCE_KEY]:'off'})).autoAdvance,false);
 // A record already written wins over a stale old key.
 const both=store({[READING_KEY]:JSON.stringify({...DEFAULT_READING,autoAdvance:false}),[LEGACY_AUTO_ADVANCE_KEY]:'on'});
 assert.equal(loadReading(both).autoAdvance,false);assert.equal(both.items[LEGACY_AUTO_ADVANCE_KEY],undefined);
});
test('#68: blocked storage gives the defaults and never throws',()=>{
 assert.deepEqual(loadReading(store({},true)),DEFAULT_READING);
 assert.doesNotThrow(()=>saveReading(store({},true),{...DEFAULT_READING,size:'large'}));
});
test('#68: larger text holds fewer letters a page; the pause scales, normal keeps its old timing',()=>{
 assert.equal(pageBudget('normal',PAGE_CHARS),PAGE_CHARS);
 assert.ok(pageBudget('large',PAGE_CHARS)<PAGE_CHARS&&pageBudget('larger',PAGE_CHARS)<pageBudget('large',PAGE_CHARS));
 const text='x'.repeat(100);
 assert.equal(readingDelay(text),Math.max(1800,900+100*45),'normal is the pre-#68 delay');
 assert.ok(readingPause(text,'short')<readingDelay(text)&&readingDelay(text)<readingPause(text,'long'));
});

const fresh={revision:0,mode:'explore',scene:{id:'approach'}};
const due=(save:typeof fresh|null,o:Partial<{seen:boolean;chapterPage:boolean;busy:boolean}>={})=>guideDue(save,{seen:false,chapterPage:false,busy:false,...o});
test('#68: the guide is due on a new adventure, after the Chapter I title page',()=>{
 assert.equal(due(fresh),true);
 assert.equal(due(fresh,{chapterPage:true}),false,'the title page comes first');
 assert.equal(due(fresh,{busy:true}),false);
 assert.equal(due(fresh,{seen:true}),false);
 assert.equal(due({...fresh,revision:3}),false,'a resumed adventure never brings it back');
 assert.equal(due({...fresh,scene:{id:'hall'}}),false);
 assert.equal(due(null),false);
});
test('#68: a brand-new adventure is due the guide in both rule sets',()=>{
 for(const rulesVersion of [undefined,CURATED_RULES_VERSION])assert.equal(guideDue(publicSave(createSave({name:'Aria',classId:'adept',backgroundId:'envoy',appearanceId:'moon',...(rulesVersion?{rulesVersion}:{})})),{seen:false,chapterPage:false,busy:false}),true,rulesVersion??'echo');
});
test('#68: the guide shows once per browser, or once per visit when storage is blocked',()=>{
 const s=store(),memory={seen:false};
 assert.equal(guideSeen(s,memory),false);markGuideSeen(s,memory);
 assert.equal(guideSeen(s,{seen:false}),true,'a later visit remembers it');assert.equal(s.items[GUIDE_KEY],'seen');
 const blocked=store({},true),visit={seen:false};
 assert.equal(guideSeen(blocked,visit),false);markGuideSeen(blocked,visit);
 assert.equal(guideSeen(blocked,visit),true,'the rest of this visit');assert.equal(guideSeen(blocked,{seen:false}),false,'a new visit shows it again');
});

for(const rulesVersion of [undefined,CURATED_RULES_VERSION])test(`#119: the guide sample matches the first odds row (${rulesVersion??'echo'})`,()=>{
 const save=publicSave(createSave({name:'Alden',classId:'adept',backgroundId:'envoy',appearanceId:'moon',...(rulesVersion?{rulesVersion}:{})})),sample=oddsSample(save,''),row=panelRows(save,'').ordered.find(r=>bestChoice(r,save.party));
 assert.ok(sample);assert.ok(row);const best=bestChoice(row,save.party);assert.ok(best);
 assert.equal(sample.who,oddsWho(row,save.party,best));assert.deepEqual(sample.odds,best.odds);
 const check=row.kind==='single'?row.action.check:row.check;assert.ok(check);assert.ok(sample.label.startsWith(check.attribute[0]!.toUpperCase()+check.attribute.slice(1)));
});
test('#119: an attack sample names defense without a party member',()=>{
 const save={mode:'combat',actions:[{id:'attack:guard',kind:'attack',label:'Attack Guard',check:{attribute:'attack',dc:11,modifier:4}}],party:[{id:'hero',name:'Alden'}]} as unknown as PublicSave,sample=oddsSample(save,'');
 assert.ok(sample);assert.equal(sample.who,'');assert.equal(sample.label,'Defense 11');
});
test('#119: no adventure or no odds rows leaves a generic guide sample',()=>{
 assert.equal(oddsSample(null,''),null);assert.equal(oddsSample({actions:[],party:[],mode:'explore'} as unknown as PublicSave,''),null);
});
test('#113: a finished chapter keeps the action panel empty',()=>{
 const save=publicSave(createSave({name:'Alden',classId:'adept',backgroundId:'envoy',appearanceId:'moon'}));
 assert.ok(panelRows(save,'').ordered.length>0);assert.deepEqual(panelRows({...save,mode:'complete'},'').ordered,[]);
});
