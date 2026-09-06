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
