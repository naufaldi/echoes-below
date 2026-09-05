# Echoes Below: Product Requirements

Version 2.0, 6 September 2026. Current expansion contract. Historical v1 is archived separately and is not the release contract. Project: `/Users/naufaldisatriya/WebApps/3d-dnd`. See [RFC](RFC.md), [goal prompt](GOAL_PROMPT.md), and [expansion status](EXPANSION_STATUS.md).

## Vision and audience

A desktop browser fantasy adventure for one human hero and two companions, combining visual-novel choices, a visible 3D party, and understandable turn-based combat. Players choose intentions and targets while the engine handles movement. Mira and Oren react to witnessed events through authored lines and optional AI conversation, with English text and generated voices.

Baldur’s Gate 3 informs the anticipation of dice, readable turn order, character setup, and consequential party stories. Echoes Below uses original characters, plot and presentation. Its current Echo Rules are a simplified D&D-inspired rules profile, not a complete or officially compatible D&D edition. Do not market simplified classes or cosmetic races as the full tabletop implementations.

The user authorizes a public Sites release and optional player-funded or owner-sponsored AI. The game must remain playable without paid AI. No multiplayer, arbitrary physics/destruction, unrestricted spells, user-generated geometry, voice cloning, or payments in this release.

## Player journey

1. Choose a name, Human/Elf/Dwarf/Halfling identity, Fighter/Rogue/Wizard/Cleric calling, background, and palette. Preview the party, then begin or continue a saved adventure.
2. Read the room and objective. Select a visible interaction or its menu equivalent. Examine evidence, talk, search supplies, choose a route, or propose a custom action.
3. Review the action and any check before committing. The server rolls once, saves the outcome, then presents it.
4. Watch a prominent die animate and reveal its natural value, modifier and total. See the consequence after the reveal. Reduced motion shortens the animation. Skip dismisses presentation, never rerolls.
5. In combat, see initiative order and the active actor. Each automatic action is presented individually with its own health/position changes. Continue to the next action deliberately. The player cannot submit another game action during playback.
6. Read authored or AI dialogue, optionally listen, stop narration, or dictate editable text. Speech never executes an action automatically.
7. Earn shared XP from evidence, exploration and resolved encounters, including peaceful choices. Continue through six chapters with persistent decisions, resources, trust and levels.
8. Close the page after any confirmed action. Reopening the same browser retains access to hosted saves; personal API keys must be entered again.

## Rules and character contract

Internal class IDs preserve old saves: guardian=Fighter (24 HP, Defense14, sword1d8+3, Rally); scout=Rogue (18 HP, Defense12, bow1d6+3, Aim); adept=Wizard (16 HP, Defense11, spark1d6+3, Mend); cleric=Cleric (20 HP, Defense13, ranged radiance1d6+3, Mend). These are compact game classes, not full D&D class progressions. Races currently establish identity and model height; racial ability packages are not implemented. Background training grants +2 to specified opening checks.

A turn has 6m movement and one action. Run exchanges the action for 6m additional movement. Melee range1.5m; ranged8m. Guard adds2 Defense to the acting character until their next turn. Aim grants advantage to the next attack. Healing spends focus or a potion for1d6+2 health, capped at maximum. Zero-health characters cannot act; healing can revive them. Party defeat permits checkpoint restoration into a new branch. No permanent death.

D20 attacks meet Defense, natural1 misses, natural20 hits and doubles damage dice, not modifiers. Advantage uses the higher of two rolls and cancels disadvantage. Checks meet the displayed DC; no automatic natural20 success on checks. The engine uses secure randomness. The presentation never generates gameplay randomness.

Shared XP thresholds: levels1–8 at0/300/900/2700/6500/14000/23000/34000. Level gains currently add6 maximum/current HP and1 focus per party member. Evidence and encounter XP can be claimed once per location; restarting or revisiting cannot farm it. This HP/focus progression is an explicit house rule. No unimplemented level-up spells or feats should be advertised.

## Companion identity and knowledge

Mira is a perceptive scout with dry humour, searching for her brother Tavin. Her continuing arc distinguishes a copied voice from a living person, reunion from rescue, and trust from recklessness. Oren is a patient veteran who prioritizes people over institutional obedience. His arc revisits his old company, naming its dead, and choosing his oath again.

Companion turns use legal AI proposals when configured, with deterministic protective tactics on provider failure. Oren prioritizes downed or badly injured allies when healing is possible; Mira attacks vulnerable reachable targets. Guard protects only the actor. The party never accepts a major bargain without player confirmation. AI context contains current visible state, confirmed discoveries, recent exchanges, and key cross-chapter facts. Player assertions and prior generated text are conversation, not authoritative facts.

Trust changes once for a recorded decision and persists. Current release records relationship values and uses them in AI context; threshold-specific authored unlocks remain a follow-up requirement, not a shipped feature.

## Campaign and worked opening

The Bell Beneath Briarwatch has six scenes. Investigate a broken cart, inspect/disarm or bypass a pressure plate, bargain with hungry Scrit or fight the goblin guards, free a courier with key/pick/force, read a ledger, then confront hobgoblin commander Vark. Feeding Scrit reveals the seal’s purpose. The courier’s testimony enables negotiation; failure leads to combat. Choose who guards the seal, then continue through the deeper door. Failed checks preserve another route. The prison must read as an inhabited cell area: bed, bars, bucket, chains, guard furniture and supplies.

Five further chapters contain eight authored locations each:

| Chapter | Core story and choice variety | Continuing consequence |
|---|---|---|
| II: Drowned Archive | Flood control, living records, copied witnesses, medicine, librarian contract | Learn Tavin entered the prison voluntarily; recover a tuning stone |
| III: Ash Market | Refugee access, corrupt taxes, bound soldiers, contaminated well, theatre testimony, furnace labour | Decide how institutions answer for harm; recover another stone |
| IV: Rootbound Prison | Memory-fed locks, imitation voices, healer obligation, Tavin’s camp, release valves, warden bargain | Rescue captives and resolve Mira’s search |
| V: Hollow Choir | False entrance trial, missing musical rest, speech prohibition, memorial, damaged friendship | Resolve Oren’s oath and prepare a circuit requiring no sacrifice |
| VI: Last Descent | Erased founders, final guards, seductive visions, keeper evacuation, bridges, guardian, core | Choose a permanent circuit or voluntary shared watch; reach an original ending |

Each new location offers evidence, companion reaction, a finite supply cache, a checked commitment with evidence-based advantage, a distinct reliable alternative, and an optional combat route. A failed checked choice is consumed and costs bounded health but leaves alternatives. Resolved locations permit one rest and onward travel. Decisions are recorded as canonical journal facts. Authored choices currently have stronger local/journal consequences than mechanical branching; do not imply that all80 choices create separate future chapters.

## Duration target

Approximately24 hours across saved sessions remains the campaign design target. The current implementation has46 locations and a reachable six-chapter ending. It is a compact expedition, not evidence of24 hours. Automated traversal measures reachability only. Future expansion needs additional quests, route interdependencies, companion scenes, combat variety and pacing based on human playtests, rather than mandatory waiting or repetitive dialogue.

Measure active foreground play, pause/loading time, AI conversation time, combat time and completion separately. Use at least three complete first-time playthroughs, record median/range and skipped content, and do not count idle time. A24-hour claim requires measured support. No minimum-duration gate should prevent players from finishing faster.

## Art, camera and interface

Preserve the dark green/charcoal and antique-gold interface, warm torchlight, cool archive water and choir light. The Crazy Taxi reference contributes readable silhouettes and immediate response. Quaternius is the cohesive low-poly source. Use real imported furniture, architecture and animated monsters; enemy identity/stats must not depend on asset filenames. Bestiary Imp adapted as goblin/hobgoblin is an explicit art substitution.

Exploration uses a raised orbiting party camera with zoom. Dialogue moves closer. Dice appear prominently over the scene; active actors have bright rings and party cards. Initiative remains visible, menus retain keyboard alternatives, and final health does not appear before an action reveal. Keep floor routes unobstructed; dressing belongs around usable routes. Scenes need differentiated props and lighting rather than repeated empty squares. Source assets must be checked in browser for scale, material and animation compatibility.

Desktop targets1280×720 and1920×1080. Main reading text16px+, routine labels14px, secondary metadata12px. Provide scrolling for long menus, setup and journal. The current app is desktop-first; mobile is not a release claim. At200% text zoom, controls must remain reachable. Visual acceptance requires actual screenshots, not code inspection.

## Privacy, costs and interruption

A player’s own API key stays only in page memory, is sent directly to OpenAI, never to the game server, and clears on reload/disconnect. No localStorage/sessionStorage persistence for personal keys. Prompts, context and audio go to OpenAI; returned dialogue and the player’s conversational text are stored with the hosted adventure. OpenAI’s own data policies still apply.

Hosted adventure access uses a private device cookie. There are no public save listings and no cross-device account recovery yet. Clearing cookies loses access; this limitation must be visible. Owner sponsorship uses a separately protected server secret, never a bundled key. Conservative limits: $0.30 per visitor/day, $2 globally/day, $25 global lifetime. These are admission reservations rather than invoice totals. Sponsorship must be disabled when its secret is absent; authored gameplay remains free of AI calls. Setting another personal key is an explicit choice to pay OpenAI directly.

Microphone refusal leaves typing available. Unsupported requests show a limitation without committing. Interrupted audio stops; late responses cannot start unwanted playback. Refresh during playback returns the committed result without rerolling. Stale actions reload state; duplicates return their original outcome. Missing models must not silently become invisible actors. Unfinished combat resumes from its saved turn.

## Requirements and traceability

| ID | Requirement | Observable acceptance / milestone |
|---|---|---|
| EB-01 | Character creation | Four classes, four races, backgrounds/palettes persist; class stats match rules. Expansion |
| EB-02 | Engine movement | Party approaches supported targets and respects combat distance/action limits. Opening + expansion |
| EB-03 | Creative requests | Preview or clear unsupported response; no dice before confirmation. Opening |
| EB-04 | Entertaining dice | 3D roll/reveal shows saved natural/modifier/total; skip/reload cannot reroll. Expansion |
| EB-05 | Sequential turns | Individual frame, active highlight and outcome for each actor; no concurrent player action. Expansion |
| EB-06 | Companion consistency | Distinct replies use witnessed facts; major commitments require player choice. Both |
| EB-07 | Text and voice | Transcript editable, generated voice stoppable, text usable without microphone. Both |
| EB-08 | Durable saves | Reload preserves turn/resources/facts; different visitors cannot access each other. Public release |
| EB-09 | Reachable opening | Peaceful and combat routes reach ChapterI ending and ChapterII continuation. Both |
| EB-10 | Visual readability | Screenshot checks at two desktop sizes and enlarged text; no critical overlap. Release gate |
| EB-11 | Cohesive assets | Verified licences, usable geometry/materials/clips, furnished prison, three additional enemy types. Expansion |
| EB-12 | Recovery | Provider errors, duplicates, stale requests and interrupted playback preserve committed state. Both |
| EB-13 | Safe AI access | Personal key absent from server/storage; sponsored atomic budgets enforced. Public release |
| EB-14 | Relationships | Once-only trust effects persist; authored threshold unlocks tracked as outstanding. Expansion/follow-up |
| EB-15 | Campaign/progression | Six chapters/46 locations, XP/levels, recorded decisions and ending;24h separately measured. Expansion + long-form follow-up |
| EB-16 | Responsiveness | Target p95 frame≤33.3ms at1080p; report measured AI and action latency. Release gate |
| EB-17 | Public publication | Exact tested source/build deployed to registered Sites URL; deployed API and browser checks. Public release |

## Milestones

Opening adventure: previously delivered. Expansion: new content, dice, presentation, creation and progression. Public release: private saves, key controls, build/deployment and verification. Long-form campaign: measured pacing, deeper mechanical consequences and companion unlocks. Do not collapse the last milestone into the existence of a six-chapter ending.
