# Character and AI-mode feedback QA

6 September2026. Current correction addresses the user’s reported race/preview, companion customization and unclear billing mode.

Root causes: preview race was missing from cached size dependencies; palette was not passed to preview actors; recomputing bounds on an attached scaled model compounded its scale; companions were hard-coded; AI billing source was implicitly selected from configured keys.

Fixes: source-asset normalization, live preview inputs, closer creation camera, companion class/race/palette setup with real class statistics, three explicit AI modes, free-by-default routing, server-side paid-call opt-in and no personal-to-host fallback.

Observed browser evidence: repeated Halfling→Elf selection remained correctly sized after fixing the discovered scaling regression; palette changed the visible model; Wizard Mira and Cleric Oren appeared in setup and saved party cards. Played tracks check, ledge travel, Scrit ration, prison key rescue, ledger, Vark fight, three hero attacks with autonomous companion turns, seal ending, reload and ChapterII continuation. Dice reveal and individual initiative frames were inspected. Save retained chosen classes and resources. Local displayed campaign AI cost remained$0.0000. Recent frame p95 shown in Settings was about17ms during this bounded run, not a whole-campaign benchmark.

Personal-key selector, connect state and reload-to-free were exercised using an inert placeholder; no paid personal-key request was sent. Host sponsorship on the public Site remains disabled until safely configured.

57 automated tests and client/server/hosted type checks pass. This supports sharing as a playable desktop preview, not a finished24-hour campaign or a fully verified voice release. Broader responsive/accessibility, real browser speech/transcription and long-campaign pacing still need coverage.
