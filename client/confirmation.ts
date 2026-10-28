import type {ActionOption} from '../shared/types.js';
/** Branch closers end their description with "Closes: …" or a conditional "Success closes: …" (server/game.ts `closes`). Keep that clause verbatim so the condition stays visible. */
export function splitCloses(description:string):{text:string;closes?:string}{
 const at=description.search(/(?:^|(?<=[.!?])\s+)[^.!?]*\bcloses:/i);
 return at<0?{text:description}:{text:description.slice(0,at).trim(),closes:description.slice(at).trim()};
}
/** Routine checks get a light confirmation; risky or branch-closing actions keep the strong centered modal. */
export const strongConfirmation=(a:ActionOption)=>!!a.dangerous||splitCloses(a.description).closes!==undefined;
/**
 * Authored `interact` actions that only read, ask or answer: check-ins, companion conversations, the Counterweight plate and its controls,
 * and the puzzle rooms' inspect and question steps. The engine offers the Counterweight controls only after the plate is read, so their order is known.
 * Every other `interact` (a story choice, an ally's help, a puzzle step that commits) keeps its card.
 */
const READS=/^(checkin:|bond_(begin|reply):|exp_talk$|counterweight:(read|pawl|weight|pin|reset)$|scrit:(supplies|captive|ward)$|courier:|parley:(prisoner|ward|evidence)$|infirmary:(inspect|signal)$|ink:(inspect|ask)$|index:read$|side:[^:]+:investigate$)/;
/**
 * Free actions commit without a card (#62, #96): no dice, nothing spent, no branch closed. A check, a danger flag or a `closes` clause always vetoes.
 * Searches and reads (`inspect` without a check) and questions (`talk`) are free by kind; `interact` only for the authored ids above.
 */
export function freeAction(a:Pick<ActionOption,'id'|'kind'|'description'|'check'|'dangerous'>){
 if(a.check||a.dangerous||splitCloses(a.description).closes!==undefined)return false;
 return a.kind==='inspect'||a.kind==='talk'||a.kind==='interact'&&READS.test(a.id);
}
export type Confirmation='none'|'light'|'strong';
export function confirmationFor(a:ActionOption):Confirmation{return freeAction(a)?'none':strongConfirmation(a)?'strong':'light';}
