> Historical development record. Superseded by the Release 1 documents. These checkpoints are not current promises or execution instructions.

# Curated D&D expansion execution

Approved 6 September 2026. Active goal: implement the approved A–E plan while preserving the published Echo Rules campaign and saves.

## Sequence and acceptance

A. Stabilize canonical actor/entity names, asset identity and geometry-derived anchors; centrally place labels without collisions or HUD overlap; isolate failed assets with retry. Browser evidence at desktop sizes and enlarged text is required.
B. New versioned curated SRD 5.2.1 ruleset, four classes levels1–8, six abilities, spell slots, conditions, reactions and grid combat. Preserve Echo Rules for legacy saves. AI directives and one-turn takeover use legal capabilities.
C. Reachable two-hour dungeon slice: quests, loot/equipment, camp/rest/level-up and companion consequences. No lost quest items, repeated rewards or softlocks.
D. Grounded DM, explicit payment source, recoverable text/voice/transcription errors and real browser key/voice checks. No credentials in evidence.
E. Six linear chapters,18 main quests and12 side quests,24 varied battles including six bosses; target25–35 hours including side quests and camp. Require three first-time human playtests with median above24 hours before duration completion.

## Current work

A in progress. Existing PRD/RFC2.1 edits are retained. Initial findings: independent Html labels have no collision manager; character anchor height is fixed; Knight/Cleric material clone ignores class changes; asset paths are inferred from class; all assets share one Suspense/error boundary.

No milestone is yet claimed complete. Do not confuse structural asset loading with visual correctness or automated campaign traversal with human playtime.

## 6 September implementation checkpoint

Implemented locally: central collision/HUD-aware labels; selected target and duplicate-enemy display names; class-sensitive material cloning; per-model errors/retry; removal of Vark's unrigged accessories. Browser1440×778 screenshots in the task show the opening, Fighter→Cleric equipment change and model recovery. Clicking Forgotten chest selected `cache`; DOM measurement found zero label/HUD collisions. Withholding only the local built Knight model produced independent errors for two actors; restoring it and clicking each Retry recovered both without refresh. Source assets and saves were retained. These changes have not been deployed yet.

B foundation added as isolated tested modules: tactical-grid for paths/terrain/LOS/area targets and curated-rules for stat/slot initialization, action resources, HP/concentration/death saves. They are not wired into gameplay yet. SRD notice added. Existing echo-v1 engine and persisted saves remain unchanged.

Next: finish A's full-scene/viewport/name/animation audit, then introduce explicit new-campaign rules routing and persistent curated state; wire tactical previews/resolution; implement class actions, companion priorities/takeover, quests/inventory/camp and slice. C/D/E are still outstanding. Human duration validation remains a later external acceptance requirement, not a reason to stop independent implementation.

## Tactical integration checkpoint

Previous goal turn classified as progress: committed asset/label changes and verified browser recovery. This continuation connects curated state to the actual creation API, save reads, combat dispatch, UI controls and presentation snapshots.

New campaigns can explicitly choose Curated tactics development preview. Echo Rules remains the default while missing mechanics are built. Curated save reads now validate the rule discriminator consistently in local SQLite and hosted D1. Legacy default creation remains unchanged. The preview supports persisted per-actor HP/AC, grid positions, legal movement costs, attacks, Dodge, potion/Cure Wounds, death saves, individual automatic decisions, companion directives and one-turn takeover before the automatic turn starts. Exploration uses the existing authored adventure through an explicit projection boundary; this is not yet a full SRD exploration adapter.

Browser evidence: created Tactical Browser QA, resumed the same saved campaign after server restart, traversed the hall by the side ledge, entered goblin combat, viewed initiative dice, took over Mira, previewed/committed a5ft move, observed25ft remaining, and resolved a ranged miss with visible d20. Screenshots are attached in the task. Browser testing exposed two corrected integration gaps: travel actions were accidentally filtered out by combat movement UI, and local storage rejected the new rulesVersion. A further playback test verifies resolved position/resources instead of prior state.

Still required before B/C acceptance: subclass features and level-up choices, full spell/condition/reaction mechanics, equipment/camp/quest systems, explicit exploration checks/saves, real scene collision data and waypoint animation, trained AI proposals, additional viewport/asset checks, and a measured two-hour slice. No full-campaign or deployment completion is claimed.

## Class actions checkpoint

This continuation adds playable Second Wind, Action Surge, level5 Extra Attack, Champion critical range, Cunning Dash, conditional Sneak Attack, Fire Bolt scaling, Sacred Flame Dexterity saves, Magic Missile, Healing Word and Bless. Bonus/action/slot resources are tracked separately, slot spending is limited within the active turn, and class rest resources recover through the current rest adapter. Life Domain healing bonuses are applied at the relevant levels. These additions are a curated subset, not completion of all class/subclass features1–8.

Bless stores explicit source, targets and lifetime, contributes to attacks/saves, and is pruned when concentration ends. Optional resource fields keep existing tactical preview saves readable. A serialization regression from assigning an undefined effect list was caught and fixed.

Browser Spell Browser QA: fresh Wizard creation, hall bypass, combat initiation, Magic Missile confirmation and dice playback. The observed spell dealt11 force damage across three displayed dart rolls, consumed one rank1 slot (2→1) and spent the main action. Screenshot attached in the task. Last-roll history positioning was then adjusted to avoid the party heading; it is hidden during the full dice presentation.

Remaining class work includes additional spell ranks/upcasting/areas, reactions, conditions, subclass feature coverage and level-up choices. No expansion milestone or public deployment has been marked complete.

Reload verification after Magic Missile retained1/2 rank1 slots and the spent action. The updated dice-history screenshot no longer covers the YOUR PARTY heading; it occupies unused lower-left space. The same screenshot shows a downed goblinoid pose remaining above the floor. Treat this as a remaining asset/retargeting defect for the A audit, not a passed death-animation check.

## Death pose and waypoint checkpoint

Previous turn was progress (class abilities committed and browser spell verification). This turn fixed the observed airborne goblinoid death pose. The real cause was the conversion script dropping all translation channels, including pelvis descent. Death now preserves a proportional pelvis descent, with a measured endpoint correction. A skinned-geometry audit changed from5.6cm floor penetration to approximately zero clearance, and the same browser save renders the fallen body on the floor. Locomotion still omits root translation.

Tactical movement now serializes ordered waypoint positions. A changing root position prop previously could snap the actor directly to the final coordinates; the root position is now fixed at mount and subsequent movement follows the committed waypoints. Browser QA committed a15ft move and showed the Wizard at the selected destination with15ft remaining. Unit tests cover corners, long frames, duplicate points and persisted presentation paths. Full animation timing across all models remains to be audited.

97 tests, client/server/hosted typechecks and production build pass. Public Sites is still version10; full expansion, additional scene asset checks and deployment are not claimed complete.

### Inventory and camp checkpoint (local, not yet deployed)

Added shared gear, per-actor loadouts, immediate armor-class projection, protected quest items, a unique opening cloak, safe-site short/long rests and persistent rest limits. Existing preview saves receive compatible defaults.

Chrome manual QA at 1440×778: created Camp Browser QA with curated rules; equipped robes (AC18→13), looted the chest, equipped cloak (AC14), used long rest (three rations→zero), refreshed and resumed. Equipment, supplies and removed long-rest availability persisted. Inventory screenshot inspected for readable controls and scrollable content. A real backdrop now prevents click-through behind the modal, with Escape/Tab focus handling. Tests additionally cover unique-item transfer and Arcane Recovery across camps.

Still pending: full rules/class coverage, richer quests and campaign authoring, tactical AI integration, complete voice/browser checks, broad asset visual certification, deployment and human duration measurement. Current local progress does not establish 24-hour playtime.

Checkpoint validation: 104 automated tests pass; client, server and hosted TypeScript checks pass; production client/worker build passes. Public site remains version 10.

### Quest journal checkpoint (local, not deployed)

Added persistent objective steps/status, optional refusal, once-only camp supplies, hidden future arcs and journal UI. The compact campaign now has 18 main tracking records and 12 optional records. Ten later optional records remain investigation checklists and must receive distinct authored challenges before the full campaign content gate can pass.

Chrome QA: opened the new journal on the older Camp Browser QA preview save; main/optional goals appeared without reward backfill. Declined A trail worth following through confirmation, refreshed, resumed and verified its Left aside status while the main travel action remained available. Screenshot at 1440×778 inspected for readable objectives and scrolling. Automated peaceful traversal completes all 30 tracked records; tests also cover skipped opportunities, failed checks and nonduplicated rewards.

Validation for this checkpoint: 110 automated tests pass; client/server/hosted type checks and production build pass. Existing public deployment is unchanged.

### Archive side-adventure checkpoint (local, not deployed)

Replaced the two Chapter II investigation checklists with Elian's passenger identity request and Sera's witness-mask request. Acceptance, cross-room evidence and alternative outcomes are validated and persistent. Healing-potion and testimony routes differ mechanically; testimony lowers the real related DC, not only narration. Added conditional named NPCs and friendly presentation. Eight later optional records remain to be deepened.

116 automated tests pass, including all four new outcome routes, duplicate rejection, missing evidence, refusal, compatibility with old checklist progress, and full peaceful campaign traversal. Client/server/hosted type checks and build pass before the final NPC-friendly presentation change. These new meetings still need browser visual/playthrough validation; no deployment or duration claim is made.

### Eight further side requests (local, not deployed)

Added eight authored requests across Market, Prison, Choir and Depths, replacing the remaining later investigation checklists. Both outcomes for all ten later requests pass tests. Resource-dependent routes reject zero-ration input and retain a free alternative. Already-resolved preparation targets cannot collect meaningless aid.

Validation: 134 tests, all three TypeScript checks and production build pass. Browser Side Adventure QA (curated Cleric/Envoy) reached Vark through the ledge, ration offer and courier rescue. Negotiation failed and correctly entered individual tactical combat, paused at Mira’s first turn. This ongoing browser save is the next playthrough starting point; later NPC visual checks remain outstanding. Existing public deployment remains unchanged.

### Browser boss victory and exploration recovery fix

Side Adventure QA won the curated Vark encounter through UI actions: independent Mira/Oren/enemy turns, Cleric Sacred Flame and visible dice presentations. The party reached the aftermath, gained level 2, secured the seal and entered Chapter II. Elian's named NPC and label rendered in the Sluice Stair without a missing-asset warning; the request is available in the action panel. The current browser save remains at archive-1 before accepting Elian's request. Full later quest playthrough is still pending.

The browser exposed an incorrect Fighter healing action after combat. Fixed the legacy exploration action leak by adding resource-correct curated recovery. 138 automated tests pass. Further observed follow-ups: creation health cards still display Echo Rules health when curated preview is selected; later rooms use similar generic dressing despite distinct story descriptions; NPC turns currently require repeated confirmation even just to finish an already-used turn. These remain actionable work, alongside broader rules, AI/voice, campaign and deployment gates.

### NPC interaction polish and corrected QA finding

Removed redundant confirmation for each `tactical:auto` step. Browser verified one click immediately produced a single Goblin guard movement playback, leaving its attack/turn boundary intact. Retry IDs and revision handling use the existing commit path. Hidden party-only Fighter resource labels on enemy turns.

Correction to the prior creation observation: source and browser both show curated HP correctly after selecting curated rules (Fighter12, Rogue10, Wizard8, Cleric10). The earlier screenshot displayed Echo Rules before that selection, so no HP implementation fix was needed. Current browser tab is Spell Browser QA at the goblin movement playback; Side Adventure QA remains saved at archive-1.

### Chapter atmosphere checkpoint (local)

Added five distinct chapter treatments using original geometry alongside existing assets. Browser screenshot of Side Adventure QA at archive-1 confirms cyan stone/water, perimeter canals, boat/reeds, party and Elian render without an asset warning. Action panel and labels remain readable. Other themes still need visual inspection; this is chapter differentiation, not per-room environmental completeness. Later-room furniture was subsequently moved toward the outer perimeter to reduce overlap with tactical paths; that final relocation still needs screenshot verification.

### Elian browser completion and journal names

Side Adventure QA completed Elian's request entirely through browser controls: accepted at archive-1, investigated at archive-2, chose private letters at archive-3, then refreshed/resumed. Journal retained 3/3 completed steps; party potions increased 5→8 and rations 2→4; reward actions and Elian's completed marker were absent. This verifies one actual side-adventure route, not every authored route.

Browser journal exposed technical SENTRY-1 headers in older combat logs. Added durable speaker names and legacy fallbacks. Reloaded browser confirmed Goblin sentry headers instead. 140 tests, all TypeScript checks and build pass. Current browser save is Side Adventure QA at archive-3 with journal open; other chapter visual reviews and remaining goal gates are still pending.

### Authored encounter roles checkpoint (local, not deployed)

Added 24 curated encounter definitions, six bosses and twelve role profiles with actual speed/range/armor/HP/damage differences. Non-encounter rooms retain narrative progression. Revised a movement test that had assumed the first initiative actor was always a companion; faster scouts can now act first.

145 automated tests pass; client/server/hosted type checks and build pass. Every roster instantiated and a bounded winning route resolved under favorable controlled dice. Ranged scout attacked from spawn without moving. Normal-dice balance, role-specific weapon/projectile animation, real browser roster playthrough and deployment remain pending. This roster checkpoint does not establish campaign duration.

## Public expansion checkpoint: 6 September 2026

Sites version 11 is deployed successfully at https://echoes-below.naufaldi.chatgpt.site. Source: `e6751228a8c442e12ef0ae4a15901d1a1976a696`; saved version `appgprj_6a9c63bb6590819184da979092c5c256~appgver_6ed3147c24788191833c12bab0c1112f`; deployment `appgdep_6a9d19e35be48191bffa3040d0b2c2c7`. Deployment status succeeded at 2026-09-06T07:44:55Z.

This release contains the curated tactical preview, inventory/camp and quest work, authored encounter roles, chapter atmosphere, canonical speaker labels, protection AI regression fix, free authored check-ins and higher-slot casting. Curated tactics remains explicitly a development preview. Existing Echo Rules saves remain supported.

Fresh browser evidence on the public site (Public Expansion QA): selected Halfling and curated rules; displayed creation HP updated to Fighter 12 / Rogue 10 / Wizard 8 / Cleric 10; created a Fighter; free mode showed the sponsored allowance unavailable; opened and confirmed Oren check-in; rendered Oren / PARTY CONVERSATION; reloaded and continued the same save; reflection persisted and the repeated check-in remained disabled. Screenshot inspected at 1200×819: party and world props rendered, labels separated, action and narration panels readable. This checks only the opening viewport, not every asset or encounter.

Pre-publication verification: 155 tests passed, all three type checks and production build succeeded. Full browser campaign traversal, higher-slot casting presentation, actual personal-key voice playback, broader scene visuals and three human duration playtests remain pending. No claim of measured two-hour opening or 24-hour campaign is made.


Latest public release: Sites version 12 includes rescued-courier projection, counterweight puzzle and 3D controls, tactical AI proposals and durable hosted planning claims. Live migration and both-rule-version public puzzle HTTP tests passed; see VERIFICATION.md. Browser access is currently unavailable because the Mac is locked. Independent content and rules work remains, so the active goal is not blocked or complete.


### Local terrain checkpoint (not deployed)

Added seven terrain arrangements, saved-grid-driven pillars/rubble and path-based autonomous detours. Suppressed unavailable exploration labels during combat and explained terrain costs in turn controls. The Sluice Stair was entered through the local browser, initiative and an enemy attack resolved, and the new battlefield inspected visually. Refresh after the development server restarted recovered the local session and retained the adventure.

188 automated tests and client/server type checks pass. Fresh-resource combat simulation: 192/192 wins under its existing controlled hero policy, no unfinished encounters. This validates bounded completion under those fixtures; it does not establish challenge, attrition or human duration. Human playtesting, richer authored pacing, wider asset/voice verification and final release gates remain. Public version 12 remains unchanged per the local-first instruction.


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

Verification checkpoint: 214 automated tests pass; client, server and hosted typechecks pass. Local build verifies 45 models and 51 bundled files. Settled browser state confirms Ilyra’s restored name and removal of the sentinel after the decision. Librarian placement was moved away from the exit label; final placement still needs a fresh screenshot. Sites remains unchanged.


## Infirmary rescue expansion: local checkpoint

- Added a saved inspection / optional medic reply / cot bracing / slow-drain route and a separately confirmed safe rescue. Room rewards and later medic assistance retain their existing IDs. No new paid asset or AI request.
- Added original cot, valve, tether, medicine case and transparent water geometry; reused a shipped character for the medic. Public state controls NPC height, water visibility, names and resolved description.
- Browser on localhost completed the sequence in Bell Index Visual QA, reloading after bracing. The rescue raised the existing fixture from 175 to 300 XP / level 2. This exposed a three-log truncation that hid the rescue under rewards; a failing regression reproduced it and the narration selector now retains the full committed action.
- Browser also exposed stale scenery during action playback. A separate Infirmary Playback QA fixture verified that the lowered cot, absent water and waiting medic now appear while the drainage outcome panel is open. This is focused fixture evidence, not an end-to-end campaign or human duration test.
- Bell Index follow-up screenshot verified the librarian's moved placement away from the exit marker.
- Public Sites remains unchanged. Campaign content density, broader visual coverage, balance, voice input and duration gates remain open.

Verification: 220 tests pass; client, server and hosted typechecks pass; local build verifies 45 models and 51 bundled files. The concurrency test now waits for the provider-start signal instead of a fixed 20 ms delay, after that timing assumption failed under parallel validation load. No deployment.


## Movement reactions checkpoint (local)

Added opportunity attacks at melee reach boundaries, main-action Disengage, Rogue Cunning Disengage, saved automatic/hold reaction policy, threat previews and segmented movement interruption. The fallback for wounded ranged companions can disengage and withdraw before taking its remaining attack. Existing curated save flags receive defaults; Echo Rules remain on their previous resolver.

Opportunity Visual QA and Reaction Label QA are controlled local fixtures with raised HP. Browser evidence: threatened route preview named Goblin guard; one run missed on 7 + 4, another rolled natural 20 for 6 damage; each reaction appeared before a separate 10-foot movement frame. The final run displayed REACTION and REACTING NOW, then returned to the hero with 20 feet remaining and its action ready. No duplicate initiative advance. These fixtures do not measure campaign duration or realistic encounter balance.

231 automated tests and client/server/hosted typechecks pass. Local build verifies 45 models and 51 bundled files. Public Sites remains unchanged.

Post-reaction controlled simulation: 24 authored encounters × four hero classes × three seeds = 288 runs; all ended in wins and none remained unfinished. Each encounter starts with fresh resources at the script’s assumed chapter level. This does not validate continuous campaign attrition, difficulty quality or duration. `docs/COMBAT_SIMULATION.json` records the run.


## Quest deadline correction (local)

Fixed impossible active objectives caused by main quests never expiring, generic side-quest chapter deadlines and skipped prerequisite meetings. Quest projection and NPC eligibility now share the next required meeting. Location-specific opening steps have their own deadlines. Completed/declined/missed history remains stable; read-time correction of old active saves is mutation-free and grants no rewards.

237 automated tests pass; client/server typechecks and local build pass. Asset bundle verification still covers 45 models and 51 files. Browser journal QA expanded A trail worth following under Opportunities passed and verified both unfinished steps plus the explanatory message. Main-courier and multi-room expiry are covered by engine/projection tests; they were not separately replayed in the browser this checkpoint. No Sites deployment.

### Local checkpoint: peaceful conversation order repaired
- Fixed food-before-introduction and persuasion-before-food routes at the cookfire. Failed distraction no longer suppresses peaceful inquiry or alarm reconciliation.
- Dialogue acknowledges existing food/key state; peaceful scene labels and objectives update.
- Verification: 242 automated tests pass; server, client, hosted type checks and production build pass. Asset build gate verifies 45 models / 51 files.
- Local Chrome: controlled `Scrit Order QA` save offered food first, then successfully introduced Scrit; remaining questions appeared. Reload/Continue retained the dialogue and updated `Scrit, camp cook` label. No paid AI calls or deployment in this checkpoint.
- Goal remains in progress. Campaign duration, full human playtesting, remaining content depth and release QA are not established by these checks.

### Local checkpoint: courier investigation playable
- Added staged prison testimony and ledger corroboration, supplying an alternate route to prepared Vark negotiation. No invented Scrit exchange or repeat interview rewards.
- 245 automated tests pass; client/server/hosted type checks and production build pass. Asset bundle verifies 45 models and 51 files.
- Local Chrome `Scrit Order QA`: continued to prison, asked both questions through bars, read ledger, used guard key, and compared testimony successfully. Screenshot inspected: Courier attribution, rescued NPC/open gate labels, remaining actions, and scrollable dialogue visible.
- Visual follow-up: world labels still cover portions of the party in the default prison framing despite avoiding mutual overlap. This requires a separate layout improvement.
- No deployment or paid AI calls. Campaign duration and full release readiness remain unproven; goal stays active.

### Local checkpoint: prison label obstruction repaired
- World labels now avoid model-sized projected body volumes. Registrations follow character movement and camera projection, independently of selected/hovered labels.
- 247 tests pass, including priority labels anchored inside silhouettes and crowded bodies near HUD. Server/client/hosted type checks and production build pass; bundle gate verifies 45 models / 51 files.
- Local Chrome screenshots inspected at prison default framing and with hero selected: gate label moved beside the party, courier label above the group, selected hero label to the right with leader line. Bodies are no longer covered by these labels. This is local visual evidence, not an exhaustive camera/animation sweep.
- PRD/RFC updated. No deployment or paid AI calls. Full campaign and duration validation remain outstanding.

### Local checkpoint: readable party formation
- Replaced tight curated exploration spacing with a wider triangle at creation, room entry and existing target approach actions. Legacy and combat layouts remain separate.
- 250 automated tests pass; client/server/hosted type checks and production build pass. Bundle gate verifies 45 models / 51 files. New tests cover separation across the opening route, serialization, live-trap boundaries, and legacy initial positions.
- Local Chrome `Formation QA`, a separate controlled opening-route save: inspected settled prison view after key rescue. Party members now stand apart rather than stacked around the gate; labels remain outside their bodies. This verifies the destination, not all possible movement paths or camera angles.
- No deployment or AI spending. Full campaign depth, duration evidence and release QA remain incomplete.

### Local checkpoint: tactical Help implemented
- Added Help attack assistance, saved lifetime, normal/reaction roll consumption, non-stacking behavior, and Sneak Attack interaction. Skill/tool Help remains outside this checkpoint.
- 257 automated tests pass. Client/server/hosted type checks and production build pass; asset gate verifies 45 models / 51 files.
- Local Chrome `Help Visual QA` controlled battle: hero spent main action on Help against adjacent Goblin guard; Oren acted automatically next. Dice presentation displayed Attack · Help, [10,17] -> 17 + 5 = 22, then 8 damage. Help status disappeared after consumption. This fixture uses raised HP and is not balance evidence.
- Rules source checked: official SRD 5.2.1 Help action, printed page 183. PRD/RFC updated. No deployment or paid AI use. Full campaign duration and remaining release gates stay open.

### Local checkpoint: Ink Garden expanded and played
- Added a four-step preparation route with apprentice dialogue and visible lantern/reed changes. Completing preparation allows a deliberate rescue without destroying surviving pages or rerolling a failed attempt. Existing later testimony remains reachable.
- 260 automated tests pass; client/server/hosted type checks and production build pass. Bundle verification covers 45 models and 51 files.
- Local Chrome controlled `Ink Garden QA`: read both clues, fitted sleeves, repaired wick, and committed the prepared departure. Inspected before/prepared/after screenshots: apprentice and steady lantern visible before commitment, absent after departure; protected reeds remain. Final XP 125 from existing decision and room rewards; preparation XP zero. Not a full chapter or duration playtest.
- No deployment or paid AI calls. Remaining work includes wider chapter depth, complete rules/visual sweeps and human duration evidence.

### Local checkpoint: NPC label protection verified
- Fixed a wiring gap: NPC preview mode disabled body protection. Explicit label modes now keep NPC silhouettes registered without adding duplicate labels. Creation preview remains label-free.
- Seven label-layout regression tests pass; client type check and production build pass. Asset build gate verifies 45 models / 51 files. Full backend suite last passed at 260 before this client-only change; it was not rerun for this checkpoint.
- Local Chrome `NPC Label QA`: inspected apprentice unselected and selected. One entity label remains beside the body with a leader line; selecting it shows the three applicable actions and no duplicate HP label.
- No deployment or paid AI calls. Campaign completion and duration gates remain open.

### Local checkpoint: continuous campaign attrition verified
- Added a no-reset campaign combat audit. Baseline: all four classes completed, with excessive potion accumulation (Fighter party 122 remaining).
- Varied curated caches between combat medicine, smaller exploration medicine and chapter-landing rations. Existing inventory and legacy cache behavior preserved.
- Current audit: 12/12 full runs completed at level 8, 13,768 legal actions total. Fixed Rogue/Fighter companions, three seeds per hero class, all authored combats, no side quests, no injected resources. Baseline/current evidence: `CAMPAIGN_ATTRITION_BASELINE.json` and `CAMPAIGN_ATTRITION.json`. This is not measured player time or balance acceptance.
- 264 tests pass; client/server/hosted type checks and production build pass. Asset gate verifies 45 models / 51 files. Local Chrome cache preview promised one potion; collection changed total 6 to 7 and removed the action.
- No deployment or paid AI. Campaign content depth and human playtime acceptance remain outstanding.

### Local checkpoint: room/chapter playtime measurement
- Added room and chapter active-time breakdowns to settings and exported reports; legacy timing remains explicitly unattributed. Invalid scene subtotals are ignored without discarding valid segment totals.
- 268 automated tests pass. Client/server/hosted type checks and production build pass (server check rerun after fixing an explicit import extension). Asset gate verifies 45 models / 51 files.
- Local Chrome exported `echoes-below-playtest.json`: version 2, archive-2 active 15,770.2 ms, legacy unattributed 327,621.1 ms, total 343,391.3 ms. Verified arithmetic and absence of name/dialogue/API-key fields. This is agent QA timing, not one of the required human playtests.
- No deployment or paid AI. Two-hour opening and 24+ hour campaign remain unproven until actual playtesting.
