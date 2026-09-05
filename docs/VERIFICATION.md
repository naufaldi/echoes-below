# Opening adventure verification

Verified locally on 5–6 September 2026. This report distinguishes executed checks from planned acceptance targets.

## Result

The compact six-scene adventure is playable in the production browser build at http://127.0.0.1:4317. Both negotiation and combat reached a real saved ending. The local server runs detached; `START.command` restarts it after a shutdown. No deployment or recurring automation was created.

## Executed checks

| Area | Evidence and result |
|---|---|
| Rules and persistence | `npm test`:32 tests passed, zero failures. Includes all nine class/background combinations; every class's deterministic combat route; failed trap/checks; dice; downed actors; healing; movement; defeat; checkpoint branching; duplicate/in-flight commands; stale AI work; preview semantics. |
| Type and build checks | Server and client typechecks passed. Vite production build passed (593 modules). The final tactical change affects server AI policy only and passed server typecheck plus the full32-test suite. |
| Browser negotiation route | Created Guardian Alden; inspected tracks; found the trap; failed disarm (Mira took6 damage); healed with Oren; entered a custom safe-route request and confirmed the AI preview; fed Scrit; freed courier; read ledger; negotiated with Vark (16+1=17 against DC16); entrusted the seal; reached “A Promise Shared.” |
| Browser combat route | Created Scout Thorne; used side ledge; fought goblin guards; AI Mira attacked while Oren healed; used recovered key; fought Vark; drank a potion and repositioned; player was downed by a critical hit; companions continued and defeated Vark; secured seal; reached “The Keepers of the Bell.” |
| Restart during combat | Stopped and restarted the actual server with hero action already spent. Deep equality of the entire public snapshot passed, including revision12, remaining6m, actionRemaining=false, initiative, resources and health. Browser Continue restored that turn. |
| Actual AI | Luna dialogue returned successfully; a later Mira reply recalled “Copper Finch” from the preceding exchange. DM declined unrevealed seal/boss information in the approach scene. Unsupported teleport/infinite-health request returned422 and public state stayed identical. |
| Actual voice | Generated DM speech successfully; Whisper transcribed the generated recording back exactly. Measured single calls: dialogue2167ms, speech1798ms, transcription2483ms. Cached speech replay6ms. Browser Mira/Oren speech and replay/stop controls worked. |
| Conversation durability | Endpoint tests verify both sides survive database restart. Browser journal displays stored dialogue after reload. Speaker/save boundaries are tested; unrelated conversation is excluded from model context. |
| Visual checks | Inspected creation, exploration, trap confirmation/result, goblins, prison, boss, dialogue and endings. Tested actual viewports1280×720 and1920×1080. Party status, contextual controls, scrolling, target list and subtitles remained available. Ending no longer has scene labels over its headline. |
| Performance | Apple M1,8GB RAM, Chrome,1920×1080,DPR1: displayed recent p95 frame time26.0ms over180 frames. This is a short local sample, not an extended hardware benchmark. Captured browser warnings/errors: none in the final inspected session. |
| Assets | Actual free Bestiary archive contains Imp/Puglin; source GLBs have no clips. Shipped Imp adaptation uses eight remapped rotation clips. Party textures and imported animations render; combat downed poses and snapshot movement were exercised. Exact provenance/licenses are in ASSETS.md. |
| Credentials | Scan of documentation/client/server/shared/production JS found zero key-shaped strings. Private environment permissions0600. Requests for environment, source and database paths returned only the public SPA index, never those files. Server listens on127.0.0.1 only. |

## Review and fixes

Independent backend review found missing conversation context, unreachable coordinated retreat, and downed-hero exploration checks. All were fixed and re-reviewed. A final client review found hidden authored outcomes, stale closed-gate/fled-NPC presentation, recordings crossing save boundaries, and muting during a pending dialogue request. All four were fixed with regression coverage and re-reviewed. World HTML labels now stay below interface overlays.

A live boss playtest subsequently revealed repeated Guard choices from the small model. Its prompt lacked concrete action effects. The planner now explains that Guard protects only the acting character, provides health/range/resource context, and excludes Guard after two consecutive self-Guards when a reachable attack exists. Rules and dice are unchanged. The resumed real battle ended on the next companion round. The policy change passed two focused tests and independent review.

A minor wording detail remains: the courier's target can still say “Captive courier” after rescue, although the gate opens and its description/objective update. This has no rules effect.

## Evidence files

`artifacts/verification/` contains trap, negotiation, boss, dialogue, combat and ending screenshots,1280/1920 viewport captures, performance capture, exact restart snapshots, checkpoint result, voice sample/transcript/timings, AI evaluation replies, credential-scan counts, and usage accounting. `artifacts/reviews/` contains review reports and fix reports.

The live evaluation and browser work remained below the explicit $2 evaluation ceiling. At the recorded pre-final sample the application accounted for about$0.37, including conservative audio reservations; final accumulated accounting is in `artifacts/verification/usage.json`. This is not an OpenAI invoice. Cached replay caused no additional speech generation.

## Limits and remaining campaign work

- This is the opening adventure, not the planned24-hour campaign. No fresh-player duration study has run. Testing time includes development interruptions and is not a player-duration measurement.
- There are no expanded chapters, cross-chapter progression, multiplayer, arbitrary spells/destruction, generated geometry, or lip synchronization.
- Safe authored room anchors replace a navigation mesh. Snapshots animate after commitment; simultaneous combat presentation is an approximation, not a fully sequenced cinematic event timeline. Generic healing/interaction effects remain simpler than movement/attack poses.
- AI memory currently supplies six exchanges per speaker plus confirmed facts and recent events; it does not yet maintain full campaign summaries. Journal retains the latest50 exchanges. Dialogue quality and hidden-information robustness need a larger evaluation set before a public release.
- Whisper was tested with a real generated audio file, not a person speaking into this Mac's microphone. Recording lifecycle/cancellation is covered by production-helper regression tests; actual microphone permissions and hardware depend on the browser/device. Text play is available throughout.
- Primary action text is smaller than the aspirational16px-everywhere PRD target. Some nearby world labels can overlap; the target list provides all targets. Broader accessibility and five-player acceptance checks remain future work.
- Puglin and unused character variants are acquired assets, not claims that all their animations have been visually certified. Enemy appearance is a permitted Imp adaptation, not an official Goblin/Hobgoblin model.


## Public expansion verification: 6 September2026

- Public URL: https://echoes-below.naufaldi.chatgpt.site. First deployment succeeded; release-fix version2 also succeeded; current bundle and representative assets respond200.
-41 automated tests pass; client/local-server/Worker type checks pass; Vite8 + Worker build passes.
- Deployed HTTP adventure: opening combat route, all40 additional locations,215 revisions, level8 with35725XP, final ending and reload. Automated traversal299 seconds; this is not human playtime or a24-hour validation.
- Distinct visitor cannot read/list another save. Duplicate action returns original revision; stale action returns409.
-41 model files parsed; no missing external dependencies; largest public file9.89MB. Browser animation/material appearance still requires inspection.
- Computer-use blocked because Mac is locked and cannot auto-unlock. No new browser screenshots, voice playback claim, or WebMCP verification.
- Personal key path uses direct OpenAI requests and page memory. OpenAI CORS preflight accepted. Real browser BYOK remains to be tested. Sponsored server key has not been configured.
- Existing local saves preserved; local server restarted with the expansion and the page responds200 at127.0.0.1:4317.

- Final public version3 succeeded, code commit `e8abb504b544941776346d1e4eed279fe86e4faf`; exact current bundle `/assets/index-BB1P8DBr.js` responds200. Metadata evidence: `artifacts/verification/deployed-v3-health.json`. No paid OpenAI calls were made during this expansion run.
