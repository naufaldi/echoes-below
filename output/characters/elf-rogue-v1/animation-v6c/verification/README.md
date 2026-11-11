# Elf Rogue V6c local runtime verification

This is an isolated development preview, not a production release. No commit, push, deployment, live save mutation or production manifest promotion was performed.

Asset: public/__elf-rogue-preview.glb
SHA256: eed37e08843e810e046bb739fcff55417beeae56fdff1797fb010497350bab4b
V5 fallback: local-review/elf-rogue-v5-fallback.glb

## Changes
- Authored bow plane/string and arrow corrected by Blender worker.
- Shorter dagger, tucked hip sheath; melee weapon extracted into hand while sheath stays at hip.
- Rejected first V6 due oversized morph-target bounds making character tiny in actual World. V6c fixes bounds without changing visible motion.
- Added explicitly labelled local melee reaction preview button. It supplies a synthetic log to existing animation selection, not new gameplay rules.

## Verification
- Browser Three GLTFLoader default and Idle height: V5 .87402344465m, V6c .87402342974m. Correct normal game size restored.
- 19,958 triangles, 2,374,996 bytes, one 2048 texture atlas, 18 joints, eight canonical clips. Structural weights validation passes.
- 20 targeted tests pass; TypeScript passes.
- Game-distance, orbit-camera screenshots captured from actual World in the local fixture. Fine finger clearance is better judged in Blender close-ups; game screenshots are not proof of anatomical perfection.
- Full-suite result is NOT claimed for this revision. Earlier full-suite harness stalls at asset-bundle test; see V5 handoff for evidence. No server mechanics changed.

## Preview
Apply integration.patch to the baseline repository, copy GLB and fixture assets, run local Vite, open:
http://127.0.0.1:5178/?elfRoguePreview=1&combatReview=1

Dev and localhost guards keep preview opt-in. Existing production assets remain default.

## Still not production-approved
Licence/commercial provenance, manifest promotion, locomotion/melee motion polish, portraits, performance validation and HP/floater impact timing remain open. A rendered clip is not final gameplay acceptance.

## Final live-transition result
Ranged, Hit and Dodge returned to Idle in live World. A separate 5.5-second melee settling check verified Idle at full weight after Attack_Melee; Weapon_Off returns to sheath position, Dagger_Sheath remains visible at scale 1, and nocked arrow stays hidden. Both browser runs report no page errors. Fifteen deterministic pose/reset samples passed; nine orbit-camera captures plus four default-view captures included.
