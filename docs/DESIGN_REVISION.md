# Echoes Below: character, narration and presentation revision

6 September 2026. User authorizes implementation and public update.

## Direction

Use BG3 as a reference for a character-first fantasy RPG presentation: compact party status, a clearly framed active character, separated narrative and action areas, warm metallic accents over dark neutral panels, visible die outcomes and a readable central scene. Preserve original setting, text, rules and licensed assets. Do not promise BG3's content, racial mechanics or visual fidelity.

Selected approach: retain the existing rules/save engine, correct the personal AI boundary, replace party presentation with animated KayKit adventurers, and revise HUD spacing. A wholesale engine replacement adds migration risk without fixing the observed problem. A CSS-only change cannot repair narrator validation or accessory attachment.

Creation stays scrollable in a dedicated left panel. Class, race, background, palette, companion setup and payment mode remain available. Race changes affect height and breadth; these are adapted fantasy identities, not unique race sculpts or complete racial features. Human, elf, dwarf and halfling are not advertised as newly acquired native pack models.

Exploration keeps the central world visible with a narrower left party panel and right actions. Narration sits between them at the bottom. Dialogue, failures and connection status use readable English. API keys are checked with a tiny explicit paid request, then retained only for the current page. A successful connection is not called persistent saving.

## Asset source decisions

- [Larian character-creation reference](https://blog.playstation.com/2023/09/14/how-your-choices-in-baldurs-gate-3s-character-creator-carry-through-your-entire-playthrough/): character identity and readable customization.
- [Quaternius RPG characters](https://quaternius.com/packs/rpgcharacters.html): original six-character CC0 pack, preserved for provenance and optional future variants.
- [Quaternius Ultimate Animated Character](https://quaternius.com/packs/ultimatedanimatedcharacter.html): 52-model CC0 candidate; formats need further conversion and no native elf/dwarf coverage is assumed.
- [KayKit Adventurers official repository](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0): acquired Knight, Mage, Rogue_Hooded and Barbarian GLBs with embedded textures and animations, CC0 license stored alongside. Knight serves fighter/cleric, Mage wizard, Rogue_Hooded rogue. Barbarian is an audited candidate. Optional overlapping equipment is hidden; retained equipment follows its authored skeleton. Dungeon/monster Quaternius sources remain unchanged.

## AI contract

Scene and recent events can support narration without discovery citations. factIds only accepts IDs in the supplied discovery context; with zero discoveries it must be empty. Generated IDs are constrained in the schema and validated again after generation. Unknown references are rejected, never silently accepted. Refusal, incomplete output and malformed output receive distinct recovery messages. No narration mutates rules state.

## Verification

Automated regression for opening with no facts, forged references, malformed output and connection failures. Live paid text requests for DM/Mira/Oren. Browser asset audit loads every shipped model and texture, compiles shaders and samples every animation. This is runtime compatibility coverage, not proof of every animation's visual quality. Browser screenshots and gameplay inspect representative character poses and the revised HUD. Unverified cases remain explicit in EDGE_CASES.md.
