# Echoes Below — v1.0 roadmap: light novel × D&D × dungeon

Status: accepted on 27 October 2026. The owner asked for a grill session with recommended answers and accepted the recommendations by default. Each decision below can still be overridden; change it here and in the matching issue.
Owner: Naufaldi. Parent: [PRD](PRD.md). Characters: [CHARACTERS.md](CHARACTERS.md). Tracking issue: #71.

## 1. What the game is

Echoes Below combines three things:

1. **A light novel.** Most of the time the player is reading: room descriptions, companion lines, outcomes and endings.
2. **A D&D table.** Dice, DCs, classes and a Dungeon Master voice decide what happens, and the rolls are the dramatic beats.
3. **A dungeon descent.** The structure is going deeper, one room at a time, through six chapters to the bell at the bottom.

**Pillar order: the light novel leads, D&D decides, the dungeon is the stage.** When two goals conflict, readability of the story wins, then clarity of the roll, then spectacle in the room.

| Pillar | What the player should feel | Surfaces that carry it |
|---|---|---|
| Light novel | "I am reading a story about people I care about." | Story box with a speaker name and portrait, paged text, a chapter title page, ending pages, the journal as a backlog, companion lines |
| D&D | "The dice are real, and I chose to take this risk." | The odds before I commit, the die in the world, the modifier breakdown, natural 20 and 1 treated as events, one roll that is never rerolled, the DM's voice |
| Dungeon | "I am going deeper, and each room is a different place." | Bespoke rooms (#47–#51), a descent map, chapter depth, visible supplies, forks marked without spoilers |

## 2. Where the game is today (playtest, 27 October 2026, build after #54)

**Update, 28 October 2026 (v1.0 release gate, `3c588bc`, Site version 21):** every §5 row passes except Release, which waits for the owner's "deploy". The diplomatic and aggressive Echo runs reach The Open Relay and The Iron Watch through all 46 rooms with different fork states. A Curated run through Chapter II no longer blanks the page. Every chapter holds 60 fps at 186–351 draw calls. Details are in [RELEASE-GATE-v1.0.md](RELEASE-GATE-v1.0.md). The observations below are from the 27 October playtest and are kept as history.

UI hygiene is done: the design tokens, controls, HUD hierarchy, story panel, labels, creation screen and confirmations were all fixed in #27–#33 and deployed in version 14. The owner still finds the game ugly. The remaining gap is **genre identity**, not polish. Observed:

- **It reads like a dashboard, not a book.**
  - Actions are a numbered menu (`01 … ↗`) inside a generic navy-and-gold panel.
  - Every surface has the same chrome, so story text, system state and menus look alike.
- **System wording reaches the player.** For example:
  - "The engine resolves the outcome. Any required dice are rolled once and saved."
  - "Skip presentation · outcomes are already saved."
  - "Hear an authored companion reflection. No AI charge, dice roll or reward."
- **Outcomes are log lines, not prose.**
  - A natural 20 shows "Mira: Read the tracks succeeded (22 vs DC 10). The tracks show captives were marched alive into the relay. The party gains 35 XP."
  - The story and the numbers sit in one sentence.
  - The natural 20 gets no special treatment.
- **Companions have no presence.**
  - Mira's line appears in the story panel under a small label.
  - There is no name box, no portrait and no pacing.
  - A free check-in still goes through an intention confirmation.
- **Dice are shown, odds are not.**
  - The DC is visible ("INSIGHT · DC 10"), but the player can't see the chance of success or which party member is best placed to try.
- **Depth is invisible.**
  - The bottom strip lists the current chapter's rooms.
  - There is no sense of descending through six chapters, and no view of which rooms were forks.

## 3. Grill log: decisions and recommended answers

Each entry gives the decision, the recommendation, the reason, and what it changes. The owner accepted these by default.

**D1. Which pillar leads?** Light novel first, D&D second, dungeon third (§1).
*Why:* the engine is choice-driven and every action already produces authored text, so reading is what players spend most of their time doing. Dice are the peaks, and the dungeon gives progress and place.
*Changes:* every UI review asks three questions in this order. Does it read like a page? Does the roll feel fair and dramatic? Does the room feel like a place?

**D2. How is text presented?** In an **ADV-style story box**: speaker name plate, portrait slot and paged text.
- Click or Space advances.
- A typewriter reveal is on by default; the first click shows the whole page.
- Auto-advance is optional.
- The journal becomes the full backlog.
- **NVL full-page text** is used only for chapter openings, chapter recaps and endings.
- On first entry, a room's description appears as a short **read-aloud page**, like D&D boxed text. Keep it to what the party can actually see, then collapse it into the story box.

*Why:* this is a familiar visual-novel convention, and a good one is invisible. Reviews of D&D boxed text agree it should be short and limited to what the characters perceive.
*Changes:* new story box (#60). Narration and dialogue leave the generic panel.

**D3. Whose voice is speaking?** Three voices, each with its own type treatment:
- the **Narrator/DM**: Alegreya at 19px, no name plate;
- **characters**: an IM Fell English name plate at 20px or above, with a portrait; the plate shares the warm iron/paper palette so character colour stays in the portrait;
- **mechanics**: Alegreya Sans with lining tabular figures; labels use the real Alegreya Sans SC cut because Google Fonts’ Sans cut has no `smcp`. Small caps tags such as `INSIGHT 22 vs 10 · +35 XP` keep prose and numbers apart.

System and implementation wording ("engine", "presentation", "saved", "AI charge") never appears in story surfaces. Where it is still needed, it moves to tooltips or Settings.
*Changes:* wording pass (#64) and a copy guide in this file (§6).

**D4. How are prose and numbers separated?** **The engine emits structured outcome fields alongside today's `text`**: the outcome prose, plus a `check` record with actor, skill, die, modifier, total, DC, success, natural roll and XP. This change is additive.
- `text` stays byte-for-byte the same, so saves, the journal and the tests that assert on it (`tests/backend-side-adventures.test.ts`, `tests/backend-consequences.test.ts`) keep passing.
- The client shows the prose as story and the `check` as a mechanics tag.
- Parsing log strings on the client was rejected: it is brittle and would break with every new sentence pattern.

*Changes:* #56, an engine change with a new test, then #60 consumes it.

**D5. Are odds shown before rolling?** Yes, as a **plain-language band with the exact figure on hover**: "Likely (85%)", "Risky (50%)", "Long shot (20%)". The band is computed on the client from **public** numbers only, the actor's modifier and the DC. Advantage and help (`attack-help`) are shown when they apply.
- **Natural 20 and natural 1 become events**, with a light burst or crack, a sound and a distinct line.
- Rolls are still made once and saved. There are no rerolls; keeping that rule is a design choice, not a limitation.

*Why:* Disco Elysium shows the odds before you commit, and players read this as fair. BG3 shows only the DC and draws complaints about save-scumming. Our engine already forbids rerolls, so showing odds is the honest counterpart.
*Changes:* #61. Nothing private reaches the client.

**D6. How are characters present in dialogue?** **Portraits are rendered in the engine from the actual 3D model**: a head-and-shoulders snapshot taken once per actor look (class, race, palette) and cached as an image for the name plate.
- They work today with the KayKit placeholders and switch to the Tripo models automatically when those arrive (#11).
- Hand-painted portraits are an optional override later, with the file contract in CHARACTERS.md §6.
- Expressions come from optional emote clips later.

*Why:* there is one source asset per character and no 2D art dependency. Portraits always match what the player picked at creation, and the game still uses one WebGL canvas.
*Changes:* #65, plus the new CHARACTERS.md §6.

**D7. What does the action list become?** **Story choices, not a dashboard.**
- Drop the `01 … ↗` numbering; keyboard numbers still work, shown as a hint.
- Group actions by verb: *Look*, *Talk*, *Act*, *Move*.
- Each check shows the best-placed party member and their odds band.
- Free, reversible actions such as companion check-ins skip the confirmation.
- Light anchored confirmations remain only for actions that cost something or close a branch (#31 rules).

*Changes:* #62.

**D8. What is the dungeon layer for v1.0?** A **descent map** and **chapter framing**. There is **no new survival system**: no torch meter and no stress.
- The descent map shows the six chapters as depths and the rooms as nodes, plus the current position and cleared rooms. Fork rooms are marked "the way here depends on you" without spoiling either variant.
- It uses only the public `CAMPAIGN_MAP` (`shared/campaign-map.ts`).
- Every chapter opens on a title page (NVL) and closes with a recap: the choices made, who was trusted and what changed.
- Supplies (potions, rations) become more visible because they are the existing pressure.

*Why:* inkle's Sorcery! postmortem calls the map the heart of that adaptation. Darkest Dungeon-style light and stress systems would be a new game system, which is v2 scope.
*Changes:* #66 (chapter pages) and #63 (descent map). *Override note:* if the owner wants survival pressure in v1.0, add one issue for a light/torch mechanic and expect engine and balance work.

**D9. What is the visual identity?** **"An adventurer's journal under torchlight."**
- One warm iron/soot neutral family carries all chrome; story paper is slightly warmer and lighter. Bone text has secondary and muted steps. A desaturated brass edge marks interaction and selection.
- IM Fell English gives room, chapter and panel titles their worn print character, at 20px and above. IM Fell English SC carries the wordmark; Alegreya carries prose and Alegreya Sans carries controls. Fonts load through Google Fonts links with preconnect and `display=swap`.
- Bevelled corners repeat across panels, cards, controls, cartouches and name plates (`corner-shape:bevel`, small rounded fallback). A low brass inner top highlight and a soft shadow provide depth. Choice rows remain borderless.
- **Chapter colour is limited to chapter title/recap pages and the current descent marker.** The HUD no longer re-tints its stone and mist tokens per chapter. This deliberately departs from #110 to keep one material over the six environments.
- Gold is kept for dice, natural 20s and the primary call to action. The primary control has a deep fill, a 1px gold frame and a gold label. State colour stays on meaningful health, hostility and error indicators.
- Compact individual party cards, a quest tracker, borderless verb groups and a slim descent line leave the scene open. Playback hides the empty action panel. Creation sits below a large game-title lockup, with no feature strip or repeated eyebrows.

Taste is the owner's call, so #55 first produces **three HTML mockup directions** of the same screen (story box, action list, HUD):
- (a) the dark journal (recommended);
- (b) light parchment pages over the dark scene, like the Pillars of Eternity storybook;
- (c) a refined version of today's look.

The owner picks one, and #59 applies it.
*Changes:* #55, then #59. #59 also removes dead CSS.
*Decision:* Owner delegated the pick on 27 Oct 2026; (a) chosen; mockups skipped (#55 closed).

**D10. What is the priority order now?** This **departs from PRD owner decision 1** ("combat → characters → environment → HUD"). Combat readability shipped, and characters are blocked on the owner's Tripo models.

The new order is:
1. Environments (#47–#51, running).
2. Identity and story presentation.
3. D&D clarity.
4. Dungeon framing.
5. Release polish.

Characters (#11) slot in whenever the models arrive and never block a release.

**D11. What is the finish line for v1.0?** See §5. **KayKit placeholder characters are acceptable at v1.0.** If the Tripo models arrive late, they ship in v1.1. The release isn't held for them.

**D12. What else is fixed?**
- **AI stays an optional bonus.** The complete experience is authored, and no core path needs AI text.
- **English only** for v1.0. Strings stay plain so localisation can come later.
- **Desktop browser only.**
- **No voice acting.** An optional, quiet per-speaker text blip, off by default.
- **Companion barks:**
  - short authored lines at natural 20s, at a party member going down, on a heal, and at fork rooms;
  - client-side, keyed on cue types, never AI (#67).

**D13. What happens to the reported residuals?**
- Track B reads companion trust but never raises it → #57.
- The confirm card closes on camera drag, tightly packed actors lose their labels, and the projectile was never confirmed visually → #58.
- Dead CSS → part of #59.

## 4. Phases

Phases overlap where the file scopes don't. The chapter agents work only in `client/rooms/` and `public/assets/env/`, so issues touching `server/`, `shared/` or `client/*.tsx` outside `rooms/` can run beside them. Issues that touch `App.tsx`, `TurnPlayback.tsx` or `style.css` conflict with each other and are queued one at a time, or given to the same agent.

| Phase | Issues | Can run in parallel with |
|---|---|---|
| 1. Environments (running) | #47 Drowned Archive, #48 Ash Market, #49 Rootbound Prison, then #50 Hollow Choir, #51 Last Descent | #55, #56, #57 (no shared files) |
| 2. Identity | #55 mockups → owner pick → #59 tokens and surfaces | #56, #57 |
| 3. Light novel layer | #56 structured outcomes → #60 story box → #64 wording → #65 portraits, #67 barks | #63 after #59 |
| 4. D&D and dungeon | #61 dice and odds, #62 story choices, #66 chapter pages, #63 descent map | — |
| 5. Release | #58 residuals, #68 reading settings and onboarding, #69 endings and credits, #11 characters (if delivered), #70 release gate | — |

## 5. Definition of done for v1.0

Every row must hold:

| Area | Done when |
|---|---|
| Content | All 46 rooms across six chapters play from creation to one of the four endings, in both Echo and Curated rules |
| Branching | The diplomatic and aggressive audit profiles reach different endings and see different fork states (Track B, B-01…B-05) |
| Rooms | Every Chapter II–VI room has its own layout, and all rooms stay within the draw-call baseline (#47–#51) |
| Light novel | Story box, read-aloud room pages, chapter title and recap pages, and ending pages are shipped. No system wording appears in story surfaces |
| D&D | Odds band, modifier breakdown, help and advantage display, and natural 20/1 events are shipped. Rolls are still made once and saved |
| Dungeon | The descent map is shipped, and forks are marked without spoilers |
| Characters | Portraits work from the in-game models. Tripo models are optional for v1.0 |
| Reading settings | Text speed, instant text, auto-advance, text size, reduced motion and volume are available |
| Onboarding | A first-run guide explains reading, choosing and rolling in under one minute |
| Quality | All tests, three typechecks and the build with the asset gate pass. p95 frame time and draw calls are recorded per chapter. One full manual playthrough per playstyle is recorded |
| Release | Deployed to the existing Site after the owner says "deploy" |

## 6. Copy guide (player-facing wording)

- **Narrator.** Second person, present tense, concrete and sensory. Describe only what the party can perceive. No numbers.
- **Characters.** Short lines in their own voice: Mira is dry and observant; Oren is patient and protective.
- **Mechanics.** A small caps tag, with no verbs: `INSIGHT · 22 vs DC 10 · +35 XP`.
- **Never in story surfaces:** engine, presentation, saved, server, AI charge, "authored". Use Settings or a tooltip when the fact matters.
- **Buttons.** Use story verbs, such as "Go on", "Descend" or "Ask Mira". Avoid system verbs such as "Take action" or "Continue adventure".

## 7. Issue list

Tracking issue: #71.

| # | Title | Depends on | Main files |
|---|---|---|---|
| #55 | Identity: three mockup directions for story box, action list and HUD | — | `docs/design/` only |
| #59 | Identity: apply the chosen direction (surfaces, chapter accents, type voices, dead CSS) | #55 + owner pick | `client/style.css`, small TSX class changes |
| #56 | Engine: structured outcome prose and check record on logs (additive) | — | `server/game.ts`, `shared/types.ts`, tests |
| #60 | Light novel: story box, paged text, read-aloud room pages, journal backlog | #59, #56 | `client/NarrativePassage.tsx`, `App.tsx`, `TurnPlayback.tsx`, `style.css` |
| #64 | Wording: remove system copy from story surfaces, story-verb buttons | #60 | `App.tsx`, `TurnPlayback.tsx`, `confirmation.ts` |
| #65 | Portraits rendered from in-game models for the name plate | #60 | new `client/Portrait*.tsx`, `World.tsx` |
| #61 | D&D: odds band, modifier breakdown, help/advantage, natural 20/1 events | #59 | `WorldDie.tsx`, `action-focus.ts`, `audio-cues.ts`, `App.tsx` |
| #62 | Actions as story choices: verb groups, best member, no confirm for free actions | #59 | `App.tsx`, `action-focus.ts`, `confirmation.ts` |
| #66 | Chapter title pages and chapter recaps | #59, #60 | new `client/ChapterPage.tsx`, `App.tsx` |
| #63 | Descent map from the public campaign map, forks without spoilers | #59 | new `client/DescentMap.tsx`, `App.tsx` |
| #67 | Companion barks on natural 20s, downs, heals and forks | #60 | new `shared/companion-barks.ts`, `TurnPlayback.tsx` |
| #57 | Track B: the playstyle ledger raises Mira and Oren trust | — | `server/playstyle.ts`, tests |
| #58 | Interaction residuals: confirm card on camera drag, packed-actor labels, projectile check | — | `App.tsx`, `WorldLabels.tsx`, `CombatCues.tsx` |
| #68 | Reading settings and first-run onboarding | #60 | `AudioSettings.tsx` → settings, `App.tsx` |
| #69 | Ending pages, endings found, and credits | #60 | new `client/EndingPage.tsx`, `App.tsx` |
| #70 | v1.0 release gate: full playthroughs, perf per chapter, deploy on owner approval | all | — |

Existing issues that stay as they are: #11 (Tripo characters, owner-gated), #47–#51 (rooms), #52 (environment tracking), #16 (Presentation v2 tracking).

## 8. Research notes

These shaped the decisions above. Most sources are wikis, forums and press, not developer postmortems, so treat them as community observations.

- **Disco Elysium.** The success chance is shown before committing. Red checks are one-shot, while white checks can be retried after the skill improves. Hidden passive checks were criticised. → D5: show odds, and keep rolls single and saved. ([wiki](https://breezewiki.discard.no/discoelysium/wiki/Skills), [Fandomentals](https://www.thefandomentals.com/disco-elysium-redefines-stories-rpgs/), [Backloggd review](https://backloggd.com/u/heychrisfox/))
- **Baldur's Gate 3.** Dialogue checks show the DC and the d20, with advantage as two dice. Players complain that the odds are hidden and that this encourages save-scumming. → D5. ([bg3.wiki DC](https://bg3.wiki/wiki/DC), [Steam discussion](https://steamcommunity.com/app/1086940/discussions/0/2971771480498477970))
- **Pillars of Eternity.** Scripted interactions are illustrated storybook pages with choose-your-own-adventure choices gated by skills. → D9 option (b), and D2's read-aloud pages. ([GameBanshee](https://gamebanshee.com/k9fqp), [Engadget](https://www.engadget.com/2014-06-19-obsidians-pillars-of-eternity-looks-old-and-thats-good-news.html))
- **Darkest Dungeon.** Light and stress are its signature tension systems. → D8: noted, deferred to v2. ([Wikipedia](https://en.wikipedia.org/wiki/Darkest_Dungeon), [GDC postmortem listing](https://www.gdcvault.com/play/1023089/contactUs))
- **Visual-novel conventions.** ADV/NVL modes, speaker name and body text, typewriter reveal, auto and skip, backlog. "An ideal UI never draws attention to itself." → D2. ([fuwanovel anatomy of VN UI](https://forums.fuwanovel.moe/blogs/entry/4226-ui-design-%E2%80%93-an-anatomy-of-visual-novels), [Naninovel text printers](https://naninovel.com/guide/text-printers))
- **Citizen Sleeper.** Tabletop-inspired dice, with low rolls as gambles and stress as a trade-off. → noted for v2. ([How to Make an RPG case study](https://howtomakeanrpg.com/r/a/case-study-citizen-sleeper.html))
- **inkle's Sorcery!.** "The map became the heart and soul of the game." → D8 descent map. ([Game Developer postmortem](https://gamedeveloper.com/business/postmortem-i-steve-jackson-s-sorcery-i-series-by-inkle))
- **Wildermyth.** Handcrafted and procedural story told in comic panels between tactical fights. → D10 chapter pages as the "between fights" layer. ([Wikipedia](https://en.wikipedia.org/wiki/Wildermyth))
- **D&D boxed text.** Keep it short, limit it to what the characters perceive, and flag what matters. → D2 read-aloud pages. ([The Alexandrian](https://thealexandrian.net/?p=35180), [EN World thread](https://www.enworld.org/threads/read-aloud-text-in-modules-what-are-folks-opinions-about-read-aloud-content.712737/))
