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
