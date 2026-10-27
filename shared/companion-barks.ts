import type {OutcomeCheck} from './types.js';

/**
 * Issue #67: short authored companion reactions. Client presentation only: barks read committed outcomes and never
 * change them, never roll and never call AI. Every line is ≤ 90 characters, holds no numbers and speaks to whoever the
 * moment is about ("you" is the hero or the other companion). Natural-roll lines fit an attack, a check or a save alike.
 */
export type Companion = 'mira'|'oren';
export type BarkMoment = 'fork'|'victory'|'down'|'natural20'|'natural1'|'heal';
/** Rooms whose description changes with how the party has played. Mirrors `ROOM_FORKS` in server/playstyle.ts; a test keeps them equal. */
export const FORK_ROOMS:readonly string[]=['archive-1','market-5','roots-4','choir-4','depth-2'];
/** An ordinary bark waits until this many beats have passed since the last bark. Fork entry and fight won ignore it. */
export const COOLDOWN_BEATS=3;
/** When one beat holds several moments, the first in this order speaks. */
export const BARK_PRIORITY:readonly BarkMoment[]=['fork','victory','down','natural20','natural1','heal'];
const BYPASS:ReadonlySet<BarkMoment>=new Set(['fork','victory']);

/** Fork lines fit every room and every variant of it: they name no person and promise nothing the room may withhold. */
export const BARKS:Record<Companion,Record<BarkMoment,readonly string[]>>={
 mira:{
  natural20:['Clean. I’d have told you to do it that way, if you’d asked.','Well. Someone’s been practising when I wasn’t looking.','Remember that one. You’ll want to tell it later.'],
  natural1:['I’ll pretend I didn’t see that. Mostly.','Not your finest moment. We’ll live.','Well. That could have gone worse. Not much worse.'],
  down:['Get up. I’m not mapping the rest of this alone.','Someone cover that gap before they notice it.','Hold on. I’ll make them pay for that.'],
  heal:['Better. Try not to spend it all at once.','There’s colour back in your face. Good.','Patched. Not pretty, but it’ll hold.'],
  fork:['Something here has been waiting for us. Look before you speak.','Our road caught up with us here. Watch what they expect of you.','Quiet. Whatever we did up above, this place remembers it.'],
  victory:['Done. Anyone bleeding, speak up before we move.','Quiet again. I was starting to miss it.','Nobody’s chasing us. Let’s keep it that way.'],
 },
 oren:{
  natural20:['That is how it’s done. Steady hands, clear head.','Good. Don’t let it make you careless.','Exactly right. Remember how that felt.'],
  natural1:['Breathe. One bad moment doesn’t make the day.','It happens to all of us. Stay behind me a moment.','Nothing that can’t be mended. Keep your guard up.'],
  down:['I see you. Stay still, I’m coming.','Hold on. Nobody gets left on this floor.','Keep breathing. I’ll stand over you until it’s done.'],
  heal:['There. Slow breaths. You’re still with us.','Take a moment. I’ll watch the front.','Good. Lean on me if you need to.'],
  fork:['Slow down. What we did before matters in this room.','Stay close. The choices we made above are waiting here.','Careful. This is where the road we chose shows itself.'],
  victory:['It’s over. Check your wounds before anything else.','Well fought. Now catch your breath.','Stand easy. You held when it counted.'],
 },
};

export interface BarkMember {id:string;hp:number;maxHp:number}
/** One playback beat, reduced to what barks read. `before`/`after` are party members only. */
export interface BarkBeat {
 /** Seed for the line: a log id, so a replay of the same beats shows the same lines. */
 key:string;
 /** Playback step this beat belongs to, or null when the turn has no playback and the bark shows on the settled room. */
 step:number|null;
 before:BarkMember[];
 after:BarkMember[];
 /** HP changes count only inside one room; an arrival that restores the party is not a heal. */
 sameRoom:boolean;
 checks:Pick<OutcomeCheck,'actorId'|'natural'|'sides'>[];
 /** Set when this beat brings the party into a fork room. */
 fork?:string;
 won?:boolean;
}
export interface BarkEvent {key:string;step:number|null;speaker:Companion;moment:BarkMoment;lineId:string;text:string}
export interface BarkState {beat:number;lastBarkBeat:number|null;lastSpeaker:Companion|null;lastLine:Partial<Record<Companion,string>>;forks:string[]}
export const INITIAL_BARK_STATE:BarkState={beat:0,lastBarkBeat:null,lastSpeaker:null,lastLine:{},forks:[]};
export type Trust=Record<Companion,number>;

const COMPANIONS:readonly Companion[]=['mira','oren'];
/** FNV-1a: a small stable string hash, so the same key always picks the same line. */
export function barkHash(key:string){let h=0x811c9dc5;for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,0x01000193);}return h>>>0;}

/** The moments one beat holds, highest priority first, with whom each is about (a companion never barks about itself). */
export function beatMoments(beat:BarkBeat):{moment:BarkMoment;subject?:string}[]{
 const found:{moment:BarkMoment;subject?:string}[]=[],party=new Set([...beat.before,...beat.after].map(a=>a.id));
 if(beat.fork&&FORK_ROOMS.includes(beat.fork))found.push({moment:'fork'});
 if(beat.won)found.push({moment:'victory'});
 if(beat.sameRoom)for(const a of beat.after){const old=beat.before.find(b=>b.id===a.id);if(!old)continue;
  if(old.hp>0&&a.hp<=0)found.push({moment:'down',subject:a.id});
  // A raised maximum (level-up, a bond) is growth, not a heal.
  else if(a.hp>old.hp&&a.maxHp===old.maxHp)found.push({moment:'heal',subject:a.id});
 }
 for(const c of beat.checks)if(c.sides===20&&party.has(c.actorId)&&(c.natural===20||c.natural===1))found.push({moment:c.natural===20?'natural20':'natural1',subject:c.actorId});
 return found.sort((x,y)=>BARK_PRIORITY.indexOf(x.moment)-BARK_PRIORITY.indexOf(y.moment));
}

/** Who answers: a standing companion in the party who is not the subject. Higher trust first; a tie alternates. */
export function barkSpeaker(beat:BarkBeat,subject:string|undefined,trust:Trust,last:Companion|null,seed:number):Companion|null{
 const able=COMPANIONS.filter(c=>c!==subject&&(beat.after.find(a=>a.id===c)?.hp??0)>0);
 if(able.length<2)return able[0]??null;
 if(trust.mira!==trust.oren)return trust.mira>trust.oren?'mira':'oren';
 return last?(last==='mira'?'oren':'mira'):COMPANIONS[seed%2]!;
}

/** Pure fold over beats: at most one bark per beat, the cooldown, no back-to-back line per companion and one bark per fork room. */
export function selectBarks(beats:readonly BarkBeat[],state:BarkState,trust:Trust):{barks:BarkEvent[];state:BarkState}{
 const barks:BarkEvent[]=[];let s=state;
 for(const beat of beats){
  const beatIndex=s.beat;s={...s,beat:beatIndex+1};
  const cooled=s.lastBarkBeat===null||beatIndex-s.lastBarkBeat>=COOLDOWN_BEATS;
  for(const {moment,subject} of beatMoments(beat)){
   if(moment==='fork'&&s.forks.includes(beat.fork!))continue;
   if(!BYPASS.has(moment)&&!cooled)continue;
   const seed=barkHash(`${beat.key}:${moment}`),speaker=barkSpeaker(beat,subject,trust,s.lastSpeaker,seed);if(!speaker)continue;
   const lines=BARKS[speaker][moment];let index=seed%lines.length;if(lines[index]===s.lastLine[speaker])index=(index+1)%lines.length;
   barks.push({key:beat.key,step:beat.step,speaker,moment,lineId:`${speaker}.${moment}.${index}`,text:lines[index]!});
   s={...s,lastBarkBeat:beatIndex,lastSpeaker:speaker,lastLine:{...s.lastLine,[speaker]:lines[index]},forks:moment==='fork'?[...s.forks,beat.fork!]:s.forks};
   break;
  }
 }
 return {barks,state:s};
}
