# Elf class equipment assembly — 2026-11-10

Three bounded static assemblies completed in Tripo AI 3D Lab using existing character and equipment GLBs.

| Class | Equipment | Credits | Downloaded triangles |
|---|---|---:|---:|
| Rogue | Bow left, dagger right | 38 | 20,127 |
| Wizard | Staff right, spellbook left | 43 | 17,539 |
| Cleric | Mace right, holy symbol left | 45 | 18,317 |
| Total | Three runs | **126** | |

Balance: **24,835 → 24,709**, matching the three visible run charges. The earlier 465-credit historical reference was not the actual charge. These costs are separate from the 990-credit original nine-asset generation batch.

Results live under `output/characters/elf-{rogue,wizard,cleric}-v1/assembly-tripo-v1/`. Each includes the downloaded GLB, direct Studio front-oblique/side/back screenshots, completion evidence, original Lab image/report downloads, a 2800×1100 local actual-geometry fourview, texture/geometry audit and SHA-256 manifest. `plan.json` preserves source identities and links each canvas. No separate asset-library ID was exposed; these are canvas node #1 outputs.

All downloaded GLBs have matching source triangle totals and exactly preserved embedded texture bytes, three separate meshes/materials, no rig and no animation. Studio exports normalize coordinates and alter vertex layout; distinguish those files from the internal Lab lossless-assembly claims. Original sources remain untouched. Hands remain open; refine the grip and pose in Blender before animation. No new `.blend` was created and no runtime integration was performed.

`inspect_assembly.py` only audits downloaded geometry and makes local evidence images. It does not assemble or modify a 3D model. It refuses node transforms that it cannot apply rather than silently making incorrect geometry evidence.

The assembly artifacts and handoff notes are versioned together on the production branch.
