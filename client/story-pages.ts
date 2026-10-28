import type {Actor,GameLog,OutcomeCheck,PublicSave,Roll} from '../shared/types.js';
import {speakerLabel} from '../shared/speaker-label.js';
import {narrationEntries} from './session.js';

/**
 * Issue #60: the story box's page model, kept pure so it can be tested. Three voices (ROADMAP D3): the narrator speaks
 * rules outcomes and DM lines without a plate; a character (an authored or AI line from anyone but the DM) gets a plate;
 * a check becomes narrator prose plus a mechanics tag. Older saves without `prose`/`check` fall back to `text`.
 */
/** Typewriter speed. Faster than reading speed (about 20–25 characters a second), so the reveal never holds a reader back. */
export const TYPEWRITER_CPS=40;
/** Characters per page: three lines of 18px Garamond in the narrowest box (1100px window). Longer passages page. */
export const PAGE_CHARS=200;
/** Auto-advance waits for a reading pause: about 22 characters a second, never under 1.8s. */
export const readingDelay=(text:string)=>Math.max(1800,900+text.length*45);

export type Voice='narrator'|'character';
/** `xp` marks a tag that is only an XP amount, so two on one page sum (#64 U4). */
export interface TagPart {text:string;mark?:'high'|'low';xp?:number}
export interface StoryLine {key:string;voice:Voice;speakerId:string|null;name:string|null;text:string;tag:TagPart[]|null}
export interface StoryPage {key:string;voice:Voice;speakerId:string|null;name:string|null;text:string;tags:TagPart[][];readAloud?:true}
type Cast=Pick<PublicSave,'party'|'enemies'>;

const cap=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
/**
 * The one string match in the story box (#60, #64): XP log lines carry no structured amount. A checked outcome's tag uses
 * `check.xp`, which the engine sums over the action's XP lines, so this only identifies those lines to absorb them, and
 * reads the amount where no check counts it (encounter XP, older saves).
 */
const XP_LINE=/^The party gains (\d+) XP\.$/;
const xpTag=(n:number):TagPart[]=>[{text:`+${n} XP`,xp:n}];
/** `LEVEL 2 · +6 MAX HP · +1 FOCUS`. Curated gains vary by class, so its level-up names the level only. */
export const levelTag=(up:NonNullable<GameLog['levelUp']>):TagPart[]=>[{text:`Level ${up.level}`},...(up.maxHp?[{text:`+${up.maxHp} max HP`}]:[]),...(up.focus?[{text:`+${up.focus} focus`}]:[])];
/** A character line opening with its own speaker's name ("Mira: My brother…") under a plate that already says "Mira" (#64 U1). */
const unprefixed=(text:string,name:string)=>{for(const p of [`${name}:`,`${name} :`])if(text.startsWith(p))return text.slice(p.length).trimStart();return null;};

/** `MIRA · INSIGHT · 22 vs DC 10 · NATURAL 20 · +35 XP` as parts, so the natural roll can be marked. Public numbers only. `named:false` drops the name when a plate already shows who rolled. */
export function checkTag(check:OutcomeCheck,rolls:Roll[],cast:Cast,{named=true}:{named?:boolean}={}):TagPart[]{
 const parts:TagPart[]=[...(named?[{text:speakerLabel({speaker:check.actorId,source:'rules'},cast.party,cast.enemies)}]:[]),{text:check.kind==='attack'?'Attack':check.kind==='save'?`${cap(check.skill)} save`:cap(check.skill)}];
 parts.push({text:`${check.total} vs ${check.kind==='attack'?'AC':'DC'} ${check.dc}`});
 if(check.sides===20&&check.natural===20)parts.push({text:check.critical?'Critical':'Natural 20',mark:'high'});
 else if(check.sides===20&&check.natural===1)parts.push({text:'Natural 1',mark:'low'});
 if(check.advantage)parts.push({text:'Advantage'});if(check.disadvantage)parts.push({text:'Disadvantage'});
 const damage=rolls.find(r=>/damage/i.test(r.purpose));if(damage&&check.success)parts.push({text:`${damage.total} damage`});
 if(check.xp)parts.push({text:`+${check.xp} XP`});
 return parts;
}
export const tagText=(tag:TagPart[])=>tag.map(p=>p.text).join(' · ');

/**
 * Logs as story lines, in order. A check shows its prose with a tag; the entry right after it that repeats the prose
 * word for word (the clue or authored line, #56) is shown once. XP lines that `check.xp` already counts are absorbed;
 * any others become a `+N XP` tag. A level-up becomes a tag rather than prose (#64 U4). A character line drops a
 * leading `Name:` its plate already shows, and an unscripted DM line that opens with a party member's name is theirs (#64 U1).
 * `rollTags` (the backlog) keeps the level-up's sentence and also tags rolls that decided no check, such as damage.
 */
export function storyLines(logs:readonly GameLog[],cast:Cast,{rollTags=false}:{rollTags?:boolean}={}):StoryLine[]{
 const lines:StoryLine[]=[];let xpBudget=0;
 for(let i=0;i<logs.length;i++){
  const l=logs[i]!;
  if(l.check){
   lines.push({key:l.id,voice:'narrator',speakerId:null,name:null,text:l.prose??l.text,tag:checkTag(l.check,l.rolls,cast)});
   xpBudget=l.check.xp??0;
   if(l.prose&&logs[i+1]?.text===l.prose)i++;
   continue;
  }
  const xp=l.speaker==='dm'&&l.source==='rules'?XP_LINE.exec(l.text):null;
  if(xp){const n=Number(xp[1]);if(n<=xpBudget){xpBudget-=n;continue;}lines.push({key:l.id,voice:'narrator',speakerId:null,name:null,text:'',tag:xpTag(n)});continue;}
  if(l.levelUp&&!rollTags){lines.push({key:l.id,voice:'narrator',speakerId:null,name:null,text:'',tag:levelTag(l.levelUp)});continue;}
  const text=l.prose??l.text,tag=rollTags&&l.rolls.length?l.rolls.map(r=>({text:`${cap(r.purpose)} · ${r.total}`})):null;
  const voiced=l.speaker==='dm'&&l.source!=='rules'?cast.party.map(a=>({a,name:speakerLabel({speaker:a.id,source:'rules'},cast.party,cast.enemies)})).find(p=>unprefixed(text,p.name)!==null):undefined;
  if(voiced){lines.push({key:l.id,voice:'character',speakerId:voiced.a.id,name:voiced.name,text:unprefixed(text,voiced.name)!,tag});continue;}
  const character=l.speaker!=='dm'&&l.source!=='rules',name=character?speakerLabel(l,cast.party,cast.enemies):null;
  lines.push({key:l.id,voice:character?'character':'narrator',speakerId:character?l.speaker:null,name,text:name?unprefixed(text,name)??text:text,tag});
 }
 return lines;
}

/** Sentences, each kept whole when it fits; a sentence longer than a page breaks between words. */
export function splitText(text:string,budget=PAGE_CHARS):string[]{
 const sentences=text.match(/[^.!?…]+(?:[.!?…]+["”’)\]]*|$)\s*/g)?.map(s=>s.trim()).filter(Boolean)??[];
 const pages:string[]=[];let page='';
 const put=(piece:string)=>{if(!page){page=piece;return;}if(page.length+1+piece.length<=budget)page+=' '+piece;else{pages.push(page);page=piece;}};
 for(const s of sentences){
  if(s.length<=budget){put(s);continue;}
  for(const word of s.split(/\s+/))put(word);
 }
 if(page)pages.push(page);
 return pages;
}

/**
 * Lines as pages. Consecutive lines in the same voice and speaker share pages, except that a checked outcome ends its
 * passage, so the next line starts a page of its own. A tag sits on the page where its line ends, and a tag-only line joins the page before it.
 * Two XP-only tags on one page sum to one (`+125 XP`, #64 U4). `readAloud` keeps the first line (the room description) on its own
 * pages, marked for the boxed read-aloud treatment.
 */
export function paginate(lines:readonly StoryLine[],{budget=PAGE_CHARS,readAloud=false}:{budget?:number;readAloud?:boolean}={}):StoryPage[]{
 type Passage={first:StoryLine;readAloud:boolean;closed:boolean;parts:{text:string;tag:TagPart[]|null}[]};
 const passages:Passage[]=[];
 lines.forEach((line,i)=>{
  const last=passages.at(-1);
  if(!line.text&&line.tag&&last){last.parts.push({text:'',tag:line.tag});return;}
  const boxed=readAloud&&i===0;
  if(last&&!boxed&&!last.readAloud&&!last.closed&&last.first.voice===line.voice&&last.first.speakerId===line.speakerId){last.parts.push({text:line.text,tag:line.tag});last.closed=!!line.tag;}
  else passages.push({first:line,readAloud:boxed,closed:!!line.tag,parts:[{text:line.text,tag:line.tag}]});
 });
 const pages:StoryPage[]=[];
 for(const p of passages){
  const own:StoryPage[]=[];const page=()=>own.at(-1)!;
  const open=(text:string)=>own.push({key:`${p.first.key}:${own.length}`,voice:p.first.voice,speakerId:p.first.speakerId,name:p.first.name,text,tags:[],...(p.readAloud?{readAloud:true as const}:{})});
  for(const part of p.parts){
   for(const chunk of splitText(part.text,budget)){if(own.length&&page().text.length+1+chunk.length<=budget)page().text+=' '+chunk;else open(chunk);}
   if(part.tag){if(!own.length)open('');addTag(page().tags,part.tag);}
  }
  pages.push(...own);
 }
 return pages;
}

/** Adds a tag to a page; an XP-only tag folds into one already there, past any level tag between them. */
function addTag(tags:TagPart[][],tag:TagPart[]){
 const n=tag.length===1?tag[0]!.xp:undefined,i=n?tags.findIndex(t=>t.length===1&&t[0]!.xp):-1;
 if(n&&i>=0)tags[i]=xpTag(tags[i]![0]!.xp!+n);else tags.push(tag);
}
/** The current revision's pages, as the settled story box shows them. The first entry in a room is its description. */
export function storyPages(save:PublicSave,{readAloud=false,budget=PAGE_CHARS}:{readAloud?:boolean;budget?:number}={}):StoryPage[]{
 // With nothing to show (a new adventure, or a revision of absorbed lines only) the room's description stands in, so there is always a page.
 const lines=storyLines(narrationEntries(save),save);if(!lines.length)lines.push({key:`${save.scene.id}:description`,voice:'narrator',speakerId:null,name:null,text:save.scene.description,tag:null});
 return paginate(lines,{budget,readAloud:readAloud&&opensWithDescription(save)});
}
/** True when this revision brought the party into the room: its entries open with the room description, or (a new adventure) the description is all there is. */
export function opensWithDescription(save:PublicSave){const entries=narrationEntries(save),first=entries[0];return !first||first.speaker==='dm'&&first.text===save.scene.description;}

/** Combat (#29): only the newest events, one line each, with the actor's name leading when the line opens with it. */
export function combatLines(save:PublicSave,count=2){
 return storyLines(narrationEntries(save),save).filter(l=>l.text).slice(-count).map(l=>{
  const actor=[...save.party,...save.enemies].find(a=>l.text.startsWith(speakerLabel({speaker:a.id,source:'rules'},save.party,save.enemies)));
  const lead=actor?speakerLabel({speaker:actor.id,source:'rules'},save.party,save.enemies):null;
  return {...l,lead,enemy:!!actor&&actor.side!=='party'};
 });
}
/** Whose plate a speaker gets: a party member's palette, the enemy colour, or the chapter accent for anyone else. */
export function plateColour(speakerId:string,cast:Cast):{palette?:Actor['appearanceId'];enemy?:true}{
 const ally=cast.party.find(a=>a.id===speakerId);if(ally)return {palette:ally.appearanceId};
 return cast.enemies.some(a=>a.id===speakerId)?{enemy:true}:{};
}
