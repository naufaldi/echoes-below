# Tripo equipped elf assembly v1 — 2026-11-02

Project: https://studio.tripo3d.ai/canvas/projects/01a19b3a-ceaf-78a0-9b4b-a9f0aefed971

## Result

One owner-approved assembly run completed in AI 3D Lab with exactly two equipment placement adjustments. The resulting equipped GLB is present and previewable in the Canvas node. The textured Studio viewer was inspected and captured in studio-equipped-preview.png. Local downloads confirmed: preservation report and front/side/back clay-wireframe preview. The combined GLB was subsequently downloaded successfully through the saved Assets entry; see the export follow-up below. The four-view PNG is still not downloaded.

The source character rigged GLB is archived under output/characters/elf-fighter-v1/exports-2026-11-02/. input-baseline.json records source hashes and structure for later Blender comparison.

## Cost

Inspection 42 credits; one assembly run 113 credits; experiment total **155 credits**. Balance 24980 -> 24938 -> 24825. Prior sword plus shield generation was 220 credits; equipment production plus this experiment is 375 credits, excluding earlier character production. No second assembly run was submitted.

## Evidence and limits

The Lab report states: three meshes/materials, 14239 triangles, 65 joints, original embedded textures and idle.001/slash.001/walk.001 preserved; Sword_Right and Shield_Left parented to existing hand bones; bone-following checked over 585 frames. These preservation and motion checks are **Lab-reported**, not independently confirmed against a locally downloaded output. The live Studio viewer showed the textured equipped character and 14239 faces.

Grip remains approximate. The report identifies leg clipping during walk and head/hair intersection during slash. This is a comparison prototype, not a game-ready result. Preview PNGs are small clay/wireframe inspections, not HD promotional renders. The Lab itself used Blender for internal validation; the planned separate local Blender version has not been made.

Keep source assets unchanged for the later Blender comparison. Compare attachment, grip, pose intersections, original-data preservation, rendered appearance, runtime budget, time, and cost. No runtime integration, commit, deployment, or public sharing was requested/performed by this assistant.

## Successful download follow-up

Direct Canvas exports did not produce a confirmed local file. Save to asset library followed by Export from https://studio.tripo3d.ai/3d-model/20cccf95-a465-4401-9b6c-785712d0558f succeeded. `elf-fighter-equipped-tripo-v1.glb` is now present both in Downloads and this archive (4168596 bytes). Export Skeleton on; Pack UV off; current 2K texture. No assembly rerun was made.

Independent local audit confirms 3 meshes, 3 materials, 14239 triangles, embedded resources, all three named clips, Sword_Right parented to mixamorig:RightHand, Shield_Left to mixamorig:LeftHand. **The downloaded asset export is NOT byte-identical to the Lab-reported lossless output:** its skin contains 55 joints (source had 65) and each clip has 156 channels (source had 195). Its size and SHA-256 also differ from the Lab report. Treat it as a Tripo re-export, not verified exact preservation. Whether the removed joints/channels affect motion has not been validated. Preserve this distinction in the Blender comparison. Detailed audit: downloaded-glb-audit.json.
