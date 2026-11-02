# Equipped Elf Fighter — Preservation and Validation Report

## Scope and execution
- One approved local assembly run; initial placement plus exactly two placement-adjustment batches.
- No generation, remeshing, mesh fusion, new rig, paid external API calls, or source-file edits.
- The owner accepted uncertain Lab billing; this session cannot measure the credit charge or enforce a numeric billing cap.

## Delivered model
- File: elf-fighter-equipped-v1.glb
- Size: 3,705,004 bytes.
- SHA-256: bd00e0df95cf180ccc66750a4ad38f7583dc0eb23012fab93e71a407178d76bd
- Three mesh objects, three original materials, and three original embedded 2048 x 2048 JPEG base-color textures.
- Sword_Right: rigid, unskinned child of mixamorig:RightHand.
- Shield_Left: rigid, unskinned child of mixamorig:LeftHand, fitted beside the left hand/forearm using the existing rear grip.
- Equipment scaling is uniform: sword 0.35x and shield 0.25x relative to their supplied geometry. These are source-coordinate scales, not physical dimensions.
- Added only equipment scene nodes, parent-child links, and equipment transforms. The body remains the original skinned mesh.

## Exact preservation checks
- Original character node names and transforms are unchanged. Only the two hand-node child lists gain equipment links.
- All 65 original joints, skin joint indices, inverse-bind matrices, joint weights, and skeleton hierarchy links are unchanged.
- Every source POSITION, NORMAL, TEXCOORD_0, index array, and character JOINTS_0 / WEIGHTS_0 array compares exactly with the corresponding output array.
- Original material definitions are retained, with equipment texture indices remapped solely to reference the appended original textures.
- All three embedded source image byte streams compare exactly; no texture conversion or replacement.
- Animation channel definitions, target indices, samplers, interpolation modes, timestamps, and sampled values are unchanged. Clips were not resampled or re-exported.
- Entire original character binary payload SHA-256: bd05d5f2e4f5e34bdd6932dcd217bf89fc4afa349c8d2e26d54501ffebeca308

| Asset | Vertices | Triangles | Embedded texture SHA-256 |
|---|---:|---:|---|
| elf-fighter-armored-rigged-v1.glb | 13,525 | 11,206 | 1a95b9bdbf0f4919d7a8689789fe20527b8e2effda66fb1b493f18981e37dd3a |
| elf-fighter-sword-p2-quad-textured-v1.glb | 1,822 | 1,648 | e4c6fb2d6a0b829628d56cf03d5d4836c6970ae2da9febea9d5a0c19ff6b52f8 |
| elf-fighter-shield-p2-quad-textured-v1.glb | 1,409 | 1,385 | 0ed3da0b3edc0657dc7573e5da2ef36ad34dfbdcc19e302aeec499543cdb6d1e |

Total: 16,756 vertices and 14,239 triangles, exactly the sum of the three supplied meshes.

## Animation and attachment checks
| Clip | Source time range (seconds) | Original channels | Source frames checked |
|---|---|---:|---:|
| idle.001 | 0.04166667–15.37500000 | 195 | 369 |
| slash.001 | 0.04166667–6.62500000 | 195 | 159 |
| walk.001 | 0.04166667–2.37500000 | 195 | 57 |

- Reimported the assembled GLB in Blender: exactly 65 bones and three mesh objects; both equipment objects import as bone-parented children of the correct existing hand bones.
- Evaluated all 585 original frames at 24 fps. Maximum rigid parent-relative matrix drift: 2.01e-07, consistent with floating-point evaluation noise.
- Triangle-surface intersection checks used 27 representative poses: nine evenly spaced poses per clip. These are sampled collision checks, not continuous collision certification.
- Final GLB header, binary view bounds, and node/mesh/animation references passed local checks; final lab-report and Blender import succeeded.
- Original UV coverage remains complete; lab-report detects no flipped normals. The model is not watertight and has original seam/open-boundary structure; no print-solid repairs were requested or performed.

## Remaining grip, clipping, and visibility limitations
- The face is visible in the delivered idle presentation previews. Visibility is not guaranteed throughout slash: the preserved arm motion can bring equipment into the head/face region.
- The original finger poses are unchanged, so the character is not retargeted into a fully closed sword grip. Hilt/finger intersections and small grip gaps remain; shield grip/forearm contact is approximate rather than mechanically strapped.
- Sampled sword clipping remains: right thigh during late idle; right leg/foot during walk; head/hair near slash frame 40; hand/forearm contact during slash. These are real remaining limitations, not a collision-free result.
- Sampled shield clipping remains at the left thigh during portions of walk/slash and at the legs/hip during the crouching slash motion. Some hand/forearm intersections are intentional contact at the grip.
- With immutable animation and a fixed rigid hand attachment, this run does not claim perfect grip, face visibility in every frame, or absence of floor/equipment-equipment clipping. Floor and equipment-equipment collision were not certified.
- Both allowed placement adjustments are exhausted; no additional assembly or adjustment runs were performed.

## Sampled collision findings
Counts below are triangle-pair surface intersections; they are not penetration depth, severity, or unique contact count. Body-region names use the dominant original skin bone of intersected body triangles.

| Clip / frame | Sword blade triangle pairs | Sword non-hand body regions | Shield non-hand/forearm body regions |
|---|---:|---|---|
| idle.001 / 1 | 0 | None detected | None detected |
| idle.001 / 47 | 0 | None detected | None detected |
| idle.001 / 93 | 0 | None detected | None detected |
| idle.001 / 139 | 0 | None detected | None detected |
| idle.001 / 185 | 0 | None detected | None detected |
| idle.001 / 231 | 0 | None detected | None detected |
| idle.001 / 277 | 0 | None detected | None detected |
| idle.001 / 323 | 0 | RightUpLeg | None detected |
| idle.001 / 369 | 0 | None detected | None detected |
| walk.001 / 1 | 43 | RightLeg | None detected |
| walk.001 / 8 | 39 | RightFoot | None detected |
| walk.001 / 15 | 0 | None detected | LeftUpLeg |
| walk.001 / 22 | 0 | None detected | None detected |
| walk.001 / 29 | 0 | None detected | None detected |
| walk.001 / 36 | 42 | RightFoot | None detected |
| walk.001 / 43 | 0 | None detected | None detected |
| walk.001 / 50 | 0 | None detected | None detected |
| walk.001 / 57 | 44 | RightLeg | None detected |
| slash.001 / 1 | 0 | RightUpLeg | LeftUpLeg |
| slash.001 / 21 | 0 | None detected | None detected |
| slash.001 / 40 | 128 | Head | None detected |
| slash.001 / 60 | 0 | None detected | LeftLeg, LeftUpLeg |
| slash.001 / 80 | 26 | None detected | Hips, LeftLeg, LeftUpLeg |
| slash.001 / 100 | 0 | None detected | LeftLeg, LeftUpLeg |
| slash.001 / 120 | 0 | None detected | None detected |
| slash.001 / 139 | 0 | None detected | LeftUpLeg |
| slash.001 / 159 | 0 | RightUpLeg | LeftUpLeg |

## Packaging decision
- The fixed packing command was attempted once. Its candidate remained readable but reduced the vertex count from 16,756 to 16,748 and changed each clip from 195 to 53 animation channels.
- That candidate was rejected because the request requires unchanged original geometry and animation representation. The delivered GLB is the validated lossless assembly, not the packed candidate.

## Previews
- elf-fighter-equipped-views.png: fixed four-view clay/wireframe sheet, columns +X, -X, +Y, -Y in Blender coordinates.
- Front = -Y; side = +X; back = +Y. Front/side/back individual PNGs and the labeled combined sheet are native-resolution crops of this same verified render, without upsampling.
- These are geometry inspection previews, not textured beauty renders. The original textures are embedded and preserved in the GLB.
- The previews show the first idle frame. Original default node transforms and clip names are retained; select idle.001 in a viewer to reproduce the presentation pose.
