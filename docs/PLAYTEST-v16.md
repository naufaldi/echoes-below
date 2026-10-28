# Echoes Below — playtest of v16 (28 October 2026)

Build: live Site version 16, commit `16b7995`, https://echoes-below.naufaldi.chatgpt.site.
Tester: lead agent session, played from character creation to an ending. Screenshots: [`docs/screenshots/playtest-v16/`](screenshots/playtest-v16/).
Roadmap: [ROADMAP.md](ROADMAP.md) (pillars, copy guide §6, v1.0 finish line §5). Issues filed from this report are listed in [§9](#9-issues).

## 1. Summary

The game can be finished from creation to an ending, and it is pleasant to read. One **blocker** stands in the way of v1.0: Curated tactics combat crashes the whole page to a blank screen when a fight ends. The other important findings are about balance and flow rather than bugs.

| Severity | Count | Headline |
|---|---|---|
| Blocker | 1 | Curated combat ends in a blank page (B1) |
| Major | 8 | Potions pile up to 128, every check has advantage, confirmations on free actions, replies shown before the dialogue ends, modals that lose focus, no reflow at 200 % zoom, action lists that scroll, truncated combat tags |
| Minor | 20 | Copy (duplicated speaker names, "A insight check", "ticks"), raw network errors, reduced motion ignores the OS setting, small targets, look-alike characters |
| Polish | 6 | Brand button name, map label alignment, repeated room staging |

What works well: the Echo run is stable from start to finish; keyboard play works (number key → Enter → Space); focus is visible on every control; colour contrast passes; the natural 20 is a real event; odds bands are honest; the descent map and the ending page read like a book; WebKit runs the game at 60 fps; audio waits for a gesture; an action interrupted by a dropped connection can be retried without being applied twice.

## 2. Coverage and method

| Run | Rules | Hero | Route | Result |
|---|---|---|---|---|
| A, live, Chrome 151 (headed) | Echo | Sela, Wizard, Envoy | Diplomatic: fed Scrit, negotiated with Vark (natural 13 + 4 vs DC 16), entrusted Scrit, then evidence → supplies → companions → first choice in every Chapter II–VI room | All 46 rooms, ending **The Open Relay** (screens `ending-open-relay`) |
| B, live, Chrome | Curated | Bram, Fighter | Aggressive: Cross quickly → Attack the guards | **Crashed three times** at the end of the goblin fight (B1) |
| C, live, Chrome | Echo | Rook, Rogue | Aggressive: Attack the guards | Fight won in 16 clicks, no errors |
| D, live, WebKit 27.2 (Playwright, headed) | Echo | Alden, Fighter | First room, keyboard roll, reload and resume | Works |
| E, engine | Echo and Curated | — | `scripts/playstyle-profiles.ts`: diplomatic, aggressive, reserved, breaker | All four endings reached in both rule sets: open-relay, iron-watch, long-way-home, broken-chain |

Not covered:
- **Firefox.** It isn't installed on this machine.
- **The other three ending pages.** They were not rendered live in this session; the engine reached each of them (run E). Their pages were screenshotted in PR #69.
- **A combat frame-time sample.**
- **A screen reader.** Roles, labels and live regions were inspected in the DOM, but no screen reader was used.

Run A used a small in-page helper to click through rooms quickly. Every room was screenshotted (contact sheets `rooms-*-contact`). Timing artefacts of that helper are not reported as findings.

**Measurement methods**
- **Visible scene %:** a 10 px grid over the viewport. A point counts as scene when the 3D canvas is the topmost element. World labels count as covered.
- **Frame time:** `scripts/perf/frame-sampler.js`, 5 s in the first room of each chapter.
- **Contrast:** `scripts/check-contrast.mjs` (tokens), plus a computed-style scan of rendered text.
- **Zoom 200 %:** emulated as a 720×450 viewport.

## 3. Blocker

### B1. Curated combat ends in a blank page
- **Severity:** blocker. It ends every Curated run at the first fight, and it blocks #70 (tracked in #94), which needs a Curated run through Chapter II.
- **Steps:**
  1. Create a hero and choose Curated tactics.
  2. Descend into the relay.
  3. Cross quickly.
  4. Attack the guards.
  5. Let turns run until the last goblin falls.
- **Observed:**
  - The page goes blank (`curated-crash-blank`) the moment the closing line "The guards fall… Scrit flees" plays.
  - Console: `TypeError: Cannot read properties of undefined (reading 'features')`, then `THREE.WebGLRenderer: Context Lost`.
  - Reproduced three times live.
  - Reloading resumes the save, because the server state is fine.
- **Cause:**
  - The server's final response is valid: `mode: explore`, `turn: null`, tactical actors present.
  - The closing narration frame is spoken by `dm` and carries `turn: null`.
  - `client/TurnPlayback.tsx` builds the visible save with `turn = frame.turn ?? after.turn ?? before.turn` (the previous creature's turn), then overrides `actorId` with the frame's speaker, `dm`.
  - `ActionPanel` mounts `TacticalControls` whenever `save.tactical` exists.
  - `client/TacticalControls.tsx:7` calls `classResources(t.actors['dm'])`, which is undefined.
  - Only `<World>` is wrapped in `SceneBoundary` (`client/App.tsx:38`, `:148`), so the whole React tree unmounts.
  - Echo is not affected because it has no `save.tactical`.
- **Fix:**
  - In playback, keep `turn` only when the frame carries one, or when its actor is a combatant.
  - Make `TacticalControls` return `null` for an unknown actor.
  - Add an app-level error boundary with a "Reload the adventure" action.
  - Add a regression test over the playback save builder: a closing `dm` frame after a Curated fight.

## 4. Gameplay

| ID | Severity | Finding | Evidence | Suggested fix |
|---|---|---|---|---|
| G1 | Major | **Supplies stop being pressure.** "Search the supplies" gives one potion per member in every room, and the ferryman and others add more. Pack size in run A: 7 potions (Chapter I) → 14 (II-1) → 83 (IV-8) → 128 (VI-7). ROADMAP D8 says supplies are "the existing pressure". | `potions-83-scroll-list` | Cap the pack (for example 2 per member). Make caches conditional or optional with a cost. Show the cap. Re-run `audit-campaign-attrition`. |
| G2 | Major | **Every story check is a near-certainty.** "Examine the evidence" is free, always offered, and grants advantage. All 25 Chapter II–VI checks in run A had advantage, and 21 of 25 succeeded. The odds band says "Likely" almost everywhere, which works against D5 ("the dice are real"). Each room also becomes the same ritual: evidence → supplies → companions → choice → continue. | room logs; `duplicate-speaker-name` shows "ADVANTAGE · LIKELY" | Give advantage only to the choice the clue is about, or make evidence cost something (a tick, or the companion line). Vary which rooms offer evidence. |
| G3 | Major | **Free actions still ask for confirmation** (regression against D7 and #62, both closed). Confirmed: search a chest, read the maintenance plate, each of the three puzzle controls, conversation replies, and "Continue the descent". A Counterweight Hall solve takes 5 confirmations. | `confirm-hides-story-box` | Commit directly when an action is free, rolls no dice and closes no branch, as the check-ins already do. |
| G4 | Major | **Reading order.** (a) In a companion conversation the reply choices are clickable on page 1/4, before the question is read. (b) The "Chapter I · Complete" card covers the last outcome page while it is still on page 1/3. | `replies-before-last-page`, `chapter-card-covers-prose` | Enable replies after the last page, or once the box is skipped. Open the chapter and ending cards after playback ends. |
| G5 | Major | **Heal rows crowd the story choices.** With any wound the Act group gains "Sela: heal Sela", "Oren: heal Sela" and "Drink healing potion" (in Curated, "Bram/Mira/Oren: give potion to Bram"). Lists reach 9–10 rows and show "scroll to explore" in 15 or more rooms at 1440×900, against V2-12. | `potions-83-scroll-list`, `rooms-*-contact` | Use one "Tend wounds" row with a member picker, or move healing to the party card. |
| G6 | Minor | **The best member is always the hero.** Story checks are hero-only, so the Wizard picks the gate lock (Agility +1, 45 %) while Mira, a Rogue, watches. "Best: Sela" appears in every room. | `pick-lock-hero-only` | Let the best-placed member attempt party checks. This is an engine change; keep it public-odds only. |
| G7 | Minor | **Curated combat pacing.** Each creature turn takes 2–3 "Let X act" clicks (move, attack, end) plus a "Go on" per beat. One goblin fight took about 31 clicks. Echo took 16. | run B | "Let X act" plays the whole turn. Offer auto-advance in combat. |
| G8 | Minor | **The branch warning spoils the story.** Resting in the first room warns "Closes: the ration to Scrit… the seal negotiation with Vark" before either character has been met. | `confirm` on Rest at camp | Use spoiler-free wording, such as "Uses every ration. Someone below may need one." |
| G9 | Minor | **Continuity.** The bell chamber says "Your companions gather… battered but alive" even when nobody was hurt. | run A, Bell Chamber | Make the line conditional on damage taken. |
| G10 | Minor | **The aggressive Echo route is 4× longer.** The engine profile makes 1,004 actions and 42 fights, against 250 actions for the diplomatic route. The diplomatic route never meets a fight after Chapter I, so a peaceful player sees no combat at all. | run E | Consider one scripted encounter per chapter that even talk cannot avoid, or shorter Echo fights after Chapter I. |

## 5. UI and copy (ROADMAP §6)

| ID | Severity | Finding | Where | Suggested fix |
|---|---|---|---|---|
| U1 | Minor | **The speaker is named twice.** The name plate says "Mira" and the body begins "Mira: My brother hated boats…" | `duplicate-speaker-name` (Hear your companions) | Strip a leading `Name:` when the plate shows that name, or drop the prefix in the authored text. |
| U2 | Minor | **Grammar:** "A insight check, DC 13" and "A agility check". | `server/game.ts:679` (`A ${challenge} check`) | Choose the article from the first letter. |
| U3 | Minor | **Unexplained jargon:** "Two ticks", "One tick", "Failure costs a tick". | confirmation cards | Use story time ("This takes a while") or say what a tick costs. |
| U4 | Minor | **Mechanics inside the prose.** "Level 2! Everyone gains 6 maximum health and 1 focus." sits inside the outcome text, and two XP tags merge into "+35 XP+90 XP". | run A | Add a level-up event or tag, and join the XP tags with " · " (#64). |
| U5 | Minor | **System words outside the story box:** "Continue saved adventure", "Choose a saved adventure", "Autosaved", "Complete authored adventure…", "Travel onward with this decision recorded", "Reload the latest saved adventure." | title, HUD, confirmation, error toast | Use "Continue your adventure", "Choose an adventure", "Travel onward"; keep "Autosaved" as HUD status, or replace it with an icon and a tooltip (#64). |
| U6 | Minor | **Settings opens with AI.** It starts with the AI mode. "Speak AI dialogue automatically" is checked in free mode. Developer data appears: "Host allowance reserved today: $0.0000", "Recent p95 frame time", playtest time and "Download playtest report". "Connect a key in settings" appears *inside* settings. | `settings-ai-first` | Put reading and sound first (#68). Move developer data behind `?debug`. |
| U7 | Minor | **"Read your story" opens a list.** It shows the Discoveries journal as a flat list, and writes "Oren and the hero agree…" instead of the player's name. | `read-your-story-journal` | Group by chapter and use the hero's name (#66 recap). |
| U8 | Minor | **The "Resolving your action…" toast covers the room title.** | `resolving-toast-over-title` | Anchor it under the title, or in the action panel. |
| U9 | Minor | **The story box disappears while the confirmation card is open** (#60 handoff note, still true). The reader loses the text they are deciding about. | `confirm-hides-story-box` | Keep the box visible, dimmed. |
| U10 | Minor | **Look-alike party.** The default calling is Fighter, which is Oren's model, so the first screen shows two identical knights. A Rogue hero is Mira's twin, and NPCs such as the courier and the ferryman reuse Mira's green hood. | `first-room-1440`, `echo-combat-rogue-twins` | The real fix is #11. Meanwhile default the calling to Wizard and tint NPCs differently. |
| U11 | Minor | **Units differ between the rule sets:** Echo shows "6m move", Curated "35 ft move". | combat HUD | Use feet in both. |
| P1 | Polish | **The brand button's accessible name** is "◈ ECHOES BELOW", although it returns to the title and saves. | topbar | `aria-label="Return to title"`. |
| P2 | Polish | **The creation screen shows "CHAPTER 1"** in the topbar. | `creation-1440` | Hide the chapter on creation. |
| P3 | Polish | **Descent map labels:** the chapter labels sit a few px off their node rows (II, IV). | `descent-map` | Align them to the row centres. |
| P4 | Polish | **Repeated staging.** Every Chapter II–VI room places "Sheltered rest", "Examine the evidence", "The way forward" and "Forgotten supplies" in the same spots, with the party in the same pose. The rooms differ, but the stage repeats. | `rooms-*-contact` | Add per-room anchors in `client/rooms/*` (chapter files only). |
| P5 | Polish | **Fonts load from Google Fonts**, a third-party request that fails offline. | network | Self-host the woff2 files. |
| P6 | Polish | **Back and refresh.** Browser Back leaves the game, and Forward or Reload lands on the title, not in the adventure. | run D | Restore the last adventure on load, or confirm before leaving. |

## 6. Accessibility (WCAG 2.2 AA)

| ID | Severity | Criterion | Finding | Suggested fix |
|---|---|---|---|---|
| A1 | Major | 2.4.3, 2.4.11 | **Modals lose focus.** Settings is `aria-modal="true"` but keeps focus on the gear button, and Tab walks the HUD behind it. Closing the journal sends focus to `<body>`. The ending page and the chapter-complete card start focus on `<body>`, and Tab reaches the dimmed HUD behind them. The map, credits and confirmation card behave correctly. | One modal helper: move focus in on open, trap Tab, make the background `inert`, and restore focus to the opener. |
| A2 | Major | 1.4.4, 1.4.10 | **No reflow at 200 % zoom** (720×450 emulation). The panels keep desktop positions: the settings button is cut off, and the action panel and story box fall outside the viewport, reachable only partly by page scroll. | Below about 900 px wide, stack the panels (actions as a drawer, story box full width). |
| A3 | Minor | 2.3.3 (AAA), brief requirement | **The OS reduced-motion setting is half ignored.** `App.tsx:57` seeds the in-game setting from localStorage only. The story box and the world die honour the OS preference, but camera glide (`SceneFraming.tsx:33`) and character walking (`World.tsx:45`) do not. | Default `reduced` to `matchMedia('(prefers-reduced-motion: reduce)')` when nothing is stored. |
| A4 | Minor | 2.5.8 | **Story box targets are small:** "Journal J" is 64×20 px and "Go on ›" is 44×21 px. | Use a minimum height of 24 px. |
| A5 | Pass | 1.4.3 | 145 of 145 token pairs pass. The rendered-text scan of creation, a room and the credits found no failures. | — |
| A6 | Pass | 2.1.1, 2.4.7 | All creation controls are reachable by Tab, with a visible 2 px outline. A room plays with the keyboard: a number key focuses or opens, Enter opens the confirmation card, Enter or Space rolls, and Escape closes and returns focus to the row. | — |
| A7 | Pass | 4.1.2, 4.1.3 | `lang="en"`. The story body is `aria-live="polite"`, with the typewriter `aria-hidden` and an `sr-only` copy, so nothing is read twice. Dialogs are labelled. Calling buttons use `aria-pressed`. | — |

## 7. Browsers and platform

| Check | Chrome 151 | WebKit 27.2 (Safari engine) | Firefox |
|---|---|---|---|
| WebGL2 | yes | yes | not tested (not installed) |
| Fonts | Cormorant Garamond, DM Sans and EB Garamond load | Cormorant Garamond and DM Sans confirmed | — |
| localStorage | works (`echoes-voice`, `echoes-motion`, `echoes-auto-advance`, playtest records) | works | — |
| Frame time (first room) | p95 18.1 ms, 60 fps | p95 18.0 ms, 60 fps | — |
| Audio autoplay | No audio requests until the first real gesture. Then 13 files (sfx, music, ambience) load | 13 files after the gesture | — |
| Resume | Reload → title with the saves list → resume works | Reload → "Continue saved adventure" → same room | — |
| Console | No errors on the Echo path. B1 on Curated | Only a WebKit deprecation warning (`window.styleMedia`, from a dependency) | — |

**Error states, live**
- **Offline:** an action shows a raw toast, "Failed to fetch" (`offline-failed-to-fetch`). The HUD still says "Autosaved". Back online, the confirmation card is still open and the retry succeeds once, because the command id is reused (minor: wording and status, E1).
- **409 (two tabs):** the stale tab shows "Reload the latest saved adventure." with no Reload button (`conflict-409`) (minor, E2).
- **Security:** `POST /api/dev/preview/approach` returns 404 on the live Site even with a valid session token.

## 8. Layout and performance

### Visible scene

| Viewport | Visible scene | Notes |
|---|---|---|
| 1440×900 | 55.6 % (minimum, Chapter V) to 61.7 %. Typical Chapter II–VI room: 56–58 % | Above the 55 % target with a thin margin (#60 note, unchanged) |
| 1440×760 | 55.2 % | `layout-1440x760` |
| 1100×800 | **52.0 %** | Below target. In the party card the name and class touch ("OrenFIGHTER"), and the HP and pack lines wrap (`layout-1100x800`) |
| 1280×720 | 49.2 % | Below target |
| 1920×1080 | 72.3 % | `layout-1920x1080` |

### Layout findings

| ID | Severity | Finding | Suggested fix |
|---|---|---|---|
| L1 | Major | **Combat text is truncated with an ellipsis:** the mechanics tag ("…ATTACK · 5 VS AC 18 · NATUR…") and the combat story line ("…then c…"). | `combat-tag-truncated`, `curated-combat-start`. Let the tag wrap to a second line in combat, or shorten it to the roll and DC. |
| L2 | Minor | **The party header wraps** ("LEVEL 1 · 205 XP" over two lines) once XP reaches three digits, at 1440. | `xp-wraps-cookfire`. Keep the header on one line with `white-space: nowrap`, or a smaller XP label. |
| L3 | Minor | **The scene is below 55 % at 1100×800 and 1280×720,** and the party card is cramped at 1100. | Narrow the side panels under 1200 px, or collapse the party card to portraits. |

### Frame time and draw calls

Measured with `frame-sampler.js` in run A, 5 s exploration, DPR 1, capped at 60 Hz. The previous baseline was 265–351 draw calls.

| Chapter (first room) | Median ms | p95 ms | Draw calls / frame | Triangles / frame |
|---|---|---|---|---|
| II The Ink Garden | 16.7 | 18.1 | 179 | 153,120 |
| III The Cinder Gate | 16.7 | 18.0 | 222 | 87,528 |
| IV The Garden of Locks | 16.7 | 18.1 | 225 | 109,888 |
| V The Silent Refectory | 16.7 | 18.1 | 201 | 89,236 |
| VI The Founders' Descent | 16.7 | 18.3 | 186 | 90,910 |

### Bundle and first load

| Measure | Value |
|---|---|
| JavaScript, gzip (raw) | 450 KB (1.6 MB): `three` 187 KB, `r3f` 84 KB, `index` 119 KB, `react` 59 KB |
| CSS, gzip | 11 KB |
| Cold load, fresh profile | TTFB 0.20 s, FCP 0.57 s, title scene loaded at 1.4 s (8.2 MB, 7.8 MB of it nine GLB models) |
| Begin → first room interactive | 2.2 s; 11.1 MB in total after the first room |

### Status of the #60 handoff notes

| Note | Status | Evidence |
|---|---|---|
| 1100 px visibility (~49 %) | Still under target: 52.0 % at 1100×800 | L3 |
| The story box is hidden while the confirmation card is open | Still true | U9 |
| The XP line is matched from engine text | Still true: `client/story-pages.ts:55` uses `XP_LINE.exec`. `check.xp` exists | Fold into #64 |
| The visibility margin is thin (55.1–55.5 %) | Unchanged: the Chapter V minimum is 55.6 % | §8 |

## 9. Issues

| Issue | Covers | Files | Order |
|---|---|---|---|
| #94 Resilience: Curated end-of-combat crash, app error boundary, offline and 409 recovery | B1, E1, E2 | `TurnPlayback.tsx`, `TacticalControls.tsx`, `App.tsx`, `api.ts`, tests | First |
| #95 Balance: supplies cap, evidence advantage, the best member rolls | G1, G2, G6, G9, G10 | `server/`, `shared/`, audits, tests | In parallel with UI work (server only) |
| #96 Reading flow: no confirmation for free actions, replies after the last page, one heal row, Curated turn pacing, story box under the card | G3, G4, G5, G7, U9 | `App.tsx`, `ActionPanel.tsx`, `confirmation.ts`, `TurnPlayback.tsx`, `StoryBox.tsx` | After #94 |
| #97 Accessibility: modal focus, 200 % reflow, OS reduced motion, target size | A1–A4, P1 | modals, `App.tsx`, `style.css` | After #96 |
| #98 Layout: combat tag truncation, XP wrap, 1100 px, toast overlap, default calling | L1–L3, U8, U10 (interim), U11, P2, P3 | `style.css`, small TSX | Serial with the other `style.css` work |
| #64 Wording (comment) | U1–U5, G8, U7 ("the hero"), XP from `check.xp` | | |
| #66 Chapter pages (comment) | No break between Chapters II–VI; chapter card over prose (G4b); "Read your story" grouped by chapter | | |
| #68 Settings and onboarding (comment) | U6, and A3 as the default for the reduced-motion setting | | |
| #11 Characters (comment) | U10 | | |
| Not filed | P4 (room anchors), P5 (self-host fonts), P6 (resume on load). Recorded here for v1.1 | | |
