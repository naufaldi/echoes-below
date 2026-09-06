# Echoes Below — Release 1 technical contract

Release freeze: 6 September 2026. [PRD](PRD.md) owns scope. Historical expansion checkpoints are archived and superseded. Keep the current application architecture and additive save compatibility; no new schema, assets or large features are required for this release.

## Architecture and ownership

TypeScript, React, Three.js/React Three Fiber and Vite render the client. Fastify with SQLite supports local development and existing local saves. A Cloudflare Worker with D1 serves the published Sites application. Both adapters use the shared rules engine; adapter parity tests detect drift. Vite emits `dist/client`, the Worker build emits `dist/server/index.js`, and metadata/migrations are staged under `dist/.openai`.

| Area | Owning modules | Release responsibility |
|---|---|---|
| Rules | server/game.ts, server/rules.ts, server/tactical.ts, shared/curated-rules.ts | Validate legal actions, resources, dice and outcomes |
| Content | shared/campaign.ts, server/encounters.ts, staged encounter modules | Frozen 46 locations, quest state, rewards and route availability |
| Supply policy | server/expedition-supplies.ts | Rules-specific once-only rewards; no legacy inventory migration |
| Persistence | server/storage.ts, hosted/db.ts, HTTP adapters | Version/revision checks, duplicate prevention, ownership and atomic commits |
| Rendering | client/World.tsx, label-layout and label registry, TurnPlayback | Asset isolation, silhouette-aware labels and saved outcome playback |
| AI | server/ai.ts, hosted/ai.ts, client/own-ai.ts, shared/ai-context.ts | Bounded grounded text and validated legal proposals |
| Voice/session | client/App.tsx, client/session.ts | Cancellation, editable transcription, one audio owner and error recovery |
| Measurement | client/playtest-clock.ts, playtest-report.ts, use-playtest.ts | Optional local per-room/chapter counters, honest unmeasured legacy intervals |

## Authoritative state and save compatibility

Rules version selects Echo Rules or the curated SRD subset. Existing internal class IDs remain unchanged. Optional fields have compatible defaults; local SQLite and hosted D1 preserve old saves. Hosted saves belong to an anonymous HttpOnly secure cookie owner; requests are scoped to that owner and protected against CSRF. Clearing the ownership cookie loses access; cross-device/account recovery is outside this release.

An action request carries commandId, expectedRevision and a currently legal actionId. Preview reveals cost/check without rolling. Resolution validates state, optionally obtains bounded companion proposals, revalidates, rolls once, and atomically commits state plus the command record. It returns the final public save and presentation frames. Retries cannot spend resources twice. Stale requests refresh rather than mutate an old revision.

Frames are copies of committed actor positions/health and logs. Presentation never owns gameplay randomness. Refresh may skip a reveal but resumes the committed result. Curated automatic steps resolve one legal decision at a time; movement may precede attack and end-turn. Defeat/checkpoint restoration creates a branch instead of overwriting the old campaign.

Curated movement uses grid paths/terrain/occupancy and authored exploration formations; it is not arbitrary free-world physics. Opportunity attacks resolve while crossing threatened reach, consume eligible reactions and can interrupt movement on incapacitation. Help affects the next eligible ally attack and expires at the helper’s next turn. Selected spells/resources/ASI/rest features are supported, not the full SRD. Exploration retains its legacy attribute adapter.

## Content and resource boundaries

Canonical scene/actor/entity names are separate from model filenames. NPC projection reflects rescue, departure, quest deadlines and encounter state. Quest/cache/reward flags prevent repeated XP or supplies. Failed checks expose a fallback and optional missed quests do not block chapter travel. Staged encounters store preparation in the save so reload cannot erase the intended sequence.

Curated expedition supply rewards: landing suffix -8 gives three rations; other authored combat rooms give two potions; ordinary rooms give one. Each item goes to a nondead carrier with the lowest current count, then party order. Existing action legality excludes total defeat before collection. Echo Rules retains one potion per party member. The policy is retained for Release 1; it is not a difficulty certification.

The attrition audit creates fresh four-class saves and traverses the opening and all 40 expedition rooms using legal actions/rests and serialization boundaries, without injected healing/resources. The committed 12-run report (three seeds per class) reached level8 and the ending in all runs. It checks structural survivability under its policy, not all routes, human skill or campaign duration. Baseline and current JSON reports are retained as evidence.

## AI and voice failure boundaries

Current configured narrative identifier is gpt-5.6-luna; transcription whisper-1; speech gpt-4o-mini-tts-2025-12-15. These are implementation identifiers, not future availability or price guarantees. Strict output validation grounds narration in public facts and legal actions. Empty discovered-fact lists are valid in a fresh opening. Speaker-specific conversation history does not become authoritative world truth.

Personal Check & connect performs a disclosed tiny text-model request. Only success activates the page-memory key and clears the input. Generation counters discard late checks after disconnect/mode switch. Direct OpenAI requests never forward a player key to game APIs or persistence. Invalid authentication, quota/access/network/timeout and grounding errors have user feedback; authored play remains available. No automatic fallback charges the host. Tests cover success/error/stale-response behavior; release browser evidence distinguishes invalid-key checks from paid end-to-end coverage.

Host secrets remain server-side. Atomic sponsored reservation buckets enforce configured global/lifetime/visitor ceilings; reservations are conservative estimates, not invoices. No credential provisioning or cap increase is part of Release 1. Public host allowance is advertised only when the health response enables it.

Voice converts supported recordings to bounded mono PCM WAV before transcription; transcripts populate editable text. One audio owner and cancellation generation prevent stale speech. Blob URLs are revoked. Speech failures retain text and release busy state. Current limitations include incomplete real-key microphone/browser coverage and provider-dependent access/latency.

## Assets and import pipeline

All acquired files are local. Quaternius source/license/hash and animation metadata remain in `public/assets/expansion/manifest.json` and the original Quaternius manifests. KayKit provenance and license are recorded in [DESIGN_REVISION](DESIGN_REVISION.md), [ASSETS](ASSETS.md) and `public/assets/kaykit/LICENSE.txt`. `public/assets/audit-index.json` enumerates all 45 supplied model files; local audit evidence, hashes and clip lists are in `artifacts/verification/assets-feedback.json` (ignored verification output). [ASSETS](ASSETS.md) records the original audit. Gameplay archetypes map explicitly to model paths.

| Role | Selected asset/source | License/free status | Format and adaptation |
|---|---|---|---|
| Hero/companions | [KayKit Adventurers 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0): Knight, Mage, Rogue_Hooded | CC0/free | GLB with embedded textures and76 clips/model; Fighter/Cleric→Knight, Wizard→Mage, Rogue→Rogue_Hooded. Hide conflicting equipment; Cleric hides sword. |
| Acquired alternatives | KayKit Barbarian; original Quaternius Warrior/Ranger/Wizard/Rogue | CC0/free | Retained and audited, not the current party mapping. Barbarian has76 clips; original Quaternius clips remain unchanged. |
| Goblin/hobgoblin | [Bestiary Dungeon Monsters](https://quaternius.com/packs/bestiarydungeonmonsterskit.html), Imp adaptation | Quaternius Asset License/free Standard Imp/Puglin only, not CC0 | GLB, imported humanoid bone names and remapped UAL rotations; hobgoblin armor/scale derivative |
| Skeleton | [Quaternius Skeleton](https://poly.pizza/m/yq5ATpujSt) | CC0/free | Self-contained GLB,15 clips including Idle/Walk/Sword/HitReact/Death |
| Slime | [Quaternius Slime](https://poly.pizza/m/eSLKTsbl7F) | CC0/free | GLB,10 clips including Idle/Walk/Bite/Death |
| Spider | [Quaternius Spider](https://poly.pizza/m/yRYJiAJyiM) | CC0/free | GLB,5 clips including Attack/Death/Idle/Jump/Walk |
| Dungeon architecture/props | Quaternius via creator Poly Pizza entries in manifest | CC0/free |27 GLBs: arches, walls, tables, chairs, cobwebs, barrels, chest, pedestal, trapdoor, statue |
| Prison bed/cage, archive bookcase, workbench/cauldron/chain | [Fantasy Props MegaKit Standard](https://quaternius.com/packs/fantasypropsmegakit.html) | CC0/free Standard, recorded license | glTF+bin. Large shared trim textures removed; simple PBR materials chosen for palette and download budget |
| Traps/doors/seal | Original game geometry plus imported props | Original/CC0 | Engine state drives open gate, plate and interaction markers |

No assumption that the free Bestiary supplies goblins, hobgoblins or all animations. Full humanoid racial anatomy is not present: identity/height/breadth is a disclosed stylization. Bounds come from the original unattached source scene, never the scaled animated clone. Race heights are human1.8m, elf2.05m, dwarf1.45m and halfling1.15m; horizontal breadth factors are elf0.88, dwarf1.25 and otherwise1.0. Rig/scale/orientation are normalized at runtime with bounding boxes; glTF uses Y-up, metres after normalization. Preserve per-instance materials and clone skeletal characters. Static props reuse loaded assets. Filename-qualified clips use semantic matching; explicit mapping and browser playback are required to exclude accidental mismatches. A matching bone name alone is not proof of correct retargeting.

Models load under Suspense with a visible loading message and scene error boundary. Party health changes drive hit/death; saved attack logs drive attack clips; position interpolation drives Walk. Model rotation and ground placement must be verified in browser. Static dressing should remain outside authored movement anchors. Budget target: p95≤33.3ms at1080p on documented hardware, DPR≤1.5,1024 shadow map, restrained point lights. A bounded prior local sample was approximately17ms p95 and a later public Settings sample20.4ms; these are not whole-campaign1080p benchmark certification.


## Release verification and traceability

| PRD | Verification |
|---|---|
| R1-01 | Creation schema, class/race/preview and save tests; fresh browser characters in both profiles |
| R1-02 | Campaign/quest/staged puzzle tests; committed attrition audit; local critical path |
| R1-03 | Tactical resources, reactions, Help, invalid actions, defeat tests; visible dice and companion playback |
| R1-04 | Duplicate/stale/revision/ownership/storage and serialization tests; reload/resume browser |
| R1-05 | Build asset verifier checks all 45 models/51 files including external glTF bins; label collision tests and desktop inspection |
| R1-06 | AI mode, personal-key, narration context, cancellation and audio tests; browser invalid-key feedback/free recovery |
| R1-07 | npm test; typecheck:server/client/hosted; npm run build including asset bundle gate; one existing-project deployment |
| R1-08 | Consolidated documents, release evidence and production smoke handoff |

No duration acceptance or full human playtest certification is part of Release 1. Timing export version2 partitions known room/chapter intervals and leaves older intervals unattributed. Long reading may undercount after inactivity; generated QA timings are not human playtests.

Deployment packages only the validated build, metadata and migrations. Preserve current Site audience, project, runtime secrets and hosted data. Do not deploy repeatedly during QA. Commit first, push exact source, save one version, deploy once after local gates, then smoke-test the production URL. No autonomous expansion follows the handoff.
