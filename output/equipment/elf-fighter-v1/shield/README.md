# Elf fighter shield v1 — Tripo production archive

Created 2026-11-02. Asset ID: `4fd06aa9-c5d9-426b-9638-3d097a9027d7`.
Studio: https://studio.tripo3d.ai/workspace/texture/4fd06aa9-c5d9-426b-9638-3d097a9027d7

## Provenance and settings

Codex-generated `shield-reference-v1.png` is the 2D reference. Tripo Studio generated the 3D model using Smart Mesh P2.0, Quad topology, requested polycount 750, one candidate. Texture uses the same reference, None style, Remove Lighting enabled, 2K. No paid retries, standalone Smart UV, PBR generation, rigging or upscaling were run.

`01-p2-quad-settings.png` and `02-texture-settings.png` record settings. `03-studio-front.png`, `04-studio-back-angle.png`, and `05-studio-back.png` are unedited screenshots of the actual Tripo Studio viewer. They are not image-generation recreations or local Blender renders. Screenshot resolution is the captured browser viewport; the model texture is separately 2048 x 2048.

## Cost observed

| Operation | Credits | Balance after |
| --- | ---: | ---: |
| Starting balance | — | 25090 |
| P2.0 geometry | 100 | 24990 |
| 2K texture | 10 | 24980 |
| Exports | No further deduction observed | 24980 |

Shield total: **110 credits**. Sword plus shield: **220 credits** based on the sword production record (110). This excludes the earlier character generation and any unrelated work.

## Files and verification

- Geometry ZIP and `geometry-fbx/`: original geometry source export.
- Textured ZIP and `textured-fbx/`: Blender preset FBX plus base-color JPEG. No .blend scene has been created.
- `elf-fighter-shield-p2-quad-textured-v1.glb`: game-format export of the same Tripo asset, not yet integrated into the game.
- `geometry-audit.json`: source FBX has 808 control vertices and 836 polygons: 549 quads and 287 triangles. Quad fraction is 65.67%; triangulation yields **1385 triangles**. The Quad setting is not an all-quad guarantee.
- `textured-audit.json`: GLB has 1385 triangles, one mesh, one material, UV coordinates and an embedded 2048 x 2048 JPEG. Size 629168 bytes; no external file URIs.
- `social-images.zip`: reference, genuine Studio screenshots, and the separately labelled local geometry inspection render for content preparation.
- `manifest.json`: SHA-256 and byte size for every archived file except itself.

Downloads were copied into fresh temporary staging directories and ZIP paths checked before extraction. No package installation or runtime code changes were needed.

## Visual checks and limits

The front preserves the green wooden face, gold rim and leaf motif. Rear/angled inspection shows shield thickness and a raised handle-like form. This is not proof that a hand fits behind the grip. Scale, orientation, attachment point, hand clearance, clipping and animation still need an in-game check. No exact 1:1 geometry fidelity claim is made.

The geometry-only Studio viewer showed an unknown server error, but its FBX export succeeded. The textured model rendered successfully without another geometry generation.

This remains a production archive under output. The repository runtime licence gate has not been cleared for these AI-generated exports; these files are not approved runtime assets. Source and screenshots trace to the same asset ID. Endorsement wording should describe the actual P2.0/image-to-3D workflow and mixed topology; do not claim standalone Smart UV or sponsor approval of this shield post.

## Four-view geometry image

`shield-geometry-four-views.png` (2400 x 1100) shows orthographic projections at 0, 45, 90 and 180 degrees, generated locally from the original FBX polygon data in `shield-inspection-geometry.json`. It preserves original quad/triangle edges. This is a solid-face inspection projection with depth-sorted polygons, not a Studio screenshot or a photorealistic render. It used no additional Tripo credits.
