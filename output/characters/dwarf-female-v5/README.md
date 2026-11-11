# Female dwarf v5 — 2D concept references, already made

Status: **finished 2D concepts**. Faldi accepted the front on 10 November 2026 and the turnaround sheet was then generated. Do not regenerate these images. Do not start another dwarf front or sheet from v1–v4.

This folder is the discoverable archive, next to `output/characters/elf-female-v1/`. It is **not** a 3D asset. Nothing here has been sent to Tripo, rigged, cleaned in Blender, copied into `public/assets/`, or wired into the running game.

## What to use

| File | Role |
|---|---|
| `raw/dwarf-front-v5.png` | Canonical front. 1344×2016, 8-bit RGB PNG, preserved byte for byte |
| `raw/dwarf-sheet-v5.png` | Canonical sheet. 2016×1344, 8-bit RGB PNG, preserved byte for byte |
| `dwarf-front-v5.jpg` | JPEG preview of the same front. Not a second generation |
| `dwarf-sheet-v5.jpg` | JPEG preview of the same sheet. Not a second generation |
| `prompts.md` | Generation record: prompts, settings, refs, the earlier gate hold, and the later acceptance |

The PNG in `raw/` is the source of truth. The JPEG is only a smaller preview of that same image.

SHA-256, matching the supplied archive byte for byte:

| File | SHA-256 |
|---|---|
| `raw/dwarf-front-v5.png` | `b5a748174a6296474eeb05794dffd32178cd228d3959abb703d2e36732be301d` |
| `raw/dwarf-sheet-v5.png` | `4e7ed17ab4e5c3bca59eae3215257044bce7b134b340e02447e0d3e78caeda49` |
| `dwarf-front-v5.jpg` | `a446908b1343091d72f6dbe3d6e26fa9fb7f37e44dfb38e9d6a450c6c55c8d2c` |
| `dwarf-sheet-v5.jpg` | `b204e3f001d1895489df51e9f873e5b5eda681aa1ef36dbe560abd8f37829afb` |

`prompts.md` opens with a YAML status that still says the liner-tail gate was HOLD and that the sheet was not generated. That line is the record from before Faldi looked at the front. The update at the end of `prompts.md` is what happened next: he accepted the front and the sheet was made. This README is the current status.

## Character

Adult fictional female dwarf for Echoes Below. Copper / dark auburn hair cut flat to the skull with a short blunt straight fringe. Broad grounded face, thick straight low brows, smaller round brown eyes, wide jaw, short chin, calm closed mouth, small rounded ears, warm tan skin. Stocky muscular heroic-chibi body, about 3.2 heads tall. Plain grey square-neck crop top and plain grey fitted shorts. Barefoot. No beard, armour, weapons, jewelry or props.

The sheet labels, spelled exactly, are FRONT, SIDE, BACK, GAME VIEW and FACE. SIDE is a true profile facing the viewer's right.

## How they were made

ImagineArt, model `gpt-image-2.5-flare`, quality medium, resolution 2K, opaque background, no prompt enhancer and no mask. 10 November 2026.

- Front: aspect 2:3, 1344×2016. Proportion guide for body, pose and framing; the v4 head crop for face, hair and ears. The elf front, elf sheet and v1–v3 images were not uploaded. 23 credits.
- Sheet: aspect 3:2, 2016×1344. The v5 front for the character; an older dwarf turnaround for layout, typography and render style only. 23 credits.
- Batch total: **46 credits** (cap 50). The hand-built proportion guide cost 0.

Asset URLs, verbatim prompts and reference roles are in `prompts.md`.

## Acceptance and remaining caveats

Faldi saw the v5 front, including its defects, and accepted it. He then asked for a full sheet like the older turnaround. No new front was generated.

The sheet repaired the white splits at both knees. Knees are solid in every view.

Soft caveats, accepted and not a reason to regenerate:

- Thin dark lash-line tails still pass the outer eye corners. There is no upward cat-eye wing. Faldi accepted this on the front, and the sheet carries it.
- Side and back hair reads fuller and rounder than the front's flat fringe cut.
- GAME VIEW sits closer to eye level than slightly from above.
- The face is modelled a little more realistically than the elf family's softer chibi face.

## What is not in this folder

Only final v5. No obsolete v1–v4 images, no proportion-guide file, and no review crops. Those paths in `prompts.md` are the generation workspace record, not files checked in here.

No Tripo asset id, FBX, GLB, texture, rig, animation or `.blend` exists for this dwarf. Do not describe these JPEGs or PNGs as a mesh.
