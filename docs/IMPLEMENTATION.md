> Historical planning/reference document. Release 1 scope is frozen; PRD.md, RFC.md and EXECUTION_STATUS.md supersede expansion promises here. This file does not authorize autonomous follow-up work.

# Echoes Below opening adventure implementation

Goal: implement the first complete playable adventure defined in PRD.md and RFC.md, then verify it in the browser. Full campaign expansion remains a later milestone. Work directly in this new project directory.

## Task 1: Server, rules and saves
User story: a player can create a hero, explore all six scenes, resolve traps and goblin encounters, fight with autonomous companions, reach an ending, and resume an exact saved state.
Edge cases: invalid IDs, illegal actions, duplicate submissions, failed checks, defeat, stale revisions, restart, AI failures and missing voice.
Done: server/API and shared contracts implemented, rules and endpoint tests pass, seeded combat and peaceful paths reach ending. AI/voice endpoints use private .env and bounded requests, no secrets in output.

## Task 2: Assets and presentation evidence
User story: the player sees a coherent stylized dungeon and recognizable characters.
Edge cases: unavailable free pack files, no animations, rig mismatch, texture paths.
Done: acquired permitted free models inventoried; required visual representations work; source/license ledger records actual files. Procedural dungeon scenery fills architectural gaps; no unverified claims about pack contents.

## Task 3: Browser game
User story: I choose a class and actions, see party and enemies in 3D, hear dialogue, follow dice and combat results, save and continue.
Edge cases: loading/failure, keyboard targets, viewport overlap, downed party, microphone denial, audio interruption.
Done: polished 3D exploration and UI consume the server contracts; complete playthrough works at 1280x720 and1920x1080; build/typecheck pass.

## Task 4: Review, live checks and leave running
User story: I can open a local URL and play without developer intervention.
Edge cases: API unavailable, invalid AI responses, stalled encounter, reload after damage, server shutdown.
Done: independent code review, test suite, production build, live AI/voice check within $2 total evaluation ceiling, browser combat and negotiation playthroughs with screenshots. Fix blockers. Leave production server on loopback and provide URL with exact implemented limitations.

## Reusable continuation prompt
Continue implementing Echoes Below at /Users/naufaldisatriya/WebApps/3d-dnd using docs/PRD.md, docs/RFC.md and this plan. Pursue a complete first playable adventure, not merely a visual demo. Keep rules and saves authoritative on the server; use the private server environment for OpenAI without revealing keys. Complete browser playthroughs, meaningful tests and screenshot evidence, fix failures, and leave the local game running. Report actual gaps honestly. Never claim the full24-hour campaign is implemented unless all six expanded chapters are built and tested.

## Progress
- Task1 complete: server, rules, six scenes, actual bounded AI choices, durable SQLite saves and dialogue history. Independent backend review and fix re-review complete.
- Task2 complete for the opening: verified free assets acquired, licensed and inventoried; runtime models and original scene modules rendered in browser. Unused variants remain uncertified.
- Task3 complete: character creation, 3D party/camera, contextual and custom actions, combat, dialogue/voice, journal, restart/resume and ending screens built. Client integration findings fixed and re-reviewed.
- Task4 complete:32 tests pass, both typechecks and production build pass, real voice/transcription and AI checks pass, both browser routes reach endings, mid-combat server restart preserves the full snapshot, screenshots saved. Live companion over-defending discovered and fixed without changing rules. Local server left running; restart via START.command.
- Measured evidence and exact limitations: [VERIFICATION.md](VERIFICATION.md). No full24-hour campaign or fresh-player duration study is claimed.
- Standalone reusable prompt: [GOAL_PROMPT.md](GOAL_PROMPT.md).
