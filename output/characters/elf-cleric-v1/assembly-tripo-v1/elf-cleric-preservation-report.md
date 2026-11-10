# Elf cleric static assembly preservation report

Only the three supplied GLBs were used. One assembly run; zero subsequent placement adjustments. No generation API calls, replacement assets, skeletons, animations, remeshing, mesh fusion, or texture generation.

## Verified preservation

| Source | Triangles | Position vertices | Binary payload check |
|---|---:|---:|---|
| elf-cleric-v1.glb | 15,157 | 32,410 | PASS |
| elf-cleric-mace-v1.glb | 1,422 | 3,362 | PASS |
| elf-cleric-holy-symbol-v1.glb | 1,738 | 4,128 | PASS |
| Total | 18,317 | 19,950 | PASS |

Every source buffer-view payload is byte-identical in the delivered GLB, including positions, normals, UVs, indices and embedded image payloads. Accessor metadata matches after index remapping. Material definitions and texture references match after index remapping. Character node transforms are unchanged. Three separate meshes are retained under named objects: elf_cleric_original, mace_anatomical_right, holy_symbol_anatomical_left. No skins or animations exist.

Only equipment root scale, rotation and translation changed. Names and resource indices were updated to assemble the scene. Embedded image data was not re-encoded.

## Placement and evidence

Anatomical right is negative X (viewer left in the front view); anatomical left is positive X. Both grips are placed at palm locations near Y=0.447, Z=0.055 in source glTF coordinates. Face remains visible in the front view. Front, side and oblique visual checks show equipment outside the torso, with deliberate grip/hand overlap. No exhaustive collision test was performed. Open fingers and the original T-pose are preserved; this is not a closed-finger gripping pose.

The textured front/side/back preview and 0/45/90/180 wireframe sheet are orthographic Blender renders of the delivered GLB geometry. They are rendered geometry evidence, not concept art. Wireframe edges represent the actual input triangles. Per-view renders use 256 pixels and 16 samples, without increasing the Lab defaults.

The geometry report measured 18,317 triangles, full UV face coverage and non-watertight source geometry. This assembly is not a print-solid repair. A packing check changed vertex counts, so that packed candidate was discarded; the delivered GLB is the byte-preserving unpacked assembly.

## Equipment transforms

Uniform scales and translations are in the input's unspecified coordinate units; rotations are about source glTF X.

- elf-cleric-mace-v1: scale 0.42; X rotation -30.963757 degrees; translation [-0.46210248000000004, 0.39827109859177834, 0.17786848063921606].
- elf-cleric-holy-symbol-v1: scale 0.32; X rotation 0.000000 degrees; translation [0.46192192000000004, 0.367, 0.05507808].

Delivered GLB SHA-256: c12a2e2142389dbb413290c7353a9570187edf139c5ab1b54b7f41e9f5a44d9a
