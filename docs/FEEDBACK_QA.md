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
