# Echoes Below — Technical RFC

Version 1.0 • 5 September 2026 • Status: design complete for review; asset-file audit remains an implementation prerequisite

Project: `/Users/naufaldisatriya/WebApps/3d-dnd` • Product contract: [PRD](PRD.md).

This RFC specifies future software. It does not assert that a game, API integration, animation pipeline, or 24-hour campaign has been tested. No API calls using a project credential were made and no secret was saved. Sources were checked on 5 September 2026. Exact Bestiary free model identities could not be established from accessible listings; section 9 documents the evidence and release gate instead of inventing filenames.

## 1. Decisions and boundaries

Choose a TypeScript workspace with a Vite/React browser client, React Three Fiber over Three.js for rendering, and a Node.js/Fastify server. Use Zod schemas at network, content and model boundaries; SQLite with better-sqlite3 for local persistence; Vitest for rules/integration tests and Playwright for browser acceptance. Use npm workspaces and commit a lockfile during implementation. Select mutually compatible stable dependency versions at scaffold time and record them in that lockfile; no dependency installation is part of this RFC phase.

The browser presents state. The server is the sole writer of game facts. A pure rules module consumes validated actions and explicit dice results and produces state changes/events. A campaign module provides authored encounters and knowledge. An AI adapter produces proposals and speech text, never writes database rows. A presentation module turns confirmed events into animations. A storage module commits snapshots and events atomically.

| Choice | Reason | Alternative not selected |
|---|---|---|
| React + R3F | Familiar component composition for UI/scenes; Three.js performs rendering | Plain Three.js is viable but duplicates scene lifecycle plumbing beside React |
| Fastify server | Explicit validated endpoints and long-running local process | Browser-only API calls expose credentials; serverless adds persistence constraints |
| SQLite | Single-user transactional saves without external infrastructure | PostgreSQL adds setup before multiplayer exists; browser storage is not authoritative |
| Authored navigation graph + A* | Small scenes have predictable paths and encounter boundaries | AI steering and full physical simulation add uncertainty without benefiting action selection |
| Structured text → speech pipeline | Inspectable dialogue, clear turn ownership, independent audio replay | Realtime speech-to-speech complicates exact action confirmation and authoritative outcomes |
| Separate role-scoped AI calls | Companions receive only their knowledge | One omniscient party prompt leaks DM secrets into companion dialogue |

Local development only: bind server and dev client to loopback; server serves the production client at the same origin. Dev proxy forwards /api to the local server. Reject unexpected Host/Origin values and mutations without a session CSRF token. No remote access or unauthenticated public hosting is approved. Public release requires a separate authentication, ownership, abuse-control and deployment RFC.

### Source of truth

Game facts include health, resources, inventory, positions, initiative, encounter mode, local clock ticks, discovered knowledge, quest flags and relationship values. SQLite owns these facts. React state owns selection, panels and audio preferences; Three.js objects own interpolated poses only. AI context is a filtered view, never a competing save. AI narration cannot resolve an action retroactively.

## 2. Domain and rules

Implement Echo Rules v1 exactly as PRD section 3, with immutable class and encounter data. The rules engine has no HTTP, audio, rendering or model dependencies. Game entities use stable logical IDs; asset filenames and dialogue names are presentation mappings.

Checks: Inspect uses Insight, Disarm and Distract use Agility, Persuade uses Presence, Force uses Might. Training is +2 only for the chosen background check. Range is measured along authored walk edges for movement, Euclidean distance plus line-of-sight blockers for attacks. Navigation edges may be gated by doors, trap boundaries and encounter transitions. Path cost uses meters; zero/negative edges are invalid content.

Combat tracks movement remaining and action remaining. Movement may occur before or after the action. Confirmed Attack consumes the action even on a miss; invalid targets consume neither. Guard and Aim follow PRD expiry. A standing actor's turn is ended explicitly or automatically when no movement/action remains. Downed actors are skipped. Combat ends immediately when no hostile standing actors remain or the whole party is downed. Resources never become negative.

Dice are produced server-side using cryptographic uniform integer generation with rejection sampling (Node crypto.randomInt), never Math.random or model text. Inject a deterministic dice source in tests. Persist the exact dice and effects in the same transaction as the updated save. Animation is cosmetic and can be skipped without changing results.

Explore mode uses authored destinations and ticks; travel halts at the first unresolved encounter boundary rather than silently crossing a trap. Followers move to reserved formation anchors with collision-free navigation; unknown hazards require the leader's decision. Walking over an unobserved active pressure plate resolves the trap for the triggering actor. Following companions stop before it. Once triggered, the opening plate is spent. Cautious travel performs one detection check per actor per marked boundary; successful observation reveals a fact but does not disarm.

For the prison gate, a failed lock pick allows a Force action with no roll, one tick, and alarm=true. The noise adds the boss sentry once, not one per noisy event. Non-hostile dialogue does not consume combat actions because it is disabled during combat except the authored surrender offer. Enemy hostility is a state transition, never inferred from generated tone alone.

Rest is allowed only at a safe camp with all three ration costs payable and no active hostiles. Reject before consuming any ration if insufficient. Reward transfers and relationship changes use one-time event keys. A rescued courier always provides testimony; failed inspection cannot permanently remove the only progression key.

## 3. Action lifecycle and interfaces

A preview expires after two minutes and is a server-side proposal with a fixed save revision and authored costs. A changed revision invalidates it immediately. It never rolls dice. A normal menu choice can prepare a preview without a model; custom intent needs interpretation. Preview and commit are distinct to prevent speech errors or model interpretation from starting unwanted fights.

1. Read a public save projection and legal targets.
2. Interpret custom text into a permitted proposal, scoped to that actor's knowledge.
3. Validate actor, target, range, resources, mode, prerequisites, and revision. Return a preview or typed rejection.
4. Player confirms. The server accepts an idempotent command and marks it queued.
5. The serial per-save executor revalidates, rolls, resolves and commits snapshot/events/command result in one transaction.
6. Publish public events. Animate from the prior pose to the confirmed destination; narration is generated only from the committed public event bundle.
7. Request a companion proposal only on its turn. Commit it through the same validator. Freeze processing when the player leaves or pauses; no background party play.

### Minimum TypeScript contracts

These are design interfaces, not implemented code. Runtime schemas must enforce the discriminated unions and bounds.

```ts
type ActionKind = 'move' | 'run' | 'inspect' | 'disarm' | 'talk'
  | 'persuade' | 'distract' | 'offer' | 'attack' | 'guard' | 'aim'
  | 'heal' | 'use_item' | 'interact' | 'force' | 'rest' | 'retreat' | 'end_turn';
type Intent =
  | { type: 'menu'; action: ActionKind; targetId?: string; optionId?: string }
  | { type: 'text'; text: string };
interface ActionRequest {
  saveId: string; actorId: string; expectedRevision: number; intent: Intent;
}
interface ValidatedAction {
  previewId: string; saveId: string; actorId: string; revision: number;
  kind: ActionKind; targetId?: string; optionId?: string;
  costs: { action: 0 | 1; focus: number; movementM: number; itemIds: string[] };
  check?: { attribute: 'might' | 'agility' | 'insight' | 'presence'; dc: number };
  commitment: 'routine' | 'party'; expiresAt: string;
}
interface CommitRequest { previewId: string; commandId: string }
interface Roll { sides: number; values: number[]; kept: number; modifier: number; total: number }
type PublicEffect =
  | { type: 'health'; actorId: string; before: number; after: number }
  | { type: 'movement'; actorId: string; pathNodeIds: string[] }
  | { type: 'resource'; actorId: string; resourceId: string; delta: number }
  | { type: 'fact'; factId: string; text: string }
  | { type: 'mode'; mode: 'explore' | 'combat' | 'defeat' | 'complete' }
  | { type: 'relationship'; actorId: string; delta: number; reasonEventId: string };
interface ResolvedEvent {
  id: string; commandId: string; revision: number; actorId: string;
  kind: ActionKind; targetId?: string; outcome: 'success' | 'failure' | 'neutral';
  rolls: Roll[]; effects: PublicEffect[]; narrationStatus: 'pending' | 'ready' | 'failed';
}
interface ActorState {
  id: string; classId: string; backgroundId: string; appearanceId: string; hp: number; maxHp: number; defense: number;
  focus: number; maxFocus: number; nodeId: string;
  inventory: Record<string, number>; conditions: string[];
}
interface CampaignSave {
  schemaVersion: 1; rulesVersion: 'echo-v1'; contentVersion: string;
  id: string; revision: number; chapterId: string; sceneId: string;
  mode: 'explore' | 'combat' | 'defeat' | 'complete'; actors: ActorState[];
  encounterState: Record<string, boolean | number | string>;
  turn: null | { order: string[]; index: number; round: number; actionRemaining: 0 | 1; movementM: number };
  facts: Array<{ id: string; text: string; knownBy: string[] }>;
  relationships: Record<string, { trust: number; eventIds: string[] }>;
  explorationTicks: number; activeSeconds: number; lastEventId: string | null;
}
interface CompanionContext {
  actorId: string; personaId: string; knownFacts: Array<{ id: string; text: string }>;
  witnessedEvents: ResolvedEvent[]; relationshipSummary: string;
  legalActions: ValidatedAction[]; playerRequest?: string;
}
interface Narration {
  id: string; eventIds: string[]; speakerId: string; text: string;
  factReferences: string[]; voiceId: string;
  audio: { status: 'pending' | 'ready' | 'failed' | 'disabled'; assetId?: string };
}
```

CampaignSave is private storage; never return it raw. PublicSave omits undiscovered flags, future room layouts and facts without player visibility. PublicEffect is only the client-safe event payload; separate private events store hidden trap state and AI-independent quest changes. Internally the full actor record also resolves class attributes and trained checks through immutable class/background IDs stored at creation.

### HTTP contract

| Endpoint | Input | Output / behavior |
|---|---|---|
| POST /api/saves | name, classId, backgroundId, appearanceId | save ID + public projection; catalog IDs validated |
| GET /api/saves/:id | none | public projection, revision, command/narration status |
| POST /api/actions/preview | ActionRequest | ValidatedAction or clarification/rejection; no dice |
| POST /api/actions/commit | CommitRequest | 202 command receipt; repeated ID returns same receipt/result |
| GET /api/commands/:id | none | queued, committed result, or typed failure |
| GET /api/saves/:id/events | cursor | SSE stream of public events and narration/audio status; reconnect replays from cursor |
| POST /api/transcriptions | multipart clip ≤30 seconds and ≤10MB | editable text only; does not commit gameplay |
| POST /api/narrations/:id/audio | none | existing cached audio or queued generation; text cannot be supplied here |
| GET /api/audio/:id | none | only generated audio belonging to current local session |
| POST /api/saves/:id/pause | paused boolean | stops new turn jobs, permits in-flight atomic commit |
| POST /api/saves/:id/checkpoints/:checkpointId/restore | explicit request | creates a new save branch from checkpoint; leaves original history intact |
| GET /api/usage | save ID | estimated/actual usage and configured limits |

Use 400 for schema error, 409 for stale state or reused command ID with different payload, 422 for illegal/unsupported action, 429 for local rate/budget limit, and 503 for provider unavailability. UUIDs for save/preview/command IDs; check save ownership against the local session. Text limit 1,000 characters for player intent, 40 for character name. No client-supplied damage, DC, trust delta or item creation is accepted. Persist class/background/appearance IDs with each actor; Mira is Scout/Survivor and Oren Guardian/Envoy. The maintenance entrance applies advantage only to party initiative dice, resolved once when combat begins.

### Worked examples

**Trap:** revision 7, Mira inspects counterweight hall. Preview states Insight check DC13; no resource cost. Commit c1 rolls 9, adds Insight2 (Mira has no Delver training), total11, failure; no trap detail is disclosed. Revision8 persists that attempt. The player then chooses the visible side ledge, adding two travel ticks. Alternatively, a successful check reveals the plate and enables Disarm. A disarm failure deals a stored 1d6 and raises alarm. Retrying c1 returns the same 9, never another roll.

**Companion:** Oren's turn, hero at 4/18 health adjacent, Oren has one focus. The model selects the legal Rally preview. The validator confirms adjacency and focus; commit deducts one focus and rolls healing 4+2=6, hero becomes10/18. Oren may say he covered the hero, but cannot narrate a second heal. If a player request demanded a nonexistent spell, reject that request and allow another legal proposal.

**Combat:** guardian attacks Vark with d20=12, Might3, total15 against13; damage d8=5 plus3 gives8. Vark becomes20/28, actionRemaining becomes0, available movement is unchanged. Animation shows one strike and hit effect. Disconnect after commit reloads Vark20/28 and the spent action; replayed events do not apply damage again.

## 4. Persistence, concurrency and recovery

Use SQLite WAL mode, foreign keys and explicit transactions. Tables: saves (versioned private snapshot), commands (unique saveId/commandId and payload hash), events (unique saveId/revision/event sequence, public/private payloads), previews, narrations, audio_assets, checkpoints, usage_ledger and jobs. Keep one executor per save in the single server process. SQLite transactions enforce invariants even if two requests arrive before the application lock.

Validate revision inside the transaction immediately before rolling. Atomically persist outcome, snapshot revision increment, public/private events and committed command result. Never hold a database transaction open across an AI or audio request. A crash before commit leaves no published roll; a crash after commit returns the stored result. Job claims use leases and stable job keys. Restart resumes narration work without repeating rules work. One command cannot be executed twice even if an SSE event is delivered twice.

Saves occur per resolved command. Make checkpoints at safe camp, pre-encounter and chapter transition. Store the current turn, pending committed event IDs and transcript. Reload positions directly from final state; do not require replaying animations. SSE event application deduplicates event IDs and checks revision. A second tab with stale revision receives409 and refreshes instead of overwriting the first tab.

Persist contentVersion and rulesVersion. Reject an incompatible save with a clear explanation; before applying a tested forward migration, create a backup. M1 ships only schema1 and does not fake compatibility with future schemas. Backups use SQLite's backup API, not copying an open database file without its WAL. Restoring checkpoints creates a separate branch and makes the rollback visible.

Pause after45 seconds without a foreground client heartbeat, and on explicit pause/close where signaled. A pending committed event may finish narration, but no new companion turn begins. Idle client time is not campaign playtime.

## 5. AI, knowledge and narrative integrity

Use OpenAI Responses API with `gpt-5.6-luna`, reasoning effort `none` initially, strict structured outputs, and a bounded output of1,200 tokens. Documentation lists structured output/function calling support; actual account access and output quality require later smoke tests. No web search, shell, browsing or arbitrary tools are granted to game agents. Use the SDK with store:false and explicit contexts; do not rely on provider conversation history for saves.

Roles: intent interpreter (visible world + legal actions), companion planner (individual knowledge + legal actions), DM narrator (only facts permitted for the current reveal), and memory summarizer (already recorded visible events). Although private campaign definitions exist on the server, prose-generation contexts receive only approved reveal facts. This minimizes accidental spoilers. Dialogue is escaped plain text, never executable HTML.

The model selects legal preview IDs or a typed clarification. A parser rejection permits one bounded repair call using validation errors; a second failure leaves the request failed and allows explicit retry. Companion failure pauses its turn with Retry or player-selectable legal action. Do not silently introduce a different paid model. Basic deterministic menu actions remain available when narration is unavailable; the UI shows the actual rules result and narration error, not fabricated AI dialogue.

Narration references committed events and approved fact IDs, max120 words for DM and60 for companions. Max two companion reactions for a major event, otherwise one. At most one banter exchange per three exploration commands. Validate referenced IDs and reject forbidden IDs. Semantic consistency cannot be guaranteed by schema: test adversarial prompts and review hallucinated numerical/world claims. Display authoritative rule outcomes separately; generated prose never creates a fact.

Build context from persona, current scene projection, current legal actions, last12 witnessed events, up to20 relevant known facts, up to10 significant relationship memories, and a ≤400-word summary. Refresh summary after20 new witnessed events, retaining event IDs. Hard limit8,000 input tokens per normal call; truncate oldest noncritical transcript before any rules or current scene fact. Model summaries are a convenience; saved events/facts win on conflict. Use database filtering by scene/quest/actor instead of a vector database for M1.

Trust changes are authored consequences, idempotent by event ID. The model expresses trust, not computes arbitrary deltas. Neither repeated praise nor prompt instructions can unlock a quest. A companion can remember only facts with its actor ID in knownBy or events it witnessed; learning via dialogue creates an explicit knowledge event.

## 6. Audio behavior

Use `whisper-1` at /v1/audio/transcriptions for completed push-to-talk clips; it is not treated as streaming transcription. Use `gpt-4o-mini-tts-2025-12-15` at /v1/audio/speech for generated narration. Pin the documented TTS snapshot to reduce behavioral drift. Initial voices: DM onyx, Mira nova, Oren echo, all configurable catalog values verified in the implementation smoke test. Do not impersonate actors or clone voices.

Browser MediaRecorder selects supported audio/webm or audio/mp4. Server validates MIME, byte size and decoded duration; reject unsupported encoding with an actionable error. An editable transcript always precedes action confirmation. Empty/noisy clips create no action. Microphone denial leaves text usable. Recording suspends character playback to avoid transcribing the game's own voice.

Split approved narration at sentence boundaries into ≤500-character chunks, preserve order, and generate at most two ahead. Start playback only after user gesture; one speaker queue. Replay serves cached audio keyed by exact text hash, model snapshot, voice and style version. Skip aborts playback and unsent chunks; already billed audio is not refunded. Audio failure keeps approved text and a retry button. Do not submit arbitrary client text to the paid speech endpoint.

Store generated audio locally outside source control; retain current campaign audio and evict least-recently-used completed-campaign audio above1GB. Raw microphone clips are temporary and deleted after transcription succeeds/fails; transcript is part of the save. No raw clip/transcript logging by default. Outgoing player speech/text goes to OpenAI; onboarding explains that and that voices are AI-generated.

Latency targets for later measurement over30 interactions: local feedback p95≤150ms; AI preview p95≤8s; narration text p95≤8s after commit; first audible speech p95≤12s after commit; transcription p95≤6s after recording ends. These are product targets, not vendor guarantees. After2s show waiting status; use20s request timeout and one explicit retry path. No continuous microphone or background generation.

## 7. 3D world and presentation

Use R3F Canvas for the scene, HTML/CSS for HUD/subtitles/actions, and mutable Three.js object refs for animation updates. Do not put per-frame positions in React state. Render one active scene and preload the next reachable scene after initial readiness.

Author each room using reusable stone modules with a graph of walk anchors, blocked edges, interaction anchors, formation slots, camera shots and encounter boundaries. A* runs on this graph; no full physics engine in M1. Validate graph reachability during content checks. Collision volumes and line-of-sight blockers are explicit simplified shapes. Skin meshes do not define gameplay collision.

Positions use meters, Y up, characters face +Z at authored neutral pose. Normalize imported assets once in the asset preparation stage; persist transform metadata. Runtime paths interpolate at2m/s walk and4m/s run; these speeds affect animation timing, not rule allowances. Use in-place locomotion; strip root displacement on adapted animation to avoid double movement. Foot sliding is an acceptance failure when plainly visible in normal camera framing.

Select clips through semantic aliases: idle, walk, run, attack, hit, downed, interact. Blend movement/idle over150ms, attack/hit over80ms. Target model/skeleton owns its animation mixer; clones must have independent skeletons. Required clip mappings are audited per model. Missing bespoke disarm is represented with generic interact plus tool/plate feedback, as allowed in the PRD; missing idle/walk/attack/downed blocks a combat actor's release.

Use one shadow-casting directional light, baked-looking ambient fill and limited non-shadowed torch lights. Cap device pixel ratio at1.5; low preset shadows1024 and modest effects. At1080p low preset target p95 frame time≤33.3ms over10min on the developer's Mac, whose hardware/browser details must be recorded. Aim for60fps, but acceptance minimum is30fps p95. Target≤150 draw calls,≤250k visible triangles,≤30MB first-scene compressed transfer,≤80MB active-scene assets, and≤500MB JS heap after a30-minute scene loop. These are initial budgets to measure, not observed asset sizes.

Warm/cool lighting, cutaway walls, outlined interactables and distinct silhouettes follow PRD section6. Reduced motion disables shake and shortens movement presentation; action-list navigation remains usable even if a target is occluded. If WebGL cannot initialize, show a clear unsupported-browser message; no claim of a working3D game.

## 8. Campaign authoring

Store reviewed JSON content validated with Zod, versioned with the app. Definitions: campaign chapters, scene graphs, encounter actors, legal options, checks, visibility/reveal facts, one-time consequences, rewards, dialogue seeds and allowed endings. Conditions/effects are a closed data vocabulary interpreted by the rules module, never arbitrary JavaScript supplied by a model.

Separate monster type from appearance: goblin.guard resolves rules stats; appearance.goblin resolves an AssetManifest entry. Vark is a hobgoblin in original setting data regardless of the adapted source model name. Save references logical IDs. Pack replacements must not change health or quest behavior.

Each scene definition contains at least one exit path after each supported failure. Validate that required keys/testimony cannot be consumed before their only critical use. Model-generated choices are suggestions referring to authored option IDs; new persistent branches require explicit content, not a prose promise.

Implement PRD's six-scene slice first. M2 expands chapter one without moving its ending earlier. M3 authors the remaining five chapters and their distinct encounter combinations. Content tests validate unlock requirements, endings, trust triggers, difficulty values, model references, checkpoint positions and six-chapter timing assumptions. No runtime dungeon/mesh generation is required to reach the campaign target.

## 9. Asset research and acquisition contract

Evidence levels: **page verified** means source listing/license read; **archive verified** means filenames and embedded content inspected; **runtime verified** means imported and animated in the browser. At this documentation checkpoint only page/download-tier verification is complete. A free Standard Bestiary download was requested through itch.io; the browser confirmed the download action, but the resulting archive was not available for local inspection. No model identity is represented as archive verified.

| Gameplay role | Chosen source / status | Availability and license | Format, rig, animation evidence | Preparation / missing coverage |
|---|---|---|---|---|
| Monster art direction; preferred goblin/boss candidates | [Bestiary](https://quaternius.com/packs/bestiarydungeonmonsterskit.html), [download page](https://quaternius.itch.io/bestiary-dungeon-monsters-kit) | Standard45MB available through no-payment download; Source178MB listed at$20; QAL | Advertises7 types, humanoid rigs, GLB/FBX; itch.io explicitly says no animations | Exact free species and filenames unverified. Not yet approved as goblin/hobgoblin implementation asset. Adapt approved rigged model only after visual/file audit. |
| Player and companions; goblin alternative | [Ultimate Animated Character Pack](https://quaternius.com/packs/ultimatedanimatedcharacter.html) | Free public download linked by creator; page lists CC0 |52 models; FBX/OBJ/Blend; animated; catalog includes goblin/knight/wizard tags | Select fantasy hero/scout/guardian and inspect goblin coverage from archive. Exact clips, skeleton axes, scale and materials not exposed by listing. Convert FBX/Blend to GLB. |
| Corridors, rooms, walls | [Modular Dungeons](https://quaternius.com/packs/modulardungeon.html) | Free public download; page lists CC0 |48 modules; FBX/OBJ/Blend; static architecture | Convert modules; normalize to2m grid; create collision/walk anchors. Exact door/chest pieces require archive inventory. |
| Weapons, potions, chest dressing | [Ultimate RPG](https://quaternius.com/packs/ultimaterpg.html) | Free creator-linked pack; page lists CC0 | FBX/OBJ/Blend advertised | Verify included props; attach weapons to hand sockets. Generic plate/slit/chain trap can be assembled from simple authored geometry with these props. |
| Bestiary locomotion/combat | [Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html) | Page lists CC0 and free subset; paid source tier separate | FBX/GLB/Blend; humanoid animation library; complete pack advertises120+ clips | Free exact clip list and browser retarget compatibility unverified. Test rest pose, bone map, root motion and weapon grip. Do not assume all120+ clips are free. |

QAL permits incorporating and modifying assets in a game, but not distributing them as standalone assets; no attribution is required. Record the license shipped with each acquired version, not a blanket creator license. Earlier CC0 packs retain their individually evidenced licenses. Keep unmodified QAL archives in local ignored research storage and do not publish asset-only bundles. Include a credits/source ledger for provenance even when not required. [QAL terms](https://quaternius.com/license.html)

### Fixed selection and gap-resolution order

1. Acquire the free Standard Bestiary and record archive hash, exact model/texture/weapon filenames and license. Inspect thumbnail and mesh for actual goblin/hobgoblin coverage. Do not purchase Source.
2. Where it contains a suitable goblin, select it; otherwise use the free Ultimate Animated Character goblin after verifying that file. Vark uses a distinct permitted adaptation of the verified goblin with larger proportions, different armor, weapon and palette; do not claim a native hobgoblin model exists. The exact source remains a content-audit result, not an implementer guess.
3. Use the older animated pack for player/Mira/Oren to reduce animation work. If its free file inventory fails to cover a role, pause that role's asset acceptance and report the gap before substituting a paid or stylistically incompatible pack.
4. Retarget only verified free Universal Animation clips for Bestiary actors. Match bone hierarchy/rest pose, bake to target skeleton offline and export GLB. If essential clips cannot be validated, use the verified animated goblin source rather than inventing animation support. No live runtime retarget dependency is required.
5. A signed-off inventory must exist before assigning final encounter appearances. M1 cannot claim asset-complete until each role passes the archive and runtime gates. This is the outstanding research limitation of this RFC.

### AssetManifest and pipeline

Manifest entries contain logicalId, sourceUrl, sourceFilename, sha256, licenseId/licenseFile, acquisitionDate, freeTier, format, authorScale, normalizedScale, forwardAxis, bounds, materialNames, texturePaths, skeletonRoot/boneMap, semanticClipMap, conversionNotes and verificationStatus. Keep unknown source measurements explicitly unmeasured until import; never substitute intended scale for measured scale.

Import GLB directly where possible; otherwise use Blender only as an offline conversion/retarget tool. Export Y-up normalized meshes, checked texture paths and skeleton/clip mappings. Inspect GLB JSON for nodes, skins, materials, embedded/external textures and animations before browser testing. Reuse geometries/materials for static modules; clone skeletons per actor. Optimize only after preserving visual/animation correctness. Asset audit evidence records a source screenshot, import report, and browser screenshots/video for idle, movement, attack, damage and downed poses.

## 10. Model costs and operational limits

Verified model facts: Luna supports text generation, structured outputs and function calling; published standard rates are$0.20/million input tokens,$0.02/million cached input and$1.20/million output. Choose `gpt-5.6-luna`; actual project access is untested. Whisper `whisper-1` is$0.006 per input minute. TTS `gpt-4o-mini-tts` lists$0.60/million text input tokens and$12/million output audio tokens; choose snapshot `gpt-4o-mini-tts-2025-12-15`. These are current source values, not a price guarantee. Sources: [Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [Whisper](https://developers.openai.com/api/docs/models/whisper-1), [TTS](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts).

Cost model uses no caching discount, no extended-context pricing, and no paid external tools. “Output” includes billed reasoning tokens, even though effort is initially none. Call counts include interpretation, DM, companions and summaries, not just player turns.

Assume average3,000 input and350 output tokens per Luna call: $0.00102/call. For speech planning only, assume200 text tokens and1,250 output audio tokens per generated minute: $0.01512/minute. The audio-token-per-minute assumption is not a published guarantee and must be calibrated using actual usage. Whisper charge is submitted recording duration, not total session length.

| Scenario per active hour | Luna calls | Recorded input min | Generated speech min | Base USD/hour |24h base |24h with30% contingency |
|---|---:|---:|---:|---:|---:|---:|
| Light |40 |3 |8 |0.17976 |4.31424 |5.61 |
| Typical |100 |8 |18 |0.42216 |10.13184 |13.17 |
| Conversation-heavy |200 |15 |30 |0.74760 |17.94240 |23.33 |

Formula: calls×(3000×0.20+350×1.20)/1,000,000 + inputMinutes×0.006 + speechMinutes×(200×0.60+1250×12)/1,000,000. Contingency covers some repairs/retries; it is not a hard upper bound. Taxes, hosting/storage, asset purchases and development/evaluation calls are excluded. At8,000 input tokens/call the typical scenario adds$0.10/hour before contingency. Voice is a major cost driver even with a small narrative model.

Recommended configurable defaults for implementation: warn at$15/campaign, pause new generation at$25/campaign, and cap at$2 per rolling active hour. These are suggested controls, not authorization to spend or configured credentials. Local automated tests use mocked providers; any live evaluation budget is explicitly set at test execution. Do not silently bill beyond a cap.

Before a request reserve a conservative maximum using its input, max output and audio duration bounds. Count in-flight reservations toward caps; settle actual usage when received and retain a conservative debit if a timed-out request's billing is uncertain. Completed game commands remain committed if a narration budget is exhausted. Offer text result, pause and budget settings; raising limits requires an explicit user setting change. Record per-role/model/campaign tokens, submitted audio duration, generated audio tokens, costs, latency, status and provider request ID without credentials or raw dialogue in logs.

## 11. Security, failures and observability

All credentials are server-only environment variables, excluded from Git and client bundles. The key previously shared in chat must not be copied into this project or documents. Secure credential setup belongs to implementation. No credential is needed for document review.

Treat player text and model output as untrusted data. Reject extra schema fields and unknown IDs. Rendering uses text nodes, no HTML execution. Restrict API payload sizes, same-origin access and local requests. The model receives no filesystem tools and cannot modify campaign definitions. Never include private DM facts in public API payloads, subtitles or client asset metadata that names undiscovered secrets.

| Failure | Defined behavior |
|---|---|
| Provider unavailable before preview | No state change; keep input and show retry |
| AI returns illegal proposal | Reject; one repair; then explicit retry/manual legal choice |
| Timeout after action commit | Read command status; never resubmit with a fresh ID automatically |
| Narration fails after commit | Show authoritative result and retry narration only |
| Audio fails or microphone denied | Preserve text; audio retry or typed input remains usable |
| Budget exceeded | Pause new paid jobs; preserve committed results and saves |
| Stale tab |409 and reload current public state |
| Save/database failure | Do not acknowledge commit; show failure and keep last confirmed state |
| Missing essential asset | Fail content acceptance with named logical asset; no silent cube replacement |
| Scene import error in play | Pause presentation, retain save, show reload/report action |

Operational measurements: commands committed/failed, duplicate hits, stale conflicts, AI invalid-proposal rate, narration retry rate, knowledge-leak evaluation counts, save latency, first text/audio latency, frame time and per-hour estimated spend. Development logs contain IDs and timings, not secrets. No external telemetry service for the local milestone.

## 12. Verification and requirement traceability

These are future acceptance tests, not checks claimed to have run. Each implementation task must include User Story, concrete Edge Cases and Definition of Done. Capture browser evidence under artifacts/verification/<run-id>/ with named screenshots and a run report identifying hardware, browser, content/rules/model versions and fixtures.

| PRD IDs | Owner | Required scenarios/evidence |
|---|---|---|
| EB-01 | Creation/content | All9 class/background combinations produce expected stats; invalid IDs rejected; reload preserves appearance and stats. |
| EB-02 | Navigation/presentation | Closed door, trap boundary, unreachable node, follower formation and scene transition; screenshot paths never cross walls. |
| EB-03 | API/AI | Valid menu, creative intent, ambiguous target, unsupported spell, prompt injection, extra fields; no mutation until confirmation. |
| EB-04 | Rules/storage | d20 bounds, DC equality, advantage/disadvantage, natural attack1/20, damage modifier, duplicate commit and injected dice fixtures. |
| EB-05 | Rules/orchestration | Move6m, Run12m, action exhaustion, invalid range, blocked sight, focus zero, downed skip, heal revival, defeat, retreat, companion retry and enemy turn order. |
| EB-06 | AI/memory |100 role-scoped cases:≥95% persona/known-fact consistency by rubric, zero unrevealed-secret disclosures, zero accepted illegal state effects. |
| EB-07 | Audio/UI | Quiet/noisy/empty clips,30s limit, edit transcript, denied mic, subtitle size, one speaker, interruption, cached replay and AI-voice disclosure. |
| EB-08 | Storage | Restart before/after commit, refresh during animation, duplicate SSE, second tab conflict, checkpoint branch and corrupt/incompatible save. |
| EB-09 | Content | Fixed-seed traversal for combat, ration, persuasion, distraction, failed trap, rescue and boss negotiation paths; all reach aftermath or explicit defeat. |
| EB-10 | UI/camera |1280×720 and1920×1080 screenshots; keyboard target list, foreground cutaway, reduced motion, subtitle/party/target readability. |
| EB-11 | Asset pipeline | Exact archive inventory/license hashes, source-to-logical mappings, textures/bounds/rigs, separate skeleton clones and semantic clip playback for every combat actor. |
| EB-12 | Jobs/API | Timeout, retry, crash, missing audio and missing scene; no repeated damage, item loss or narration-triggered state writes. |
| EB-13 | Usage | Reservation races, uncertainty after timeout, cap rejection, cached replay, actual-versus-estimated cost report. |
| EB-14 | Content/memory | Trust threshold unlock, repeat event idempotency, negative trust without abandonment, summary contradiction corrected from event history. |
| EB-15 | Campaign | Six chapter graphs, progression, all3 endings reachable, cross-chapter flags, five fresh-player duration logs; no assertion of24h before measurement. |
| EB-16 | Rendering/operations |10min1080p frame-time run,30min scene loop memory,30 AI/voice timing samples, initial transfer and draw-call reports. |

Opening screenshot filenames: creation.png, exploration.png, dialogue.png, trap.png, combat.png, vark.png, aftermath.png. Capture one combat and one negotiation end-to-end browser run. Compare visual evidence with PRD's reference mapping; report a mismatch and fix it before calling the milestone complete. A generic asset viewer alone does not verify a playable adventure.

Document-phase review: numbered requirement mapping and cost arithmetic checked; links and source claims reviewed; no application tests or provider calls performed. Exact free model/clip coverage and browser rendering remain unverified and are a mandatory first implementation investigation. This limitation must remain visible in handoff.

## 13. Implementation handoff and milestones

Write a separate executable plan after these documents are reviewed. Work in this project, not the personal workspace. Do not initialize a new repository elsewhere, publish, deploy, configure credentials, or activate a long-running goal as a side effect of documentation.

| Work package | User story | Edge cases | Definition of done |
|---|---|---|---|
| A. Asset and rules foundation | As a player I need recognizable actors and fair actions | Free pack gaps, incompatible skeleton, illegal range/roll | Verified hero/goblin/Vark art mapping, essential browser clip demo and tested Echo Rules module |
| B. Saved opening exploration | As a player I need to reach and investigate the dungeon | Trap/door boundary, save crash, failed check | Creation→approach→hall playable, persistent, with screenshot evidence |
| C. AI party and voice | As a player I need believable speaking companions | Secret leak, denied mic, failed model, cap hit | Role isolation tests and confirmed speech/actions, voice queue, cost instrumentation |
| D. Complete slice | As a player I need a finished adventure | Boss defeat/negotiation, downed party, reload | Six scenes, combat and negotiation endings, five slice playtests, all M1 criteria |
| E. Expanded chapter | As a player I need deeper choices and relationships | Repeated rewards/trust, optional wing failures | Chapter1 targets3–4h, personal conversations, level-up and branch tests |
| F. Full campaign | As a player I need sustained progression and an ending | Long memory, migrated content, cross-chapter flags | Six chapters and three endings, measured duration and complete campaign regression |

Proposed first execution goal: **Build a playable, voiced, saveable opening adventure in Echoes Below, using cohesive Quaternius-based fantasy assets, with functional AI companions, exploration, a trap, goblin interaction, combat, and a reachable ending.** Not activated by this document.

## 14. Research references

- [Three.js model loading](https://threejs.org/manual/en/loading-3d-models.html): GLB/glTF import workflow.
- [React Three Fiber introduction](https://r3f.docs.pmnd.rs/getting-started/introduction): React renderer for Three.js; source confirmed earlier in discussion, current fetch failed.
- [Fastify documentation](https://fastify.dev/docs/latest/): server validation and lifecycle reference.
- [SQLite transactions](https://www.sqlite.org/transactional.html): atomic durable commits; application idempotency still must be implemented.
- [OpenAI Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [Whisper](https://developers.openai.com/api/docs/models/whisper-1), [TTS](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts): model/rate sources.
- [Audio FAQ](https://help.openai.com/en/articles/7031512): Whisper completed-file transcription and streaming limits.
- [Quaternius license](https://quaternius.com/license.html), pack-specific links in section9: asset evidence and acquisition terms.
- [Taxi demo](https://crazy-taxi.astra.demos.sulat.com/): observed during discussion as a visual presentation reference; no code or assets copied.


## Implementation status: compact opening adventure

The production implementation now lives in this project. [API.md](API.md) is the exact shipped request/response contract; earlier interface sketches in this RFC remain architectural design context. [VERIFICATION.md](VERIFICATION.md) records actual evidence.

Settled slice adaptations: Fastify serves the Vite production client on loopback4317; Node24 SQLite stores snapshots, idempotency records, checkpoints, conversation exchanges, audio and usage. Commands return one committed snapshot rather than SSE. Room movement uses authored safe approach/turn anchors and client interpolation rather than a navmesh. The renderer uses original stone modules and the actually acquired Quaternius assets recorded in ASSETS.md. Initial initiative-order companion actions use legal deterministic tactics; subsequent End turn/Continue requests ask Luna for bounded choices and validate them again. Provider failure leaves explicit tactical fallback. Dialogue history supplies six recent exchanges per speaker, public facts and witnessed events; the journal retains the latest50 exchanges. Cross-chapter summaries and full campaign content remain future work.

The public scene projection updates the opened gate and removes fled NPCs. No browser script can grant health, roll its own authoritative dice, or invent legal action IDs. Settings expose estimated cost, voice controls and measured recent frame time. Audio accounting reserves conservatively; it is not an exact provider invoice.
