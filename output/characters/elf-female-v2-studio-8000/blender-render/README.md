# Blender Render — Elf v2 armor comparison

Saved 1 November 2026 for the owner to compare **Blender Render** against the existing Tripo production result. This directory contains the latest delivered Blender armor-on-original-character result; it does not contain the rejected character rebuild.

- [Front](blender-render-front.png) · [Three-quarter](blender-render-three-quarter.png)
- [Walk pose](blender-render-walk.png) · [Slash pose](blender-render-slash.png)
- Editable scene: `blender-render.blend` (Blender 4.3.2; original texture packed; losslessly Zstandard-compressed).
- Verification: [preservation-qa.json](preservation-qa.json).

The existing Elf v2 mesh, UVs, weights, original material, 65-bone rig and idle/walk/slash actions are preserved. New modular armor is authored separately. Idle playback is enabled. The source is the [existing rigged FBX](../exports/rigged/unpacked/tripo_convert_c0fc6445-98f0-43ca-85cb-adfc494d6842.fbx).

Front/three-quarter/walk views were rendered before the rear-only final backplate fit; the slash view was re-rendered after that fit. These views were checked for the observed torso, greave, toe-cap and backplate issues. This does not certify collision-free motion through every frame.

This is a comparison/production archive, **not a runtime asset integration**. Original character proportions are retained rather than changed to match every pixel of the approved 2D concept. Generated-source licensing, runtime geometry/skin/texture budgets and game clip contracts still need the checks documented in [CHARACTERS.md](../../../../docs/CHARACTERS.md). No deployment, game asset replacement or new Tripo generation was performed.

Files follow the existing production archive convention and use ordinary Git blobs (the repository has no Git LFS attributes). `manifest.json` records SHA-256 and byte counts for every other file in this directory; it is provenance inventory, not runtime licence approval.

The `.blend` uses Blender-compatible lossless Zstandard compression (7,956,745 bytes). It was reopened in Blender 4.3.2 and its decompressed bytes match the delivered 41,198,876-byte scene exactly. Uncompressed SHA-256: `d8f6242914e500076a6607914c6d747c699fa415ef101304ac8e27ccc682ec2b`. No scene data was removed or simplified.
