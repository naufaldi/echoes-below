> Historical planning/reference document. Release 1 scope is frozen; PRD.md, RFC.md and EXECUTION_STATUS.md supersede expansion promises here. This file does not authorize autonomous follow-up work.

# Expansion status

Updated6 September2026. Goal remains active. First public deployment succeeded at https://echoes-below.naufaldi.chatgpt.site. Browser acceptance remains unfinished.

Implemented this expansion:
- Saved per-action presentation frames, prominent animated die/reveal, sequential Next action and skip, initiative strip and active actor highlights.
- Four race identities and four class profiles, shared XP/levels1–8, once-only rewards, finite supply caches.
- Five additional authored chapters with40 locations, original Tavin/Oren arcs, evidence, local choices, optional combat, rests and a campaign ending. Existing ChapterI saves continue into ChapterII.
- Quaternius skeleton/slime/spider GLBs, dungeon props, prison bed/cage/chains, archive/market/choir dressing. Manifests retain sources/licences.
- Worker/D1 adapter, anonymous owner-scoped saves/dialogue/checkpoints, atomic duplicate/revision handling, generated Drizzle migration.
- Personal API key in page memory with direct OpenAI requests; optional sponsored Worker adapter with atomic conservative caps. Sponsored secret is not configured yet.
- Six authored companion conversations now unlock through trust and witnessed facts in safe locations; selected replies persist in AI memory and grant once-only Steady Nerves/Shared Resolve bonuses. Tests cover all12 reply branches and interrupted-conversation reload. Published in Sites version5; deployed reload and duplicate-reward checks passed.
- Updated PRD/RFC/reusable goal prompt. Earlier specifications archived, not normative.

Verified:53 automated tests pass, including all40 new locations, level8 reachability, new enemy archetypes, duplicate XP prevention, individual frame copies, visitor isolation, checkpoint branches and budget admission. Client/server/Worker type checks pass. Production build and three type checks passed. Post-release retry/streaming/animation fixes passed the production build and all checks; Sites version2 succeeded and its current bundle, health, skeleton, spider and prison-bed files respond200. Sites version3, commit `e8abb504b544941776346d1e4eed279fe86e4faf`, also succeeded. Its exact bundle `/assets/index-BB1P8DBr.js` responds200. The final correction preserves turn highlights on the last combat action. OpenAI browser CORS preflight accepts direct API requests.

Outstanding release work:
1. Review hosted idempotency and player-key retry behavior, hostile/oversized inputs, and actual Worker deploy behavior.
2. Deployed HTTP traversal completed all46 locations, including5 combat actions/turn advances,40 expansion locations,215 revisions, level8 and final-ending reload. Visitor isolation, duplicate and stale checks passed. Automated API elapsed299s is not human playtime. Evidence: `artifacts/verification/deployed-v2.json`. These checks passed; the final presentation correction is published and verified by exact-bundle response.
3. Browser visual/playtest remains blocked: computer-use reports the Mac is locked and cannot auto-unlock. Do not substitute HTTP tests for screenshots or actual voice playback. Recheck when user unlocks.
4. WebMCP read/preview tools added; supported-context verification unavailable while locked. Not a user-requested WebMCP blocker.
5. Sponsored secret provisioning remains pending; personal-key/authored modes are available. Never expose the existing local key to normal tool output or public files.
6.24-hour duration remains unverified and not achieved by46 compact locations. Deeper mechanical consequences, additional long-form quests and human pacing tests remain required for that target. Race mechanics and full D&D class features are not implemented; the UI/docs must not claim them.

Registered Site: `appgprj_6a9c63bb6590819184da979092c5c256`, expected URL `https://echoes-below.naufaldi.chatgpt.site`. Reuse it, never create another. Local personal data remains under ignored `data/` and must not be published. Source write credentials are ephemeral and must never be persisted.

Continuation audit: previous goal turn was progress (public release and deployed traversal). This turn rechecked the browser: the Mac remains locked, but companion-story work made further authoritative progress. Browser blocker has appeared in two consecutive goal turns; the goal is not marked blocked while independent work remains.

Follow-up verification: the real local OpenAI speech → WAV → Whisper round trip produced matching text, but first exposed reversed speaker perspective. Explicit participant binding and subject-specific relationship memory corrected both text-only follow-up prompts. Evidence is in `artifacts/verification/bond-perspective.json`; original failures remain in the voice evidence and must not be counted as semantic passes. Browser listening remains unverified. Future campaign clues were removed from client imports; production packaging now checks for accidental clue leakage.

Current continuation: prior turn made progress by publishing version6, verifying the exact clue-free client bundle and corrected deployed relationship memory. This turn adds PRD-25/26: combat no longer chooses a room’s ethical outcome, and ten cross-room decisions unlock tangible optional assistance. Regression evidence includes actual source decisions, contrary paths, save/reload, once-only claims and rule effects. Long-form quests and human pacing remain outstanding; do not count these ten links as a measured duration.

Version7 is published successfully at the existing public URL. Commit `71027324220a3d5a7cba776d6534142fc8937ef1`; exact client bundle `index-Dug-BAQT.js` returns200. All49 tests, client/server/Worker type checks and production build pass. A deployed opening-to-Archive traversal at revision73 passed ten checks: owner isolation, duplicate/stale requests, combat leaves choice pending across reload, apprentice aid from the actual earlier choice, DC reduction, and once-only/reload persistence. Evidence: `artifacts/verification/deployed-v7-consequences.json`. This is API evidence, not human playtime or visual QA. The Mac was rechecked and remains locked; independent campaign work is still possible, so the goal remains active.

Current continuation adds PRD-27 pacing instrumentation: a local-only active play clock and explicit report download, with separate waiting and idle/hidden exclusions. This prepares measurement; it does not establish campaign duration. Previous turn was concrete progress (version7 and a successful73-revision deployed traversal). Current browser verification remains gated by the locked Mac.

Version8 publication succeeded for commit `8f20e7635eb953126279212e24974a89352624ee`; public bundle `index-ClkttmF6.js` includes the local playtest clock. All53 tests, three type checks and production build pass. The computer-use lock was revalidated again after more than three consecutive goal turns. Independent engine/content/measurement work is complete for this verification pass; the next acceptance steps require an unlocked browser for screenshots, real key/audio flow, timer behavior and an initial pacing baseline. The full goal is not achieved. It is blocked on that external state change rather than repeatedly extending an unreviewed build. See `PLAYTEST_HANDOFF.md` for exact resumption steps and remaining long-form scope.

## 6 September feedback follow-up

The Mac is now unlocked. Opening-adventure browser QA through the boss, ending, reload and Chapter II continuation passed locally; public version 9 passed creation, action and save/resume smoke checks. Race preview, companion setup and explicit billing modes are corrected. 57 tests pass. See FEEDBACK_QA.md for current evidence. Earlier lock statements above are historical. Real personal-key browser audio, broader accessibility and long-form campaign pacing remain unverified; the full 24-hour goal is not complete.


### Ability advancement checkpoint, 2026-09-06

Implemented local player-selected ability improvements for all three party members, six-score display, before/after selection and review, and inventory notification. Fixed XP level-up reviving unconscious characters and temporarily resetting canonical equipment AC. All 172 backend tests, server/client/hosted typechecks and production build pass. Browser check attempted but Mac is locked. These changes are not yet deployed; public version 12 remains the last verified release. Campaign duration and human playtest requirements remain unmet.


### Legal campaign progression and Vark dialogue checkpoint

`scripts/audit-campaign-progression.ts` traverses all 40 expansion rooms with each curated hero class using only legal actions, maximum dice and a peaceful main route; every action is serialized and reloaded. No XP, levels or resources are injected. All four runs reach level 8 and retain all eligible ability improvements. Evidence: `docs/CAMPAIGN_PROGRESSION.json`. On this route level 8 arrives only after depth-8’s final decision. This is a pacing limitation, not evidence of a balanced combat campaign or 24-hour duration.

Added optional Vark questions and an evidence-backed DC reduction with saved facts and no repeat rewards. The new content is local pending browser verification and publication. Mac remains locked on the current verification attempt. Public version 12 is still the last verified release.


### Local development policy and rest continuation

User steering: develop and verify locally; do not repeatedly deploy Sites. Publish only after the repair work is finished and verified. The current public release remains version 12. Local development uses Vite at http://127.0.0.1:5173 with the watched API at http://127.0.0.1:4317. Added optional additional Hit Dice within a persisted short-rest window, without repeated class recovery.

Verification: all 179 backend tests and all three typechecks pass. Live local Vite proxy returned successful creation, short rest, travel to hall and save reload at revision 2. This is HTTP integration evidence, not browser visual evidence. No Sites deployment performed.


### Local label and narration QA

The Mac became available. Local browser QA at port 5173 created a curated Fighter save named Label QA. Selected-character leader lines and labels were inspected in a rendered screenshot. The inventory modal hid world labels, displayed six abilities, and changed to Mira’s correct Rogue values on selection. QA exposed an opening narration heading incorrectly naming Oren; the shared text/speaker projection fix was verified through hot reload showing THE STORY SO FAR / ADVENTURE JOURNAL. Long-label wrapping, wider camera-angle coverage and level-up choice interaction still need browser verification. No Sites deployment performed.


Current local browser save Label QA has reached the Vark battle after a failed prepared negotiation (5 vs DC13); active turn is Goblin guard, with an alarm scout present. Puzzle wrong-order recovery, mid-puzzle reload, safe crossing, peaceful goblin passage, rescue identity, level 2 and parley DC change were observed. Battle completion and long-passage scroll verification remain pending. No Sites deployment.


Local Label QA completed the Vark combat route and opening ending, then reached Chapter II’s Sluice Stair at 725 XP. Non-roll playback and last-roll overlap fixes are local and visually verified. The current browser remains available for the continuing chapter playthrough. Target two-hour/24-hour duration remains unproven; no Sites deployment.


Local dice presentation now distinguishes D10 and D12 rather than using the D20 fallback. Geometry regression checks pass, including ten coplanar D10 faces. This fixes the shape issue recorded during Second Wind QA; fresh browser D10 playback is still pending. No deployment performed.
