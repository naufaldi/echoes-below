# Elf Rogue, Wizard and Cleric production — 2026-11-10

Nine assets generated in Tripo Studio. All original textured GLB/FBX files, base-color textures, direct Studio screenshots and actual-geometry wireframe sheets are archived in this repository.

Observed credits: **25825 → 24835 = 990**. Nine geometry tasks at 100 and nine 2K texture tasks at 10. No rerolls, rigging, assembly or paid export. API balance was not used.

| Asset | Quads | Triangles | Triangulated total | Files |
|---|---:|---:|---:|---|
| elf-rogue | 7584 | 1809 | 16977 | [Archive](../../characters/elf-rogue-v1/) · [Wireframe](../../characters/elf-rogue-v1/inspection/geometry-four-views.png) · [Studio](../../characters/elf-rogue-v1/tripo-studio-textured.png) |
| elf-wizard | 6526 | 1496 | 14548 | [Archive](../../characters/elf-wizard-v1/) · [Wireframe](../../characters/elf-wizard-v1/inspection/geometry-four-views.png) · [Studio](../../characters/elf-wizard-v1/tripo-studio-textured.png) |
| elf-cleric | 6796 | 1565 | 15157 | [Archive](../../characters/elf-cleric-v1/) · [Wireframe](../../characters/elf-cleric-v1/inspection/geometry-four-views.png) · [Studio](../../characters/elf-cleric-v1/tripo-studio-textured.png) |
| rogue-bow | 676 | 226 | 1578 | [Archive](../../equipment/elf-rogue-v1/bow/) · [Wireframe](../../equipment/elf-rogue-v1/bow/inspection/geometry-four-views.png) · [Studio](../../equipment/elf-rogue-v1/bow/tripo-studio-textured.png) |
| rogue-dagger | 726 | 120 | 1572 | [Archive](../../equipment/elf-rogue-v1/dagger/) · [Wireframe](../../equipment/elf-rogue-v1/dagger/inspection/geometry-four-views.png) · [Studio](../../equipment/elf-rogue-v1/dagger/tripo-studio-textured.png) |
| wizard-staff | 676 | 300 | 1652 | [Archive](../../equipment/elf-wizard-v1/staff/) · [Wireframe](../../equipment/elf-wizard-v1/staff/inspection/geometry-four-views.png) · [Studio](../../equipment/elf-wizard-v1/staff/tripo-studio-textured.png) |
| wizard-spellbook | 507 | 325 | 1339 | [Archive](../../equipment/elf-wizard-v1/spellbook/) · [Wireframe](../../equipment/elf-wizard-v1/spellbook/inspection/geometry-four-views.png) · [Studio](../../equipment/elf-wizard-v1/spellbook/tripo-studio-textured.png) |
| cleric-mace | 580 | 262 | 1422 | [Archive](../../equipment/elf-cleric-v1/mace/) · [Wireframe](../../equipment/elf-cleric-v1/mace/inspection/geometry-four-views.png) · [Studio](../../equipment/elf-cleric-v1/mace/tripo-studio-textured.png) |
| cleric-holy-symbol | 779 | 180 | 1738 | [Archive](../../equipment/elf-cleric-v1/holy-symbol/) · [Wireframe](../../equipment/elf-cleric-v1/holy-symbol/inspection/geometry-four-views.png) · [Studio](../../equipment/elf-cleric-v1/holy-symbol/tripo-studio-textured.png) |

## Checks and limitations

- FBX polygons were parsed from original binary exports. GLB index counts match each FBX triangulated count. All nine base-color textures are 2048 × 2048.
- Sheets are 2800 × 1100 PNG, at 0°, 45°, 90° and 180°, using actual source geometry. They are local orthographic inspection renders, not Studio screenshots or generated concept art. Native model orientation is preserved.
- `inspect_fbx.py` renders these exports using native Y-up geometry. It does not apply arbitrary FBX Model transforms and must be adapted before reuse on transformed multi-object scenes.
- Characters are full bodies wearing class outfits, with empty hands. Clothing is not a separately interchangeable wearable mesh. Models are unrigged; equipment is separate.
- The 750 prop target does not impose a 1500-triangle hard cap. Bow, dagger, staff and holy symbol exceed 1500 triangles and need optimization if that cap is retained.
- Original files are preserved. No `.blend`, optimized game export, runtime licence approval or `public/assets` integration is claimed.
- Generation quality has been visually inspected in Studio; four-view geometry has been inspected locally. Game scale, pivots, attachment, deformation, runtime performance and licensing remain separate acceptance work.
- Studio settings panels can reset to 8K on revisiting an asset; export dialogs confirmed current textures at 2K, independently verified from downloaded JPEGs.
