# Elf wizard static assembly preservation report

Inputs: elf-wizard-v1.glb, elf-wizard-staff-v1.glb, elf-wizard-spellbook-v1.glb. Only these three assets were used, on temporary copies.

## Changes

One bounded assembly, zero subsequent placement adjustments. Added separate named equipment parents and named equipment mesh objects: `staff_anatomical_right_mesh` and `closed_spellbook_anatomical_left_mesh`. Character nodes and transforms are unchanged. Equipment changed only by uniform scale, rotation and translation. Staff scale 1.12; book scale 0.18. Book thin axis aligned to vertical with PCA, giving horizontal covers. Placement matrices below use glTF coordinates, Y up, front +Z. Anatomical right is -X.

## Verified preservation

All three original binary payload blocks match the final GLB byte-for-byte, including vertex positions, normals, UVs, triangle indices and embedded images. Original material definitions match after texture-reference index relocation. Character names, mesh references, hierarchy and transforms match exactly. Serialization omitted one empty UserProperties metadata string; geometry, pose and appearance are unaffected. Original mesh primitive topology is retained; no remesh, fusion, replacement assets, generated textures, skeleton or animation. The final GLB has three separate mesh objects, zero skins and zero animations.

Measured triangles: character 14,548; staff 1,652; book 1,339; total 17,539. Vertex entries: 19,896. Output lab-report confirms UV face ratio 1.0 and zero flipped normals. Existing open boundaries remain; this is not a watertight-print repair.

The prescribed packing check changed vertex entries to 19,857 and reported five flipped normals. The packed candidate was rejected; the delivered unpacked GLB preserves source data exactly.

## Visual checks and limitations

Inspected actual-geometry clay/wire front, side and back renders. Staff meets the anatomical right hand; the closed book sits over the anatomical left palm. Face remains visible in the front view. Original outstretched pose and open fingers are unchanged, so this is static prop support rather than a closed-finger grip. Minor contact intersections may remain; no exact triangle-triangle collision clearance claim is made. Staff overlaps the character silhouette in a side view, as expected from this pose.

The supplied front/side/back image is a clay geometry render. The 0/45/90/180 sheet is a direct orthographic projection of the final GLB triangle vertices/indices, with painter-ordered faces and wire edges; it is not a textured render or concept art. Fine overlapping triangles may have painter-order artifacts.

The requested textured front/side/back preview was not produced: the available Lab preview workflow permits clay and wireframe only. Original materials and embedded textures are preserved in the downloadable GLB. No paid generation service was called; Lab credit cost was not measured.

## Input hashes and equipment transforms

### elf-wizard-v1

SHA-256: `96a82b3eb271d9544981f2f5fae347f61ce3b3ebecc04a03be003c5f5b98369c`

```
[
  [
    1.0,
    0.0,
    0.0,
    0.0
  ],
  [
    0.0,
    1.0,
    0.0,
    0.0
  ],
  [
    0.0,
    0.0,
    1.0,
    0.0
  ],
  [
    0.0,
    0.0,
    0.0,
    1.0
  ]
]
```

### elf-wizard-staff-v1

SHA-256: `1c68a74d83bc6d472537add049df03eacc5e42d0081daa07513caa2a02aaba49`

```
[
  [
    1.12,
    0.0,
    0.0,
    -0.442
  ],
  [
    0.0,
    1.12,
    0.0,
    -0.005
  ],
  [
    0.0,
    0.0,
    1.12,
    0.042
  ],
  [
    0.0,
    0.0,
    0.0,
    1.0
  ]
]
```

### elf-wizard-spellbook-v1

SHA-256: `c36605e1b9b5af4a80179783071cca6b596173c83e2af77c7cb8bf266488e40c`

```
[
  [
    0.17988763995583457,
    0.0048853539372618274,
    0.004070664322647138,
    0.42944036305156064
  ],
  [
    -0.006337276084258454,
    0.12820949746263857,
    0.12618305628018975,
    0.4480739390324448
  ],
  [
    0.0005252836870470794,
    -0.12624760622398087,
    0.12830146530637432,
    0.09444512656341691
  ],
  [
    0.0,
    0.0,
    0.0,
    1.0
  ]
]
```