import type {ActionOption} from '../shared/types.js';
/** Branch closers end their description with "Closes: …" or a conditional "Success closes: …" (server/game.ts `closes`). Keep that clause verbatim so the condition stays visible. */
export function splitCloses(description:string):{text:string;closes?:string}{
 const at=description.search(/(?:^|(?<=[.!?])\s+)[^.!?]*\bcloses:/i);
 return at<0?{text:description}:{text:description.slice(0,at).trim(),closes:description.slice(at).trim()};
}
/** Routine checks get a light confirmation; risky or branch-closing actions keep the strong centered modal. */
export const strongConfirmation=(a:ActionOption)=>!!a.dangerous||splitCloses(a.description).closes!==undefined;
