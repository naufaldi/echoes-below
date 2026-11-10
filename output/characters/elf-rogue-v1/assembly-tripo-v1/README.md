# Equipped Elf Rogue — Tripo assembly v1

Assembled in [Tripo AI 3D Lab](https://studio.tripo3d.ai/canvas/projects/01a1c42d-e079-77a8-9c41-20785df0e5bf) on 2026-11-10 from the three existing archived source GLBs listed in production.json. Observed run cost: **38 credits**. One assembly run; Lab reports zero subsequent placement adjustments. No new model generation.

Place the bow in the anatomical left hand and the dagger in the anatomical right hand.

**Known issue:** the open-hand placement does not read as a secure grip. See [Blender grip-correction handoff](BLENDER-HANDOFF.md) for the next agent's scope, source files, workflow and acceptance checks. The correction is not implemented yet.

## Files and evidence

- `elf-rogue-equipped-tripo-v1.glb`: downloaded Studio GLB export with three separate meshes/materials and three embedded 2048×2048 textures.
- `tripo-studio-equipped.png`, `tripo-studio-side.png`, `tripo-studio-back.png`: direct, unaltered textured Studio screenshots.
- `tripo-lab-completed.png` and `.txt`: direct completion and credit evidence.
- `geometry-four-views.png`: 2800×1100 local orthographic inspection of the downloaded GLB at 0/45/90/180°. Actual triangle geometry, not concept art or a Studio screenshot. Painter ordering may show artifacts at overlapping faces.
- Additional PNG and preservation-report MD files: original Lab downloads, retained unchanged. Rogue Lab evidence uses fixed cardinal angles; Wizard Lab preview is clay; Cleric Lab includes textured renders.
- `downloaded-glb-audit.json`: measurements of the actual archived export. `production.json` links source files and hashes. `manifest.json` checks every archive file.

## Verified result and limits

Downloaded export: **20,127 triangles**, three materials, three embedded 2K images, zero skins and zero animations. All three embedded image hashes match the original inputs exactly. Original source-file hashes remain unchanged.

The Lab preservation report describes its internal lossless assembly. Studio re-export normalizes coordinates and changes vertex layout/count; its bytes and hierarchy are not identical to the internal Lab file. Do not extend the Lab byte-preservation claim to the downloaded export. The archived GLB is the locally audited handoff file.

This is a static equipment placement in the original outstretched pose. Fingers remain open; some hand-contact intersections or small support gaps may remain. It needs grip/pose refinement, rigging and runtime integration checks before game use. No local Blender assembly or `.blend` source was created. Production archive only; no public/assets integration or runtime licence approval.

The original characters, equipment, reference images and source exports remain in their original version folders. The assembly is archived alongside its source assets for the Blender handoff.
