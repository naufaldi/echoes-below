# Chapter rooms

From #46 on, each chapter owns one file. `World.tsx` asks `roomFor(sceneId)` in `registry.ts` which component draws the room, then renders the shared actors, markers, labels, tactical overlay and mechanisms on top of it.

| Prefix | Rooms | File | Issue |
| --- | --- | --- | --- |
| `approach`, `hall`, `cookfire`, `prison`, `bell`, `aftermath` | Chapter I | `../ChapterOneRooms.tsx` | #26 (done) |
| `archive` | `archive-1` … `archive-8` | `DrownedArchive.tsx` | #47 |
| `market` | `market-1` … `market-8` | `AshMarket.tsx` | #48 |
| `roots` | `roots-1` … `roots-8` | `RootboundPrison.tsx` | #49 |
| `choir` | `choir-1` … `choir-8` | `HollowChoir.tsx` | #50 |
| `depth` | `depth-1` … `depth-8` | `LastDescent.tsx` | #51 |

Each Chapter II–VI file starts as a stub that renders `LegacyShell`, the old shared shell, so nothing looks different until a chapter replaces it. **Edit only your chapter file and your kit folder.** Don't edit `registry.ts`, `kit.tsx`, `LegacyShell.tsx`, `World.tsx`, `DungeonDressing.tsx` or `ChapterAtmosphere.tsx`. If you need a new shared helper, put it in your own file and say so in your PR.

## Contract

A chapter file exports:

```tsx
export default function DrownedArchive({scene,save,reduced}:RoomProps){…}   // required
export const mood=(scene:string):MoodOverride=>({…});                       // required; return {} to keep chapterMood(scene)
```

- **Props.**
  - `scene` is the scene id, e.g. `archive-3`. Branch on it to make each of the 8 rooms distinct.
  - `save` is the `PublicSave`. It's never null in Chapters II–VI. Read `save.mode`, `save.scene.entities`, `save.scene.description` (Track B fork variant text), `save.tactical` and the mechanism states from it.
  - `reduced` is true when the player asked for reduced motion. When it's set: no particle drift, no camera shake, no animated flicker.
- **Mood.** `mood(scene)` is merged over `chapterMood(scene)`. Keys: `background`, `fog: [near, far]`, `ambient`, `sun`. The legacy `floor` key is only read by `LegacyShell`. The scene's lights stay in `World`: ambient, hemisphere and one shadow-casting sun, with a ±10 m shadow box. Add point lights inside your room.
- **What `World` already draws.** Don't draw these again:
  - party, enemies and NPC models;
  - entity markers and labels;
  - the Curated grid overlay and blocked-cell pillars (`TacticalTerrain`);
  - Ink Garden, Infirmary and Bell Index mechanisms (`archive-2/3/4` in Curated);
  - dice, combat cues and contact shadows.
- **Coordinates.**
  - A server position `[x,y]` is world `[x, elevation, -y]`.
  - The tactical grid is 9×9 cells of 1.2 m. Cell `[4,4]` is the room centre, and the footprint covers ±5.4 m.
  - The camera orbits from +x/+z (azimuth ±0.6π, polar 0.45–1.15). Keep that side low. Put tall walls at −z and on the far sides.
- **Labels.** Put solid dressing inside `<group userData={{blocksLabels:true}}>` so labels avoid it. Decals and floor marks go outside such a group.

## Helpers (`kit.tsx`)

| Helper | Use |
| --- | --- |
| `mat(color, roughness?, metalness?, flat?)`, `decal(color, opacity?)` | Shared, cached materials. Never create a material per mesh. |
| `geo.box/rock/cyl/cone/tent/link/disc/bell/flame` | Shared unit geometries. |
| `Instances({parts, geometry?, color, …})` | One draw call for a list of primitive pieces. `Part = [x,y,z,sx,sy,sz,ry?,rx?,rz?]`. |
| `KitInstances({url, parts, shadow?, material?})` | One draw call per mesh in a kit GLB for every placement. Use it for any repeated wall, floor or column. Parts use the kit's native pivot and size. |
| `Model({url, position, height?, scale?, rotation?})` | One placed kit model. useGLTF loads each file once, and every copy shares its geometry and textures. With `height` the model is centred and fitted; without it the native pivot is kept, so modular pieces tile. |
| `Prop({file, …})` | Quaternius props that are already in `public/assets/expansion/`, by bare file name. |
| `Flame`, `WallTorch`, `chain`, `rand`, `smooth` | Small effects and deterministic jitter. `Flame` respects `reduced`. |
| `cellToWorld(cell)`, `worldToCell(x,z)`, `entityToWorld(entity)`, `CELL` | Coordinate mapping. |
| `roomGrid(save, scene)` | The 9×9 grid. During Curated combat it is `save.tactical.grid`; otherwise it is this scene's authored `encounterTerrain`, which is what combat loads. |
| `walkableCells(save, scene)`, `clearOfPlay(save, scene, x, z, radius?)` | Where creatures can stand. Echo Rules has no grid, so there the whole footprint counts as walkable. |
| `useSolidParts(save, scene, parts, radius?)` | Filters a solid `Part[]` to the pieces that touch no walkable tile and no interactable. The result is memoised per layout. Dropped parts are logged in development. |

**Placement rule.** Solid props may stand only on Curated blocked cells or outside the ±5.4 m footprint, and never within 0.7 m of an entity. `useSolidParts` enforces this, but design for it rather than relying on the filter. Floors stay at or below y = 0, and thin floor decals are fine anywhere.

## Assets

- Put kit files in `public/assets/env/<kit>/`, and give each kit folder a `manifest.json`. `kaykit-dungeon/manifest.json` is the reference.
- Every file needs an entry with `file`, `sha256`, `source` (pinned URL), `author`, `licence`, `retrieved` and `changes`.
- **The licence must be `CC0-1.0`.** Read the licence text inside the download, not just the store page.
- `npm run build` runs `scripts/verify-asset-bundle.mjs`, which fails on:
  - an unlisted file;
  - a changed hash;
  - another licence;
  - a file outside a kit folder;
  - `env/` over **20 MB** in total.
- Import only the files you use.
  - Download into a fresh empty directory outside the repo and check that each file is real glTF/GLB, then copy it in.
  - Keep your chapter's share at **≤ 4 MB**.
  - Add new models to `public/assets/audit-index.json` so `/?asset-review` loads them.
- Write model URLs as full string literals (`'/assets/env/kaykit-dungeon/wall.glb'`). The gate scans `client/rooms/*.tsx` for them and checks that each file was bundled.
- **Starter set** (`kaykit-dungeon`, KayKit Dungeon Remastered, CC0, about 1 MB):
  - Walls: `wall`, `wall_half`, `wall_corner`, `wall_broken`, `wall_arched`, `wall_gated`, `wall_doorway`. Walls are 4 m wide and 4 m tall, 1 m thick, with the pivot at the bottom centre.
  - Floors: `floor_tile_large` (4×4 m), `floor_tile_small` (2×2 m), `floor_tile_small_broken_A`, `floor_dirt_large`.
  - Stairs: `stairs`.
  - Props: `pillar`, `column`, `shelves`, `barrel_large`, `box_large`, `crates_stacked`, `table_medium`, `torch_mounted`, `rubble_large`, `banner_thin_brown`, `candle_lit`.
  - Each GLB embeds the same 15 KB texture atlas.
  - Scale the pieces to fit the 1.2 m cell grid. For example, a 4 m wall at `sx = 0.6` spans two cells.

## Budget

- **Draw calls.** No room may exceed the Phase 0 baseline of about 550 per frame. Chapter I rooms measure 265–351. Today's shell measures at about the same level as Chapter I; see the #46 PR for the numbers.
- Record draw calls and p95 frame time for every room in your PR, measured with `scripts/perf/frame-sampler.js` (`docs/PERF_BASELINE.md`).
- Every shadow-casting mesh is drawn twice. Instance repeats, and set `shadow={false}` on decals and small far props.

## Preview a room

1. Run `npm run build && npm start`. Another worktree may already use port 4317; if so, change both `4317` values in `server/index.ts` locally and don't commit that change.
2. Open `http://127.0.0.1:4317/?scene=archive-3`. The page creates a throwaway save that has reached that room through legal actions, then loads it.
   - `&rules=curated` opens Curated Rules; the default is Echo.
   - `&choice=0` takes the first option in every earlier room; the default is `choice=1`. This flips companion-axis forks such as `roots-4` (`0` → Mira, `1` → Oren). The stance forks (`archive-1`, `choir-4`) and the Scrit forks (`market-5`, `depth-2`) depend on fights and on Scrit, and the preview route doesn't change them: it always gets the mercy/ally variant. To see the other variant, use a played save.
3. The route is `POST /api/dev/preview/:sceneId?rules=echo|curated&choice=0|1`. It needs the session CSRF token and a loopback socket. It is registered only by the local Fastify app (`server/dev-preview.ts`), never by the hosted Worker, and the build fails if `/api/dev/` appears in the Worker bundle.

Preview saves are ordinary local saves named `Preview <scene>`. They appear in "Choose an adventure".
