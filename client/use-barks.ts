import {useEffect,useMemo,useRef} from 'react';
import {INITIAL_BARK_STATE,selectBarks,type BarkEvent,type BarkState} from '../shared/companion-barks.js';
import type {PublicSave} from '../shared/types.js';
import {barkBeats} from './bark-beats.js';

/**
 * Companion barks for one committed turn (`before` → `after`), for the story box to show at each playback step
 * (`step: null` once playback ends). Rate-limit state carries across turns and resets when another save is loaded.
 * Selection reads the state committed by the previous turn, so a repeated render picks the same lines.
 * Call it for every committed transition (the save before the action, the adopted save after it), not only turns with
 * playback: entering a fork room records no frame. The in-between saves TurnPlayback shows through `onFrame` are not turns.
 */
export function useBarks(before:PublicSave|null,after:PublicSave|null):BarkEvent[]{
 const committed=useRef<{saveId:string|null;state:BarkState}>({saveId:null,state:INITIAL_BARK_STATE});
 const key=before&&after?`${after.id}:${before.revision}:${after.revision}`:null;
 const result=useMemo(()=>{if(!before||!after)return null;const from=committed.current.saveId===after.id?committed.current.state:INITIAL_BARK_STATE;return {saveId:after.id,...selectBarks(barkBeats(before,after),from,after.relationships)};},[key]);// eslint-disable-line react-hooks/exhaustive-deps -- the key names the turn
 useEffect(()=>{if(result)committed.current={saveId:result.saveId,state:result.state};},[result]);
 return result?.barks??[];
}
