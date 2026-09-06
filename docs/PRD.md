# Echoes Below — Release 1 product contract

Release freeze: 6 September 2026. This document replaces the expansion contract. The existing implementation is the final content of Release 1. [RFC](RFC.md) defines its architecture; [execution status](EXECUTION_STATUS.md) records release gates. Prior checkpoint notes are historical archives, not outstanding release commitments.

## Product and scope

A desktop browser fantasy adventure for one player and two companions. Players choose actions and targets while the engine resolves rules, movement and dice. Original Briarwatch characters and setting draw on the readable choices, party framing and dice anticipation of Baldur’s Gate 3. This is a stylized independent game, not BG3 or a complete tabletop D&D implementation.

Release 1 contains six chapters and 46 locations: the six-location Bell Beneath Briarwatch opening, then eight locations each in Drowned Archive, Ash Market, Rootbound Prison, Hollow Choir and Last Descent. It includes 18 main and 12 side quests, recorded decisions, shared XP, levels 1–8 and a reachable ending. Locations vary in depth; many later rooms use compact authored choices. **No verified 24-hour duration or completed first-time human playtests is claimed.** No duration minimum gates this release.

Do not add chapters, quests, monsters, art packs or large mechanics during release closure. Multiplayer, full SRD coverage, expanded branching, racial abilities, new subclasses, richer bespoke animation and long-form campaign pacing are future work.

## Playable journey

1. Name the hero and choose Fighter, Rogue, Wizard or Cleric; Human, Elf, Dwarf or Halfling identity; background and palette. Customize Mira and Oren’s class, race and palette while preserving their authored names and stories. Races alter visual proportions and identity, not full racial ability packages.
2. Choose Echo Rules (default, preserved for existing saves) or the explicitly labelled curated tactics preview. The latter is a supported playable subset with known omissions, not full SRD certification.
3. Free story mode is default and supports the complete authored campaign and automatic companion decisions without paid AI. Optional personal-key or configured host allowance enables open-ended AI conversation and generated voice.
4. Select an object label or its equivalent in the target/action menu. Inspect, converse, solve a puzzle, search supplies or choose a route. Confirm consequential actions; failed checks leave another supported route.
5. Observe the saved dice and outcome. Continue or skip presentation without rerolling. Combat highlights the current actor and presents action outcomes separately. Curated allies/enemies await explicit automatic-step controls; companion takeover and tactics are available.
6. Rescue the courier, confront Vark, decide who guards the seal and continue to Chapter II. Later decisions preserve their facts, resources and consequences.
7. Reload and continue the same saved adventure. Confirmed state survives skipped/interrupted playback. Defeat offers checkpoint recovery into a branch; existing saves are retained.

## Rules and companions

Echo Rules keeps its compact four-attribute, movement/action, Defense, Guard/Aim, focus and potion system. Initial HP is Fighter24, Rogue18, Wizard16, Cleric20. Its level-up HP/focus changes are house rules. Internal class identifiers remain compatible with old saves.

Curated tactics uses a versioned SRD 5.2.1-inspired subset: six combat abilities, grid movement, action/bonus/reaction resources, AC, initiative, advantage/disadvantage, death saves, concentration, selected conditions, opportunity attacks, Help, class actions, selected spells/upcasting, rest resources and ability improvements. Exploration retains the authored four-attribute adapter. Class-specific progression is implemented only for the selected features; complete class/subclass spell lists and racial abilities are excluded. The in-game attribution identifies licensed rules material.

Mira and Oren retain authored personalities, witnessed-fact boundaries, trust and private story scenes. Paid AI may propose a currently legal action, but the rules engine validates and resolves it. Free/failure tactics remain available. AI cannot create rewards, decide major bargains, rewrite hidden facts or execute dictated text automatically.

## Existing encounter and resource behavior

The opening supports cart evidence, counterweight puzzle or safe ledge, ration-based peaceful passage or goblin battle, key/pick/force prison rescue, courier/ledger testimony and Vark negotiation/combat. Additional implemented staged encounters include the Bell Index, infirmary and Ink Garden. These are frozen content, not a promise that every room has equivalent depth.

Quest rewards and caches are once-only. Deadlines reflect the next required stage; missed optional objectives do not block the main route. Curated expedition caches supply one potion in ordinary rooms, two in authored combat rooms and three rations at chapter landings; living carriers with the least receive supplies first. Echo Rules retains three potions per expedition cache. No inventory reset or migration accompanies this release.

## Presentation, audio and privacy

Use the existing stylized party and dungeon assets, warm light, cool shadows and gold-accented panels. Canonical game identities drive labels rather than filenames. Label placement avoids HUD, other labels and registered character silhouettes; selected targets remain available through the menu when a label is suppressed. Labels and dressing reflect rescued/departed NPC state. Desktop is the release target; small screens and extreme camera angles are not fully certified.

Personal keys live only in page memory and go directly to OpenAI. Check & connect discloses a small paid model-access check and reports checking, success, rejection or disconnect. Reload clears the key. A successful text check does not guarantee speech access. Personal usage is billed by OpenAI and not covered by host allowance limits. Host mode is disabled when unavailable. There is no silent switch from personal/free mode to paid host calls.

Narration and speech are optional. Text remains available after speech failure; stop/cancel prevents stale playback. Microphone denial or unsupported input leaves editable text. Provider timeout, grounding rejection or budget failure must show feedback and release busy state. Keys must never enter saves, game-server requests, logs or browser storage.

## Release acceptance

| Requirement | Required observable behavior | Verification owner |
|---|---|---|
| R1-01 Creation | Selected identity/class/rules persist; legacy creation works | creation/rules tests and browser |
| R1-02 Authored progression | Trap, both goblin routes, rescue, Vark and later chapter remain reachable | engine tests, traversal audit and browser |
| R1-03 Combat | Legal resources/turns, separate outcomes, recoverable defeat | rules tests and browser |
| R1-04 Saves | No rerolls on reload, duplicate/stale rejection, visitor isolation | storage/adapter integration and browser |
| R1-05 Presentation | No missing bundled models or blocking desktop labels/panels | asset gate, layout tests and browser |
| R1-06 AI recovery | Explicit mode/key status; free play survives provider failures | AI/session tests and browser feedback |
| R1-07 Publication | Complete tests, three type checks, build and asset gate pass before one deployment | release checklist |
| R1-08 Honest handoff | Record limitations, exact release source and local/production evidence | execution status and final handoff |

## Future work outside Release 1

Measured campaign pacing and first-time human playtests; deeper later encounters; full rules/exploration integration; additional race-specific models and animation polish; broader devices/accessibility/performance testing; account recovery and cross-device saves; complete real-key microphone/dialogue/audio sessions across browsers. These are not autonomous follow-up instructions. Development stops after verified Release 1 publication.
