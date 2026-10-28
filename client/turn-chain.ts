import type {PublicSave} from '../shared/types.js';
type TurnView=Pick<PublicSave,'mode'|'turn'|'activeReaction'|'actions'>;
/** "Let X act" commits one decision at a time (move, attack, end). Steps beyond the first per click, so a runaway turn still stops. */
export const TURN_CHAIN_LIMIT=8;
/**
 * Curated pacing (#96): after a committed `tactical:auto`, keep letting the same automatic actor act while its turn continues.
 * Stop once combat ends, a reaction needs an answer, or the turn passes to anyone else (a player-controlled actor or the next creature).
 */
export function continuesTurn(before:TurnView,after:TurnView){
 const actor=before.turn?.actorId;
 return !!actor&&after.mode==='combat'&&!after.activeReaction&&after.turn?.actorId===actor&&after.actions.some(a=>a.id==='tactical:auto'&&a.actorId===actor);
}
