# Echoes Below: Product Requirements

Version 2.1, 6 September 2026. Product contract aligned with the published Sites version 10. Historical v1 is archived separately and is not the release contract. Project: `/Users/naufaldisatriya/WebApps/3d-dnd`. See [RFC](RFC.md), [goal prompt](GOAL_PROMPT.md), and [expansion status](EXPANSION_STATUS.md).

## Release baseline and evidence

The current release is a playable desktop preview at [Echoes Below](https://echoes-below.naufaldi.chatgpt.site/), with six chapters and 46 locations. This revision integrates the character setup, explicit AI payment modes, narrator grounding fix, connection feedback, KayKit party assets and revised HUD. It does not establish a completed 24-hour campaign.

Verified in the latest correction: 62 automated tests; client/server/Worker type checks; six real OpenAI dialogue scenarios; generated speech; browser invalid-key feedback and local server-backed DM narration; runtime loading, textures, shader compilation and animation sampling for all 45 supplied models. Chrome visual inspection at 1440×778 confirmed separation of the party, narration and action panels. Real-key browser dialogue/voice/microphone together, all animation poses, enlarged-text acceptance and full campaign pacing remain open. [Feedback QA](FEEDBACK_QA.md) records evidence; [edge cases](EDGE_CASES.md) records coverage; [design revision](DESIGN_REVISION.md) records the art direction.

## Vision and audience

A desktop browser fantasy adventure for one human hero and two companions, combining visual-novel choices, a visible 3D party, and understandable turn-based combat. Players choose intentions and targets while the engine handles movement. Mira and Oren react to witnessed events through authored lines and optional AI conversation, with English text and generated voices.

Baldur’s Gate 3 informs the anticipation of dice, readable turn order, character setup, and consequential party stories. Echoes Below uses original characters, plot and presentation. Its current Echo Rules are a simplified D&D-inspired rules profile, not a complete or officially compatible D&D edition. Do not market simplified classes or cosmetic races as the full tabletop implementations.

The user authorizes a public Sites release and optional player-funded or owner-sponsored AI. The game must remain playable without paid AI. No multiplayer, arbitrary physics/destruction, unrestricted spells, user-generated geometry, voice cloning, or payments in this release.

## Player journey

1. Choose a name, Human/Elf/Dwarf/Halfling identity, Fighter/Rogue/Wizard/Cleric calling, background, and palette. Customize Mira and Oren’s class, race and palette while retaining their names and stories. Preview the party, then begin or choose a saved adventure from the adventure picker.
2. Choose Free story mode (default), a personal OpenAI key, or the host allowance when enabled. A personal key requires **Check & connect**, a disclosed small paid access check, and a visible successful connection before AI dialogue is enabled. Read the room and objective. Select a visible interaction or its menu equivalent. Examine evidence, talk, search supplies, choose a route, or propose a custom action.
3. Review the action and any check before committing. The server rolls once, saves the outcome, then presents it.
4. Watch a prominent die animate and reveal its natural value, modifier and total. See the consequence after the reveal. Reduced motion shortens the animation. Skip dismisses presentation, never rerolls.
5. In combat, see initiative order and the active actor. Each automatic action is presented individually with its own health/position changes. Continue to the next action deliberately. The player cannot submit another game action during playback.
6. Read authored or AI dialogue, optionally listen, stop narration, or dictate editable text. Speech never executes an action automatically.
7. Earn shared XP from evidence, exploration and resolved encounters, including peaceful choices. Continue through six chapters with persistent decisions, resources, trust and levels.
8. Close the page after any confirmed action. Reopening the same browser retains access to hosted saves; personal API keys must be entered again.

## Rules and character contract

Internal class IDs preserve old saves: guardian=Fighter (24 HP, Defense14, sword1d8+3, Rally); scout=Rogue (18 HP, Defense12, bow1d6+3, Aim); adept=Wizard (16 HP, Defense11, spark1d6+3, Mend); cleric=Cleric (20 HP, Defense13, ranged radiance1d6+3, Mend). These are compact game classes, not full D&D class progressions. Races currently establish identity, model height and breadth; racial ability packages are not implemented. Background training grants +2 to specified opening checks.

A turn has 6m movement and one action. Run exchanges the action for 6m additional movement. Melee range1.5m; ranged8m. Guard adds2 Defense to the acting character until their next turn. Aim grants advantage to the next attack. Healing spends focus or a potion for1d6+2 health, capped at maximum. Zero-health characters cannot act; healing can revive them. Party defeat permits checkpoint restoration into a new branch. No permanent death.

D20 attacks meet Defense, natural1 misses, natural20 hits and doubles damage dice, not modifiers. Advantage uses the higher of two rolls and cancels disadvantage. Checks meet the displayed DC; no automatic natural20 success on checks. The engine uses secure randomness. The presentation never generates gameplay randomness.

Shared XP thresholds: levels1–8 at0/300/900/2700/6500/14000/23000/34000. Level gains currently add6 maximum/current HP and1 focus per party member. Evidence and encounter XP can be claimed once per location; restarting or revisiting cannot farm it. This HP/focus progression is an explicit house rule. No unimplemented level-up spells or feats should be advertised.

## Companion identity and knowledge

Mira is a perceptive scout with dry humour, searching for her brother Tavin. Her continuing arc distinguishes a copied voice from a living person, reunion from rescue, and trust from recklessness. Oren is a patient veteran who prioritizes people over institutional obedience. His arc revisits his old company, naming its dead, and choosing his oath again.

Companion turns use legal AI proposals when configured, with deterministic protective tactics on provider failure. Oren prioritizes downed or badly injured allies when healing is possible; Mira attacks vulnerable reachable targets. Guard protects only the actor. The party never accepts a major bargain without player confirmation. AI context contains current visible state, currently available actions, confirmed discoveries, speaker-scoped recent exchanges, and key cross-chapter facts. DM suggestions must refer to available actions. An opening scene can be narrated before any discoveries exist; it must not fail merely because the discovery-reference list is empty. Player assertions and prior generated text are conversation, not authoritative facts.

Trust changes once for a recorded decision and persists. Six private companion scenes unlock at trust1/4/8, with later scenes additionally requiring witnessed archive, market, prison or choir events. Each offers two original responses, preserves the chosen memory for later AI context, and grants Mira +2 maximum/current health (Steady Nerves) or Oren +1 maximum/current focus (Shared Resolve), once. Starting a scene temporarily replaces other actions with its two replies; unfinished conversations survive reload. These scenes work without paid AI.

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

Use dark blue/charcoal panels with antique-gold accents, warm torchlight, cool archive water and choir light. BG3 informs the compact party HUD, prominent character setup, dice anticipation and separation of narrative from actions; original story and licensed assets remain independent. The earlier Crazy Taxi reference contributes readable silhouettes and immediate response. KayKit Adventurers supplies the current party models; Quaternius supplies monsters and dungeon dressing. Use real imported furniture, architecture and animated monsters; enemy identity/stats must not depend on asset filenames. Bestiary Imp adapted as goblin/hobgoblin is an explicit art substitution.

Creation uses a closer, front-facing party preview beside a scrollable setup panel. Exploration uses a raised orbiting party camera with zoom. Dialogue moves closer. Dice appear prominently over the scene; active actors have bright rings and party cards. Initiative remains visible, menus retain keyboard alternatives, and final health does not appear before an action reveal. Party world-name labels appear on selection, hover or an active turn, keeping idle characters visible; party cards remain available throughout. Gear follows the source skeleton, with overlapping optional accessories hidden. Keep floor routes unobstructed; dressing belongs around usable routes. Scenes need differentiated props and lighting rather than repeated empty squares. Source assets must be checked in browser for scale, material and animation compatibility.

Desktop targets1280×720 and1920×1080. Accessibility targets remain main reading text16px+, routine labels14px and secondary metadata12px; the compact HUD currently includes smaller metadata, so these targets and200% text-zoom acceptance are not yet fully verified. Provide scrolling for long menus, setup and journal. The current app is desktop-first; mobile is not a release claim. At200% text zoom, controls must remain reachable. Visual acceptance requires actual screenshots, not code inspection.

## Privacy, costs and interruption

Connection feedback distinguishes checking, connected for this visit, rejected and disconnected. A successful access check enables AI; an invalid key, missing model permission or exhausted quota must not show success. Disconnecting or switching modes invalidates late check results. The small access check is billed by OpenAI and does not verify microphone or speech capability. A player’s own API key stays only in page memory, is sent directly to OpenAI, never to the game server, and clears on reload/disconnect. No localStorage/sessionStorage persistence for personal keys. Prompts, context and audio go to OpenAI; returned dialogue and the player’s conversational text are stored with the hosted adventure. OpenAI’s own data policies still apply.

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
| EB-14 | Relationships | Once-only trust effects and six fact-gated private conversations persist, including chosen replies and Shared Resolve. Expansion/follow-up |
| EB-15 | Campaign/progression | Six chapters/46 locations, XP/levels, recorded decisions and ending;24h separately measured. Expansion + long-form follow-up |
| EB-16 | Responsiveness | Target p95 frame≤33.3ms at1080p; report measured AI and action latency. Release gate |
| EB-17 | Public publication | Exact tested source/build deployed to registered Sites URL; deployed API and browser checks. Public release |
| PRD-28 | Live character preview | Repeated race/palette changes keep stable dimensions and update the visible model. Feedback correction |
| PRD-29 | Companion setup | Chosen class/race/palette and class-derived stats persist; old saves remain selectable. Feedback correction |
| PRD-30 | Explicit payment source | Free is default; unavailable host mode disabled; personal failure never spends host funds. Public release |
| PRD-31 | Personal-key confirmation | Checking and success/error/disconnect statuses visible; late check cannot reconnect after mode change. Feedback correction |
| PRD-32 | Grounded narration | Empty-discovery opening works; unknown references rejected; suggestions use supported actions; speaker histories stay separate. Feedback correction |
| PRD-33 | Revised asset/HUD presentation | All supplied models pass runtime audit; attached gear and panel separation visually inspected; broader visual gates remain explicit. Feedback correction |

## Milestones

Opening adventure: previously delivered. Expansion: new content, dice, presentation, creation and progression. Public release: private saves, key controls, build/deployment and verification. Long-form campaign: measured pacing, deeper mechanical consequences and companion unlocks. Do not collapse the last milestone into the existence of a six-chapter ending.

## Consequential campaign encounters

**PRD-25.** Defeating an expedition room’s defenders clears the combat obstacle; it does not decide how people, records or institutions are treated. After victory both authored outcomes remain available without another check. The player must choose one before travel or a sheltered rest. Reload preserves this pending decision. Previously completed saves retain their historical decisions.

**PRD-26.** Ten earlier decisions create optional later opportunities. Each appears as a named interaction in its target room, explains the prior relationship, and records the result in the journal. Help is claimed once per campaign branch. It never commits the room’s main decision for the player.

| Earlier action | Later opportunity | Mechanical result |
|---|---|---|
| Share the apprentice’s lantern | Witness Sel’s contract | Contract DC −3 |
| Save the ferryman’s boat | Receive his return supplies | One potion per party member |
| Restore Ilyra’s name | Present signed council records | Accounting DC −3 |
| Rescue the medic immediately | Receive treatment in the Thorn Infirmary | Restore health, not focus |
| Sponsor the refugees | Work crew helps convert the furnace | Conversion DC −3 |
| Build the guilds’ shared filter | Receive prisoner relief supplies | One potion per party member |
| Teach the prisoners silence | Arrange a sentry diversion | One fewer defender at the Seventh Rootbound room |
| Teach the missing rest | Singers help release Aras | Release DC −3 |
| Assign choir evacuation guides | Divert a Fracture Gallery guardian | One fewer defender |
| Trust Mira on the glass causeway | Ask her to inspect the final bridges | Bridge DC −3 |

Acceptance: each opportunity is absent with the opposite earlier decision; reload retains availability/effect; repeated requests do not duplicate a reward; actual dice difficulty and starting enemy count match the displayed explanation. The ten links deepen consequences but do not establish the 24-hour duration target.

**PRD-27. Local pacing evidence.** Settings provides exploration, combat, conversation and waiting counters plus a downloadable playtest report. Only observed, focused, visible play counts; settings, completed adventures, idle beyond120 seconds and timer gaps over5 seconds are excluded. Waiting is shown separately from active play. Counters persist in this browser per adventure, with separate reports for restored branches. The export includes timings, visited room IDs, ending status and recent frame timing, never player name, dialogue or credentials. It is a user-editable local estimate and can undercount long reading; three first-time complete playtests and their context remain necessary before a24-hour claim.

## Feedback correction: character choices and AI payment (6 September 2026)

**PRD-28.** Hero race and palette update the 3D preview immediately and remain correct after repeated changes. Preview normalization uses the original unattached asset bounds, never the already-scaled animated instance. Human/elf/dwarf/halfling have distinct supported heights; these remain stylized cosmetic identities, not full racial feature implementations. Fighter and Cleric currently share the KayKit Knight body; the Cleric hides the sword and uses spellcasting presentation. Do not claim a unique Cleric sculpt. The previous detached shield/holy-symbol geometry was removed.

**PRD-29.** New-adventure setup offers class, race and palette for Mira and Oren. Names, personalities and personal story arcs remain stable. The chosen class supplies the actual stats/actions and model; party cards show the actual class. Choices persist with the save. Existing adventures retain their current party.

**PRD-30.** Character setup and Settings both show three explicit options: Free story mode (default), personal OpenAI key, and the host’s limited allowance. The last option is disabled when unconfigured. Free mode runs authored scenes and autonomous tactical companions without paid AI. Personal mode requires a successful key access check, never silently falls back to host billing, and clears the key on disconnect, switching away or reload. Reload returns to Free mode. Paid provider access is opt-in, including companion planning.

## Feedback revision: narrator connection and asset presentation

PRD-31: Connecting a personal key performs a disclosed small access check and visibly reports checking, connected-for-this-visit, rejected or disconnected. Never describe page-memory storage as permanently saved. Disconnect/mode changes invalidate late connection results.

PRD-32: Opening narration must work without discoveries. Scene description and recent confirmed events are valid narrative context. Fact references must use supplied discovery IDs; unsupported references remain rejected. Model refusals and truncation must have readable errors and preserve gameplay.

PRD-33: Use compact fantasy RPG panels and a visible central stage following DESIGN_REVISION.md. All supplied 3D models receive runtime loading, shader and animation checks. Retained gear follows the rig. Native race sculpts and full BG3 mechanics are not claimed. EDGE_CASES.md records evidence and remaining coverage.

## Approved curated campaign expansion (implementation in progress)

The next campaign keeps the KayKit party style and original setting. Its design target is25–35 hours of active play, with a median above24 hours in three first-time complete human playtests before claiming that duration. Six floors/chapters connect linearly; optional rooms and alternative solutions exist inside each floor. No waiting gate or repetitive AI conversation may pad the duration.

- **EB-28, Visual identity:** As a player, I want readable object/actor names and reliable models so I can select the intended target. Handle long/duplicate names, race/class changes, camera occlusion, missing models, crowded labels and narrow viewports. Done when labels avoid one another and the HUD, target menus retain hidden targets, individual failures offer retry, and screenshots verify actor scale/equipment and model anchors.
- **EB-29, Curated rules:** As a player, I want understandable tactical choices with consistent dice consequences. New campaigns explicitly opt into curated SRD5.2.1; existing echo-v1 saves keep their original rules. Four classes progress1–8, with six abilities, proficiency, saves, AC, movement, action/bonus/reaction, spell slots, concentration, conditions, death saves and rests. Handle exhausted resources, invalid targets, stale commands, interrupted turns, friendly fire and party defeat. Done when server validation owns every outcome, preview agrees with resolution, and old-save regression tests pass.
- **EB-30, Companion control:** As a player, I want allies to act intelligently while retaining control of major decisions. Provide balanced, focus-target, protect-hero and conserve-resource priorities, plus takeover of one unstarted companion turn. Handle downed targets, no legal attack, delayed AI and changed initiative. Done when each action is shown individually, fallback decisions are legal and takeover never executes twice.
- **EB-31, Two-hour slice:** As a player, I want a complete dungeon with quests, loot, equipment, camp, level-up and companion consequences. Handle rejected quests, lost combat, full inventory, spent key items, repeated rewards and interrupted rests. Done when multiple peaceful and combat routes reach an ending, rewards are once-only, mandatory progression cannot softlock and human timing supports approximately two hours.
- **EB-32, Reliable narration:** As a player, I want clear text/voice and control over who pays. Keep Free/personal/sponsored explicit; personal failures never switch to owner billing. Handle invalid/revoked keys, quota, timeout, malformed/ungrounded narration, microphone denial, interrupted playback and refresh. Done when real browser tests confirm connection feedback, DM and both companion dialogue, speech interruption and recovery, with no keys in saves/logs/evidence.
- **EB-33, Full campaign:** As a player, I want a sustained story with varied challenges and consequential relationships. Target18 main quests,12 side quests and24 combat encounters including six bosses and12 enemy roles across six chapters. Estimated main story15–19.5h, side content8–11h, camp2–3h. Handle skipped side quests, divergent allegiances, early deaths and old checkpoints. Done when all routes have tested endings, content avoids repetitive filler, and three human first-time playtests support the duration claim.

Delivery order: A visual reliability; B curated rules and tactics; C two-hour slice; D AI/voice acceptance; E full campaign. B/C/D must support the slice before the full content expansion is accepted. Current progress is recorded in EXECUTION_STATUS.md; these requirements are not claims about Sites version10.

### Curated preview integration status

The local build now offers an explicit Curated tactics preview when starting a campaign. Its rules version persists across reloads; existing adventures retain Echo Rules. Combat waits for each creature's decision, companions offer tactics and takeover before their automatic turn starts, and movement can be previewed from a destination control or a highlighted tile. Class health and AC are shown for curated characters. This preview is a development milestone, not acceptance of EB-29–33: full class features, spell catalogs, reactions, equipment/camp, SRD exploration checks and long-form content are still pending.

The curated preview now gives each class specific resource-backed actions: Fighter Second Wind/Action Surge/Extra Attack and Champion criticals; Rogue Cunning Dash and conditional Sneak Attack; Wizard Fire Bolt and Magic Missile; Cleric Sacred Flame, Cure Wounds, Healing Word and Bless. Bless requires maintained concentration. These are implemented selections within the planned class progression; further spells, reactions, subclass features and level-up choices remain required before EB-29 acceptance.

### Curated preview checkpoint: inventory and camp

Implemented locally: a shared pack, per-character armor/shield/cloak slots, immediate AC updates, and a unique opening-chest cloak. Equipped copies count against shared ownership. Quest items cannot be discarded. Outfit models still follow class; the inventory explicitly discloses this visual limitation. Legacy Echo Rules saves retain their original rest behavior.

Curated campaign constraint: each safe location offers one short rest and one long rest. Short rest spends one Hit Die per injured conscious ally and restores supported class resources; Wizard recovery is limited per long rest. Long rest consumes one ration per living party member, restores supported resources, and never revives dead actors. Combat and uncleared locations prohibit resting. These are explicit curated constraints, not a claim of full SRD parity.

### Curated preview checkpoint: quest journal

The journal now tracks main objectives and optional investigations with durable completed steps and active/completed/missed/declined states. Optional objectives may be declined after confirmation without blocking the descent. Completed optional objectives award two camp rations once; existing story XP is unchanged. Failed checks do not complete objectives. Leaving the final opportunity closes an unfinished optional objective, and future arcs stay hidden until encountered.

The existing compact story is mapped to 18 main quest records and 12 optional records. This is tracking coverage, not completion of EB-33's content depth: ten later optional records currently collect evidence and companion responses across rooms and still need distinct authored challenges, outcomes and pacing. The campaign remains unverified for 24-hour duration.

### Drowned Archive side-adventure revision

Two optional investigations now have distinct authored meetings. Elian's passenger-register request spans the Sluice Stair, Ink Garden and Bell Index; Sera's witness-mask request spans the Witness Vault, Glass Causeway and Keeper of Debts. Each requires accepting the request, investigating elsewhere, then returning to choose an outcome. One route grants three healing potions, the other authenticates testimony that reduces a related check by three. Both retain the once-only camp-ration quest reward. Refusal or leaving without the evidence does not block the main story.

Eight later optional records remain investigation checklists and still require distinct content. These two additions do not establish the two-hour slice or 24-hour campaign timing gates.

### Remaining side-adventure content revision

All ten later optional records now have authored cross-room requests instead of read-all-evidence checklists. New requests concern altered water measures, unpaid theatre workers, copied voices, evacuation counts, an erased novice name, an expired work oath, shelter access and a keeper’s parcel. Each has two outcomes with supplies or preparation consequences. Some aid choices cost a shared ration; a free alternative remains available. Preparation is not offered after its target decision has already resolved.

This supplies authored content for all 12 optional records, including the two opening objectives. It does not prove sufficient variety or 24-hour duration: the later requests still share an accept/investigate/return structure and need visual playthroughs and pacing evaluation.

### Exploration recovery parity

Curated exploration recovery now uses class resources: Cleric Cure Wounds consumes one rank-1 slot, Fighter Second Wind is self-only and consumes its limited use, and a potion heals 2d4+2. Any conscious party member can give their potion to an injured living ally after regrouping. Downed allies can recover; dead actors cannot. Echo Rules retains its original healing rules.

### Individual NPC turn controls

Selecting “Let [actor] act” now directly commits one NPC step, using the same saved-command boundary. Presentation still pauses before another step and before another actor; player attacks, choices and takeover retain confirmation. Enemy turn UI no longer displays party-only Second Wind/Action Surge labels.

### Chapter visual identity checkpoint

Added chapter palettes and original geometric landmarks around the existing licensed props: Archive canals/boat/reeds, Market awnings/furnace, Prison roots, Choir organ pipes, and Depths circuit rings. Large new solids stay outside the central tactical footprint; later chapter props were moved toward the perimeter to reduce traversal conflicts. This differentiates chapters but does not yet provide a unique authored layout for every room.
