# Expansion status

Updated6 September2026. Goal remains active. First public deployment succeeded at https://echoes-below.naufaldi.chatgpt.site. Browser acceptance remains unfinished.

Implemented this expansion:
- Saved per-action presentation frames, prominent animated die/reveal, sequential Next action and skip, initiative strip and active actor highlights.
- Four race identities and four class profiles, shared XP/levels1–8, once-only rewards, finite supply caches.
- Five additional authored chapters with40 locations, original Tavin/Oren arcs, evidence, local choices, optional combat, rests and a campaign ending. Existing ChapterI saves continue into ChapterII.
- Quaternius skeleton/slime/spider GLBs, dungeon props, prison bed/cage/chains, archive/market/choir dressing. Manifests retain sources/licences.
- Worker/D1 adapter, anonymous owner-scoped saves/dialogue/checkpoints, atomic duplicate/revision handling, generated Drizzle migration.
- Personal API key in page memory with direct OpenAI requests; optional sponsored Worker adapter with atomic conservative caps. Sponsored secret is not configured yet.
- Updated PRD/RFC/reusable goal prompt. Earlier specifications archived, not normative.

Verified:41 automated tests pass, including all40 new locations, level8 reachability, new enemy archetypes, duplicate XP prevention, individual frame copies, visitor isolation, checkpoint branches and budget admission. Client/server/Worker type checks pass. Production build and three type checks passed. Post-release retry/streaming/animation fixes passed the production build and all checks; Sites version2 succeeded and its current bundle, health, skeleton, spider and prison-bed files respond200. Sites version3, commit `e8abb504b544941776346d1e4eed279fe86e4faf`, also succeeded. Its exact bundle `/assets/index-BB1P8DBr.js` responds200. The final correction preserves turn highlights on the last combat action. OpenAI browser CORS preflight accepts direct API requests.

Outstanding release work:
1. Review hosted idempotency and player-key retry behavior, hostile/oversized inputs, and actual Worker deploy behavior.
2. Deployed HTTP traversal completed all46 locations, including5 combat actions/turn advances,40 expansion locations,215 revisions, level8 and final-ending reload. Visitor isolation, duplicate and stale checks passed. Automated API elapsed299s is not human playtime. Evidence: `artifacts/verification/deployed-v2.json`. These checks passed; the final presentation correction is published and verified by exact-bundle response.
3. Browser visual/playtest remains blocked: computer-use reports the Mac is locked and cannot auto-unlock. Do not substitute HTTP tests for screenshots or actual voice playback. Recheck when user unlocks.
4. WebMCP read/preview tools added; supported-context verification unavailable while locked. Not a user-requested WebMCP blocker.
5. Sponsored secret provisioning remains pending; personal-key/authored modes are available. Never expose the existing local key to normal tool output or public files.
6.24-hour duration remains unverified and not achieved by46 compact locations. Deeper mechanical consequences, authored relationship unlocks, additional long-form quests and human pacing tests remain required for that target. Race mechanics and full D&D class features are not implemented; the UI/docs must not claim them.

Registered Site: `appgprj_6a9c63bb6590819184da979092c5c256`, expected URL `https://echoes-below.naufaldi.chatgpt.site`. Reuse it, never create another. Local personal data remains under ignored `data/` and must not be published. Source write credentials are ephemeral and must never be persisted.
