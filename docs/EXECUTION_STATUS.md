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
