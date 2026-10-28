import {formatPlaytime,type usePlaytest} from './use-playtest';

// #68 Developer figures move out of the player's Settings: they show only with `?debug` in the address, or under the Vite dev server.
export function debugView(search=typeof location==='undefined'?'':location.search){return new URLSearchParams(search).has('debug')||!!import.meta.env?.DEV;}

/** AI spend, frame time and the playtest timer, for playtests. Its wording is for developers, so the copy scan skips this file. */
export default function DebugPanel({usage,hosted,personal,frameTime,playtest,hasSave}:{usage:number;hosted:boolean;personal:boolean;frameTime:number;playtest:ReturnType<typeof usePlaytest>;hasSave:boolean}){
 if(!debugView())return null;
 return <section className="settings-section debug-panel" aria-labelledby="settings-debug"><h3 id="settings-debug">Debug</h3>
  <div className="settings-note">{personal?'Personal charges are billed by OpenAI and are not measured here.':`${hosted?'Host allowance reserved today':'Local campaign budget accounted (estimated)'}: $${usage.toFixed(4)}.`}<br/>Recent p95 frame time: {frameTime.toFixed(1)}ms.</div>
  {hasSave&&<section className="playtest-summary"><h3>Playtest time</h3><p>Exploration {formatPlaytime(playtest.totals.exploration)} · Combat {formatPlaytime(playtest.totals.combat)} · Conversation {formatPlaytime(playtest.totals.conversation)} · Waiting {formatPlaytime(playtest.totals.waiting)}</p><p aria-label="Active time by chapter">{playtest.breakdown.chapters.map(c=>`Chapter ${c.chapter}: ${formatPlaytime(c.activePlay)}`).join(' · ')}</p>{playtest.breakdown.unattributedActivePlay>0&&<p>Earlier time without room detail: {formatPlaytime(playtest.breakdown.unattributedActivePlay)}. This is included in the totals above.</p>}<button onClick={playtest.download}>Download playtest report</button><p className="muted">Counts focused play until two minutes without input. Hidden time, settings and long pauses are excluded; long reading may be undercounted. {playtest.storageAvailable?'Counters stay in this browser for this adventure.':'Browser storage is unavailable; only this visit is measured.'} The report contains timings and visited room IDs, never your name, dialogue or API key. Checkpoint branches have separate reports.</p></section>}
 </section>;
}
