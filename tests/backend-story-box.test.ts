import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSave,applyAction,publicSave,legalActions,type Save} from '../server/game.js';
import {EXPEDITION} from '../shared/campaign.js';
import type {GameLog,OutcomeCheck} from '../shared/types.js';
import {PAGE_CHARS,checkTag,combatLines,paginate,splitText,storyLines,storyPages,tagText,type StoryLine} from '../client/story-pages.js';

const make=()=>createSave({name:'Aria',classId:'scout',backgroundId:'envoy',appearanceId:'moon',raceId:'elf'});
const view=(s:Save)=>publicSave(s);
const line=(text:string,extra:Partial<StoryLine>={}):StoryLine=>({key:text.slice(0,8),voice:'narrator',speakerId:null,name:null,text,tag:null,...extra});
/** An older save: the same logs before #56 added prose and check. */
const legacy=(s:Save)=>{const v=view(s);return {...v,logs:v.logs.map(({prose:_p,check:_c,...l})=>l as GameLog)};};

test('pagination keeps sentences whole, breaks an overlong sentence between words, and never exceeds the page',()=>{
 const sentence='The bell answers from somewhere below the stair.';
 const pages=splitText(Array(9).fill(sentence).join(' '));
 assert.ok(pages.length>1);for(const p of pages){assert.ok(p.length<=PAGE_CHARS,p);assert.ok(p.endsWith('stair.'),p);}
 assert.equal(pages.join(' '),Array(9).fill(sentence).join(' '));
 const long='word '.repeat(80).trim()+'.';const split=splitText(long,60);
 assert.ok(split.length>1&&split.every(p=>p.length<=60));assert.equal(split.join(' '),long);
 assert.deepEqual(splitText('Short. Two lines.'),['Short. Two lines.']);
 assert.deepEqual(splitText(''),[]);
});
test('pages group one speaker, put each tag on the page where its line ends, and give the read-aloud room its own page',()=>{
 const tag=[{text:'Insight'},{text:'12 vs DC 10'}];
 const pages=paginate([line('A cold room.'),line('Mira looks up.',{tag}),line('',{tag:[{text:'+35 XP'}]}),line('Stay close.',{voice:'character',speakerId:'mira',name:'Mira'})]);
 assert.equal(pages.length,2);
 assert.equal(pages[0]!.text,'A cold room. Mira looks up.');assert.deepEqual(pages[0]!.tags.map(tagText),['Insight · 12 vs DC 10','+35 XP']);
 assert.deepEqual({voice:pages[1]!.voice,name:pages[1]!.name,text:pages[1]!.text},{voice:'character',name:'Mira',text:'Stay close.'});
 // A checked outcome is its own page: what follows it does not run on into its prose.
 assert.deepEqual(paginate([line('The lock jams.',{tag}),line('The attempt costs you.')]).map(p=>[p.text,p.tags.length]),[['The lock jams.',1],['The attempt costs you.',0]]);
 const boxed=paginate([line('A cold room.'),line('Mira looks up.')],{readAloud:true});
 assert.deepEqual(boxed.map(p=>[p.text,!!p.readAloud]),[['A cold room.',true],['Mira looks up.',false]]);
 const longTagged=paginate([line('One sentence here. '.repeat(20).trim(),{tag})],{budget:80});
 assert.ok(longTagged.length>1);assert.deepEqual(longTagged.map(p=>p.tags.length),[...Array(longTagged.length-1).fill(0),1]);
});
test('Mira’s natural 20 reads as story with a separate tag, shown once (ROADMAP §2)',()=>{
 const s=make(),mira=s.party.find(a=>a.id==='mira')!,next=applyAction(s,'tracks:mira',n=>n===20?20:1);
 const pages=storyPages(view(next));
 assert.equal(pages.length,1);
 assert.equal(pages[0]!.text,'The tracks show captives were marched alive into the relay.');
 assert.equal(pages[0]!.voice,'narrator');
 assert.deepEqual(pages[0]!.tags.map(tagText),[`Mira · Insight · ${20+mira.attributes.insight} vs DC 10 · Natural 20 · +35 XP`]);
 assert.equal(pages[0]!.tags[0]!.find(p=>p.mark)?.mark,'high');
 assert.doesNotMatch(pages.map(p=>p.text).join(' '),/succeeded|vs DC|XP/);
});
test('the check prose and the clue line after it show once, and check.xp absorbs every XP line it sums',()=>{
 const room=EXPEDITION.find(r=>r.id==='market-3')!;const s=make();s.sceneId=room.id;
 const next=applyAction(s,'exp_choice:0',()=>20),logs=view(next).logs.filter(l=>l.revision===next.revision);
 const check=logs.find(l=>l.check)!;assert.ok(check.prose);assert.equal(logs[logs.indexOf(check)+1]!.text,check.prose,'#56 caveat: the next entry repeats the prose');
 assert.ok(logs.filter(l=>/^The party gains \d+ XP\.$/.test(l.text)).length>1);
 const lines=storyLines(logs,view(next));
 assert.equal(lines.filter(l=>l.text===check.prose).length,1);
 assert.ok(!lines.some(l=>/XP/.test(l.text)));assert.ok(!lines.some(l=>!l.text&&/XP/.test(tagText(l.tag!))),'every XP line is counted in the tag');
 assert.ok(tagText(lines[0]!.tag!).endsWith(`+${check.check!.xp} XP`));
 // Without a check, XP lines stay visible as tags rather than narrator text.
 const plain=storyLines([{id:'x',revision:1,speaker:'dm',source:'rules',text:'The party gains 35 XP.',rolls:[]}],view(next));
 assert.deepEqual(plain.map(l=>[l.text,tagText(l.tag!)]),[['','+35 XP']]);
});
test('old saves without prose or check fall back to text, with nothing dropped',()=>{
 const next=applyAction(make(),'tracks:mira',()=>20),old=legacy(next);
 const pages=storyPages(old),text=pages.map(p=>p.text).join(' ');
 assert.match(text,/^Mira: Read the tracks succeeded \(\d+ vs DC 10\)\. The tracks show captives were marched alive into the relay\.$/);
 assert.deepEqual(pages.flatMap(p=>p.tags).map(tagText),['+35 XP']);
});
test('a failed check keeps its prose and marks a natural 1; authored companion lines get a plate',()=>{
 const s=make();s.sceneId='prison';const next=applyAction(s,'pick',()=>1),[page]=storyPages(view(next));
 assert.equal(page!.text,'The lock jams. You can still break the gate.');
 assert.match(tagText(page!.tags[0]!),/^Aria · Agility · \d+ vs DC 13 · Natural 1$/);assert.equal(page!.tags[0]!.find(p=>p.mark)?.mark,'low');
 const talk=storyPages(view(applyAction(make(),'checkin:mira',()=>1)));
 assert.deepEqual([talk[0]!.voice,talk[0]!.speakerId,talk[0]!.name],['character','mira','Mira']);
});
test('entering a room opens with its description, marked for the read-aloud page only when asked',()=>{
 const entered=view(applyAction(make(),'enter',()=>10));
 assert.equal(storyPages(entered,{readAloud:true})[0]!.text.length>0&&storyPages(entered,{readAloud:true})[0]!.readAloud,true);
 assert.ok(storyPages(entered,{readAloud:true})[0]!.text.startsWith(entered.scene.description.slice(0,40)));
 assert.ok(!storyPages(entered).some(p=>p.readAloud));
 // A new adventure has no entries yet: its first room is still a first entry.
 const fresh=view(make()),opening=storyPages(fresh,{readAloud:true});assert.equal(opening.map(p=>p.text).join(' '),fresh.scene.description);assert.ok(opening.every(p=>p.readAloud));
 const talk=view(applyAction(make(),'checkin:mira',()=>1));assert.ok(!storyPages(talk,{readAloud:true}).some(p=>p.readAloud));
});
test('attack tags name the AC, the damage and a critical; combat lines carry the prose',()=>{
 const cast=view(make()),check:OutcomeCheck={kind:'attack',actorId:'mira',targetId:'x',skill:'attack',sides:20,natural:20,modifier:5,total:25,dc:13,success:true,critical:true};
 assert.equal(tagText(checkTag(check,[{sides:20,values:[20],kept:20,modifier:5,total:25,purpose:'Attack'} as never,{sides:8,values:[6],kept:6,modifier:3,total:9,purpose:'Damage'} as never],cast)),'Mira · Attack · 25 vs AC 13 · Critical · 9 damage');
 assert.equal(tagText(checkTag(check,[],cast,{named:false})),'Attack · 25 vs AC 13 · Critical');
 assert.equal(tagText(checkTag(check,[{sides:8,values:[6],kept:6,modifier:3,total:9,purpose:'Damage'} as never],cast,{named:false,short:true})),'Attack · 25 vs AC 13 · Critical · 9 dmg');
 let s=make();s.sceneId='cookfire';s=applyAction(s,'fight',()=>10);s.enemies.forEach(e=>{e.hp=e.maxHp=200;});s.party.forEach(a=>{a.hp=a.maxHp=200;});
 assert.equal(s.turn!.actorId,'hero');const target=s.enemies.find(e=>legalActions(s).some(a=>a.id===`attack:${e.id}`))!;
 s=applyAction(s,`attack:${target.id}`,()=>20);
 const lines=combatLines(view(s));
 assert.ok(lines.length<=2&&lines.length>0);
 const hit=lines.find(l=>l.text===`You land a blow on ${target.name}.`);assert.ok(hit,JSON.stringify(lines));
 // The hero's line opens "You", so the combat tag drops the name and keeps roll, target, the natural 20 and damage (#98).
 assert.match(tagText(hit!.tag!),new RegExp(`^Attack · \\d+ vs AC \\d+ · Critical · \\d+ dmg$`));
});
