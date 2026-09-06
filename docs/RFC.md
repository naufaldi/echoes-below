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

### Exploration healing boundary fix

Browser QA exposed legacy `campheal` on a curated Fighter after combat. The curated legal-action wrapper now excludes old camp healing and personal-potion commands and delegates to `server/exploration-healing.ts`. Validation uses tactical HP, death status, class, slot and inventory state before any dice or mutation. Resolution consumes the correct resource, projects mechanics before recording presentation, and preserves existing action revision/idempotency behavior. Tests cover slot use instead of focus, Fighter self-only recovery, 2d4+2 potion healing, downed/dead targets, exhausted resources and serialized state.

### Direct NPC step dispatch

`App.choose` dispatches only `tactical:auto` directly through the existing confirmation/commit implementation with an explicit action argument. It clears unrelated previews; the synchronous action lock, expected revision, retained retry command ID and single-step presentation remain shared. Other actions use the existing confirmation dialog. Browser validation resumed Spell Browser QA, ended the hero turn, selected Let Goblin guard act once and received exactly one 20-foot movement playback with the guard still active. No confirmation dialog was inserted. Enemy class-resource labels are hidden in TacticalControls; engine special-feature guards were already party-only.

### Chapter atmosphere rendering

`client/ChapterAtmosphere.tsx` owns deterministic chapter colors and geometric landmarks. World uses the same chapter definition for fog, lighting and instanced floor tint; changing chapters refreshes instance colors. New solid landmarks sit outside ±4.8 world units, the current tactical grid footprint. Existing later-room furniture is moved outward; opening layouts are preserved. Geometric scenery uses local Three.js primitives and adds no third-party license requirements or texture downloads. Further visual review must check all five themes, room-specific layout, prop bounds and label occlusion.

### Durable speaker presentation

GameLog adds optional `speakerName`; server logging snapshots canonical actor identity before actors leave the scene. The original speaker ID remains the identity key for rules and AI. `shared/speaker-label.ts` renders saved names first, then current actors and explicit legacy mappings. Unknown old rules IDs display Creature rather than leaking implementation identifiers. React text rendering preserves name escaping. Tests cover duplicate-enemy names after scene removal and legacy fallback.

### Enemy roles and encounter selection

`shared/enemy-roles.ts` separates authored role mechanics from model files. `server/encounters.ts` selects rosters and six boss names per scene for new curated combats. Existing in-progress actors without role IDs retain fallback mechanics; Echo Rules encounter construction is unchanged. Initiative/speed/range/damage use the role where present, with line-of-sight and close-range disadvantage still applied. Diversion removes an escort, never the first boss; the opening alarm can add a scout.

Tests count actual authored coverage, instantiate every roster, verify ranged attacks from spawn, preserve old combat data and resolve each encounter using favorable controlled dice within a step bound. They do not certify normal-dice difficulty. Models reuse available assets; distinct ranged weapon/bolt animations and broader visual role readability still need verification/adaptation.
### Protect-directive movement regression

The previous automatic movement scorer used the hero cell as its goal for every Protect decision. With no healing available, a surviving companion could repeatedly move near a fallen hero while a ranged enemy remained alive. Protect now selects a nearby threat to a conscious hero when present, otherwise the nearest living enemy. A movement must strictly reduce distance to that target; otherwise the actor dodges or ends its turn instead of oscillating. This heuristic is validated for the current dungeon grid; complex obstacle layouts require path-to-attack-position scoring before introduction.

`tests/backend-protect-movement.test.ts` reproduces the bug against the original code and passes with the fix for both downed and safe heroes. `scripts/audit-combat-balance.ts` runs seeded legal-action simulations without provider calls. The depleted report compares 96 independent encounters: before the fix, 73 wins, 11 defeats and 12 unfinished runs; after, 91 wins, 5 defeats and zero unfinished runs. Each run starts with half HP, half spell slots, no potions and otherwise fresh class charges. The separate baseline report contains 192 fresh-resource runs from before this fix. Neither audit measures human playtime, campaign attrition, presentation quality or full tactical balance.

### Free party conversation checkpoint

server/party-checkin.ts owns authored check-in availability and resolution. Existing revision/idempotency and saved-log boundaries apply; private flags prevent repetition after reload. No provider or dice call is made. App uses the legal action when AI is unavailable and preserves the existing AI conversation path when enabled. Tests cover persistence, chapter gates, unchanged resources and unavailable states. Browser QA on Release QA confirmed a free Mira reflection rendered after confirmation and its button became unavailable afterward. Full voice and later-chapter visual acceptance remain pending.

### Higher-level casting checkpoint

Spell action IDs retain their original form at level 1 and append the selected level for higher casting: tactical:missile:guard-1:3, tactical:cure:mira:2, tactical:healing_word:mira:4, tactical:bless:2, recover:cure:hero:mira:2. Resolvers accept only a currently generated legal action before parsing the level, rolling dice or mutating state. Each spell consumes exactly its chosen slot, preserving other ranks. Cure Wounds and Healing Word use two dice per slot level; Magic Missile uses slot level plus two darts. Supported Life Domain healing uses the selected slot level in its bonus. Bless has no extra beneficiary in the current three-member party and explains this tradeoff. Magic Missile remains a single-target curated adaptation; split targeting is still outstanding.

Verified against [official spell descriptions](https://www.dndbeyond.com/sources/dnd/br-2024/spell-descriptions) and [SRD 5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf). Tests cover every supported rank, slot depletion, healing scaling, action economy, invalid IDs, concentration and serialized exploration healing. Browser selection and presentation validation remain pending.


### Rescued courier visual state

After any successful rescue route, the courier’s label becomes Rescued courier and the model stands outside the open cell. Public scene projection derives this from the saved rescue flag while retaining the courier entity ID, so old saves receive the correction without changing identity or quest state.


### Counterweight maintenance puzzle

server/counterweight-puzzle.ts owns legal control actions and saved stage flags. Action requests use counterweight:read/pawl/weight/pin/reset. Legal-state validation occurs before cloning or mutation. Reading stores the procedure as a public fact; completion reuses the maintenance fact and its existing once-only XP key. Wrong ordering sets the same alarm boolean used by authored enemy reinforcement. Control state survives serialization; spent traps, unconscious heroes and other scenes expose no controls. Tests cover the full sequence, interruption/reload, wrong order, reset, alternate route, spent traps and no trap damage after completion. The chain interaction target now has state-driven pawl, weight and pin controls, described below.


### Counterweight visual feedback

The public scene now projects only observable pawl, weight and lock states. A local 3D mechanism uses those states for lever rotation, counterweight height and pin position, with immediate placement under reduced motion. Clicking the model focuses the existing chain target. Labels describe each stage and identify a spent floor mechanism. The old decorative hanging weights are removed. Local browser QA completed read → pawl → weight → reload → pin; state and labels persisted. No new downloaded assets are required.


### Tactical AI proposal integration

PublicSave.tacticalProposal exposes the active living companion’s legal choices and directive only during automatic tactical turns. shared/tactical-planning.ts supplies a shared prompt, constrained action schema and validation for personal browser AI, local OpenAIProvider and hosted planning. Local and hosted action routes invoke planning for tactical:auto; personal mode sends the key directly to OpenAI and forwards only the selected action map to the game server. Existing mode authorization, spending reservations, expected revision and duplicate command boundaries remain in place. Personal proposals are cached by command ID for retries. The engine revalidates a proposal against current options before resolving exactly one step, falling back for invalid IDs. Enemy and hero proposals are never executed through this route. Tests use a mocked provider to verify dispatch and validation; real paid browser latency and evaluation quality are still unverified. Full legal movement choices remain available to the planner; redundant movement descriptions are omitted from its payload to limit context size.


### Sponsored tactical retry boundary

Local action integration tests cover simultaneous same-command requests, identical replay results, one provider call, one revision, free-mode exclusion and provider failure. Hosted planning now claims (owner, command ID) in planning_requests before the provider call, validating the request hash on reuse. Completed results are reused. A pending claim returns AI_PENDING for 90 seconds; an older abandoned claim returns an empty plan and deterministic fallback without a second purchase. Failed producer attempts persist an empty result. This favors bounded cost over retrying the same uncertain provider request. The additive generated migration is drizzle/0001_chunky_patriot.sql. Tests apply all migrations and exercise claims through distinct Store instances; the version 12 deployed D1 table was verified; real-provider latency remains to be verified. No claim is made that unrelated dialogue/audio requests share this planning-specific mechanism.


### Durable ability advancement

`shared/curated-rules.ts` stores optional `improvements: {level, first, second}[]` on each curated character. Missing arrays on older saves mean unspent eligible milestones. `makeCharacter` reapplies saved choices while rebuilding higher-level statistics. `improveCharacter` validates milestones, ability identifiers and cap 20, applies Constitution’s modifier delta across current levels, and preserves other resources. `server/advancement.ts` exposes canonical `advance:<actor>:<level>:<first>:<second>` inventory actions; only the oldest eligible milestone is selectable. The resolver validates the complete ID against current legal choices before mutation, projects updated statistics/equipment armor, logs the decision and increments revision once. Existing request revision and command deduplication boundaries apply. No database migration or provider call is required.

`PackPanel` exposes score/modifier values and two point selectors, normalizes their order, and uses the existing confirmation flow. The main inventory button signals available advancement. `awardExperience` preserves choices during rebuild, keeps unconscious characters at zero HP, and reprojects armor after level changes. Six regression tests cover companion selection, serialization, later XP progression, Constitution/resource preservation, caps, Fighter’s extra milestone, malformed/state-invalid requests, downed state and equipment defenses. Local browser validation of the new panel is pending while the Mac is locked.

Rules references verified 2026-09-06: [official Ability Score Improvement feat](https://www.dndbeyond.com/sources/dnd/br-2024/feats) and [official class progression](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). This feature uses the existing SRD attribution and remains a curated subset.


### Vark parley boundary

`server/vark-parley.ts` owns once-only `parley:prisoner`, `parley:ward` and `parley:evidence` actions. They require the bell scene, curated exploration, a conscious hero and no active companion story. Evidence additionally requires saved rescue/seal-knowledge flags and both preceding questions. Exact legal IDs are validated before cloning; each action appends a grounded public fact and authored Vark log, sets its flag and increments revision. No XP or provider call occurs. Shared `parleyDC` supplies both displayed and resolved negotiation difficulty. Legacy difficulty remains 16. Regression tests demonstrate that a roll which fails unprepared succeeds after evidence, plus serialization, repetition, missing proof and invalid-state handling. No additional asset or animation is implied by the exchange.


### Short-rest continuation

Optional `Logistics.shortRestScene` identifies an active rest window. `camp:short` opens it; `camp:hitdie:<actor>` validates the same safe scene and a living, injured, conscious member with remaining Hit Dice. Each choice heals once, spends one die, logs the resolved roll and increments revision, with no extra tick or class recovery. `applyAction` closes the window after any other successfully resolved action; rejected requests do not close or mutate it. Existing request deduplication applies. Older saves without the optional field have no active rest window. Tests cover serialization, depletion, class-recovery isolation, exploration interruption and ineligible members.


### Label anchors and authored speaker selection

`placeLabels` retains projected `anchorX/anchorY`, rejects non-positive dimensions and anchors inside HUD rectangles, and keeps its existing collision-free placement. `WorldLabels` renders pointer-transparent SVG leaders to the closest label edge, with an anchor dot. Selected labels allow 240px and two lines. `client/session.ts` now derives both narration text and speaker from one filtered entry list, retaining legacy creation-log filtering. A named heading requires all displayed entries to be authored by the same non-DM speaker. The default scene description has no named speaker. Regression tests cover covered anchors, invalid dimensions and opening/check-in/scene-entry heading identity.


### Narrative overflow presentation

`NarrativePassage` measures scrollHeight/clientHeight on text changes, resize and scroll, exposes a described keyboard-focusable paragraph, and updates an overflow hint. Text changes reset scrollTop; ResizeObserver disconnects on cleanup. No gameplay or audio state changes. Local typecheck passes; long-passage interaction is pending browser confirmation.


### Local playback layout correction

CSS targets `.turn-playback:not(.with-roll)` for the bottom result panel, retains existing focus containment and committed-frame logic, and hides the older narration beneath it. App suppresses its busy toast during playback. Last-roll markup moved into the party sidebar with static positioning, retaining responsive scrolling. No rules, save format or provider behavior changed. Rendered local screenshots verified movement visibility and removal of the sidebar overlap.


### Dice geometry

`client/die-geometry.ts` centralizes the existing Three.js primitive choices and adds D12’s dodecahedron plus a D10 pentagonal trapezohedron constructed as ten planar kite faces. The alternating ring height is derived from the pole height and cos(pi/5) so each kite triangulates coplanarly. Outward triangle orientation is verified; geometry is memoized by side count and disposed on replacement/unmount. Two tests count distinct outward face planes for all supported dice and verify D10’s closed triangulated surface and twelve vertices. The old mapping was observed to fail with 20 planes for D10. Reference: [Wolfram MathWorld trapezohedron](https://mathworld.wolfram.com/Trapezohedron.html). Browser inspection of a new D10 roll remains pending.


### Local tactical terrain update

Curated encounters use seven authored terrain arrangements across the opening and five later chapter environments. Solid stone pillars block movement and sight; amber rubble costs 10 feet per entered cell. Terrain is shown during combat and explained beside the turn controls. Exploration target labels are suppressed in combat so unavailable camp/clue interactions do not obscure actors.

The saved tactical grid owns both pathfinding and 3D terrain. New battles select their scene profile; resuming an existing battle retains its saved grid. Autonomous movement follows a complete legal route to an adjacent attack cell and can initially move away from a target to navigate around a wall. It respects living actor occupancy, difficult ground, movement budget, and blocked diagonal corners. Unreachable targets produce a defensive/end-turn fallback.

Verification: regression tests cover connected spawn cells across every authored encounter, disjoint terrain, independent layout copies, wall detours, insufficient movement and sealed targets. A local browser encounter at The Sluice Stair rendered the saved pillars/rubble and resolved an enemy attack with a visible die presentation. This is incremental local evidence, not campaign-duration or full visual acceptance. No deployment in this checkpoint.


### Local action-animation correction

Curated combat logs and presentation frames now carry an optional explicit animation cue (melee, ranged, spell, item or dodge). Spell and defensive actions produce a presentation even without a die roll. The renderer consumes confirmed cues and ignores AI prose; older attack logs retain a compatibility fallback. Rogue ranged attacks use the shipped shooting clip, while spell actions use the casting clip. Action clips play once; idle and walking loop. Repeated attack events restart their clip.

Verification covers Magic Missile, Sacred Flame, Bless, ranged attack and Dodge cues through rules resolution, presentation and serialization. All seven shipped character GLBs resolve locomotion, death and attack clip names; KayKit casting/ranged names are checked explicitly. This validates mappings and data flow, not all on-screen animation poses or weapon/projectile alignment. Local only; no new deployment.


### Local target-focus correction

Selecting a focus no longer silently substitutes all actions when that target has no legal action. Matching actor/target actions and untargeted controls remain available; an explicit message and Show all actions control explain an empty focus. Combat target menus exclude exploration props. The tactical heading uses the same canonical enemy names as initiative and world labels.

Verification: three regression tests cover unavailable targets, matching targets, global controls, actor focus and clearing. Local browser selection of Slime brute retained that focus, displayed guidance for the automatic Acid spitter turn and retained its advance button; Show all actions reset the selector and removed the message. Client type check passed. This checkpoint does not deploy or establish full-campaign acceptance.


### Local Scrit inquiry expansion

After Scrit’s initial introduction, the curated opening offers separate questions about stolen supplies and the captive. Hearing both unlocks his account of the seal’s purpose. Dialogue records only witnessed facts, grants no repeatable XP and remains optional. Existing ration, distraction and combat routes remain available. Responses acknowledge a key already transferred to the party.

A party that fed Scrit and heard about the captive may spend one additional ration to cancel an existing alarm. This removes its extra scout from the later Vark encounter; subsequent disturbances can raise a new alarm. The offer is unavailable without supplies, after combat victory, in combat, after slipping past by distraction or outside the cookfire scene. Each exchange persists and resolves once.

Verification: regression tests cover question prerequisites, persistent knowledge, duplicate rejection, supply cost, unavailable/hostile states, two-versus-three-enemy boss rosters and a later renewed alarm. Browser presentation of these new exchanges remains pending. This adds narrative choices and a resource consequence, not proof of a two-hour opening or 24-hour campaign. No deployment.


### Local narrative playback and revision verification

A fresh free-mode Elf Wizard (Scrit QA) reached the cookfire via the side ledge and completed the three Scrit questions through the browser. The second question unlocked the ward question; each consumed question disappeared. Long text displayed a scroll hint, accepted Page Down while focused, and changed to the end-of-passage hint. The next passage reset to its beginning. Reload/Continue retained character, location and completed questions. Offering a ration afterward reduced supplies from three to two and opened the prison route.

This playthrough exposed a quest-log revision bug: quest/loot hooks run after the resolver increments the save revision, so their log entries were stamped for the following action. The action commit boundary now assigns every newly emitted log and presentation log to the resulting revision, preserving earlier log entries. The regression traverses the quest completion and following Scrit conversation, including serialization, and verifies that the old reward does not contaminate the next speaker heading. All 203 tests and server type checking passed. Existing historical logs are preserved, not rewritten. No deployment or campaign-duration acceptance is claimed.


### Local production asset package gate

The production build now runs `scripts/verify-asset-bundle.mjs` after Vite and before worker assembly. It checks every shipped GLB/glTF, literal character/scenery model references, external buffers and image dependencies. Source and bundled files must have identical SHA-256 hashes; glTF buffers/views must fit their declared data. Remote dependencies and references outside public assets fail the gate.

Local result: 45 models and 51 bundled files verified, including six external `.bin` dependencies. Detailed per-model hash, byte size, mesh/skin/clip/image counts are written to ignored `data/asset-bundle-verification.json`. The regression test omits Bookcase_2.bin and separately changes Knight.glb in temporary copies; both fail with the specific dependency/model identified. This guard proves bundle completeness and structural bounds, not rendered appearance, rig compatibility or every animation pose. Production build was checked locally; no Sites deployment occurred.


### Local personal-key provider verification

A bounded live evaluation used the existing authorized project credential through the personal-key module: six short replies generated successfully, plus a 74,496-byte speech response. Reviewed outputs maintained Mira/Oren identity, declined future-secret disclosure and declined a fabricated victory/inventory claim. The artifact is `artifacts/verification/personal-narrative-feedback.json`; no credential is included. These are Node module calls, not microphone capture or browser playback, and do not certify all generated responses.

Connection checking now requires a completed provider response with usable output text before the UI may show Connected. HTTP 200 with failed/incomplete/empty/refused or unreadable data is rejected. Network failures and timeouts have actionable messages and do not retain a candidate key. Tests cover these states and existing 401/403/429 handling. No new credential configuration or deployment occurred.


### Local browser voice checkpoint

On the Scrit QA adventure, selected the existing local shared allowance with automatic speech enabled. Let the DM narrate returned a grounded recap of the ration/key exchange. The browser exposed Stop; Stop returned to Listen. Listen replayed the saved narration and later returned to Listen without an error. No microphone input was captured, and subjective voice quality was not assessed. This is local sponsored-path browser evidence, distinct from the personal-key module evaluation.

Settings showed $0.1204 of local budget accounting after this test. Local speech uses a conservative $0.12 reservation, so the UI now explicitly labels the total as estimated budget accounted, not actual OpenAI billing. Usage refreshes when settings opens or speech changes state, with stale responses discarded after changing adventures. Public deployment remains unchanged.

Free-mode transition QA also exposed a stale enabled Listen control. Narration and journal replay controls now disable when AI is unavailable, with settings guidance; the generated text remains readable. The local browser confirmed Voice unavailable after switching back to free story mode. Client type checking passed.


### Curated Dash action (local)

Every conscious creature with positive Speed and an available action can take Dash: spend the main action and add current Speed to remaining movement for this turn. Movement is selected afterward and retains terrain/occupancy costs. Rogue Cunning Dash remains a separate bonus action; Fighter Action Surge can fund another Dash. No roll is required. Reference: https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game and SRD 5.2.1 https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf .

Automatic creatures can Dash when movement is exhausted and a legal approach exists. Saved turn state records the intent to use that movement; fallback advances on the next step instead of ending immediately. It stops on reaching an adjacent target and clears the intent when the turn changes. Tests cover spent movement, modified Speed, both class combinations, duplicate rejection, unconscious/zero-speed actors, save serialization and the automatic Dash/move/end sequence. Browser presentation and broader balance under the new action remain pending. No deployment.


### Chapter II Bell Index puzzle (local)

The curated Bell Index now includes a three-slot catalogue console. Reading its rubbings teaches the meanings of Witness, Keeper and Vessel, and their ordering clue. The player places unused plates, can reset safely, and submits the complete order. A wrong order resets without damage or blocking alternative choices/combat. Correct order records Ilyra’s name, but the room remains unresolved until the player chooses its outcome. Restoring the name then needs no random check, including after an earlier failed persuasion attempt. Puzzle steps grant no farmable XP; the existing room decision reward remains once-only.

Saved boolean slot flags project into `scene.bellIndex`; the original bronze console renders occupied slots and a solved color from that state. Controls require a conscious hero, exploration, the correct scene and an unresolved room. The console is hidden during combat. Legacy Echo Rules progression is unchanged.

Tests cover prerequisites, duplicate plates, partial-sequence serialization, wrong-order recovery, final decision without dice and unavailable contexts. 213 tests plus client/server type checks pass. The new console’s actual browser appearance remains pending; this content addition does not establish campaign duration. No deployment.


### Bell Index browser and missing-character correction

A separate Bell Index Visual QA fixture tested the room directly. The browser read the clue, placed Witness/Keeper/Vessel, submitted, reloaded and retained the solved state. The restore-name action lost its DC indicator, resolved without dice and awarded the existing 125 XP decision total. This is controlled room QA, not campaign traversal.

The inspection found that the described librarian and sentinel lacked exploration entities. The room now projects a bronze adaptation of the shipped KayKit Knight and the shipped skeleton, with name-restoration decisions targeting the librarian and combat targeting the sentinel. Both models were visually observed. Combat suppresses these exploration duplicates. Once resolved, the sentinel disappears and the restored librarian is named Ilyra; the scene description reflects the chosen outcome instead of describing the earlier captive drawer. Scene projection regression and client/server type checks pass. No deployment.


### Saved infirmary preparation and exploration presentation

`server/infirmary.ts` owns legal preparation actions, resolution and public scene projection. Boolean `infirmary:inspect`, `:signal`, `:brace`, `:drain` flags use the existing versioned save envelope. Empty flags preserve existing saves. Steps append witnessed facts and increment the revision; normal command deduplication remains at the API boundary. `infirmaryPrepared` is shared by action availability and dice resolution so a no-check preview agrees with the engine. Final rescue uses the existing `archive-4:choice:0` consequence and once-only reward IDs, with a prepared outcome describing the retained medicine. Future medic assistance uses wording valid for either rescue approach.

`scene.infirmary` projects braced/drained/rescued state. Optional entity elevation drives the NPC group and its label anchor together; old entities default to floor height. `InfirmaryMechanism` renders original cot, medicine case, tether, valve and translucent pocket geometry beside an existing shipped character model. No new external asset download is required. The scene hides the mechanism and NPC during combat. This is a stylized state transition, not a fluid or rescue-motion simulation.

`client/playback-scene.ts` selects the committed scene at the reveal of the last exploration frame. Earlier frames and combat frames preserve their prior scene selection. This fixes narration describing drained water while the scene still showed suspension. `client/session.ts` keeps all non-AI entries from the current committed revision, after the latest scene-entry boundary, rather than dropping the narrative behind three reward messages. The scrollable passage handles longer outcomes. Tests cover prepared rescue, recovery after a failed rush, duplicate/unavailable commands, serialization, resource/XP invariants, NPC height, both endings, final frame selection and rescue plus level-up narration.


### Opportunity attack boundary and presentation

`server/opportunity.ts` exposes the same reach/visibility/resource predicate for movement previews and resolution. `server/tactical.ts` resolves a selected path one cell at a time. Before each departure it flushes previously traveled movement, resolves eligible opposing reactions in initiative order, and stops if the mover falls. Each segment has a distinct motion ID; each reaction has a committed frame. The transaction remains one action request and one revision, covered by the existing command deduplication boundary. Presentation neither rerolls nor resumes server resolution. Refresh adopts the already committed result.

Fixed curated party melee loadouts are longsword (Fighter), dagger (Rogue), quarterstaff (Wizard), and mace (Cleric). Authored melee enemy profiles retain their weapon and reach; ranged profiles use short-reach sidearms/natural attacks rather than their ranged action. These loadouts are rule data, not newly acquired inventory items. Reactions honor Dodge, Bless, critical dice, concentration saves and eligible Rogue Sneak Attack. Sneak Attack availability resets each creature turn, allowing an off-turn reaction after using it on the Rogue's own turn. No Extra Attack or main action is granted or spent by a reaction. Full weapon inventory, opportunity-specific equipment poses and additional reaction spells are separate remaining work.

Optional `tactical.reactionPolicy` defaults missing entries to automatic, preserving prior curated saves. Holding a reaction never consumes it. `features.disengaged` persists through save serialization and clears on the owner's next turn. Beginning combat resets reaction readiness and stale Disengage flags. Echo Rules do not enter this resolver. `GameLog.actionKind = reaction` is explicit metadata, independent of prose. During client playback only, `PublicSave.activeReaction` marks the reacting actor for labels; this is not a pending rules action or persisted turn change.

Verification covers before-departure timing, multi-enemy reactions, partial path interruption/cost, repeat movement with spent reactions, serialization, Disengage economy, reach 10, blocked sight, unconscious attackers, reaction refresh, off-turn Sneak Attack, concentration and companion withdrawal. Local browser fixtures verified threat preview, a d20 reaction, a separate movement frame, REACTION/REACTING NOW labels and return to the same player's turn. Fixture health was raised to isolate presentation; these are not balance playtests.


### Quest availability from the next required stage

`server/side-adventures.ts::sideNextMeeting` selects the remaining acceptance/investigation/decision location from saved facts. Both NPC/action eligibility and `server/quests.ts` consume that selection. Generic quest steps may supply an `until` position for prerequisites tied to an earlier location. The effective deadline is the earliest unfinished stage deadline, with the quest end as its upper bound. Completion is checked before expiry so finishing a step on a room transition still completes the objective. Durable completed/declined/missed states retain priority.

The public projection is read-only and supports older active records without retroactive rewards. Tests exercise actual opening travel while leaving the captive, skipped acceptance/evidence/final meetings, old active metadata, retained completed status, opening prerequisite deadlines and suppression of an unreachable NPC. Existing full-campaign tests still complete all 18 main and 12 side quests without duplicate rewards. The journal explanation was inspected in the local browser.

### Local checkpoint: Scrit interaction availability
`canSpeakToScrit` shares the conversation eligibility decision between the base action menu and the inquiry module. `guardsDistracted` records the outcome independently of `distractTried`; older curated saves infer successful distraction only when passage exists without food or a transferred key. Food remains once-only through `fed`, preserving resource and reward idempotency. Scene projection updates the cook label, description, and objective after negotiated passage. Regression coverage exercises ordering, serialization, legacy inference, duplicate offers, and scene projection.

### Local checkpoint: courier evidence
`server/courier-inquiry.ts` exposes legal questions and validates the same predicates at resolution. Curated-only exploration, a conscious hero, and absence of an active companion scene are required. Once-only `courier:*` flags persist the interview; corroboration additionally requires `rescued`, `inventory.ledger`, and the preceding questions. It records witnessed facts and sets the shared `sealKnowledge` capability. Vark menus and narration now refer to acquired seal evidence without assuming Scrit was its source. The canonical speaker label maps `courier` to `Courier`. Existing rescue and XP rules remain the source of rescue rewards.

### Local checkpoint: character-aware label layout
`WorldLabelSilhouette` registers an invisible local body volume under each rendered character’s moving group. The volume uses normalized model dimensions/race breadth, with a low wide volume for downed actors. The existing label update projects its eight corners into screen-space rectangles. `placeLabels` receives these separately from HUD blockers: anchors under HUD remain hidden, while anchors within a body may relocate to a safe label position. All placed rectangles avoid bodies, HUD, and prior labels. This deliberately protects conservative volumes rather than exact animated pixels; some labels may disappear in dense scenes.

### Local checkpoint: authored approach formation
`placeExplorationParty` centralizes curated placement: the leader keeps the authored approach anchor; two followers stand 1.4 units behind and 1.4 units to either side, clamped horizontally to the approach area. Room entry anchors the leader at [0,-1.5]. Existing hall approach constraints still clamp the leader behind the trap and followers remain farther back. This is authored destination placement, not a general exploration navigation solver; animation continues to approach committed positions. Existing saves adopt the formation on their next applicable interaction or room transition.

### Local checkpoint: attack assistance
Verified against [SRD 5.2.1, Help, printed page 183](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf). Optional `TacticalState.attackHelp` stores source/target pairs separately from concentration effects. Menu legality requires an available main action, an opposing conscious target within 5 feet, and line of sight. Resolution spends the action and records the benefit. Shared `consumeAttackHelp` serves normal and opportunity attack rolls, consuming all applicable benefits on that one roll. Automatic-hit and saving-throw spells do not consume it. `expireAttackHelp` runs at the source initiative slot, including skipped dead sources; a new encounter clears all benefits. Advantage/disadvantage cancel normally; Sneak Attack uses the resulting advantage or qualifying adjacent ally. UI status and roll purpose identify assistance. Missing optional arrays preserve old saves.
