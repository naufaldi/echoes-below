# Echoes Below: Technical RFC

Version 2.1, 6 September 2026. Aligned with published Sites version 10 (source `3a785c5a2e76b85133fe408fcae4450f7016841b`). Current implementation decisions; supersedes archived v1 proposals. [PRD](PRD.md) owns product requirements. [FEEDBACK_QA](FEEDBACK_QA.md) records the latest correction evidence; [EDGE_CASES](EDGE_CASES.md) records remaining acceptance coverage. [EXPANSION_STATUS](EXPANSION_STATUS.md) retains the broader campaign history. No credentials belong in these documents.

## Architecture decisions

Keep TypeScript, React, Three.js/React Three Fiber and Vite. Vite8 is required by the installed Sites plugin; preserve the npm lockfile. Build the browser into `dist/client`, Worker ESM into `dist/server/index.js`, and Sites metadata/migrations into `dist/.openai`. The Worker exports default `fetch(request,env)` and uses the platform ASSETS binding for static files. `sites()` participates in the Vite build.

Keep the existing loopback Fastify/Node SQLite backend for the user's local saves; do not migrate or erase personal data during publishing. Add a Cloudflare Worker adapter using D1 for hosted saves. Both adapters call the same pure `server/game.ts` rules engine and `server/rules.ts` dice functions. Public hosting cannot use Node's local SQLite file. The duplicated HTTP adapters are a deliberate migration seam, with integration tests to detect contract drift.

| System | Owner | Responsibility / boundary |
|---|---|---|
| Rules and authoritative state | `server/game.ts`, `server/rules.ts` | Legal actions, dice, distance, turns, health, resources, XP, decisions |
| Campaign | `shared/campaign.ts` |40 new authored locations, choices, evidence, companion lines, enemy identity and next-room sequence |
| Local API/storage | `server/app.ts`, `server/storage.ts` | Loopback validation, CSRF, SQLite transactions, cached audio and local saves |
| Hosted API/storage | `hosted/worker.ts`, `hosted/db.ts` | Cookie ownership, Zod boundaries, D1 prepared statements, atomic action commits |
| AI | `hosted/ai.ts`, `server/ai.ts`, `client/own-ai.ts` | Strict proposals and grounded narration; provider failure cannot stop authored play |
| Shared AI context | `shared/ai-context.ts` | Public facts, relevant history and character perspective; excludes engine flags and future content |
| Presentation | `client/TurnPlayback.tsx`, `client/World.tsx` | Saved-frame playback, dice reveal, active actor, movement/animations/camera |
| Assets | `client/World.tsx`, `client/DungeonDressing.tsx`, `client/AssetReview.tsx`, public manifests | KayKit party models, Quaternius dressing/enemies, per-instance equipment and runtime audit |
| AI mode and key connection | `client/ai-mode.ts`, `client/AIModePicker.tsx`, `client/own-ai.ts`, `client/App.tsx` | Explicit billing source, access check, page-memory key and stale-result guard |
| Voice/session | `client/App.tsx`, `client/session.ts`, `client/own-ai.ts` | Editable transcription, one playback owner, cancellation and WAV conversion |

D1 is authoritative for hosted product data. Browser storage keeps preferences, last-selected save ID and opt-in-export local pacing counters; it never stores personal API keys. A private HttpOnly, Secure, SameSite=Strict cookie establishes anonymous device ownership; its random value is hashed before use as the database owner identifier. The CSRF token is derived separately and returned only from the same-origin session endpoint. All save, dialogue, preview, checkpoint and audio queries include owner. Clearing the cookie currently loses access; there is no account recovery or cross-device sync promise.

## Rules and content state

See PRD for the compact Echo Rules profile and explicit deviations from full D&D. Existing internal class IDs and version1 saves remain readable; raceId defaults to human, XP to0 and level to1 when absent. New fields are additive and use null-safe defaults. Races are currently identity/height/breadth, not racial abilities. Classes use compact weapon/heal/Aim profiles. Level thresholds mirror the familiar D&D progression, but HP/focus increments are house rules.

Every discovery/reward records a unique flag. `awardExperience` refuses a second award for the same key, so repeated actions, revisits and retries cannot farm XP. Expedition choices produce canonical facts and once-only trust changes. A failed primary check leaves alternative/combat routes. Each room permits one supply cache and one post-resolution rest. Current progression is a linear chapter sequence with local choices, not a branching open world. Future narrative branching must consume recorded decisions explicitly rather than relying on AI to invent continuity.

The current engine uses authored movement anchors and interpolated movement, not a navmesh/A* implementation. Props are placed away from those routes. Added geometry must be tested for collisions/occlusion before claiming arbitrary pathfinding.

## Minimum interfaces and lifecycle

Actual TypeScript contracts are in `shared/types.ts`; these excerpts describe their meaning.

```ts
interface ActionRequest {
  commandId: string;       // UUID, retained across retries
  expectedRevision: number;
  actionId: string;        // currently legal option ID
  companionPlans?: Record<string,string>; // optional BYOK proposals, revalidated by engine
}
interface Preview {
  previewId: string; saveId: string; revision: number;
  action: ActionOption; expiresAt: string;
}
interface PresentationFrame {
  actorId: string; sceneId: SceneId;
  party: Actor[]; enemies: Actor[]; log: GameLog;
}
interface GameLog {
  id: string; revision: number; speaker: string;
  text: string; source: 'authored'|'rules'|'ai'; rolls: Roll[];
}
```

`Save` owns private flags, attempts, turnIndex and checkpoint references. `PublicSave` strips private fields and adds the visible scene and currently legal actions. Frames contain copies of visible actors and the individual resolved log, never future flags. Public context contains current scene, party, recent logs, discovered facts and selected cross-chapter facts. Dialogue output is `{id,speaker,text,source,createdAt}`. Audio output is an MP3 response on hosted routes; the client creates a temporary blob URL. Local backend retains its cached audio URL contract; `client/api.ts` normalizes both.

Action sequence: preview (optional) → validate revision/action → obtain optional legal AI companion plans → revalidate by atomic commit → resolve secure dice and state → save final result and command record → return result plus frames → client plays frames one at a time → adopt final state. Frames are presentation of an already committed resolution, not separate server turns. Refresh skips animation and resumes the committed state, preventing a second roll or partial combat save.

During playback, the scene uses previous actor values until reveal, then the individual frame values. No new player command is accepted. Initiative order and active actor remain visible. “Next action” advances; “Skip presentation” immediately adopts the saved result. Reduced motion replaces spinning with a short reveal. Dice geometry must match its side count.

### Worked examples

Trap: inspect hall floor → preview Insight DC13 → confirm → server rolls d20, adds attribute/training, records discovered plate or failed attempt. A later failed disarm consumes the plate, rolls1d6 damage and raises the alarm. The client displays that stored roll before the consequence; duplicate command IDs return the same result.

Companion: Oren has focus and Mira is below half health within7.5m approach+heal range. AI receives offered `heal:mira` and legal attacks. Engine checks focus, side, injury and distance again, moves within1.5m and resolves1d6+2. Invalid/stale proposals use protective tactics. Guard never protects another party member.

Combat: hero attacks a goblin, consuming an action but retaining remaining movement. End turn resolves subsequent automatic actors until the next player decision. Returned frames show Mira's shot, an enemy's damage and Oren's healing individually. A final defeated enemy opens the room route only in authoritative state; playback cannot resurrect it.

## HTTP and storage

Hosted routes retain the local client's contract: session/health; save list/create/read; action preview/commit/direct; dialogue/history; narration audio; transcription; usage; checkpoint restore. Direct commands accept optional BYOK companion proposals. A player-key dialogue is generated directly at OpenAI, then only player text and returned reply are persisted through `/dialogue/local`; that route cannot modify game state. Hosted requests enforce same-origin and CSRF checks, bounded JSON, validated IDs and per-owner queries. Thirty saves per device is the current creation limit.

D1 tables: `saves`, `commands`, `checkpoints`, `previews`, `dialogues`, `budgets`. Schema lives in `db/schema.ts`; Drizzle-generated migrations live in `drizzle`. Runtime code never creates/changes tables. Prepared statements contain one SQL statement each; related writes use D1 batch transactions.

Command commit atomically inserts the idempotency record only when the expected revision still exists, updates the matching save under the same command/hash, and creates an arrival checkpoint when necessary. A different request reusing an ID returns409. Stale concurrent commands cannot both advance one revision. Duplicate requests retrieve the original public result. Restoring a checkpoint creates a new save branch and leaves the original intact. Local storage uses its existing synchronous transaction implementation. Hosted SQLite-adapter tests exercise actual SQL. Prior deployed D1 checks covered ownership, duplicate/stale commands and campaign traversal; these do not replace browser presentation checks.

## AI, credentials and spending

Narrative candidate and current adapter: `gpt-5.6-luna`, Responses API, strict JSON schema, reasoning none, maximum700 output tokens. Existing local live verification established availability. Whisper candidate: `whisper-1`. Speech: `gpt-4o-mini-tts-2025-12-15`, voices ash/coral/onyx. Model identifiers are centralized in adapters and must be rechecked when provider behavior changes.

Personal key mode: **Check & connect** calls `verifyOwnKey(candidate)` directly against the Responses API using `gpt-5.6-luna`, reasoning none, `max_output_tokens:16` and a minimal OK request. The UI discloses this small paid request. The candidate remains transient during the check; only a successful response installs it as the active module-memory key and clears the password input. UI status reports checking, connected for this visit, rejection or disconnection. A generation counter prevents a late response from reconnecting after disconnect or a mode switch. The check verifies text-model access, not TTS or microphone availability. Requests go directly from browser to `api.openai.com`. No key is included in game API bodies/headers, saves, logs, localStorage or sessionStorage. Disconnect/reload clears it. OpenAI CORS preflight and browser invalid-key rejection were checked. Real paid requests through the personal module succeeded from Node; a complete real-key browser dialogue/voice/microphone session is still unverified. Browser extensions or compromised page code remain able to read page memory; do not describe this as encrypted local storage or absolute secrecy.

Sponsored mode: owner key comes only from Worker environment `OPENAI_API_KEY`, configured as a Sites secret. It is never in source, manifest or client bundle. When absent, hosted health reports AI unavailable while the authored game works. User-key mode does not send its key through the sponsored relay. Current secret provisioning is a separate release-status item; do not advertise sponsorship as active until verified.

Sponsored reservations are deliberately conservative: text/plan request$0.02, speech request$0.12 (input capped1200 chars), transcription$0.003 (canonical PCM≤30s). A materialized SQL eligibility check atomically increments lifetime, global-day and visitor-day buckets together. Ceilings$25/$2/$0.30 respectively. Rejected admission changes no bucket. Provider errors retain reservations rather than risk spending beyond caps. Visible totals are reservation estimates, not exact invoice charges. No uncontrolled retries.

Historical planning estimate, not re-priced in this documentation revision, using the previously recorded candidate text rates$0.20/M input and$1.20/M output, Whisper$0.006/min, speech roughly$0.015/min (speech token billing varies):

| Pattern | Assumptions/hour | Approx API estimate/hour |24h illustration |
|---|---|---|---|
| Light |20 text calls×1500 input/150 output;3min speech;1min transcription |$0.061 |$1.46 |
| Typical |60 text calls×2000/200;10min speech;4min transcription |$0.212 |$5.10 |
| Conversation-heavy |180 text calls×3000/300;30min speech;12min transcription |$0.695 |$16.68 |

These estimates exclude taxes, cache effects, price changes and retries; they do not authorize additional spending. Sponsored reservations are much larger than these invoice estimates and intentionally exhaust sooner. Player-funded requests bill the player's account and are not covered by the server's sponsored ceilings. UI must not mislabel reserved visitor/day amounts as exact campaign spend.

## Voice and memory

Browser recordings are decoded and resampled to canonical16kHz mono16-bit PCM WAV, truncated to30s. Hosted code checks RIFF/WAVE/fmt/data headers, sample format/rate, declared payload length and actual byte limit before sending to Whisper. Thus a forged duration cannot produce a long sponsored request. Transcript returns to the editable action field only.

Only one audio element owns playback. Mute/stop increments a generation token; late results do not play. Blob URLs are revoked on stop/end/cancellation. Text remains when audio fails. Local audio can be cached; hosted speech is streamed and regenerated on replay, so a replay may consume allowance. Conversation history is persisted separately from rules logs, scoped by owner/save/speaker, and never treated as verified world facts. Hosted `GET /api/saves/:id/dialogue?speaker=mira` filters to Mira before returning history for personal requests; `/dialogues` remains the full save journal. Regression coverage ensures Oren’s exchanges do not enter Mira’s requested history.

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

### Runtime asset and HUD verification

The local-only `?asset-review` view uses `AssetReview.tsx` and the model inventory. It loads each glTF/GLB and its textures, checks positive finite bounds, compiles shaders with the active WebGL renderer and samples each animation while checking node transforms. All45 supplied models passed the observed audit. Sampling does not certify every pose, retargeted motion, weapon contact or draw-order issue.

`World.tsx` hides mutually exclusive source equipment, retains skeletal attachments and removes the earlier detached generated party gear. Semantic clip matching includes KayKit melee/spellcast/walk/hit/death names and legacy monster names. Party names appear only on selection, hover or active turn. CSS now uses blue/charcoal panels, gold accents, a scrollable creation panel and separated party/action/narration regions. Chrome1440×778 inspection measured party ending at x234, narration x270–1120 and actions beginning at x1146. Smaller desktop sizes,200% text zoom and all scenes still need broader visual coverage.

## Verification matrix

| PRD IDs | Owning areas | Evidence required |
|---|---|---|
| EB-01,15 | creation/rules/campaign | class/background/race roundtrips, all40 expansion rooms, XP once-only, reachable ending |
| EB-02,05 | engine/World/TurnPlayback | movement and combat tests; individual frames; browser order/highlights |
| EB-03,04 | preview/commands/dice/playback | no preview rolls, duplicate/stale tests, dice reveal screenshot |
| EB-06,14 | AI context/dialogue/campaign | knowledge/personality evals, persistent choices/trust; six trust/fact-gated authored conversations, once-only Shared Resolve reward and persistent memory |
| EB-07,12 | audio/session/API | transcription bytes, editable input, cancellation and late-response tests; actual playback |
| EB-08,13 | Store/Worker/budgets/key UI | visitor isolation, atomic reservations, no key persistence, secure secret configuration |
| EB-09 | opening rules | peaceful/combat endings and onward continuation |
| EB-10,11,16 | rendering/assets/CSS | asset metadata plus actual browser screenshots, clips, overlap and frame time |
| EB-17 | Sites build/deploy | exact source commit/archive, successful deployment and deployed API/browser checks |
| PRD-25, PRD-26 | rules/consequences | victory leaves main choice pending; ten actual source/opposite paths and once-only effects |
| PRD-27 | PlayClock/usePlaytest | phase, idle, visibility and persistence tests; separate human duration evidence |
| PRD-28, PRD-29 | creation schema/game/World | companion combinations, legacy defaults, actual stats and repeated preview changes |
| PRD-30, PRD-31 | ai-mode/own-ai/App/API adapters | no host fallback, invalid/quota/permission failures, visible connection state and cancellation |
| PRD-32 | shared AI context/three provider paths/Worker history | empty-fact schema, invalid reference rejection, incomplete output, speaker filtering and live semantic samples |
| PRD-33 | World/CSS/AssetReview |45-model runtime audit, source license records, attached gear and measured panel separation |

Latest release evidence:62 tests pass with Node's test runner via tsx, and client/server/Worker type checks plus production build pass. Six real personal-module dialogue scenarios covered the opening, Mira, Oren, hidden-story requests, invented rewards and speaker-switch attempts; generated MP3 output was87,168 bytes. Browser local DM narration and invalid-key feedback also passed. These are bounded observations, not proof of every generated sentence or full real-key browser voice acceptance. Browser QA uses approved computer/browser tools, not shell-driven browser automation. Do not claim a locked browser was tested through HTTP requests. Tests cannot establish24-hour entertainment value; human playtesting is mandatory for that target.

## References

- [OpenAI model documentation](https://platform.openai.com/docs/models), [pricing](https://openai.com/api/pricing/), [speech](https://platform.openai.com/docs/guides/text-to-speech), [transcription](https://platform.openai.com/docs/guides/speech-to-text).
- [D&D SRD](https://www.dndbeyond.com/srd), [SRD5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf). Any future copied/adapted licensed SRD text must carry its required attribution. Current narrative and explanatory text are original; no BG3 story/dialogue/assets are copied.
- [Quaternius catalog](https://quaternius.com/index.html), [Quaternius Asset License](https://quaternius.com/license.html), [Crazy Taxi visual reference](https://crazy-taxi.astra.demos.sulat.com/).


### Authored companion conversation state

`shared/companion-stories.ts` defines six private scenes at trust1/4/8. Later scenes require explicit discovered-fact IDs, preventing future-story leakage. `companionStoryId` is additive saved state. While active, legal actions contain only the two offered replies; reload resumes the same decision. Completion records the selected canonical bond memory, increments trust once and grants Mira +2 maximum/current health or Oren +1 maximum/current focus. No XP or repeated farming is possible. Bond facts are retained in AI context beyond the recent-history window. The camera uses the active speaker, and focus is displayed numerically to remain readable at higher levels.

## Narrative boundary correction (6 September 2026)

Full campaign clues and outcomes remain server-side. A generated `shared/campaign-map.ts` exposes only room ID, title, chapter number and chapter name for navigation. The production build rejects client bundles containing authored future clues. Encounter content reaches the browser through its current public save.

Every dialogue request identifies the replying character and listening hero separately from world facts. Relationship memory names the subject of feelings and decisions explicitly; legacy ambiguous Mira memories receive a request-time clarification without rewriting saves. Local, hosted and personal-key paths share this binding. A real Luna check previously reversed the participants; after this correction both tested phrasings preserved Mira’s agency. This is bounded evidence, not a guarantee of all generated dialogue.

## Campaign consequence and victory boundaries

PRD-25 belongs to the rules engine: expedition victory sets `<room>:defendersDefeated`, writes a `victory:<room>` fact, and ends initiative. A later `exp_choice:0/1` command writes the canonical decision, once-only room XP and `<room>:resolved`. Both choices are legal without a second check after victory, including when the hero is downed. Existing saves with `<room>:resolved` remain completed; no history is silently rewritten.

PRD-26 is authored privately in `server/campaign-consequences.ts`. A link requires a confirmed source-choice flag and a matching current room. `exp_ally:<id>` claims it atomically through the existing command/revision transaction. `aid:<id>` persists the once-only claim; `consequence:<id>` exposes the actual result to the journal and AI. Preparation reduces the target DC by 3 (no stacking); diversion reduces the initial defender count by one; supplies add one potion per party actor; treatment restores HP without restoring focus. These effects use the same derived values in legal-action descriptions and resolution. No provider call can grant a link.

Public save projection adds only currently available witnesses as NPC entities with an optional `modelClassId`. Mira’s assistance targets the existing party actor, avoiding a duplicate model. Full source-target mappings remain server-side. Verification: `backend-consequences.test.ts` covers all ten actual source decisions and opposite paths, once-only effects, reload, altered check resolution, defender counts and legacy saves; `backend-expansion.test.ts` covers post-combat choice for all enemy archetypes.

## Pacing instrumentation (PRD-27)

`PlayClock` consumes monotonic timestamps and explicit visibility/focus/play-phase transitions. It clips intervals at the120-second input-idle deadline, excludes observation gaps over5 seconds and never backfills idle time on the next input. Exploration/combat/conversation sum to active play; network waiting and excluded time remain separate.

`usePlaytest` owns browser listeners and periodic persistence. Each mounted adventure session writes a unique `echoes-playtest-v1:<saveId>:<randomId>` record, so two tabs never overwrite a shared counter. Export aggregates validated records for that save ID only. Switching saves cannot append the new room or ending to the previous adventure’s record. No game backend endpoint receives these records; localStorage denial falls back to current-visit counters. Download is an explicit user action. Browser timers can miss sustained reading or sleeping, so these measurements are estimates and cannot substitute for supervised playtest evidence. `backend-playtest-clock.test.ts` covers phase boundaries, visibility, focus, completion, timer suspension, idle clipping, reactivation and malformed persisted totals. Browser acceptance remains required.

## Feedback correction: shared creation and explicit AI mode

The shared Zod creation schema accepts optional strict companion setups, each containing a supported class, race and palette. Legacy defaults remain Mira/scout/elf/moss and Oren/guardian/dwarf/ember. The engine builds actual class statistics from these choices; no client-supplied HP/resources are accepted. The preview receives all creation selections. Model bounds derive from the original unattached source scene independently of the scaled clone, preventing cumulative resizing during race changes.

Client AI mode is in page memory and defaults to `off`. Mutations send `x-echoes-ai-mode`; only `sponsored` enables server-funded AI. The hosted request uses an environment without its AI key for other modes; the local server gates paid dialogue, audio, transcription and freeform interpretation and only plans companion turns for explicit sponsorship. Personal-key routing never falls back to owner billing. No migration or extra credential persistence is introduced.

Regression coverage: all16 companion class/race combinations, invalid setup, legacy defaults, free-mode provider exclusion and hosted budget non-reservation. Browser QA completed a newly customized party’s opening through Vark combat, the ending, reload and ChapterII continuation. Mode selection was tested with an inert placeholder rather than a paid key; reload reset to Free. That earlier UI check alone does not establish paid generation. The later six-case personal-module live evaluation succeeded from Node; full browser BYOK voice acceptance remains open.

## Feedback revision implementation

PRD-31 is owned by client/own-ai.ts and App.tsx: a direct small Responses request checks candidate access, without retaining the key until success. A generation counter invalidates late callbacks after disconnect/mode change. Explicit status text announces the result. No key is sent to the game server.

PRD-32 is owned by shared/ai-context.ts with groundedDialogueSchema used by browser, local API and Worker. Known IDs are enumerated from the supplied facts; zero facts means maxItems 0. The prompt explicitly permits scene narration with no citations and supplies `availableActions` IDs/labels for valid suggestions. Post-generation validation remains mandatory. A reproduced live failure invented scene/entity citation IDs despite valid text; tests now exercise that empty-fact contract. Refusals/truncation are handled separately in personal mode.

PRD-33 is owned by World.tsx, style.css and AssetReview.tsx. KayKit source licenses are recorded in DESIGN_REVISION.md and public/assets/kaykit/LICENSE.txt. Browser-only local asset review loads every inventory model, compiles materials, samples animations and reports errors. Runtime success is not a visual certification of all frames. Generated equipment that floated independently was removed; source rig attachments are retained with optional extras hidden.

## Curated expansion architecture and current implementation boundary

New requirements EB-28–33 above are approved work. Keep echo-v1/PublicSave schema1 unchanged until a discriminated versioned campaign adapter and storage tests are ready. No reinterpretation of existing four-attribute saves as six-ability actors is permitted.

| Requirement | Owner | Verification |
|---|---|---|
| EB-28 | visual-identity, WorldLabels, label-layout, IsolatedAsset | deterministic layout tests; duplicate names; class changes; browser screenshots; missing-model retry |
| EB-29 | curated-rules, tactical-grid, future versioned campaign adapter | bounded resources, death/concentration, walls/terrain/LOS, command idempotency and legacy save tests |
| EB-30 | companion planner and turn controller | legal priorities, no-action fallback, one-turn takeover, sequential presentation |
| EB-31 | quest/inventory/camp modules and slice content | alternative completion routes, once-only rewards, checkpoint/resume, human slice playtest |
| EB-32 | existing own-ai/API/voice boundaries | real browser connection, grounded dialogue, billing isolation, interruption/error recovery |
| EB-33 | campaign graph/content and playtest clock | full-route traversal plus three first-time human reports |

The central world-label layer projects registered anchors, skips occluded/offscreen targets, and places higher-priority labels first within the visible canvas excluding HUD rectangles. Labels that cannot fit remain selectable in the target menu. Actor visual IDs are optional for backward compatibility and separated from rules class. Per-model Suspense/error boundaries prevent an individual GLTF failure from blanking the scene; an accessible model-error strip offers retry even when the world anchor is occluded. Browser evidence currently covers the opening at1440×778, clickable target selection and no measured HUD/label collisions. Full scene/viewport and injected model-failure certification remains pending.

The isolated curated-rules module implements bounded1–8 stat/slot initialization, resource spending, temporary HP, concentration checks, healing and death-save primitives. It is connected to the opt-in tactical preview through the integration adapter described below. Preset abilities and starting AC are curated game defaults; subclass features, equipment-derived AC, conditions, rests and level-up selections remain implementation work. See public/SRD-NOTICE.txt for licensed source attribution.

The isolated tactical-grid module uses five-foot cells, equal-cost diagonal movement with no corner cutting, difficult terrain and a conservative supercover line of sight. Circular area previews include allied targets and respect walls. Coordinates are grid cells, distinct from existing echo-v1 scene meters. Future adapters must map rendered positions explicitly; do not pass legacy positions into this module. Cover grades, occupied-cell rules, elevations and combat integration remain pending.

### Integration follow-up

`server/tactical.ts` is now reached by explicit creation rulesVersion and combat dispatch. `Save.tactical` stores actor mechanics and cell positions; `projectTactical` derives the legacy-shaped visual actor fields. The existing exploration adapter presently copies authored health changes back at its boundary; it must be replaced by typed curated check/damage/rest events before full rules acceptance. `assertSaveVersion` protects both local and hosted reads from unsupported versions and missing tactical actor data. API tests cover new creation/read/action retry and legacy defaults.

Turn commands use the existing revision/idempotency transaction. `tactical:auto` resolves one legal decision, so movement and attack are separately observable. Companion takeover is permitted only before the automatic turn has started. Directives currently drive deterministic choices; model-generated tactical proposals are not yet integrated. No paid AI is invoked by those commands. Movement costs are authoritative; the client only previews offered destinations. Committed presentation frames include tactical state and visual projection to show the resolved resource state.

The preview is not yet ready for full campaign rollout: ranged class attacks are a small provisional catalog, equipment-derived stats and subclasses remain pending, and the generic grid must be replaced by scene-authoritative blockers/cover. The source build is ahead of public Sites version10 and has not been deployed by this checkpoint.

Class actions now use optional per-actor resource records with safe defaults for earlier preview saves. Beginning a turn resets per-turn counters while preserving rest-limited charges; the current rest adapter restores charges. Spell actions explicitly consume the relevant action type and slot. Bless effects record source/targets/remaining rounds and require matching active concentration; save/attack resolution includes its bonus. Committed playback records slot/action state. Tests cover over-spending, Extra Attack/Surge boundaries, Sneak Attack eligibility, Champion criticals, Sacred Flame saves and Bless cleanup. Higher-rank casting, reactions and broader class/subclass coverage remain pending.

The goblinoid death pipeline now rebases pelvis translation for Death only; geometry tests evaluate actual skinned vertices at the final pose. Tactical actor presentation includes optional `motion` metadata (event ID and world-space waypoint positions), preserving legacy save compatibility. The client consumes it only when the motion ID changes after mounting; refresh uses saved coordinates. Root transforms no longer snap to final coordinates on each render. Movement interpolation is independent of rules resolution and cannot spend movement or change the confirmed destination.

### Inventory and camp implementation checkpoint

`shared/logistics.ts` owns item identifiers and shared ownership/loadouts. `server/logistics.ts` validates equipment/rest actions against current legal actions before cloning and resolving. `server/tactical.ts` derives AC from loadouts when projecting mechanics, preserving gear across combat and level transitions. Optional logistics defaults preserve older preview saves; Echo Rules behavior remains unchanged. Camp and equipment actions use the existing revision/idempotency API boundary. No item filename determines mechanics.

Rest permissions persist per scene. Short rest spends at most one Hit Die per conscious injured actor, restores one Second Wind and Action Surge, and performs bounded Wizard Arcane Recovery. Long rest consumes pooled rations, restores living actors only, and clears recovery usage. The opening cloak reward is guarded by both cache transition and a durable reward ID. Tests cover save serialization, repeated rest/loot rejection, equipment exclusivity, class proficiency, dead actors, pooled supplies, unsafe locations and Arcane Recovery across camps. Full armor-model adaptation and broader loot authoring remain pending.

### Quest state and reward boundary

`server/quests.ts` declares stable quest IDs and evaluates authoritative scene/choice flags. `shared/quests.ts` is the public view; it contains only activated arcs. `applyAction` runs quest synchronization after all resolution paths, including tactical turns and logistics. Step completion and terminal states persist in optional save data; previously recorded achievements cannot regress during retreat. Decline is a validated action using the existing revision/command protocol. Rewards use a durable private flag and are added in the same resolved save. Reading old preview saves derives progress without retroactive rewards or mutations; legacy Echo Rules remains unchanged.

`client/QuestJournal.tsx` separates active, completed, missed and declined objectives. The journal retains keyboard focus and supports Escape; optional refusal closes the journal and uses the existing confirmation dialog. Tests cover failed checks, once-only supplies, refusal/reload, past opportunities, old save compatibility, hidden future arcs and a full peaceful traversal completing the 30 tracked records. These traversal tests prove reachability, not pacing or unique side-quest content.

### Authored side-adventure boundary

`server/side-adventures.ts` owns private meetings, evidence, outcome flags and conditional public entities/actions. Action validation requires the right scene and accepted request before evidence or resolution; completed/declined quests expose no further commands. Public entities use canonical NPC names and existing licensed Cleric models, with friendly presentation. Only observed evidence/outcomes enter save facts for AI grounding. Testimony contributes a maximum three-point preparation reduction through `campaignEffects`, matching both action preview and resolution. Rewards and choices persist in the same action transaction.

Quest steps now preserve progress by matching their label rather than array position, avoiding accidental completion when an old checklist is replaced by a new task. Previously completed preview quests retain their terminal status and cannot collect new rewards. Eight further optional records still need this authored treatment.

### Side-adventure resource and timing validation

Side choices declare ration costs, potion/ration rewards and optional preparation targets. Legal actions omit unaffordable choices and preparation whose target is already resolved. Resolution validates first, then deducts pooled rations and applies the selected reward atomically with outcome flags. Generated action descriptions report exact resource effects. Twenty outcome routes are tested alongside missing-evidence and duplicate-command rejection, zero-supply free alternatives, save migration and real DC reduction. Current content has ten authored later requests; no read-all checklist remains in the active definitions for them.
