# Echoes Below asset ledger

Verified 2026-09-05 during implementation. Original raw archives are ignored local research; served models are incorporated into this game, not an asset pack for redistribution.

## Quaternius RPG characters
Original: https://quaternius.com/packs/rpgcharacters.html (CC0 displayed).
Acquired converted glTF from https://github.com/euuuuuuan/cairnfall-public/tree/main/assets/vendor/quaternius_rpg (provenance recorded in that repository CREDITS.md).
Files: Warrior.gltf, Ranger.gltf, Wizard.gltf, Rogue.gltf. Each has an embedded buffer and textures, one skeleton, and multiple animation clips. Exact SHA256 and clip lists: public/assets/quaternius/manifest.json.
Roles: Guardian/Oren = Warrior; Scout/Mira = Ranger; Adept = Wizard. Rogue is available for variations. Browser checks confirmed embedded textures, distinct normalized character heights, idle/walk, attack, hit and downed playback in the opening adventure. These compact checks are not a complete animation-library certification.

## Bestiary free Standard
Original and acquisition: https://quaternius.itch.io/bestiary-dungeon-monsters-kit
Archive successfully downloaded through free Standard endpoint, then inspected. Exact model contents: Imp.glb and Puglin.glb (also FBX equivalents). No native Goblin or Hobgoblin file and zero animations. Both GLBs include one skin and embedded textures. Original license copied to public/assets/quaternius/LICENSE-BESTIARY.txt; QAL allows use/modification in this game, prohibits standalone asset redistribution. Source archive remains ignored.
Imp is the available goblinoid visual adaptation; Vark uses a larger armored variant with visibly different gear. These are adaptations for original game roles, not claims that the source included goblins/hobgoblins.
Exact nodes, skeleton presence and hashes: public/assets/quaternius/audit-Imp.glb.json and audit-Puglin.glb.json.

## Dungeon environment
Original procedural stone modules, floor tiles, archways, torches, bars, crates, trap plate and bell assembled in Three.js for this game. Visual influence: user-provided Crazy Taxi demo for readable3D presentation, Quaternius for fantasy proportions. No taxi assets or code copied.

## Verification
Archive/JSON structural inspection complete. Browser rendering and clip compatibility are separate runtime checks recorded in the final verification report.

## Animation adaptation
Acquired official Universal Animation Library Standard (CC0):43 named clips verified. scripts/prepare-monsters.py maps8 selected rotation-only clips by matching bone names onto Imp/Puglin. Translation tracks intentionally omitted to preserve body proportions and prevent root motion. Generated Imp-animated.glb and Puglin-animated.glb. Structural mapping and browser checks completed for the shipped Imp variant, including idle and combat poses. Puglin is acquired but not used by this opening adventure. Vark adds runtime armor and a larger silhouette. There is no claim of native Goblin/Hobgoblin coverage or general-purpose retarget compatibility.
