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
Imp is the available goblinoid visual adaptation; Vark uses a larger variant. These are adaptations for original game roles, not claims that the source included goblins/hobgoblins.
Exact nodes, skeleton presence and hashes: public/assets/quaternius/audit-Imp.glb.json and audit-Puglin.glb.json.

## Dungeon environment
Original procedural stone modules, floor tiles, archways, torches, bars, crates, trap plate and bell assembled in Three.js for this game. Visual influence: user-provided Crazy Taxi demo for readable3D presentation, Quaternius for fantasy proportions. No taxi assets or code copied.

## Verification
Archive/JSON structural inspection complete. Browser rendering and clip compatibility are separate runtime checks recorded in the final verification report.

## Animation adaptation
Acquired official Universal Animation Library Standard (CC0):43 named clips verified. scripts/prepare-monsters.py maps8 selected rotation-only clips by matching bone names onto Imp/Puglin. Locomotion translation tracks are omitted to preserve body proportions and prevent root motion. Death now includes pelvis translation rebased from the source rest pose to the target proportions, with a measured Imp endpoint correction so the fallen body contacts the floor. Generated Imp-animated.glb and Puglin-animated.glb. Structural mapping and browser checks completed for the shipped Imp variant, including idle and combat poses. Puglin is acquired but not used by this opening adventure. Vark has a larger silhouette. Detached procedural armor was removed during the curated expansion because it did not follow the source skeleton. There is no claim of native Goblin/Hobgoblin coverage or general-purpose retarget compatibility.

## 6 September party revision

Party rendering now uses KayKit Adventurers CC0 Knight, Mage and Rogue_Hooded; Barbarian is an acquired candidate. Source: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0. License lives at public/assets/kaykit/LICENSE.txt. All four GLBs contain embedded textures and 76 animation clips each. Optional overlapping accessories are hidden; retained equipment follows source bones. Race height/breadth are game adaptations, not native racial models. All 45 current supplied models passed a browser loading/shader/animation-sampling audit; this does not certify every visual pose. Original Quaternius models remain available and their licenses remain unchanged.

## Death-pose correction and movement verification

The rotation-only death adaptation left the pelvis at standing height. `prepare-monsters.py` now retains/rebases that channel for Death only. Geometry audit `check-monster-ground.mjs` evaluates skinned vertices at the end of Death and compares their minimum Y with the standing ground plane. The corrected difference is approximately -0.000000005 source-model units (2cm tolerance); texture pixels are stubbed only for this geometry audit. A real browser screenshot of the same saved goblin encounter verifies the rendered body rests on the floor. This does not certify every other model/clip.

Tactical movement now carries an ordered waypoint list to presentation. The renderer no longer reapplies final actor coordinates as a changing root-group prop; it advances along the path and faces the next waypoint. Reload mounts at the saved final position instead of replaying old movement.


### Local production asset package gate

The production build now runs `scripts/verify-asset-bundle.mjs` after Vite and before worker assembly. It checks every shipped GLB/glTF, literal character/scenery model references, external buffers and image dependencies. Source and bundled files must have identical SHA-256 hashes; glTF buffers/views must fit their declared data. Remote dependencies and references outside public assets fail the gate.

Local result: 45 models and 51 bundled files verified, including six external `.bin` dependencies. Detailed per-model hash, byte size, mesh/skin/clip/image counts are written to ignored `data/asset-bundle-verification.json`. The regression test omits Bookcase_2.bin and separately changes Knight.glb in temporary copies; both fail with the specific dependency/model identified. This guard proves bundle completeness and structural bounds, not rendered appearance, rig compatibility or every animation pose. Production build was checked locally; no Sites deployment occurred.
