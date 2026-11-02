# Elf fighter equipment: Blender handoff

Status: Tripo assembly and download complete. Independent Blender assembly has not started. No `.blend` project exists yet. These are production prototypes, not approved runtime assets.

## Inputs to preserve

Paths are relative to the repository root.

| Role | Source |
| --- | --- |
| Original armored character | `output/characters/elf-fighter-v1/exports-2026-11-02/elf-fighter-armored-rigged-v1.glb` |
| Sword | `output/equipment/elf-fighter-v1/textured/elf-fighter-sword-p2-quad-textured-v1.glb` |
| Shield | `output/equipment/elf-fighter-v1/shield/elf-fighter-shield-p2-quad-textured-v1.glb` |
| Tripo comparison export | `output/equipment/elf-fighter-v1/assembly-tripo-v1/elf-fighter-equipped-tripo-v1.glb` |

Use the original character for the Blender assembly. It has 65 skin joints and the clips `idle.001`, `slash.001`, and `walk.001`. The downloaded Tripo comparison export has 55 skin joints and 156 channels per clip, versus 195 channels in the source. Do not treat it as the lossless 65-joint file described in the Lab report. The effect of this re-export difference remains untested.

The baseline is 11,206 character triangles + 1,648 sword triangles + 1,385 shield triangles = 14,239 triangles. Hashes and audits live beside the source files and in `output/manifest.json`.

## Next Blender task

1. Import the three original sources into a new project under `output/equipment/elf-fighter-v1/assembly-blender-v1/`. Preserve source files and the original rig.
2. Fit the sword to the right hand and the shield to the left hand. Keep equipment as separate named objects and retain materials/textures.
3. Check idle, slash, and walk across their full timelines. Pay particular attention to sword/head contact around slash frame 40, sword/thigh or foot contact during walk, and shield/hip or thigh contact during crouching slash. These are Tripo report findings to verify, not accepted behavior.
4. Save the actual `.blend`, an embedded-texture GLB, source hashes, measured geometry/rig/clip counts, and render evidence. Record any intentional rig or animation changes and compare against the Tripo export. Use the same saved version for social images and game evaluation.
5. Update production manifests. Runtime integration is a separate task requiring licence evidence, the character contract, and the asset gate; see `docs/CHARACTERS.md` §7.4. Do not silently add these prototypes to the runtime bundle.

## Tripo result and cost

- Canvas: https://studio.tripo3d.ai/canvas/projects/01a19b3a-ceaf-78a0-9b4b-a9f0aefed971
- Saved asset: https://studio.tripo3d.ai/3d-model/20cccf95-a465-4401-9b6c-785712d0558f
- One inspection: 42 credits. One assembly run: 113 credits. Experiment total: **155 credits**.
- Sword and shield generation previously used 220 credits. Combined equipment plus assembly total: **375 credits**, excluding character generation. No additional paid generation is needed to start Blender work.
- Downloaded Tripo GLB: 4,168,596 bytes; SHA-256 `3093be6a205fa9643bc0114013cd60463ca9c5ec75d1ffd6f384ddf38d55c278`.
- See `output/equipment/elf-fighter-v1/assembly-tripo-v1/README.md`, `credits.json`, `downloaded-glb-audit.json`, and the original Lab report for evidence and limitations.

Studio screenshots, locally rendered geometry sheets, and generated reference images are distinct evidence. Label them accurately. The small native Lab contact sheet is not an HD render.
