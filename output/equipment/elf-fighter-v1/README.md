# Elf Fighter equipment prototype — 2 November 2026

## Sword production
- Reference images generated using OpenAI built-in image_gen. Sword: isolated chunky steel short sword, leather grip, brass leaf guard. Shield: isolated moss-green wooden shield, brass rim and leaf emblem. White backgrounds, no characters or text.
- Tripo Studio browser workflow, P2.0 Smart Mesh, Quad, target 750 polygons, one candidate.
- Asset: https://studio.tripo3d.ai/workspace/generate/14ad0d64-5835-4d3f-b739-447bfee65c4f
- Geometry generation: 100 credits observed (25,200 -> 25,100). FBX export caused no additional observed deduction. At that geometry-only stage, no texture generation, Smart UV, rig, or shield generation had been submitted. See completion below.
- Export: sword-p2-quad-v1.fbx; original downloaded ZIP preserved.
- Binary FBX audit: 855 control points, 750 quads and 148 triangles, 898 total polygons, 83.52% quads, 1,648 triangles after triangulation. No n-gons found. Target is not an exact output count.
- Studio model viewer returned an unknown server error, including after Retry and reload. Export succeeded. Four-view preview is a local orthographic rendering of exported FBX vertex/polygon data, not a Studio screenshot.
- Visual inspection: blade, guard, grip and pommel remain identifiable in four projected views. Fine leaf relief is simplified. Side thickness needs checking against the elf hand. These projections do not certify manifoldness, intersections, normals, UV quality, grip or game readiness.

## Endorsement alignment
The Gmail collaboration email of 23 September 2026 suggests P2.0 Native Quads, speed and Smart UV, with weapons/props as examples. The approved October concept concerned the elf first post. No new weapons-post approval is claimed. The linked detailed Feishu brief could not be opened. Use actual evidence: P2.0 Quad generation, mixed quad/triangle result, real observed workflow. Do not claim all-quad output, Smart UV testing, measured generation speed, textures or game integration.

## Remaining work
Examine UV distortion, check scale/grip on elf and resolve asset licence requirements before bundling. Shield remains a reference image only. No commit, push or publish performed.

## Sword texture and exports completed — 2 November 2026
- Reference-image texture, style None, Remove Lighting on, 2K. Default 8K would have cost 30; selected 2K cost 10 credits.
- Total observed spend: geometry 100 + texture 10 + exports 0 = **110 credits**. Balance 25,090 after both exports.
- Studio viewer recovered after texture generation. Front, oblique/side and reverse-oblique views inspected; blade, brass guard and leather grip visibly textured. No gross missing section observed. Detailed UV seams and hand fit remain untested.
- FBX package and GLB saved under `textured/`. GLB audit: 842,912 bytes, 1,648 triangles, one mesh/material, one embedded 2048×2048 JPEG, UV coordinates present, no external URIs.
- GLB download event timed out in browser tooling, but the completed file was found locally and its header, declared length, JSON, geometry count and embedded image were validated.
- Smart UV was not separately run. No rig, paid retry, shield generation, publishing or game integration performed.
- Endorsement evidence can now include reference-to-quad mesh and 2K texture workflow. No claim that all faces are quads or that the asset is game-ready.
