# Female elf v2: Tripo Studio P2 Quad, target 8000

New asset: https://studio.tripo3d.ai/workspace/texture/8193d3b0-b4cc-48fc-be79-4f9adb51262b

Generated from the approved elf-front.png reference using Chrome UI. One P2.0 candidate in Quad mode, target 8000. Studio and exported FBX both report 9083 polygons. This is a separate generation, not cleanup of the old master.

| FBX | Quad | Triangle | Ngon | Total | Quad percent | Triangulated |
|---|---:|---:|---:|---:|---:|---:|
| Original local master | 3609 | 1336 | 0 | 4945 | 72.98% | 8554 |
| New geometry and textured export | 7321 | 1762 | 0 | 9083 | 80.60% | 16404 |

The target was exceeded by 1083 polygons (13.54%). The result is quad-dominant, not 100% quad. The old Studio base (5729 faces, asset 42de814c-14cc-41b0-ab42-083ca7a22778) has not been proven identical to the original local master. Fighter 1447de15-fb60-4516-a6db-1384f4a9e5a7 remains separate.

## Inspection and texture

Inspected front, both sides and back. No obvious gross mesh defect justified a localized edit. No Edit Mesh, external editor, rig or animation operation was used. Visual checks do not establish manifoldness, self-intersection freedom or animation readiness.

Applied reference-based texture at 2K, Remove Lighting on, style None. Final export contains one UV layer, one material and a 2048x2048 base-color JPEG. Vertices and polygon-index arrays are identical before and after texture. No nonfinite vertex coordinates or repeated indices within faces were found. Detailed UV distortion and game integration were not tested.

## Costs

Studio balance: 25160 -> 25060 after P2 generation (100 credits) -> 25050 after texture (10 credits). Total 110. No additional balance change observed for FBX exports.

## Local deliverables and evidence

- exports/elf-female-v2-p2-8000-geometry.fbx: raw geometry before texture.
- exports/elf-female-v2-p2-8000-textured.zip: final FBX plus external texture. Keep its FBM texture folder beside the FBX.
- exports/textured/: extracted final package.
- verified-texture-and-mesh-proof.mp4: validated texture process and post-generation result/mesh orbits; gaps omitted.
- 20-textured-orbit.mp4: shaded result rotating through all sides.
- Numbered MP4s and matching frame folders: original captured stages, including slow upload attempts.
- recording-events.json: capture times. geometry-audit.json and textured-audit.json: read-only FBX checks.
- manifest.json: SHA-256 and size for each retained local artifact.

A background recording attempt stopped after two frames. Subsequent stages were recorded separately. Export briefly interrupted browser control but the download completed. No recording is described as continuous or as plugin/API execution. The reference upload eventually completed after waiting; earlier blocked status was premature.

Master SHA-256 remains d45d5d805740f04fd05a9c08bfa31a9a80767427f344e70c8573a8c45763ce07. Original master and Fighter were not overwritten.

## Content and sharing

Intended story: building a game with Tripo-generated assets, with a future wish to share assets free. Nothing has been published or sent. Raw-asset redistribution permission remains unverified: confirm applicable Tripo plan/license and input rights. Commercial-use permission does not automatically grant raw-asset redistribution or CC0 status.

## Recording correction (takes precedence)

Final video review found early clips 06-12 captured the older browser tab, not the newly generated asset. Earlier settings/mesh screenshots saved with the same capture method are not reliable evidence of the new model. Do not use proof-labeled/ or INVALID-wrong-tab-workflow-do-not-use.mp4: their captions misidentify the captured tab. They are retained only to preserve all outputs, not as deliverables. Initial P2 generation video is unavailable. The actual generation was observed live and its exported FBX is verified, but this does not replace video proof. No paid regeneration was run to recreate the event. The verified final video uses actual texture processing and the new asset orbit; wireframe orbit 21 was captured after texturing, clearly labeled.


## Final clean showcase and motion tests

`elf-v2-clean-smooth-orbit-final.mp4`: 12.53s, 568x540, 30fps equally stepped orbit, no text/audio/UI. Final edge crop removes the prior blue UI sliver; original frames retained.

`motion-tests-v1/elf-v2-motion-tests-clean.mp4`: 40.07s, 560x550, idle then walk then unarmed slash. Real-time capture approx 18.5-18.8fps, encoded at 30fps using frame duplication. Rig and three animations exported in `exports/rigged/elf-female-v2-rigged-idle-walk-slash.zip`. See motion-tests-v1/report.json for visual QA limitations. Added rig cost 20 credits, total v2 130, final balance 25030. No new geometry or texture generation in this stage.
