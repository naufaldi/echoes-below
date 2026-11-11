# Elf rogue static assembly — preservation report

Delivered model: elf-rogue-equipped-tripo-v1.glb

Only the three supplied existing GLBs were used. One bounded assembly run, zero placement adjustments. No generation calls, replacements, skeletons, animations, mesh fusion, remeshing, or topology edits.

Character node hierarchy, transforms and mesh data remain unchanged. Bow_Left_Hand and Dagger_Right_Hand remain separate named meshes under separate placement nodes. The character faces -Z in glTF coordinates, making anatomical left +X and anatomical right -X. Equipment uses uniform scale and translation only; original rotation is retained.

Equipment placement (glTF coordinate units):
- Bow: scale [0.65, 0.65, 0.65], translation [0.5089, 0.14100000000000001, -0.032]; identity rotation.
- Dagger: scale [0.32, 0.32, 0.32], translation [-0.453, 0.39080000000000004, -0.032]; identity rotation.

Measured triangle counts from indexed primitives:

| Asset | Triangles |
|---|---:|
| Character | 16,977 |
| Bow | 1,578 |
| Dagger | 1,572 |
| Total | 20,127 |

Verified preservation:

All original buffer-view bytes were compared against the final GLB and match exactly, including positions, triangle indices, normals, UVs, and embedded image bytes. Accessor definitions match after reference offsets. All three material definitions match after texture reference offsets. Three meshes, three materials and three embedded images remain. Character nodes match exactly; no skins or animations exist. The optional packed candidate changed source data and was rejected; the delivered file is the lossless assembly, not that candidate.

Visual verification:

The accompanying fixed orthographic clay/wireframe sheet renders the delivered GLB's actual geometry, not concept art. Front and back views show the bow at the anatomical left palm and the dagger at the anatomical right palm. The face remains clear in the front view. Hands remain open in their original outstretched pose; equipment sits at the palms rather than in newly closed fingers. Grip contact is intentional. No collision-free guarantee or enclosed grasp is claimed. Side projection overlap does not establish a mesh intersection.

Limits:

The permitted preview provides front, back and two sides only, in clay and wireframe. A textured front/side/back render and the requested 45-degree wireframe view were not produced. The provided sheet is explicitly labeled 90/270/180/0 degrees and is not the requested exact 0/45/90/180 sheet. No textures or images were generated. The embedded original textures are preserved in the downloadable GLB.

Final geometry report: 20,127 triangles, UV face ratio 1.0, zero flipped normals reported for the lossless assembly. The source meshes have open boundaries; assembly preserves them and is not a watertight print repair. The generic report lists only one texture size; explicit GLB inspection and byte comparison verified all three embedded images separately.

Embedded original image SHA-256 values:

- elf-rogue-v1.glb: 517755bb5455fa286358b2c44898d2448c1625747c8d793f884ec97c20c32e29

- elf-rogue-bow-v1.glb: 52553c16974ea34c6e249c717bedb1f7a10f6fa7833f683196d1a925fcf0b0f2

- elf-rogue-dagger-v1.glb: cee9d8d0a5e4dc8be793458bd47372afaccbd57b52996a34214adebc237a0e00
