# Interaction residuals (#58): capture notes

All shots come from the local build (`npm run build && npm start`) at 1440×900. They were driven by `agent-browser` and use the scene preview `/?scene=market-3`, with `&rules=curated` for Curated. "Confront the chamber's defenders" → "Take action" starts the skeleton fight.

## 1. Confirm card survives a camera drag
- `1-before-confirm-closed-by-drag.jpg`: before the fix. The player opened "Examine the evidence" and then dragged 120 px on the scene (mouse down, two moves, mouse up). The card closed on pointerdown.
- `1a-confirm-open.jpg`: after the fix, the card anchored to the chosen row.
- `1b-confirm-after-orbit-drag.jpg`: a 200 px drag after the fix. The camera orbited and the card stayed open. Enter then confirmed the action, because focus returns to "Take action" after a drag.
- These checks were scripted on the same build:
  - an out-and-back drag (60 px away, then back to 1 px from the start) keeps the card open;
  - a 3 px click on the scene closes it;
  - Escape closes it;
  - "Reconsider" closes it.

## 2. Packed actors keep their labels
- `2-before-selected-skeleton-unlabelled.jpg`: before the fix. The Echo melee had the party and three skeletons packed together, and the camera was orbited six times. "Bound skeleton 1" is selected in Focus but has no label. A frame dump showed it was a layout drop: the label was a candidate, nothing occluded it, and every nearby slot overlapped a body or the hero's label. That frame is now the fixture of the "live market-3 melee" unit test.
- `2-after-selected-skeleton-labelled.jpg`: the same orbit after the fix. The label sits above the cluster with a leader line. Across 8 orbit steps × 6 actors, 0 selections lost their label (before the fix: 5 of 30).
- `2b-after-hovered-cluster-all-labelled.jpg`: the pointer hovers the cluster, so five actor labels are shown. None overlaps a body, the HUD or another label.

## 3. Projectiles
To catch mid-flight frames, the capture build temporarily stretched the 0.38 s flight to 4 s and the 1.6 s cue lifetime to 6 s, using localStorage overrides. Those overrides were reverted before commit; the shipped timing is unchanged.
- `3-before-echo-mira-no-projectile.jpg`: the old projectile mesh. This frame was taken with the cue derivation already in place: a temporary hook logged `kind:"ranged"` for Mira's beat. It still shows nothing, because the old 0.07 sphere was depth-tested and hidden inside the packed bodies.
- Echo on main fired no projectile cue at all. Echo's attack `log(...)` in `server/game.ts` passes `undefined` for `animation`, and playback passed `frame.log.animation` straight to `cueFor`. The new `backend-combat-cue` test covers the derivation.
- `3a-echo-mira-arrow-midflight.jpg` and `3b-echo-mira-arrow-later.jpg`: Echo after the fix. Mira (scout) shoots the adjacent skeleton. The arrow is drawn over the bodies and flies nose first along its arc. These two frames show an interim arrow, slightly smaller than the shipped one (0.42 long instead of 0.5).
- `3c-curated-bone-archer-arrow-midflight.jpg`: Curated, with the shipped arrow size. The Bone archer's bow shot is mid-flight toward Mira across the pillars.
- `3d-curated-reduced-motion-result-only.jpg`: Curated with Reduced motion on (the app setting). Mira's ranged beat on the Bone archer shows no flight, only the "−11" result.
- `3e-spell-orb-visual-forced.jpg`: the preview party has no caster, so this capture forced Mira's beat to render as a spell, to show the orb. It is a visual check only, and the override was reverted. In game, adepts and clerics in Echo, and wizards and clerics in Curated, get this cue from their attacks.
