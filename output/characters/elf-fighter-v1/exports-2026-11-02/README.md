# Armored elf source archive — 2026-11-02

Existing Tripo Studio asset: 1447de15-fb60-4516-a6db-1384f4a9e5a7.
https://studio.tripo3d.ai/workspace/animate/1447de15-fb60-4516-a6db-1384f4a9e5a7

The original reference remains ../elf-fighter-front.png. studio-idle-proof.png is a real Studio screenshot of this armored asset playing idle. Existing motion recordings remain in ../animation-tests/.

The ZIP and source-fbx/ contain the downloaded textured FBX using the Blender preset, current 2K texture, Export Skeleton OFF. This is the static source mesh; the existing Studio rig and animation clips have not been exported in this package. No new model, texture or rig was generated.

Local FBX audit: 6089 control vertices, 6262 polygons, comprising 4944 quads and 1318 triangles; 11206 triangles after triangulation. Counts match the Studio face/vertex display.

armored-elf-geometry-four-views.png is a 2800 x 1100 local orthographic inspection of the actual exported FBX, at 0, 45, 90 and 180 degrees. Original polygon edges are preserved. The Blender source uses Z-up; projection maps (x,y,z) to (x,z,-y) for an upright front view. It uses depth-sorted filled polygons and is not a Studio screenshot. inspection-geometry.json retains the source vertex and face arrays.

Downloads were staged in a fresh temporary directory and ZIP paths checked before extraction. Files remain a production archive, not game-ready runtime assets. Equipment attachment, rig export, final GLB, animation and licence gates remain outstanding. No commit or publication was performed.

## Rigged GLB follow-up

`elf-fighter-armored-rigged-v1.glb` was exported from the same Tripo asset with Export Skeleton on and all three existing animations selected; Animation stay in Place off. Local JSON inspection confirms one skin with 65 joints and idle.001, slash.001, walk.001. This is the input for the separate Canvas assembly experiment.
