# Character and AI-mode feedback QA

6 September2026. Current correction addresses the user’s reported race/preview, companion customization and unclear billing mode.

Root causes: preview race was missing from cached size dependencies; palette was not passed to preview actors; recomputing bounds on an attached scaled model compounded its scale; companions were hard-coded; AI billing source was implicitly selected from configured keys.

Fixes: source-asset normalization, live preview inputs, closer creation camera, companion class/race/palette setup with real class statistics, three explicit AI modes, free-by-default routing, server-side paid-call opt-in and no personal-to-host fallback.

Observed browser evidence: repeated Halfling→Elf selection remained correctly sized after fixing the discovered scaling regression; palette changed the visible model; Wizard Mira and Cleric Oren appeared in setup and saved party cards. Played tracks check, ledge travel, Scrit ration, prison key rescue, ledger, Vark fight, three hero attacks with autonomous companion turns, seal ending, reload and ChapterII continuation. Dice reveal and individual initiative frames were inspected. Save retained chosen classes and resources. Local displayed campaign AI cost remained$0.0000. Recent frame p95 shown in Settings was about17ms during this bounded run, not a whole-campaign benchmark.

Personal-key selector, connect state and reload-to-free were exercised using an inert placeholder; no paid personal-key request was sent. Host sponsorship on the public Site remains disabled until safely configured.

57 automated tests and client/server/hosted type checks pass. This supports sharing as a playable desktop preview, not a finished24-hour campaign or a fully verified voice release. Broader responsive/accessibility, real browser speech/transcription and long-campaign pacing still need coverage.

The creation screen also exposes an adventure picker so QA-created saves never hide older player adventures behind a single Resume button. No saved adventure was deleted or overwritten.

Published as Sites version 9 at https://echoes-below.naufaldi.chatgpt.site on 6 September 2026. Real public-browser smoke test created Public Feedback QA with Cleric Mira, searched the chest, reloaded and resumed: class, 20 HP, seven potions and the resolved chest remained intact. Settings retained Free story mode and showed host reserved usage $0.0000. Host allowance was visibly unavailable. Personal paid generation remains unverified.

## Second feedback pass: personal narration and asset presentation

Reproduced the screenshot error with a real valid OpenAI key: generated text cited scene.approach/entity.tracks/recent.mira, but the fresh save had no discovery facts. The corrected shared schema explicitly requires empty references in that case and otherwise enumerates supplied IDs. 61 tests pass, including new personal-provider regressions. Six live narrative cases passed generation and bounded semantic review: opening, Mira, Oren, hidden story request, invented reward claim and speaker-switch attempt. Generated MP3 contained 87,168 bytes. Direct personal module requests were run from Node, not a real-key browser session.

Browser QA visibly rejected an inert invalid key without marking it connected. Local server-backed DM narration in Chapter II succeeded in the browser after refreshing the restarted server session. The asset review loaded all 45 supplied models and textures, compiled shaders and sampled animations without a failed model. New KayKit party models were visually checked in Chrome, including front-facing orientation and attached equipment. At 1440×778, measured party panel ended at x234, narration occupied x270–1120, actions began x1146: no panel overlap. Full mobile support remains outside this desktop preview.

DESIGN_REVISION.md and EDGE_CASES.md are the current design and explicit acceptance register. Every possible generated sentence, microphone permission path and animation frame is not certified.

Final regression count: 62 tests passed. Hosted speaker history now filters by the requested speaker; the new regression confirms Mira never receives Oren’s private conversation history. Party world-name labels appear on selection/hover/active turn to avoid obscuring bodies. PRD/RFC and the design/edge-case register are updated.


### Local interactive QA: puzzle, rescue and Vark (2026-09-06)

Played the curated Label QA save at port 5173 through real browser controls. Wrong puzzle ordering rang the warning chain without HP loss. Releasing the pawl and seating the weight survived browser reload and Continue saved adventure. Locking the pin disabled the floor; quick crossing reached Goblin Cookfire without damage. Scrit conversation and ration offer opened the prison. Unlocking the gate changed the visible courier identity to Rescued courier; reading the ledger reached level 2.

In Vark’s chamber, both new questions displayed authored Vark text. Presenting the actual witness accounts visibly changed negotiation DC16 to DC13. The real negotiation rolled 5 + 0 = 5 and correctly entered combat. Separate dice/initiative playback was inspected, then skipped to the active Goblin guard turn. The alarm produced the additional Goblin scout. The battle remains unfinished and must continue from this save. Screenshots of the prison, parley and settled d20 are present in the task’s browser tool evidence.

Long parley text overflow was difficult to discover. Added a keyboard-focusable narrative passage, thin stable scrollbar, overflow-only “Scroll to read more” hint, and reset-to-top on a new passage. Client typecheck passes; live short-passage rendering was checked after hot reload. The overflow hint and keyboard scrolling on a long passage still require browser confirmation. No deployment performed.


### Local boss combat and ending completion

Continued Label QA from the failed Vark negotiation through actual browser actions. Goblin guard moved 25 feet, then hit the hero for 7 damage. Automatic companion steps were advanced individually with presentation skips during the longer sequence. Mira/Oren eliminated the alarm scout. The hero used Second Wind (3 + 2 = 5 healing), missed an attack, used Action Surge, then hit the guard for 8. The next hero attack defeated Vark in round 2 after companion actions. Aftermath showed 675 XP and party HP 18/20, 17/17, 20/20. Securing the seal opened the chapter-complete screen; Continue to Chapter II reached The Sluice Stair, 725 XP, same party and restored opening-transition health. This verifies one real local combat path, not general balance or target duration.

Visual fixes from this session: non-roll action playback moved to a compact bottom panel so movement remains visible; dice retain the large modal. Redundant resolving toast is suppressed during playback. The floating last-roll card overlapped companion text; it now lives in normal party-panel flow. Both corrections were checked in rendered browser screenshots. Client typecheck passed. No Sites deployment.

Remaining observed limitation: D10 playback currently shares an icosahedron fallback geometry with D20 even though its numeric roll is correct. Correct die geometry is still needed.
