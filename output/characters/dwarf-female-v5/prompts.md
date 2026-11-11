---
title: Echoes Below — Female Dwarf v5 (proportion guide + front)
tags: [cpp-imagine, imagineart, echoes-below]
date: 2026-11-10
status: guide OK; Image 1 generated, GATE = HOLD (liner tail); Image 2 (concept sheet) NOT generated
---

> Current status is in `README.md`: Faldi accepted this v5 front and the concept sheet is finished. The YAML `status` above is the earlier gate, before that acceptance. Do not treat it as the current state.

# cpp-imagine — Echoes Below female dwarf v5

Approval: Faldi, in order: "oke, now render for full of for tripo or my game" / "render to make it for echoes below okey?" / "not 3D". 2D only. Not posted, no Tripo, no 3D, no retries.

## Step 0 — proportion guide (0 credits)
- Hand-built SVG drawn from scratch in Python (`refs/make_guide.py` → `refs/proportion-guide.svg`), rasterized locally with cairosvg. No generator, no tracing of the elf or v1–v4.
- Clean PNG: `refs/proportion-guide.png`, 1344×2016. Faceless (no eyes, nose, mouth or hair), small rounded ears, grey square-neck crop and shorts, barefoot, five fingers and five toes, white margin above and below. No lines.
- Measured on the PNG: crown y=199, chin y=733 (pixel transition from head to neck at the centre column), sole y=1802. **Heads tall = 1603 / 534 = 3.00.** Crotch at y=1267, which is the 2/3 line.
- Fixes made for free before spending: the first draft's chin blended into the neck and the head facets were asymmetric (could read as side-swept hair). I darkened and narrowed the neck so the chin edge is crisp, made the head facets symmetric, and made the arms, hands and toes heavier. Then I re-measured: 3.00.
- Marked copy, for eyes only and not uploaded: `review/guide-heads-measure.jpg`.

## Settings (Image 1)
- ImagineArt connector, generate_image ×1. model gpt-image-2.5-flare · quality medium · resolution 2K · background opaque · aspect 2:3 → 1344×2016 PNG. No Prompt Enhancer (no such API option). No mask_url.
- Uploaded refs (image_url, in order):
  1. proportion-guide.png → https://asset.imagine.art/processed/50501d29-5b81-4928-a3b2-bda569be424c (PROPORTIONS/BODY/POSE/FRAMING)
  2. dwarf-head-v4.png → https://asset.imagine.art/processed/270cee11-b71d-4545-9fb9-dc98278fb7f7 (FACE/HAIR/EARS)
- NOT uploaded: elf-front, the elf character sheet, v1, v2, v3, the full v4 body, the compare collage, the marked guide copy, any mask.
- Credits: balance 89,272 before → 89,249 after = **23 credits** (cap 50). The guide cost 0. Image 2 not run, so the total is 23.

## Image 1 — dwarf-front-v5.jpg
- asset: https://asset.imagine.art/processed/25f62084-de2a-4d29-9c13-211f33a984c9 (raw/dwarf-front-v5.png)

Prompt (verbatim):
```
RULE 1 — NO winged eyeliner, no black flick past the outer corner, no cat-eye, no wing angling up. The face reference still has a short thin tail past both corners — do not copy that. Eyelids bare, or only a thin short darker lash line that STOPS at the outer corner and does not extend.

RULE 2 — Exactly 3 heads tall, follow the proportion guide. The head (crown of hair to bottom of chin) is one third of crown to sole. Short thighs, short shins, low crotch, wide planted stance. Keep the same figure size and placement as the guide, with the same extra white margin above the head and under the feet. Do not fill the canvas. Do not stretch the legs. Do not shrink the head.

Reference roles:
- FIRST image (faceless blocky tan figure in grey crop top and shorts) = PROPORTIONS, BODY, POSE and FRAMING guide only. Match its 3-heads-tall chibi ratio, big head, short legs, wide stance, figure size and position on the canvas, and the grey outfit. It is a rough flat placeholder: render it as a finished, smoothly modeled character, not as blocky boxes. Its head is blank on purpose; do not invent a face from it.
- SECOND image (copper-haired head) = FACE, HAIR and EARS identity only: copper / dark auburn hair cut flat to the skull with a short blunt straight fringe, thick straight low brows, smaller round brown eyes, wide jaw, short chin, broad nose, calm closed mouth, small rounded ears, warm tan skin. Do not copy any eyeliner tail from it. Do not take the body size or head-to-body ratio from it.

Character: an adult female dwarf, a fantasy game race, for the game Echoes Below. Muscular, solid adult woman with a big heroic-chibi head: broad shoulders, broad sturdy torso with an adult bust, thick waist, heavy muscular arms, large sturdy hands with five fingers each, wide flat bare feet with five toes each, nothing fused. Adult, not a child, not a baby. No beard, no facial hair, no braids.

Outfit: plain grey square-neck sports crop top and plain grey fitted shorts, barefoot. No armor, no weapons, no jewelry, no belts, no shoes, no props, no cultural dress.

Style: stylized low-poly 3D game character render, visible flat faceted planes, chunky heroic-chibi, simple flat color blocks, soft even studio lighting, no baked shadows, no cast shadow, no ground plane. Not photoreal, not anime, not painterly.

Pose and framing: one character only, full-body front view, symmetric, facing the camera, arms slightly away from the body, hands relaxed and empty, feet flat. Whole head and both feet visible. Clean pure white background. No text, no labels, no logo, no watermark.
```

## GATE CHECK — HOLD
- **Winged liner / tail: FAIL.** There's no upward wing or cat-eye, but the dark upper lash line still runs past the outer corner of both eyes and tapers to a thin point, the same short tail as the v4 crop (review/eyes-zoom.jpg). The brief counts "a clear tail past the outer corner" as a hold.
- **Heads tall: PASS, about 3.2.** crown y=177, chin y≈706 (bottom of the chin's underside plane; 688 at the top of that plane), sole y=1847, so 3.16–3.27 heads. The first one-third line (y=733) lands at the chin/neck, not the chest (review/heads-measure-v5.jpg). A big improvement over v4's ~4.9. The figure fills slightly more of the canvas than the guide (crown 177 vs 199, sole 1847 vs 1802).
- **Style family: PASS (soft).** Big head, short legs, chunky low-poly faceting, flat color blocks and even light read as heroic-chibi game-character family, much closer to the elf family than v4. The face is still a bit realistic in its modelling.
- Result: HOLD on the liner tail. Image 2 (concept sheet) was not generated and the second ~23 credits were not spent.

## Other review notes
What worked: the v4 face identity carried over cleanly (copper blunt fringe flat to the skull, thick straight low brows, smaller round eyes, broad nose, wide jaw, short chin, calm closed mouth), with small rounded ears. She's an adult and muscular, the outfit is right, she's barefoot on white with no text, and she has 5 toes per foot and 5 digits per hand (thumb plus 4).
What missed / minor:
- The liner tail (above). The model copied it from the face crop despite RULE 1.
- Thin white seam gaps at both knees, where the thigh and shin facets don't meet (visible in the full view at about y≈1510).
- Stance is a little narrower than the guide.

## Suggestion for the next go (needs Faldi)
Height and style now pass. The only blocker is the liner tail, which is inherited from the head crop. The cheapest fix: inpaint just the two outer eye corners on this v5 front with mask_url ("bare lid, lash line stops at the corner"), about 23 credits, then run the concept sheet from that. Or retouch the v4 head crop locally for free (erase the tails) before any new front, so the ref stops teaching the tail.

## Files
- refs/proportion-guide.png, refs/proportion-guide.svg, refs/make_guide.py, refs/dwarf-head-v4.png
- dwarf-front-v5.jpg, raw/dwarf-front-v5.png
- review/guide-heads-measure.jpg, review/head-v5.jpg, review/eyes-zoom.jpg, review/chin-area.jpg, review/heads-measure-v5.jpg, review/hands.jpg, review/feet.jpg

---

## UPDATE 10 Nov 2026 ~16:55 WIB — Faldi overrode the hold; concept sheet generated
- **Hold override:** Faldi saw the v5 front and its defects and accepted them ("no problem\nwhere is also iamge like this?", with an older turnaround sheet attached). That overrides the liner-tail hold above. No new front, cleanup, guide or gate loop. No retries.
- The original 50-credit batch cap still applies: front 23 + sheet 23 = 46.

### Settings (Image 2)
- ImagineArt connector, generate_image ×1. model gpt-image-2.5-flare · quality medium · resolution 2K · background opaque · aspect 3:2 → 2016×1344 PNG. No Prompt Enhancer (no such API option). No mask.
- Refs (image_url, in order):
  1. v5 front (CHARACTER): https://asset.imagine.art/processed/25f62084-de2a-4d29-9c13-211f33a984c9 (URL checked live, HTTP 200)
  2. Faldi's attached older dwarf turnaround (the v1 sheet; LAYOUT/TYPOGRAPHY/STYLE only) → uploaded as https://asset.imagine.art/processed/1bebc3f4-0d9c-48ca-a3a3-5e04292341ec. Layout-reference provenance: attachment `47ccce93…c145d.png`, kept in the generation workspace as `refs/layout-ref-dwarf-sheet-v1.png`, uploaded as a JPEG q95 conversion.
- NOT uploaded: elf-front, the elf sheet, v1–v4 fronts, the compare collage, the guide, any mask.
- No per-image cost field and no Create tooltip in the API. Balance 89,249 before → 89,226 after = **23 credits**. Batch total: 46 (front 23 + sheet 23), under the 50 cap.

### Image 2 — dwarf-sheet-v5.jpg
- asset: https://asset.imagine.art/processed/aa064893-848a-455e-9be8-79942fb279a9 (raw/dwarf-sheet-v5.png)

Prompt (verbatim):
```
Reference roles:
- FIRST image (copper-haired stocky dwarf woman on white) = the CHARACTER. Copy her exactly in every view: copper / dark auburn hair cut flat to the skull with a short blunt straight fringe, thick straight low brows, smaller round brown eyes with no eyeliner wing, broad nose, wide jaw, short chin, calm closed mouth, small rounded ears, warm tan skin, muscular stocky adult body about 3.2 heads tall with a big heroic-chibi head, short legs, grey square-neck crop top and grey fitted shorts, barefoot.
- SECOND image (an older turnaround sheet) = LAYOUT, TYPOGRAPHY and RENDER STYLE only. Copy its page layout, title block, divider, label placement and low-poly render look. Do NOT copy its brown messy hair, its face, its smile or its winged eyeliner.

Make a clean 2D character concept turnaround sheet of the FIRST image's dwarf, the only character on the page. Landscape. Flat cream / off-white paper background, no texture, no ground plane, no shadows.

Typography (the ONLY text allowed, spelled exactly, dark charcoal):
- Top left, large refined serif capitals: ECHOES BELOW, with a thin horizontal rule and a small diamond under it.
- Directly below, small letter-spaced serif capitals: FEMALE DWARF / HEROIC CHIBI / BASE BODY
- Small letter-spaced serif caption centered under each view: FRONT, SIDE, BACK, GAME VIEW, FACE.
No other words, numbers, logos or watermarks.

Layout:
- Left three quarters: three full-body views of the same dwarf in a row, same scale, feet on one shared baseline, head to toe fully visible, evenly spaced. Left: FRONT view, arms slightly out, empty hands. Middle: SIDE view, a true profile facing the viewer's RIGHT, arms down at her sides. Right: BACK view, showing the back of the flat copper haircut and the back of the body.
- A thin vertical divider line.
- Right column, stacked: top GAME VIEW, a smaller full-body three-quarter view seen slightly from above; bottom FACE, a head-and-shoulders portrait facing the viewer.

Consistency: same face, same hair, same head size and same body proportions in all five views. Knees fully connected and solid, no white gaps or seams anywhere on the body. Five fingers per hand and five toes per foot, nothing fused. No eyeliner wings.

Style: stylized low-poly 3D look rendered as a 2D image, visible flat faceted planes, chunky heroic-chibi, simple flat color blocks, soft even studio lighting, no baked or cast shadows. Not photoreal, not anime, not painterly. Adult woman, modest outfit, no armor, no weapons, no jewelry, no props, no cultural dress, no beard.
```

### Review of the sheet (full size plus crops: review/sheet-title.jpg, sheet-front.jpg, sheet-side-back.jpg, sheet-right-col.jpg, sheet-lower-legs-feet.jpg, sheet-face-eyes.jpg)
- **Typography: PASS.** ECHOES BELOW with a thin rule and diamond, then FEMALE DWARF / HEROIC CHIBI / BASE BODY, then FRONT, SIDE, BACK, GAME VIEW, FACE. All spelled correctly, clean serif, no extra text, numbers or logos. The layout matches the attached sheet: 3 turnarounds, a vertical divider, and Game View over Face in the right column.
- **Consistency: PASS.** The same v5 character in all 5 views: copper blunt fringe, broad grounded face, thick straight brows, closed mouth, small rounded ears, grey crop and shorts, barefoot. Head size and body build match across the three turnarounds on one baseline. She didn't revert to the v1 brown hair, the elf face or the v4 small-head body.
- **Anatomy: PASS.** The v5 front's white knee seams are gone; the knees are solid in every view. Hands have a thumb plus 4 fingers, and toes read as 5 where visible. No fused limbs. Clearly an adult, muscular build.
- **SIDE** is a true profile facing the viewer's RIGHT. ✅
- **Proportion:** about 3.2–3.3 heads in the turnarounds, consistent with the accepted front.
- Softer notes (no retry, per instructions):
  - The thin lash-line tail at the outer corners carried over from the front (accepted by Faldi). It's small at sheet scale.
  - The side and back hair reads as a rounder full bob/dome than the front's flat fringe cut. That's plausible, but the back has a little more volume.
  - GAME VIEW is closer to eye level than "slightly from above".
  - The face is modelled a bit more realistically than the elf family's softer chibi face.
