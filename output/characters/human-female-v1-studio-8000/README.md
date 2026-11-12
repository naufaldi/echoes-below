# Human female v1 - Tripo Studio production

12 November 2026. Asset `99ee9ad0-48ce-494b-8455-505c28e3cbf0`. P2.0 Smart Mesh, Quad topology, target 8,000 faces, one candidate. Input: archived original `human-front.png`; the differently clothed sheet was not submitted.

## Archived results

- Original geometry FBX: 8,410 vertices, 7,527 quads + 1,672 triangles; 9,199 polygons, no n-gons; 16,726 triangulated triangles. Counts refer to the pre-rig export.
- Original textured FBX ZIP and extracted FBX/base-color JPEG. Texture is 2048 x 2048; Remove Lighting enabled, style None. Topology equivalence after texturing was not independently audited.
- Actual exported geometry wireframe at 0, 45, 90, 180 degrees in `evidence/geometry-four-views.png`. This is a local orthographic all-edge projection, not a Studio screenshot. +Z is assumed front; runtime orientation is unverified.
- Direct Studio screenshots of front, side, back, idle, walk, slash and export settings.

## Rig and motion

Humanoid/Mixamo rig completed in Studio. Idle, walk and unarmed slash presets played. Sampled poses show attached limbs without obvious gross tears; this is limited visual evidence, not detailed skin-weight, finger, collision, ground-contact or full-cycle certification. Walk moves forward in Studio. Slash is about 6.58 seconds and does not yet satisfy the game attack timing contract.

Attempted FBX export includes skeleton and all three clips with Animation stay in Place ON. Chrome navigated to an ERR_BLOCKED_BY_CLIENT page for the export host. The block screenshot is archived. No bypass was attempted and no rigged package was found in Downloads. Bone count, actual exported clips and in-place motion remain unverified. The rig currently remains in Studio only.

## Costs and next work

Observed charges: geometry 100, texture 10, rig 20 = 130 credits. No additional observed charge for preset previews or export. Combined Human and Dwarf work consumed 240 credits, balance 24,709 to 24,469. These are observed Studio balance changes, not API billing records.

Resume the blocked rig download through an allowed path, audit the exported rig, then prepare required game clips and equipment. No game-ready GLB or Blender source was created. No runtime files changed and no deployment. Licence and runtime approval remain outstanding.
