# Echoes Below: v1.0 release gate (28 October 2026)

Issue: #70. Definition of done: [ROADMAP §5](ROADMAP.md#5-definition-of-done-for-v10). Method: [PLAYTEST-v16 §2](PLAYTEST-v16.md#2-coverage-and-method).
Build: `main` at `3c588bc`, the commit deployed as Site version 21. The live Site serves the same `assets/index-CUafcEL-.js` and `assets/index-CMKBsNPf.css` as the local `dist/client/index.html`.
Tester: release-gate test agent. Machine: Apple M1, 8 GB, macOS 15. Browser: Chrome for Testing 151, headed, through agent-browser, at 1440×900 and DPR 1. Stills: [`docs/screenshots/release-gate-70/`](screenshots/release-gate-70/).

## 1. Result

**Gate: pass, except for one row.** Every ROADMAP §5 row passes except **Release**, which waits for the owner's "deploy". The bundle that would ship is already live as version 21. #113 was filed as a minor bug and does not block. The polish items in §5 are tracked in #110.

| §5 area | Result | Evidence |
|---|---|---|
| Content | **Pass** | Echo: two full runs, creation to ending, 46 of 46 rooms each (A and B). Curated: run C, creation to the end of Chapter II, in the UI. The engine profiles reach the same endings in both rule sets (`scripts/playstyle-profiles.ts`: diplomatic → open-relay, aggressive → iron-watch, for `echo-v1` and `curated-srd-5.2.1-v1`). A full Curated run in the UI was not required. |
| Branching | **Pass** | A reached **The Open Relay** and B reached **The Iron Watch**. All five Track B forks showed different variants (§3). They match the engine oracle: A mercy/ally/mira/mercy/ally, B force/wary/oren/force/wary. |
| Rooms | **Pass** (one note) | Each Chapter II–VI room rendered its own layout in A and B. Echo draw calls are 186–351 per frame across all chapters, inside the 265–351 baseline at the top end, and lower from Chapter II on ([PERF_BASELINE](PERF_BASELINE.md#v10-release-gate-per-chapter-28-october-2026-main-at-3c588bc)). Note: Curated combat draws 417 (Cookfire) and 485 (Sluice Stair) per frame because of the tactical grid. It still holds 60 fps at p95 18.6 ms. |
| Light novel | **Pass** | Story box, room pages, chapter title pages for I–VI, the Chapter I complete page and recap pages for II–VI were all seen (§3). Ending pages: `a-ending-open-relay.jpg`, `b-ending-iron-watch.jpg`. A wording watch over story surfaces in all three runs found no system wording. Its only matches were the room name "The Engine of Hunger". |
| D&D | **Pass** | Seen live: the confirmation card showed the odds band ("Likely 80%"), the best member, the modifier breakdown ("Insight +3 · Proficiency +2") and "One try each. The roll stands." The roll came up a natural 1, shown as its own tag (`SMOKE · INSIGHT · 6 VS DC 10 · NATURAL 1`, `live-smoke.jpg`). Results appear as tags (`INSIGHT · 8 VS DC 12 · +35 XP`). Curated and Echo combat both ran in the UI (48 fights in total). The client never rolls; every outcome came from the server save. |
| Dungeon | **Pass** | The descent strip and map are present in every room. The ending lists 46 of 46 rooms by chapter, with fork dots. |
| Characters | **Pass (D11)** | Portraits come from the in-game KayKit models (party card, story plate). Tripo models (#11) are deferred to v1.1 by owner decision D11. |
| Reading settings | **Pass** | Settings opens with Reading (text speed including Instant, turn pages automatically with a pause, text size, the guide), then Sound (master, music, effects), then a Motion section with Reduced motion, which defaults to the OS setting (#97) (`settings-keyboard.jpg`). Keyboard check: focus moves in, Tab stays inside (six Tabs), Escape returns focus to the gear. "Show the guide again" is in Settings. |
| Onboarding | **Pass** | The guide has four steps (read, choose, odds, roll). Keyboard only: Enter ×4 finished it in about 5 s, focus stayed in the card, and "Begin" returned focus to the opener. It shows once, on a new adventure only (`client/guide.ts`). Step 3: `guide-step3.jpg`. |
| Quality | **Pass** | `npm test` 487/487. `typecheck:server`, `typecheck:client` and `typecheck:hosted` are clean. `npm run build` passes the asset gate (122 models, 14 licensed audio files, 81 CC0 environment files, 51 manifest-listed model files, 158 bundled files). p95 and draw calls are recorded per chapter. One full playthrough per playstyle was recorded (§4). |
| Release | **Waiting for the owner** | The bundle hash matches live version 21, and `/api/health` returns `{"ok":true,"aiConfigured":false,"hosted":true}`. Live smoke: new Echo game, two actions (search the chest, roll Inspect tracks), no console errors. No deploy was made by this gate. |

## 2. Gates

| Gate | Result |
|---|---|
| `npm test` | 487 tests, 487 pass, 0 fail |
| `npm run -s typecheck:server` | clean |
| `npm run -s typecheck:client` | clean |
| `npm run -s typecheck:hosted` | clean |
| `npm run build` | passes, asset gate included. `index-CUafcEL-.js` is 416 kB (130 kB gzip), `three` 744 kB (190 kB gzip) |

## 3. Playthroughs

Every run used the local production build, served from `dist/client` with a fresh SQLite database, on port 4353, with AI off. A small in-page driver clicked the real UI: `.actions-panel` rows, the confirmation's primary button, "Go on", and the chapter page buttons. It followed the choice policy in `scripts/playstyle-profiles.ts`. It listened for `error`, `unhandledrejection`, `console.error`, `console.warn`, a blank page and the app error boundary.

| | A: Echo, diplomatic | B: Echo, aggressive | C: Curated, aggressive |
|---|---|---|---|
| Hero | Sela, Wizard, Envoy | Bram, Fighter, Delver | Rook, Rogue, Delver |
| Route | Feed Scrit, negotiate, entrust Scrit. Chapters II–VI: evidence → supplies → companions → first story choice | Side ledge¹, attack the guards, force the gate, fight Vark, secure the seal. Chapters II–VI: confront the defenders, then the second choice | Counterweight puzzle, cross quickly, attack the guards, force the gate, fight Vark, secure the seal. Chapter II as in B |
| Reached | **The Open Relay**, 46/46 rooms | **The Iron Watch**, 46/46 rooms | End of Chapter II (recap page) |
| Chapter pages | Title I–VI. Recap II–VI. Chapter I complete page skipped (#113) | Title I–VI, Chapter I complete page, recap II–VI | Title I–II, Chapter I complete page, recap II |
| Actions / confirmations / committed directly | 267 / 186 / 81 | 1,063 / 983 / 81 | 203 / 93 / 111 |
| Fights | 0 | 42 | 6 (Cookfire, Bell Chamber, Sluice Stair, Bell Index, Glass Causeway, Keeper of Debts) |
| Party defeats | 0 | 1, at The Silent Refectory (V-3). Restored to its arrival checkpoint, then continued | 0 |
| Console errors, page errors, blank page, error boundary | none | none | none. **The v16 blocker B1 does not reproduce**: all six Curated fights ended without a blank page |
| Truncated combat tags (ellipsis) | none | none | none |
| Wall time | 8.9 min | 67.8 min | about 7.5 min of play² |

¹ The engine's aggressive Echo profile takes the side ledge, not "Cross quickly". Run C took "Cross quickly".
² The driver stopped at The Keeper of Debts on a Curated level-up. The ability-score choice is reached through "Level up available · Inventory", and the driver does not open that dialog. The level-up was left untaken, and the run continued from the same save after about 30 minutes idle.

**Track B forks (different between A and B)**

| Fork | A, diplomatic | B, aggressive |
|---|---|---|
| archive-1 The Sluice Stair | "Word has come down… your party chose talk over steel." *Raise the sluice with the ferryman's help* | "Word of the fighting at the relay has reached the water." *Persuade the ferryman to raise the sluice with you* |
| market-5 The Ember Theatre | Scrit's cousin waves from the wings. *Perform the true testimony with Scrit's cousin* | The council's script makes you raiders. *Win the crowd back with the true testimony* |
| roots-4 Tavin's Survey Camp | Mira reaches Tavin first. *Let Mira promise to open the channel together* | Mira stops at the edge. *Help Oren draw up a release plan with Tavin* |
| choir-4 The Choir of Stone | Weapons already lowered. *Demonstrate the complete circuit with the novices* | Weapons raised. *Demonstrate the complete circuit under guard* |
| depth-2 The Abandoned Watch | A runner from the relay reached them. *Offer the guards safe passage upward* | No word has come from the relay. *Lower your weapons and offer safe passage upward* |

**Recordings** are kept out of git, on the test machine:

| File | Duration | Covers |
|---|---|---|
| `/tmp/release-gate-70b/video/run-a-echo-diplomatic.webm` | 9 min 40 s | A, creation to ending |
| `/tmp/release-gate-70b/video/run-b-echo-aggressive-part1.webm` | 41 min 16 s | B, creation into Chapter V (frame cap) |
| `/tmp/release-gate-70b/video/run-b-echo-aggressive-part2.webm` | 15 min 19 s | B, Chapter V to the start of Chapter VI's last rooms |
| `/tmp/release-gate-70b/video/run-c-curated-aggressive-ch1-2.webm` | 20 min 36 s | C, creation to The Keeper of Debts, including all six Curated fights |

Recording was capped by frame count under the machine's browser-resource rule. B has two gaps: 9 minutes around the defeat and restore in Chapter V, and the last 2 minutes before the ending. The ending is covered by `b-ending-iron-watch.jpg`.

## 4. Performance

The per-chapter tables are in [PERF_BASELINE.md](PERF_BASELINE.md#v10-release-gate-per-chapter-28-october-2026-main-at-3c588bc). In summary, all 18 Echo samples (first room and first combat of each chapter) hold 60 fps: median 16.7 ms, p95 17.9–18.6 ms, max 18.8 ms. Draw calls are 186–351 and triangles 88k–329k. In Curated (run C), Chapter I and II samples hold 60 fps at p95 16.8–18.6 ms, with 263–287 draw calls in exploration and 417–485 in tactical combat.

## 5. Layout and accessibility spot-check

| Check | 1440×900 | 1100×800 | 720×450 (200 % zoom) |
|---|---|---|---|
| Visible scene (10 px grid, canvas topmost), The Cinder Gate with the room page open | 55.4 % | 56.7 % (v16: 52.0 %) | 48.0 % (drawer layout: actions behind "What will you do?") |
| Screenshot | — | `layout-1100x800.jpg` | `layout-720x450.jpg` |

- **Keyboard, confirmation:** the number key opens the confirmation with focus on "Roll →". Enter rolls, and Enter turns the outcome pages.
- **Keyboard, chapter page:** Enter turns the Chapter III title page.
- **Keyboard, settings:** reached in 8 Tabs. Enter opens it, Tab stays inside, and Escape returns focus to "Open settings".
- **Keyboard, first-run guide:** see the Onboarding row in §1.
- **Combat tags:** no ellipsis in any of the 48 fights. A watcher checked every 0.7 s for `text-overflow: ellipsis` with overflow.

## 6. Known items that do not block v1.0

Being fixed in #110 (colour and layout pass). The lead re-checks contrast, scene share and screenshots after it merges:
- At 1100 px the bottom room strip clips the last room name ("07 The L…", `layout-1100x800.jpg`).
- The first-run guide's step 3 highlight ring overlaps the member chips (`guide-step3.jpg`).
- Chapter recap pages use the next chapter's accent colour. For example, the Chapter II recap is orange, the Ash Market colour (`c-curated-ch2-recap.jpg`).
- One Curated room (roots-1) still shows 9 action rows with "scroll to explore".

Found in this gate:
- #113 (bug, minor): the Chapter I complete page can be skipped by clicking "Continue to the Drowned Archive" in the second before it opens.
- Curated level-ups are offered only through "Level up available · Inventory". The action list does not show them, so a player who never opens Inventory never raises an ability score. Recorded for the owner, not filed.
- Curated tactical combat runs 417–485 draw calls per frame, above the Echo baseline, with no frame-time cost on this machine.

## 7. Not covered

- Firefox and WebKit. The v16 WebKit result stands.
- A full Curated run to an ending in the UI. The engine profile covers it.
- Screen readers. Live regions and labels were inspected in v16 and are unchanged here.
- Deploy, which waits for the owner.
