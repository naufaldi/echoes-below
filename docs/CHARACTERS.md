# Echoes Below — Character model contract (v2)

Status: ready for production (v2.1, 27 October 2026). Owner: Naufaldi. Parents: [PRD](PRD.md) (Presentation v2) and [ROADMAP](ROADMAP.md) (v1.0).

What v2.1 adds:
- the art direction now matches the KayKit environments (§3);
- the `Head` node rule (§4.3);
- dialogue clips (§4.4);
- an NPC priority list (§2);
- portraits and dialogue presence (§6).

KayKit placeholder characters are acceptable at v1.0 (ROADMAP D11), so these models never block a release.

This document says what 3D characters the game needs, how they must be built, and how they plug into the code. It has two audiences:

- **Part A — model production.** For whoever generates the models (the owner with Tripo, plus any cleanup tool such as Blender).
- **Part B — integration.** For the coding agent (Codex) that wires finished GLB files into the game.

Rule for both parts: the engine (`server/`, rules in `shared/`, saves, API) does not change. Only assets, `shared/visual-identity.ts`, `shared/animation-cues.ts`, `client/` rendering, the asset gate and the asset tests may change.

## 1. How characters appear in the game

- Desktop browser, 1440×900 baseline. Isometric-style camera at about `[9, 12, 15]`, FOV 43°, looking at the room centre. Players can orbit and zoom. See the `Canvas` camera and `OrbitControls` in `client/World.tsx`.
- On screen a character is small, roughly 80–140 px tall. **Silhouette and colour blocks matter more than face or texture detail.** Fine detail will not be seen.
- Three party members stand close together. They must be told apart with name labels hidden.
- Lighting is warm torchlight with cool shadows.
- Chapter I is built from low-poly Quaternius props with flat colour.
- Chapters II–VI are moving to **KayKit Dungeon Remastered** (CC0): chunky stylised pieces with one small hand-painted texture atlas (#46–#51).
- Characters must sit naturally in both.
- Rendering is three.js r180 via React Three Fiber, WebGL2, shadows on, device pixel ratio 1–1.5.

## 2. Roster

### Phase A — required now (4 models)

One model per class. The hero, Mira and Oren all use these, because the player may change any companion's class at creation. Internal class ids must not change.

| Model file | Class (UI) | Internal `classId` | Reads as | Weapon/prop | Combat cues it must perform |
|---|---|---|---|---|---|
| `fighter.glb` | Fighter | `guardian` | Armoured front-liner, broad shoulders, shield | One-hand sword + shield | melee, item, dodge |
| `rogue.glb` | Rogue | `scout` | Light, hooded, lean, ranged | Short bow or hand crossbow + dagger | ranged, melee, item, dodge |
| `wizard.glb` | Wizard | `adept` | Robed scholar, tall hat or hood, glowing focus | Staff or wand + book | spell, item, dodge |
| `cleric.glb` | Cleric | `cleric` | Holy defender, tabard with sun motif, lighter armour than Fighter | Mace + holy symbol (no sword) | spell, melee, item, dodge |

The Fighter and the Cleric currently share one knight model. They must now have clearly different silhouettes: Fighter = heavy plate and shield, Cleric = tabard, mace and raised holy symbol.

### Phase B — later, not now

- **Race variants.** Human/Elf/Dwarf/Halfling. For now race is applied in code as a height and breadth scale (`actorHeight` in `shared/visual-identity.ts`; `breadth` in `CharacterModel`, `client/World.tsx`). Build Phase A models with **human** proportions.
- **Companion signatures.** Optional named meshes so Mira and Oren stay recognisable whatever class they take (see §4.5).
- **Named NPCs**, in order of how often they appear (mentions across `shared/campaign.ts` and `server/`; speaker names from `shared/speaker-label.ts`):

  | Priority | NPC | Mentions | Today |
  |---|---|---|---|
  | 1 | **Scrit**, the goblin who may become an ally | ~115 | Goblin model |
  | 2 | **Commander Vark** | ~85 | Vark model |
  | 3 | **The Courier** | ~69 | Rogue model |
  | 4 | **Archive apprentice / Ilyra** the librarian | ~34 | Fighter model in bronze |
  | 5 | **The Ferryman** (Drowned Archive) | ~20 | Entity marker only |

  Scrit and Vark speak most, so they are the first NPCs worth a model and a portrait after the four classes.
- **Enemies.** Goblins and other monsters stay unchanged (PRD decision 5).

## 3. Art direction

- **Style:** stylized fantasy, chunky and readable. Head about 1/4–1/3 of body height (slightly heroic chibi, close to the current party scale). Not realistic and not anime.
- **Shapes:** one strong silhouette feature per class: Fighter shield + pauldrons, Rogue hood + bow, Wizard hat/hood + staff, Cleric tabard + holy symbol.
- **Colour:** muted base materials (leather, steel, cloth) plus one **accent area** (cape, tabard, hood or sash) that the game recolours by palette. Keep the accent area large and visible from above.
- **Texture:** a simple hand-painted or flat-shaded look that sits next to KayKit Dungeon Remastered walls and Quaternius props. Avoid photo-real noise, PBR grain, strong baked lighting and baked shadows.
- **Match the environment.** Put a candidate next to a KayKit wall and the current KayKit party in `?asset-review` before you finish it. Realistic proportions or a realistic texture will clash with both and are a reason to regenerate.
- **Pose:** neutral A-pose or T-pose for rigging. Weapons in hands or holstered, below head height in the rest pose (the game measures the model's bounding box to scale it; a raised weapon makes the character smaller).
- **Tone:** heroic and slightly worn. These are people going into a dangerous dungeon, not parade knights.

### Companion personality (for signature details later)

- **Mira**: perceptive scout with dry humour; searching for her brother Tavin, a surveyor. Default palette `moss`. Signature idea: map case or brass surveyor's compass on the belt.
- **Oren**: patient veteran who protects people and questions blind obedience to his old oath. Default palette `ember`. Signature idea: worn watch badge or a torn oath sash.
- **Hero**: the player's character. No signature.

## Part A — Production requirements

### 4.1 File format and orientation
- glTF 2.0 binary (`.glb`), one file per model, textures embedded. No external or remote URIs (the asset gate rejects them).
- Y-up, 1 unit = 1 metre. Human height about 1.8 m (absolute scale is normalised in code, but keep it sane).
- Feet on `y = 0`. Centred on the origin in X and Z.
- **Faces +Z** (toward the default camera). The current party models face +Z and the code relies on it.
- Nothing else in the file: no lights, cameras, ground planes, stray props or hidden helper meshes.

### 4.2 Mesh and rig
- One humanoid skeleton per model, all character meshes skinned to it. At most about 100 joints (current models use 41).
- Animations are **in place**. No root motion, because the game moves the character itself.
- Weapons and props are **separate meshes** parented or skinned to the hand bones, so code can hide or show them.

### 4.3 Names the code depends on (exact spelling)

| Thing | Name | Purpose |
|---|---|---|
| Main-hand weapon mesh | `Weapon_Main` | Shown by default |
| Off-hand weapon or prop | `Weapon_Off` | Shown by default (wand, dagger, holy symbol, book) |
| Shield | `Shield` | Fighter only |
| Palette material | `Accent` | Only this material is recoloured by `ember` / `moss` / `moon` |
| All other materials | anything except `Accent` | Never recoloured |
| Companion signature mesh (Phase B) | `Sig_Mira`, `Sig_Oren` | Hidden unless that companion uses the model |
| Head bone | `Head` (case-insensitive; the KayKit rigs use `head`) | Portrait framing (§6) and look-at. Required |

Put the accent colour as near-white/light grey in the `Accent` base colour or texture, because the game multiplies the palette colour into it. Dark accents cannot be recoloured.

### 4.4 Animation clips (exact names)

| Clip name | Game state / cue | Loop | Max length | Notes |
|---|---|---|---|---|
| `Idle` | idle | yes | — | Seamless loop, subtle breathing |
| `Walk` | moving between tiles | yes | — | Seamless loop, in place |
| `Attack_Melee` | `melee` | no | 1.0 s | Code holds the attack state 1.1 s |
| `Attack_Ranged` | `ranged` | no | 1.0 s | Draw/aim/release |
| `Cast_Spell` | `spell` | no | 1.0 s | Clear hand/focus raise at the cast moment |
| `Use_Item` | `item` | no | 1.0 s | Drink potion / use object |
| `Dodge` | `dodge` | no | 0.8 s | Side-step or block |
| `Hit` | took damage | no | 0.6 s | Code holds the hit state 0.7 s |
| `Death` | hp ≤ 0 | no, holds last frame | 1.5 s | Ends lying on the ground |

Required in every model: `Idle`, `Walk`, `Hit`, `Death`, `Use_Item`, `Dodge`, plus the class attack clips from the roster table. Bake at 30 fps. `Run` is an optional extra.

**Dialogue clips (optional, recommended).** The story box (ROADMAP D2/D6) plays these while a character speaks, and the portrait snapshot uses their pose:

| Clip name | Used when | Loop | Max length | KayKit fallback |
|---|---|---|---|---|
| `Talk` | The character's line is on screen | yes | — | `Interact` |
| `Nod` | Agreeing or trust going up | no | 1.0 s | `Interact` |
| `Shake` | Refusing or trust going down | no | 1.0 s | `Idle` |
| `Victory` | A natural 20, or a fight won | no | 1.5 s | `Cheer` |
| `Worried` | Low HP, or bad news | yes | — | `Idle` |

If the tool cannot produce a clip, keep the name but use the closest motion. For example, `Dodge` can reuse a short block motion. Record the substitution in the manifest `notes` field.

### 4.5 Budgets (provisional until the first delivered model is measured)

| Metric | Budget | Current KayKit baseline |
|---|---|---|
| Triangles (all meshes, weapons included) | ≤ 20,000 | 5.7k–7.0k |
| Textures | 1 base-colour atlas ≤ 2048², optional normal/ORM ≤ 1024² | 1 texture |
| GLB file size | ≤ 4 MB | ~3.6 MB |
| Skinned meshes | ≤ 8 | ~10 |
| Joints | ≤ 100 | 41 |

AI-generated meshes are usually far denser. Decimate and bake before export.

### 4.6 Licence and provenance
- Confirm the Tripo plan in use allows public and commercial use of the output. Save evidence (plan name, terms URL, date).
- For each model, add a manifest entry next to the files (`public/assets/characters/manifest.json`), following the existing format in `public/assets/quaternius/manifest.json`: `file`, `sha256`, `animations`, `skins`, `source` (tool and generation id), `license`, `notes`.

### 4.7 Suggested generation prompts (starting points)

Shared suffix: *stylized fantasy RPG character, chunky heroic proportions, large readable silhouette, hand-painted texture, muted colours with one light cloth accent area, A-pose, full body, no base, no background.*

- **Fighter:** "human fighter in worn steel plate with broad pauldrons, light-coloured cloth cape, one-handed sword and round heater shield, short practical hair" + suffix.
- **Rogue:** "human rogue in a deep hood and leather armour, light-coloured scarf and hood lining, short bow on the back, dagger at the hip, lean build" + suffix.
- **Wizard:** "human wizard in layered robes, tall soft pointed hat, light-coloured inner robe, wooden staff with a glowing crystal, book on the belt" + suffix.
- **Cleric:** "human cleric in chainmail under a light-coloured tabard with a sun emblem, flanged mace, raised holy-symbol amulet, no sword, no helmet" + suffix.

### 4.8 Production checklist (owner)

Tool features vary by plan and version. Verify each step in the tool itself and do not assume a step exists.

1. **Spike first.** Make one model (recommended: Fighter) end to end before making the other three.
2. **Generate** the model from the prompt in §4.7, optionally with a concept image. Reject results with broken hands, fused weapons or a weak silhouette from above.
3. **Texture** in the stylized look from §3. Keep a light-coloured accent area.
4. **Rig** as a humanoid.
5. **Animate** the clips in §4.4. Note which clips the tool cannot produce.
6. **Export** GLB.
7. **Clean up** (for example in Blender):
   - Decimate to the §4.5 budget.
   - Split weapons into `Weapon_Main` / `Weapon_Off` / `Shield`.
   - Name the accent material `Accent`.
   - Rename clips to the §4.4 names.
   - Set +Z facing, feet at y=0, in-place animation.
   - Remove extra objects.
8. **Self-check**: open the GLB in a glTF viewer. Confirm every clip plays, nothing is missing, and the size and triangle count are within budget.
9. **Hand over** to Codex:
   - The GLB files.
   - Screenshots of each clip.
   - The substitution notes from step 5.
   - Licence evidence (plan name, terms URL, date).

## Part B — Integration task (Codex)

### 5.1 Deliverables
1. Add the four GLBs and the manifest under `public/assets/characters/`.
2. `shared/visual-identity.ts`: add `fighter`, `rogue`, `wizard`, `cleric` to `CHARACTER_ASSETS`. Map `guardian→fighter`, `scout→rogue`, `adept→wizard`, `cleric→cleric` in `byClass`. Keep the enemy entries. Keep `assetId` overrides working so old saves load.
3. `shared/animation-cues.ts`: put the canonical clip names from §4.4 **first** in each candidate list. Keep the old names as fallbacks until the KayKit models are removed.
4. `client/World.tsx` `CharacterModel`:
   - Replace the KayKit weapon hide-list with the naming contract (`Weapon_Main`, `Weapon_Off`, `Shield`, `Sig_*`).
   - Recolour only materials named `Accent`, and keep the `bronze` look for the librarian NPC.
   - Keep the existing facing logic and set yaw from the +Z convention.
   - Keep `actorHeight` and `breadth` race scaling.
5. `scripts/verify-asset-bundle.mjs`: for files under `assets/characters/`, fail the build when a required clip is missing, a budget in §4.5 is exceeded, or a manifest entry or sha256 is wrong.
6. Tests: rewrite `tests/backend-visual-identity.test.ts`, `tests/backend-asset-bundle.test.ts` and, if affected, `tests/backend-monster-animation.test.ts` to the new manifest **in the same change** (PRD V2-10). Never delete an assertion just to go green. Engine tests must pass unchanged.
7. Remove the KayKit hero files only after the new models pass every check below. Update `docs/ASSETS.md` and the README credits.

### 5.2 Acceptance

| ID | Check | How |
|---|---|---|
| C-01 | Each class loads with no console error. Every required clip plays at its game state | `http://127.0.0.1:4317/?asset-review` (local only) plus a browser run |
| C-02 | Fighter and Cleric are distinguishable by silhouette with labels hidden; so are all four classes | Screenshot of four characters in one room |
| C-03 | Hero Fighter + Oren Fighter in different palettes are distinguishable with labels hidden | Screenshot |
| C-04 | Palettes `ember`/`moss`/`moon` change only the accent area | Screenshot per palette |
| C-05 | Feet on the floor, facing the camera at rest, turning toward the walk direction | Browser |
| C-06 | Race scaling (Halfling, Dwarf, Elf) does not break the mesh or clip into the floor | Screenshot per race |
| C-07 | Attack/hit/death read within the game's 1.1 s / 0.7 s state windows | Recording of one goblin combat |
| C-08 | Budgets in §4.5 pass the asset gate | `npm run build` |
| C-09 | `npm test`, three type checks and build pass | Local run |
| C-10 | A Release 1 save created with KayKit models loads and shows the new models | Load an existing local save |

### 5.3 Out of scope
- Race-specific meshes.
- Companion signature meshes.
- NPC and enemy models.
- Engine and rules changes.
- Deployment.
- Portraits. They come from the in-game render (§6), which ROADMAP #R6 builds separately. A new model only needs a correct `Head` node.

### 5.4 Handoff prompt (paste into Codex)

```text
Repository: echoes-below (branch from main). Read docs/CHARACTERS.md and docs/PRD.md first.

Task: integrate the character GLB files I provide into the game, following CHARACTERS.md Part B (§5.1) exactly.
Files provided: public/assets/characters/{fighter,rogue,wizard,cleric}.glb (or the subset listed below) plus my notes and licence evidence.

Rules:
- Do not change server/, game rules, save format or API. Only the files listed in §5.1.
- First inspect each GLB and report: triangle count, file size, joint count, texture sizes, mesh names, material names, clip names. Compare against §4.3–§4.5 and list every mismatch before changing code.
- If a GLB violates the contract, stop and report. Do not silently rename or work around it in code.
- Keep the old KayKit models as fallback until every check in §5.2 passes.
- Rewrite asset tests to the new manifest in the same change; never delete assertions just to pass.
- Verify with npm test, the three type checks, npm run build, and a browser run of creation → goblin combat. Provide screenshots for C-02, C-03, C-04 and C-06.
- Deliver as one branch and one pull request. Stop before merge. Do not deploy. Never print or commit .env.

Models delivered in this batch: <list>
Clip substitutions: <notes>
```

## 6. Portraits and dialogue presence

Characters speak through the story box, which has a name plate and a portrait (ROADMAP D2, D6). Portraits come from the 3D model, so **there is one source asset per character**, and the portrait always matches the class, race and palette the player picked.

### 6.1 Rendered portraits (default, no extra art)
- **How.** The game renders a head-and-shoulders snapshot of the in-game model, using the same canvas and offscreen target, then caches it as an image. It renders again only when the class, race, palette or model changes. Today this works with the KayKit models and with the Tripo models after #11.
- **Framing.**
  - The camera aims at the `Head` node, from slightly above eye level, about 20° to the character's right, so the character faces three-quarters toward the text box (§6.2). `SIDE` in `client/PortraitStudio.tsx` flips this.
  - The eyes sit at about 40% from the top. KayKit heads are about half the body's height, so today's frame shows most of the upper body. A Tripo model (#11) with realistic proportions gets true head-and-shoulders framing from the same rule.
  - The background is transparent.
  - Output is 512×512 and is shown at 96–128 px.
- **Pose.** The neutral portrait uses the first frame of `Idle`. `Talk` was rejected because its first frame can cover the face (the goblin model holds its mace there). Expressions use the dialogue clips in §4.4 when present.
- **What a model needs.** A correct `Head` node (§4.3), a face toward +Z (§4.1), and a face and hair that read at 128 px. Big, simple shapes beat fine detail here too.

### 6.2 Painted portraits (optional override, later)
If the owner wants illustrated portraits for named characters, the game prefers these files over the render:

| Rule | Value |
|---|---|
| Path | `public/assets/portraits/<characterId>-<expression>.png`. `characterId` is `mira`, `oren`, `scrit`, `vark`, `courier`, `ilyra` or `ferryman`; the hero always uses the render, because the player customises them |
| Expressions | `neutral` (required), then `smile`, `worried`, `angry`, `hurt` |
| Size | 512×512 PNG, transparent background, ≤ 200 KB each |
| Framing | As in §6.1: head and shoulders, eyes at ~40% from the top, facing three-quarters toward the right, so they look into the text box |
| Style | The same art direction as §3, so painted portraits must not look like a different game from the 3D model |
| Licence | As in §4.6, with an entry in `public/assets/portraits/manifest.json` |

### 6.3 Acceptance for portraits
| ID | Check |
|---|---|
| P-01 | Mira, Oren and the hero show distinct portraits whatever classes they take |
| P-02 | Changing a palette at creation changes the portrait accent |
| P-03 | A painted override, if present, replaces only that character and expression; missing expressions fall back to `neutral`, then to the render |
| P-04 | Portrait rendering adds no second WebGL canvas and costs < 2 ms per snapshot |
