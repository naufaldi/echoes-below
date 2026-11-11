# Elf Rogue V6c: start here

## Brief for the next agent

Goal: a readable, animated **Elf / Scout (Rogue)** in Echoes Below's real 3D World. This is the existing bow-first agile class, not a new Archer class or a change to combat rules. Use the existing Tripo model; preserve its warm tan skin, brown hair/eyes, olive cape, leather and cream scarf. Compare against the previous Elf Fighter for heroic-chibi proportions, not its imperfect weapon grips.

**Status: development prototype, not production approved.** Eight clips render and the bow/knife corrections have been tested locally. Keep KayKit as the normal game default. Do not publish, deploy, replace production assets, change saved outcomes, or claim licence clearance. A commit is not release approval.

## Files and provenance

- [Versioned asset folder](../output/characters/elf-rogue-v1/animation-v6c/README.md): editable `.blend`, final GLB, V5 reproduction input, scripts, manifests, Blender videos and actual-game screenshots.
- Original Tripo exports and references remain under `output/characters/elf-rogue-v1/`, imported unchanged from `docs/elf-character-production` (source commit `02043bc756b982b5f718a1db19af2647ac9fb879`). Game integration base: `8842d313c76a1ec2222f504fdccdbb46490ba2b9`.
- Studio asset: `688b6d82-29cb-45c0-91bd-e7a116c0a736`; assembly project: `01a1c42d-e079-77a8-9c41-20785df0e5bf`.
- Generation plan/terms and commercial rights evidence remain unverified. Existing repository production rules allow only the documented licence allow-list; this archive is **not** an exception.

## What changed and why

1. Original asset had no skeleton and open hands. Moving the weapons alone was insufficient. Blender mesh adjustment plus an approximate 18-joint rig/animation prototype was produced.
2. Dark eyes were partly recessed whites, not simply a black texture. Earlier work adjusted 53 sclera vertices while preserving brown irises and original texture. More light alone had failed oblique views.
3. V5 established one padded 2048 atlas, canonical clip/node names, limited Accent-only palette changes and the export contract.
4. V6c rotated the bow around the existing grip so its string/rest plane aligns with the draw (179.98°, versus about 84° before). Arrow is 1.45× longer and aimed through the rest above the grip. String follows the draw hand.
5. Knife retains the Tripo hilt; blade is 65% former length / 60% width. It rests in a modeled open-rim sheath behind the right hip. Melee puts it into the right hand; sheath stays on the belt.
6. An initial V6 export was rejected because morph-target bounds made the character tiny in Three.js. V6c bounds match V5 (0.87402343m source height).

## Run it in the game, step by step

Prerequisite: Node 24+, npm, this branch. From repository root:

```sh
npm ci
npm run rogue:prepare
npm run dev
```

Open `http://127.0.0.1:5173/?elfRoguePreview=1&combatReview=1` (use the printed Vite port if occupied). This local page uses the **actual World component**, with an engine-generated isolated Cookfire fixture, not your live save. No backend is needed for this fixture. Use Play ranged attack, Preview melee reaction, Play dodge, Preview hit, Play movement, Reset, and palette buttons. Melee is explicitly a synthetic visual reaction, not proof a new combat action is implemented.

For ordinary local play, run `npm run dev:server` separately, use `?elfRoguePreview=1`, and create an Elf Scout. Only that race/class is overridden. Without the query the existing character remains. The review page is DEV + localhost guarded.

After review:

```sh
npm run rogue:clean
npm run build
```

Prepare copies the archived GLB and generates the fixture into ignored `public/__*` files. **Vite copies public files even when code is DEV-only**, so the build now refuses to proceed until these files are cleaned. Never bypass this guard. Prepare refuses to overwrite existing preview files; inspect before explicitly cleaning them.

## How the integration works

- `client/rogue-preview.ts`: opt-in asset path; world-space `Arrow_Release` socket; release metadata; deterministic debug sampling.
- `client/World.tsx`: existing real renderer, authored breadth, target-facing, actual clip completion through mixer `finished`, socket/preview lifecycle cleanup.
- `client/CombatCues.tsx`: waits asset release time (~0.791667s), samples socket at release and flies to target for .38s. Fallback remains for legacy assets.
- `client/character-dress.ts`: palette changes only `Accent`, never skin/body/weapon materials.
- `shared/animation-cues.ts`: canonical `Attack_Melee` / `Dodge` names with legacy fallback preserved.
- `client/RogueCombatReview.tsx`, `client/main.tsx`, `local-review/make-fixture.ts`: isolated visual harness.
- `tests/backend-ranged-socket.test.ts`: socket, cleanup, clip fallback, palette contract tests.

No engine rules, save format, damage, dice or game balance were changed. HP bars/floaters still use existing beat timing; they are not fully synchronized to the delayed arrow. Portraits still use the old model.

## Acceptance checklist (repeat after every export)

- Front, side, rear and oblique: handle within palm, wrist believable; string draws in bow plane; arrow crosses rest above grip; no face/string clipping.
- At game distance: correct size and silhouette, bow not sideways, dagger not oversized, knife/sheath readable, eyes not black sockets.
- Ranged: draw → release → Idle; nocked arrow hides after release; projectile starts at socket and aims at target.
- Melee: knife enters hand, swings clear of face, then returns exactly to sheath; no stale scales or transforms.
- Hit, Dodge, Walk, Death, Use_Item: sample each clip and transition. Test repeated buttons and Reset; no pose leakage or console errors. Death should hold final pose.
- Ember/moss/moon: only Accent changes. Normal URL still renders original assets.

Recorded prior V6c browser evidence: 15 deterministic pose/reset checks, 13 game-angle/default screenshots, ranged/Hit/Dodge/melee returning Idle, zero page errors. Blender sampled BVH checks found zero tested face/weapon and stowed sheath/knife overlaps. These are sampled checks, **not a continuous collision-free or anatomical guarantee**. Full verification results for this packaging revision are in the asset folder's `verification/packaging-results.md`.

## Continue other animations

Use the existing eight clips: `Idle`, `Walk`, `Attack_Ranged`, `Attack_Melee`, `Use_Item`, `Dodge`, `Hit`, `Death`. First improve Walk foot planting/body balance and draw-finger articulation; then knife equip/return transition, believable melee recovery and falling motion. Bow limbs still do not flex. Current procedural item motion is only a gesture. Do not add gameplay classes or rules to compensate for visual problems.

Start from the versioned `.blend` for edits, but see its export caveat in the asset README. Preserve clip names, sockets, timing metadata and all unrelated character materials. Keep Hit .6s / Dodge .8s; other current clips are 1s. Regenerate exports, import the final GLB fresh, inspect multiple angles, repeat game tests, update checksums/evidence. Commit only the scoped change. Production promotion additionally needs licence approval, portraits, performance checks and final visual review; do not auto-deploy.
