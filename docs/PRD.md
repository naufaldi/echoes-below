# Echoes Below — Presentation v2 enhancement contract

Status: **approved direction, 27 October 2026** (owner decisions recorded below). Created at source `54909eb`. Character models: [CHARACTERS.md](CHARACTERS.md).

This document supersedes the Release 1 freeze. The owner has reopened development for a presentation remake. Release 1's product contract is archived in [PRD-release1-archive.md](PRD-release1-archive.md). It remains the reference for shipped gameplay, rules, saves, AI and privacy behavior, and those stay in force unless this document changes them. Freeze statements in [RFC](RFC.md), [execution status](EXECUTION_STATUS.md), [goal prompt](GOAL_PROMPT.md), [implementation](IMPLEMENTATION.md), [expansion status](EXPANSION_STATUS.md) and [playtest handoff](PLAYTEST_HANDOFF.md) describe Release 1 closure only. They do not stop v2 work.

## Goal

Rebuild the presentation layer so the existing adventure looks, sounds and plays like a 3D game rather than a menu over a backdrop. **Play feel comes first**: combat readability, pacing and HUD, using the current assets. Characters are produced separately by the owner with Tripo against [CHARACTERS.md](CHARACTERS.md) and integrated when ready. Goblins and other enemies keep their current models. The engine (`server/`, `shared/` rules and state, API, saves, tests) is kept and not redesigned; story changes that need the engine are a separate track (Track B) and need explicit approval.

## Evidence base

Local production build of `54909eb` played on 27 October 2026 in headless Chromium at 1440×900. Covered: creation, Broken Approach, Counterweight Hall, Goblin Cookfire, and goblin combat in both Echo Rules and Curated tactics. Screenshots were taken locally and are not committed. Frame rate and memory were **not measured**. Later chapters were **not played**. Story structure, audio and rendering were checked from code (sections below).

## Observed problems

### Characters (P1)
- Only three hero models exist: `knight`, `mage`, `rogue` (`shared/visual-identity.ts:2`). Fighter and Cleric both map to `knight` (`shared/visual-identity.ts:4`). A Fighter hero beside Oren the Fighter renders as two identical knights. Party members are told apart only by labels.
- Race is a uniform height scale (`actorHeight`, `shared/visual-identity.ts:7`). An Elf Wizard looks like a Human Wizard.
- Identity/palette is a material colour multiply (`client/World.tsx`). The three palettes were not compared side by side.
- Party models are chibi KayKit, while goblins use the Quaternius imp. The styles clash, and goblins render smaller than the heroes they threaten.

### Combat readability (P1)
- Every roll and outcome is shown as a centered modal over the scene (`client/TurnPlayback.tsx`, mounted from `client/App.tsx:98`). The world plays the attack/hit cue at the same moment (`client/World.tsx:33`), so it is hidden behind the modal. In practice combat reads as a sequence of dialog boxes.
- The die is a small 3D mesh inside the modal (`client/die-geometry.ts`), separate from the world, so the roll never happens in the scene. The modal mounts a separate `<Canvas>` per roll (`client/TurnPlayback.tsx:37`). Headless Chromium logged `THREE.WebGLRenderer: Context Lost` three times during one combat. This is not yet confirmed in a real browser.
- No in-world feedback: no enemy HP bars, no damage numbers, no projectile for ranged/spell attacks (the Wizard "attacks" from distance with no visible effect), no hit reaction readable at scene scale.
- Curated tactics advertises grid movement, but the grid is not visible: no tile overlay, no movement range, no click-to-move. Movement is chosen from menu text ("Move left", "Approach Goblin guard").

### Environment (P1)
- All Chapter I rooms seen share one shell: the same back wall, arched door, pillars and floor tiles. Only dressing changes. Room changes feel like label changes.
- Broken Approach is written as an outdoor hillside in rain but renders as an indoor tiled room with pine trees placed on the tiles.
- `client/DungeonDressing.tsx:13` varies dressing by chapter prefix (archive/market/prison/choir/final). Later chapters were not inspected.

### HUD and camera (P2)
- The left party column, right action panel and bottom story panel cover most of the 1440×900 viewport. The 3D scene is a strip in the middle, and the party stands under the story panel.
- The room title and subtitle overlap the scene and, in combat, the initiative tracker.
- The creation panel scrolls internally. "Customize your companions", play mode and "Begin your descent" sit below the fold.
- The default camera (drag to orbit, scroll to zoom) does not auto-frame the active actor or target during combat.

### Audio (P1)
- The game has **no music, no ambience and no sound effects**. `public/` contains no audio files.
- The only audio is optional spoken dialogue: OpenAI `gpt-4o-mini-tts` voices (`client/own-ai.ts:9`, `server/ai.ts:351`; Mira `coral`, Oren `onyx`, narrator `ash`) via a personal key or a host allowance. The host allowance is disabled, so **the default free mode is completely silent**.
- Dice, hits, misses, footsteps, doors and UI have no feedback sound.

### Rendering (P2)
- WebGL2 through React Three Fiber's default `WebGLRenderer` (`client/World.tsx:97`: `shadows`, `dpr={[1,1.5]}`, `antialias`). **WebGPU is not used.** No frame-rate measurement exists.
- Known costs: a second WebGL context for every dice roll (`client/TurnPlayback.tsx:37`), real-time shadows, and per-object cloned props and materials (`client/DungeonDressing.tsx`, `client/World.tsx:23`).
- The production bundle is one 1.33 MB JavaScript chunk (373 kB gzip), plus 40 MB of models loaded on demand.

### Pacing (P2, gameplay, not visual)
- Echo Rules initiative needs one click per combatant (5 modals) before the first turn.
- Exploration lists the same check once per party member ("Inspect floor · Alden / Mira / Oren"). Counterweight Hall shows 13 actions in a list that must be scrolled.
- During a combat turn the automation harness reported "End turn" covered by the free-text box. A visual check is still needed.

### Story structure (P1, engine; Track B)
- The campaign is complete from start to finish: 6 chapters, 46 locations, a reachable ending. But it is **one fixed line**. Every route converges on the next listed room (`server/game.ts:1456`). There are no alternative rooms or routes.
- The final ending reads only the last room's binary choice (`server/game.ts:1457`, `shared/campaign.ts:53`). Earlier decisions do not affect it.
- Earlier choices change texture, not route: Chapter I interim ending (`fed` → "A Promise Shared"), one extra Vark enemy (`alarm`), ten small cross-room payoffs (−3 DC, potions, heal, one fewer enemy; `server/campaign-consequences.ts:11-20`), and companion trust (choice 0 raises Mira, choice 1 raises Oren).
- Chapters II–VI use one template per room (description, clue, two choices, two outcomes, four objects). Bespoke mechanics exist only in three Drowned Archive rooms, and only in Curated tactics.
- Combat is optional after Chapter I. Choice 1 is always available without a check (`server/game.ts:666`). In Echo Rules, winning a fight makes choice 0 free and grants XP (`server/game.ts:665`), so the peaceful player is the one who gets pushed onto the fallback choice.
- Hidden branch closer: resting at camp in Echo Rules uses every ration (`server/game.ts:1535`). That silently removes "Offer a ration", the Scrit ending and the negotiation path.
- To verify: "Cross cautiously" after the maintenance plate is found may still spring the trap (`server/game.ts:1580-1610`). A continuity slip: archive-8 outcome 0 credits "Scrit's people" even when Scrit fled (`shared/campaign.ts:13`).

## Non-goals

Track A (this contract): no new chapters, quests, monster types, rules, classes or mechanics. Enemy models stay unchanged for now. No rules or save-schema changes. No multiplayer. No mobile certification. AI, key handling and privacy behavior are unchanged (see archive).

## Approach

Keep the engine and rebuild the client with a strangler pattern: the new client runs beside the old one against the same API until it reaches parity.

| Phase | Output | Exit criteria |
|---|---|---|
| 0 Baseline | Frame-time and draw-call measurement of the current build in a headed browser | Recorded numbers for Broken Approach and goblin combat. Sets the V2-08 floor |
| 1 Parallel client | Separate entry (`/v2` or second Vite entry) using the existing API and `shared/` types | Old client unchanged and still passes all gates |
| 2 Play-feel slice | Creation → Broken Approach → Counterweight Hall → goblin combat with current models: in-world combat feedback, in-scene dice, single canvas, HUD that leaves the scene visible, grouped actions, fewer initiative clicks, per-room layouts, first audio pass | V2-02…V2-07, V2-11, V2-12 |
| 3 Characters (parallel, owner-paced) | Owner delivers one spike model first, then the four class models per [CHARACTERS.md](CHARACTERS.md); asset gate extended with budgets and clips; models integrated | CHARACTERS.md C-01…C-10, V2-01, V2-10 |
| 4 Rollout | Remaining rooms and chapters, then retire the old client | Parity with the Release 1 journey (archive §Playable journey) |

## Vertical slice acceptance

| ID | Required observable behavior | Verification |
|---|---|---|
| V2-01 Distinct party | Hero, Mira and Oren tell apart by silhouette with labels hidden, for every class choice in scope | Browser screenshots per class |
| V2-02 In-world combat | Attack, hit, miss and death read in the scene. Damage/miss text and HP are visible in world. Rolls do not cover the acting characters | Browser recording of one full goblin combat |
| V2-03 Visible dice | The roll is visible together with the scene. Result and modifiers stay readable. Skip/continue never rerolls | Browser + existing playback tests |
| V2-04 Room identity | Each slice room is recognisably different with labels hidden. Broken Approach reads as exterior | Side-by-side screenshots |
| V2-05 Scene space | At 1440×900 the active actor and target are never covered by HUD. Creation's begin action is visible without scrolling | Layout checks + screenshots |
| V2-06 Grid (Curated) | Tiles, movement range and target are visible; movement selectable in scene and in menu | Browser |
| V2-07 Stability | One canvas for the world. Zero WebGL context losses across a full combat | Console capture in headless and headed Chrome |
| V2-08 Budget | Frame time no worse than the Phase 0 baseline on the same machine; character budgets per CHARACTERS.md §4.5 | Measured frame time + asset gate |
| V2-09 Engine unchanged | Engine, rules, save and API tests pass unchanged. Three type checks and build pass. Release 1 saves load in v2 | Local run of the full suite |
| V2-10 Asset tests updated deliberately | `backend-asset-bundle`, `backend-visual-identity` and `backend-monster-animation` tests are rewritten to the new manifest in the same change that replaces assets, never deleted to go green | Diff review + asset gate |
| V2-11 Audio | Free mode has exploration and combat ambience/music, and SFX for dice, hit, miss, footsteps, doors and UI. Master/music/SFX volume and mute persist. Audio starts only after a user gesture. Reduced-motion players still get sound. All audio is licensed and listed in a manifest | Browser + manifest check |
| V2-12 Pacing | Combat starts after at most one confirmation (initiative summary, not one modal per combatant). Repeated per-member checks are grouped into one action with a member picker. No action list needs scrolling in the slice rooms at 1440×900 | Browser |

## Owner decisions (27 October 2026)

1. **Priority:** combat readability → characters → environment → HUD/camera. Play feel is fixed first.
2. **Characters:** one Tripo spike model, then one model per class (4). Race variants later. The owner produces them; integration follows [CHARACTERS.md](CHARACTERS.md).
3. **Environment:** keep Quaternius pieces; each slice room gets its own layout, not one shared shell. Replacing the kit is decided after the slice.
4. **Repository:** same repo, branch and PR per phase, stop before merge.
5. **Enemies:** goblins and other enemies keep their current models for now.

## Rendering decision: stay on WebGL2 for now

WebGPU now ships in all major browsers, but its maturity differs by platform, and WebGL2 remains the safe baseline. Switching three.js to `WebGPURenderer` also affects materials, post-processing and drei helpers. More importantly, nothing shows the GPU is the bottleneck. Fix the known costs first: one canvas, tuned shadow maps, shared materials, instanced dressing, code-split bundle. Measure in Phase 0. Open a WebGPU spike only if the measured bottleneck is GPU-side and the fixes above are insufficient.

## Track B — story branching (proposal, needs owner approval)

This track changes the engine and content, so it is not part of Track A. Goal: two playstyles produce different journeys and endings, not only different text.

- **Playstyle ledger.** Derive from choices already recorded: *Mercy ↔ Force* (peaceful vs combat resolutions), *Mira ↔ Oren* trust, and *Scrit alliance* (`fed`, entrust).
- **One fork per chapter.** One room per chapter has two variant states chosen by the ledger (for example allies help vs alarm raised). These are variants of existing rooms, not new chapters.
- **Endings from the whole run.** Three or four endings computed from the ledger and key decisions, replacing the single last-room choice. Fix the Scrit continuity slip.
- **Fair rewards.** A peaceful resolution earns comparable XP and unlocks as much as a combat win.
- **Visible branch closers.** Warn before an action (such as resting) removes a route.
- **Verification.** Extend `scripts/audit-campaign-progression.ts` to run a diplomatic profile and an aggressive profile to the end, and assert that their routes and endings differ.

### Playstyle A vs B — today and target

Playstyle A is diplomatic/stealthy: feed Scrit, negotiate, avoid fights, choose peaceful room options. Playstyle B is aggressive: fight every offered battle and force gates.

| Aspect | A today | B today | Target (Track B) |
|---|---|---|---|
| Route | Same 46 rooms in the same order | Same 46 rooms in the same order | One ledger-driven room variant per chapter, so A and B see at least 5 different room states |
| Chapter I ending | "A Promise Shared" (if Scrit was fed) or "The Keepers of the Bell" | "The Keepers of the Bell" | Kept, and recorded into the ledger |
| Vark encounter | Negotiation possible (DC16 Echo / DC13 Curated with evidence) | Fight; one extra enemy if the alarm was raised | Kept |
| Later rooms | A failed check pushes to the fallback choice | A won fight makes choice 0 free and grants XP | Peaceful success earns comparable XP and access |
| Companions | Trust follows choice 0/1, not style | Same | Ledger also moves Mira (mercy/insight) and Oren (protection/duty) trust |
| Final ending | Decided by the last room's choice only | Same | 3–4 endings from ledger + key decisions |
| Combat | Avoidable after Chapter I | Offered in every room (Echo Rules) | Kept; combat stays a real option, not the only rewarded one |

### Track B acceptance (if approved)

| ID | Check |
|---|---|
| B-01 | The diplomatic and aggressive audit profiles both reach an ending, and the endings differ |
| B-02 | The two profiles see different room states in each of chapters II–VI |
| B-03 | Every branch-closing action warns before confirmation |
| B-04 | Release 1 saves load and continue; old flags map into the ledger without data loss |
| B-05 | Engine, rules and campaign audit tests pass; new tests cover ledger and ending selection |

## Next step

Phase 0 (frame-time baseline) or Phase 2 (play-feel slice) starts on the owner's go. Track B waits for explicit approval. Character integration starts when the owner delivers the first model.

## Delivery

Ordinary branch, commit, push and PR per phase. Stop before merge. No deployment to Sites without explicit owner approval. Reuse the existing Site registration and never create another. Never print or commit `.env`.
