# Rogue grip correction — Blender handoff

Status: **requested follow-up; not implemented**. Owner flagged the Rogue's weak weapon contact on 2026-11-10 and asked to leave instructions for another agent. This note does not claim a corrected model or Blender file exists.

## Problem and target

The current Tripo assembly puts the bow near the anatomical left palm and the dagger near the anatomical right palm, while retaining open fingers and the original outstretched pose. The weapons do not read as firmly held. Exact contact gaps and mesh intersections still need close-up inspection; the screenshots alone are not a collision audit.

Use Blender to correct placement and hand shape on copies of the existing Tripo assets. Do not regenerate the character or weapons. Aim for a believable static grip first, without changing the face, costume, textures or overall character proportions. A complete animation rig is a separate task.

## Starting files

- Import `elf-rogue-equipped-tripo-v1.glb` from this folder as the assembly baseline. It has 20,127 triangles, three meshes/materials, three embedded 2K textures, and no skeleton or animation.
- Compare `tripo-studio-equipped.png`, `tripo-studio-side.png`, `tripo-studio-back.png`, and `geometry-four-views.png` here.
- Read `production.json` for the three original GLB paths and hashes. Original character: `../original-tripo/elf-rogue-v1.glb`. Original props are under `output/equipment/elf-rogue-v1/{bow,dagger}/original-tripo/` from the repository root.
- Read `downloaded-glb-audit.json`. Studio re-export normalized orientation/scale and changed vertex layout. Do not apply the Lab report's original-coordinate placement values directly to this export. Inspect the actual imported model axes and dimensions.

## Blender workflow

1. Import the baseline into a new scene. Save a new `.blend` under sibling `../assembly-blender-v1/`. Keep the Tripo archive unchanged and maintain a hidden, unedited baseline collection for comparison.
2. Identify anatomical left/right from the character's front, not the current camera direction. Keep bow and dagger as separate, clearly named objects. Inspect each hand and handle from front, side and above before editing.
3. Fit the dagger handle into the right palm. Center the grip between the thumb and curled fingers; keep the crossguard outside the hand and the blade clear of the forearm. Adjust equipment translation and rotation first. Use uniform scaling only when handle size requires it.
4. Fit the bow's central grip into the left palm. Wrap the fingers and thumb around that grip. Keep the bowstring clear of the wrist/forearm and avoid burying the bow limbs in the hand. This is a relaxed equipped pose, not an arrow-drawing pose.
5. Correct the hands. The model is unrigged, so Pose Mode alone cannot close its fingers. Inspect whether finger geometry is separable enough for controlled editing. For a static result, use small local mesh edits with carefully limited influence, preserving UVs and avoiding stretched knuckles or collapsed fingers. A temporary hand armature is an alternative when it gives better deformation control; record whether it is retained or baked. If topology prevents a clean grip without substantial remodeling, report that constraint before widening scope.
6. Make only the wrist/forearm changes needed to support the grip. Do not redesign the full pose. Once a hand rig exists, parent or constrain equipment to the corresponding hand bone/socket, keeping props rigid rather than weighting them to finger bends. For an unrigged static export, retain separate objects and their placement transforms; do not claim they will follow future animation automatically.
7. Inspect contact from multiple angles. Fingers should wrap around handles with visible thumb opposition; no floating support gap, blade-through-hand, bowstring-through-arm, or severe finger intersections. Small intentional contact overlap is acceptable when it prevents visible gaps. Do not hide bad contact behind a favorable camera angle.
8. Export a new GLB and re-import it into a fresh scene. Confirm appearance, equipment placement, object separation, materials, embedded textures and any retained rig survive the round trip. Compare character scale/orientation to the baseline.

## Deliverables and acceptance

Save everything under `output/characters/elf-rogue-v1/assembly-blender-v1/`:

- Real saved `.blend`, corrected GLB, and a short change/validation report linking the exact source GLB and its SHA-256.
- Before/after close-ups of **both** grips from front and side, plus full-character front/side/back images. Label these as Blender renders or screenshots, never Tripo Studio screenshots.
- Actual exported-geometry wireframe at 0/45/90/180 degrees, with measured triangle count. No generated illustration as geometry evidence.
- Audit exported mesh/material/texture counts, dimensions and hashes; explain any intentional geometry or texture changes. Keep original textures where possible and preserve original Tripo exports.
- SHA-256 manifest for every deliverable and a README with remaining issues. Do not claim animation readiness unless rig, weights and equipment following have actually been tested.

Pass only when both hands visibly hold their weapons from multiple views and the exported GLB reproduces the corrected Blender scene. Keep this as a production archive until the project's runtime licence, budget and integration gates pass. No automatic commit, push, merge or deployment is authorized by this note.
