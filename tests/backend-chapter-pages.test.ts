import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyAction,createSave,legalActions,publicSave,type Save} from '../server/game.js';
import {previewSave} from '../server/dev-preview.js';
import {runProfile} from '../scripts/playstyle-profiles.js';
import {CHAPTER_PAGES} from '../shared/chapter-pages.js';
import {CURATED_RULES_VERSION} from '../shared/curated-rules.js';
import {dueChapterPage,markPageSeen,pageId,recapRows,seenPages,FIRST_ROOMS} from '../client/chapter-flow.js';

// #66 Which chapter page shows next: a title page once per chapter per save, a recap where it appeared and after playback, Chapter I's card, Chapter VI's recap before the ending.
const certain=(sides:number)=>sides;
const view=(s:Save)=>publicSave(s);
const act=(s:Save,id:string)=>{assert.ok(legalActions(s).some(a=>a.id===id),`${id} is offered in ${s.sceneId}`);return applyAction(s,id,certain);};
/** Chapter I without combat, as server/dev-preview.ts plays it, stopping in the aftermath. */
function chapterOne(){let s=createSave({name:'Sela',classId:'adept',backgroundId:'envoy',appearanceId:'moon'});for(const id of ['enter','ledge','offer','prison','unlock','ledger','bell','negotiate','secure'])s=act(s,id);return s;}

test('each chapter opens in one first room, and Chapter I opens in the approach',()=>{
 assert.deepEqual(FIRST_ROOMS,{approach:1,'archive-1':2,'market-1':3,'roots-1':4,'choir-1':5,'depth-1':6});
 assert.deepEqual(CHAPTER_PAGES.map(p=>p.chapter),[1,2,3,4,5,6]);
});

test('a new save opens on the Chapter I title page, once, and not during playback',()=>{
 const s=view(createSave({name:'Sela',classId:'adept',backgroundId:'envoy',appearanceId:'moon'}));
 assert.equal(s.scene.id,'approach');
 assert.deepEqual(dueChapterPage(s,[],false),{kind:'title',chapter:1});
 assert.equal(dueChapterPage(s,[],true),null,'waits for playback');
 assert.equal(dueChapterPage(s,['title:1'],false),null,'once per save');
 const later=view(act(createSave({name:'Sela',classId:'adept',backgroundId:'envoy',appearanceId:'moon'}),'enter'));
 assert.notEqual(later.scene.id,'approach');
 assert.equal(dueChapterPage(later,[],false),null,'a later room never shows a title page');
});

test('Chapter I closes on its card after the closing passage, every time, then Chapter II opens on its title page',()=>{
 const done=chapterOne(),end=view(done);
 assert.equal(end.mode,'complete');assert.equal(end.scene.id,'aftermath');
 assert.deepEqual(end.chapterRecaps?.map(r=>r.chapter),[1]);
 assert.deepEqual(dueChapterPage(end,[],false),{kind:'recap',chapter:1});
 assert.equal(dueChapterPage(end,[],true),null,'waits for the last page of the closing passage (#96)');
 assert.deepEqual(dueChapterPage(end,['recap:1','title:1'],false),{kind:'recap',chapter:1},'the card is the only way on, so it is never dismissed');
 const two=view(act(done,'continue_campaign'));
 assert.equal(two.scene.id,'archive-1');
 assert.deepEqual(dueChapterPage(two,['title:1'],false),{kind:'title',chapter:2},'no second Chapter I recap: the card was it');
 assert.equal(dueChapterPage(two,['title:1','title:2'],false),null);
});

test('entering Chapter III shows the Chapter II recap, then the title page, then the room',()=>{
 const s=view(previewSave('market-1','echo'));
 assert.deepEqual(s.chapterRecaps?.map(r=>r.chapter),[1,2],'the preview route carries the recaps of the chapters it played');
 assert.equal(dueChapterPage(s,[],true),null,'waits for playback');
 assert.deepEqual(dueChapterPage(s,[],false),{kind:'recap',chapter:2});
 assert.deepEqual(dueChapterPage(s,['recap:2'],false),{kind:'title',chapter:3});
 assert.equal(dueChapterPage(s,['recap:2','title:3'],false),null);
});

test('a save resumed mid-chapter never replays an old recap or title page',()=>{
 for(const room of ['archive-3','market-4','roots-8','depth-5'])assert.equal(dueChapterPage(view(previewSave(room,'echo')),[],false),null,room);
 const fallen={...view(previewSave('roots-1','echo')),mode:'defeat'};
 assert.equal(dueChapterPage(fallen,[],false),null,'a fallen party sees no chapter page');
});

for(const rules of ['echo-v1',CURATED_RULES_VERSION] as const)test(`a full diplomatic ${rules} run shows each title and recap once, in order`,()=>{
 // The client's loop: at each settled save, show what is due and dismiss it, except Chapter I's card, which the player leaves by acting.
 const shown:string[]=[];let seen:string[]=[],saveId='';
 runProfile('diplomatic',rules,'guardian',s=>{
  if(s.id!==saveId){saveId=s.id;seen=[];}
  for(let page=dueChapterPage(view(s),seen,false);page;page=dueChapterPage(view(s),seen,false)){
   if(shown.at(-1)!==pageId(page))shown.push(pageId(page));
   if(page.kind==='recap'&&page.chapter===1)break;
   seen=[...seen,pageId(page)];
  }
 });
 // The profile reports saves after each action, so the opening title page (tested above) is already behind it.
 assert.deepEqual(shown,['recap:1','title:2','recap:2','title:3','recap:3','title:4','recap:4','title:5','recap:5','title:6','recap:6']);
});

test('Chapter VI shows its recap once before the ending page',()=>{
 let s=previewSave('depth-8','echo');
 for(const id of ['exp_choice:1','exp_next'])s=act(s,id);
 const end=view(s);
 assert.equal(end.mode,'complete');assert.ok(end.recap,'the ending page has its recap');
 assert.deepEqual(dueChapterPage(end,[],true),null,'waits for the closing passage');
 assert.deepEqual(dueChapterPage(end,[],false),{kind:'recap',chapter:6});
 assert.equal(dueChapterPage(end,['recap:6'],false),null,'then the ending page');
 assert.equal(dueChapterPage({...end,chapterRecaps:undefined},[],false),null,'an older save without recaps goes straight to the ending');
});

test('dismissed pages are kept per save, and for the session when storage is unreachable',()=>{
 const data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
 markPageSeen(store,'save-a',{kind:'title',chapter:1});markPageSeen(store,'save-a',{kind:'recap',chapter:2});
 assert.deepEqual(seenPages(store,'save-a').sort(),['recap:2','title:1']);
 assert.deepEqual(JSON.parse(data.get('echoes-chapter-pages:save-a')!).sort(),['recap:2','title:1']);
 assert.deepEqual(seenPages(store,'save-b'),[],'another save starts fresh');
 data.set('echoes-chapter-pages:save-c','{not json');
 assert.deepEqual(seenPages(store,'save-c'),[],'an unreadable entry shows the pages again');
 const blocked={getItem:()=>{throw Error('SecurityError');},setItem:()=>{throw Error('SecurityError');}};
 markPageSeen(blocked,'save-d',{kind:'title',chapter:3});
 assert.deepEqual(seenPages(blocked,'save-d'),['title:3'],'once per session without storage');
 assert.deepEqual(seenPages(null,'save-d'),['title:3']);
});

test('recap rows keep numbers in their tags and words in their lines',()=>{
 const rows=(mira:number,oren:number,mercy=0,force=0)=>recapRows({trustDelta:{mira,oren},mercy,force,xp:350});
 assert.deepEqual(rows(2,1,1,0),[
  {key:'trust',tag:'Trust · Mira +2 · Oren +1',line:'Mira and Oren both trust you more.'},
  {key:'stance',tag:'Mercy 1 · Force 0',line:'You chose talk over steel.'},
  {key:'xp',tag:'Experience · +350 XP',line:'The party is stronger for every step of it.'},
 ]);
 assert.equal(rows(0,0)[0]!.line,'Mira and Oren hold their trust steady.');
 assert.equal(rows(1,0)[0]!.line,'Mira trusts you more. Oren’s trust holds steady.');
 assert.equal(rows(-1,2)[0]!.tag,'Trust · Mira −1 · Oren +2');
 assert.deepEqual(rows(0,0).map(r=>r.key),['trust','xp'],'no stance row when no fight was won or avoided');
 assert.equal(rows(0,0,0,2)[1]!.line,'You let steel decide.');
 assert.equal(rows(0,0,1,1)[1]!.line,'Talk and steel, in equal measure.');
 for(const r of [...rows(2,-1,3,1),...rows(0,0,1,1)])assert.doesNotMatch(r.line,/\d|engine|saved|presentation/i,r.line);
});
