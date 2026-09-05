# Echoes Below: Technical RFC

Version2.0, 6 September2026. Current implementation decisions; supersedes archived v1 proposals. [PRD](PRD.md) owns product requirements. [EXPANSION_STATUS](EXPANSION_STATUS.md) owns current evidence and remaining work. No credentials belong in these documents.

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
| Assets | `client/DungeonDressing.tsx`, public manifests | Normalized reusable Quaternius models and themed dressing |
| Voice/session | `client/App.tsx`, `client/session.ts`, `client/own-ai.ts` | Editable transcription, one playback owner, cancellation and WAV conversion |

D1 is authoritative for hosted product data. Browser storage only keeps preferences and last-selected save ID. A private HttpOnly, Secure, SameSite=Strict cookie establishes anonymous device ownership; its random value is hashed before use as the database owner identifier. The CSRF token is derived separately and returned only from the same-origin session endpoint. All save, dialogue, preview, checkpoint and audio queries include owner. Clearing the cookie currently loses access; there is no account recovery or cross-device sync promise.

## Rules and content state

See PRD for the compact Echo Rules profile and explicit deviations from full D&D. Existing internal class IDs and version1 saves remain readable; raceId defaults to human, XP to0 and level to1 when absent. New fields are additive and use null-safe defaults. Races are currently identity/height, not racial abilities. Classes use compact weapon/heal/Aim profiles. Level thresholds mirror the familiar D&D progression, but HP/focus increments are house rules.

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

Command commit atomically inserts the idempotency record only when the expected revision still exists, updates the matching save under the same command/hash, and creates an arrival checkpoint when necessary. A different request reusing an ID returns409. Stale concurrent commands cannot both advance one revision. Duplicate requests retrieve the original public result. Restoring a checkpoint creates a new save branch and leaves the original intact. Local storage uses its existing synchronous transaction implementation. Hosted SQLite-adapter tests exercise actual SQL, but real D1 deployment remains an additional gate.

## AI, credentials and spending

Narrative candidate and current adapter: `gpt-5.6-luna`, Responses API, strict JSON schema, reasoning none, maximum700 output tokens. Existing local live verification established availability. Whisper candidate: `whisper-1`. Speech: `gpt-4o-mini-tts-2025-12-15`, voices ash/coral/onyx. Model identifiers are centralized in adapters and must be rechecked when provider behavior changes.

Personal key mode: key in module memory only; password input clears after connection. Requests go directly from browser to `api.openai.com`. No key is included in game API bodies/headers, saves, logs, localStorage or sessionStorage. Disconnect/reload clears it. OpenAI CORS preflight was checked, but real browser BYOK requires browser QA. Browser extensions or compromised page code remain able to read page memory; do not describe this as encrypted local storage or absolute secrecy.

Sponsored mode: owner key comes only from Worker environment `OPENAI_API_KEY`, configured as a Sites secret. It is never in source, manifest or client bundle. When absent, hosted health reports AI unavailable while the authored game works. User-key mode does not send its key through the sponsored relay. Current secret provisioning is a separate release-status item; do not advertise sponsorship as active until verified.

Sponsored reservations are deliberately conservative: text/plan request$0.02, speech request$0.12 (input capped1200 chars), transcription$0.003 (canonical PCM≤30s). A materialized SQL eligibility check atomically increments lifetime, global-day and visitor-day buckets together. Ceilings$25/$2/$0.30 respectively. Rejected admission changes no bucket. Provider errors retain reservations rather than risk spending beyond caps. Visible totals are reservation estimates, not exact invoice charges. No uncontrolled retries.

Planning estimate using the previously verified candidate text rates$0.20/M input and$1.20/M output, Whisper$0.006/min, speech roughly$0.015/min (speech token billing varies):

| Pattern | Assumptions/hour | Approx API estimate/hour |24h illustration |
|---|---|---|---|
| Light |20 text calls×1500 input/150 output;3min speech;1min transcription |$0.061 |$1.46 |
| Typical |60 text calls×2000/200;10min speech;4min transcription |$0.212 |$5.10 |
| Conversation-heavy |180 text calls×3000/300;30min speech;12min transcription |$0.695 |$16.68 |

These estimates exclude taxes, cache effects, price changes and retries; they do not authorize additional spending. Sponsored reservations are much larger than these invoice estimates and intentionally exhaust sooner. Player-funded requests bill the player's account and are not covered by the server's sponsored ceilings. UI must not mislabel reserved visitor/day amounts as exact campaign spend.

## Voice and memory

Browser recordings are decoded and resampled to canonical16kHz mono16-bit PCM WAV, truncated to30s. Hosted code checks RIFF/WAVE/fmt/data headers, sample format/rate, declared payload length and actual byte limit before sending to Whisper. Thus a forged duration cannot produce a long sponsored request. Transcript returns to the editable action field only.

Only one audio element owns playback. Mute/stop increments a generation token; late results do not play. Blob URLs are revoked on stop/end/cancellation. Text remains when audio fails. Local audio can be cached; hosted speech is streamed and regenerated on replay, so a replay may consume allowance. Conversation history is persisted separately from rules logs, scoped by owner/save/speaker, and never treated as verified world facts.

## Assets and import pipeline

All acquired files are local, with source/license/hash and animation metadata in `public/assets/expansion/manifest.json` and original Quaternius manifests. [ASSETS](ASSETS.md) records the original audit. Gameplay archetypes map explicitly to model paths.

| Role | Selected asset/source | License/free status | Format and adaptation |
|---|---|---|---|
| Hero/companions | Quaternius RPG Warrior/Ranger/Wizard/Rogue, existing audited pack | CC0/free | glTF, embedded original animations, clone skeleton and normalize height; Cleric currently reuses Warrior |
| Goblin/hobgoblin | [Bestiary Dungeon Monsters](https://quaternius.com/packs/bestiarydungeonmonsterskit.html), Imp adaptation | Quaternius Asset License/free Standard Imp/Puglin only, not CC0 | GLB, imported humanoid bone names and remapped UAL rotations; hobgoblin armor/scale derivative |
| Skeleton | [Quaternius Skeleton](https://poly.pizza/m/yq5ATpujSt) | CC0/free | Self-contained GLB,15 clips including Idle/Walk/Sword/HitReact/Death |
| Slime | [Quaternius Slime](https://poly.pizza/m/eSLKTsbl7F) | CC0/free | GLB,10 clips including Idle/Walk/Bite/Death |
| Spider | [Quaternius Spider](https://poly.pizza/m/yRYJiAJyiM) | CC0/free | GLB,5 clips including Attack/Death/Idle/Jump/Walk |
| Dungeon architecture/props | Quaternius via creator Poly Pizza entries in manifest | CC0/free |27 GLBs: arches, walls, tables, chairs, cobwebs, barrels, chest, pedestal, trapdoor, statue |
| Prison bed/cage, archive bookcase, workbench/cauldron/chain | [Fantasy Props MegaKit Standard](https://quaternius.com/packs/fantasypropsmegakit.html) | CC0/free Standard, recorded license | glTF+bin. Large shared trim textures removed; simple PBR materials chosen for palette and download budget |
| Traps/doors/seal | Original game geometry plus imported props | Original/CC0 | Engine state drives open gate, plate and interaction markers |

No assumption that the free Bestiary supplies goblins, hobgoblins or all animations. Full humanoid racial anatomy is not present: identity/height is a disclosed stylization. Rig/scale/orientation are normalized at runtime with bounding boxes; glTF uses Y-up, metres after normalization. Preserve per-instance materials and clone skeletal characters. Static props reuse loaded assets. Filename-qualified clips use semantic matching; explicit mapping and browser playback are required to exclude accidental mismatches. A matching bone name alone is not proof of correct retargeting.

Models load under Suspense with a visible loading message and scene error boundary. Party health changes drive hit/death; saved attack logs drive attack clips; position interpolation drives Walk. Model rotation and ground placement must be verified in browser. Static dressing should remain outside authored movement anchors. Budget target: p95≤33.3ms at1080p on documented hardware, DPR≤1.5,1024 shadow map, restrained point lights. No current expansion performance claim without measurement.

## Verification matrix

| PRD IDs | Owning areas | Evidence required |
|---|---|---|
| EB-01,15 | creation/rules/campaign | class/background/race roundtrips, all40 expansion rooms, XP once-only, reachable ending |
| EB-02,05 | engine/World/TurnPlayback | movement and combat tests; individual frames; browser order/highlights |
| EB-03,04 | preview/commands/dice/playback | no preview rolls, duplicate/stale tests, dice reveal screenshot |
| EB-06,14 | AI context/dialogue/campaign | knowledge/personality evals, persistent choices/trust; threshold unlocks remain backlog |
| EB-07,12 | audio/session/API | transcription bytes, editable input, cancellation and late-response tests; actual playback |
| EB-08,13 | Store/Worker/budgets/key UI | visitor isolation, atomic reservations, no key persistence, secure secret configuration |
| EB-09 | opening rules | peaceful/combat endings and onward continuation |
| EB-10,11,16 | rendering/assets/CSS | asset metadata plus actual browser screenshots, clips, overlap and frame time |
| EB-17 | Sites build/deploy | exact source commit/archive, successful deployment and deployed API/browser checks |

Current automated suite is Node's test runner via tsx, not Vitest. Browser QA uses approved computer/browser tools, not shell-driven browser automation. Do not claim a locked browser was tested through HTTP requests. Tests cannot establish24-hour entertainment value; human playtesting is mandatory for that target.

## References

- [OpenAI model documentation](https://platform.openai.com/docs/models), [pricing](https://openai.com/api/pricing/), [speech](https://platform.openai.com/docs/guides/text-to-speech), [transcription](https://platform.openai.com/docs/guides/speech-to-text).
- [D&D SRD](https://www.dndbeyond.com/srd), [SRD5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf). Any future copied/adapted licensed SRD text must carry its required attribution. Current narrative and explanatory text are original; no BG3 story/dialogue/assets are copied.
- [Quaternius catalog](https://quaternius.com/index.html), [Quaternius Asset License](https://quaternius.com/license.html), [Crazy Taxi visual reference](https://crazy-taxi.astra.demos.sulat.com/).
