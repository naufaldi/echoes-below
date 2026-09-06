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

### Journal character naming

New combat log entries preserve the character’s display name at the time of the event, including duplicate-enemy numbering. Existing journal entries use readable legacy fallbacks instead of exposing internal IDs such as SENTRY-1. Names remain available after leaving the encounter.

### Curated encounter roster

The curated campaign now selects 24 explicit combat opportunities across six chapters, including six named bosses. Twelve roles vary movement, range, armor, hit points, damage die and attack name: goblin guard/scout, hobgoblin commander, bone sentinel/archer/warden, acid spitter/slime brute, cavern hunter/venom stalker, resonant adept and core colossus. Other rooms preserve their narrative alternatives without generating generic defenders. Peaceful resolution remains available. This satisfies roster coverage, not combat balance or full visual animation acceptance.
### Companion protection reliability checkpoint

Protect means defending a conscious player from nearby threats, then engaging surviving enemies when no nearby threat exists. It must not keep a companion orbiting a downed or safe player while an enemy remains at range. Each automatic step remains separately visible and subject to normal legal movement and actions.

Acceptance: in both downed-player and safe-player fixtures, the protecting Fighter approaches a distant enemy and uses its attack on the next decision. In a seeded low-resource audit across all 24 authored encounters and four hero classes, every run must reach victory or defeat within 220 individual actions. This is a regression bound, not a difficulty or campaign-duration promise.

### Free party conversation checkpoint

Free party check-ins remain available without an API key. Mira and Oren each offer one authored reflection per opening room and one per later chapter, with no XP, relationship farming or resource changes. Downed companions, active combat, defeat and unfinished bond conversations cannot start a check-in. The UI identifies the speaker and distinguishes these authored lines from paid AI dialogue.

### Higher-level casting checkpoint

Players can select an available spell-slot level from 1 through 4 when casting Magic Missile, Cure Wounds, Healing Word or Bless. Each choice displays its slot cost and expected dice in the confirmation. Exhausting level-1 slots does not disable higher-level casting. Healing outside combat supports the same Cure Wounds scaling. Only one slot spell can be spent per turn; a rejected or repeated action cannot consume another slot. Existing level-1 command IDs remain valid.


### Rescued courier visual state

After any successful rescue route, the courier’s label becomes Rescued courier and the model stands outside the open cell. Public scene projection derives this from the saved rescue flag while retaining the courier entity ID, so old saves receive the correction without changing identity or quest state.


### Counterweight maintenance puzzle

Counterweight Hall now offers an optional deterministic maintenance puzzle: read a keeper’s plate, release the pawl, seat the weight, then lock the pin. Visible feedback describes every intermediate state. A wrong order resets progress and raises the existing alarm; safe reset and alternate crossing remain available. Solving disables the trap and discovers the maintenance entrance. No new mandatory gate is added to existing campaigns. This increases interaction depth but does not establish a two-hour duration.


### Counterweight visual feedback

The public scene now projects only observable pawl, weight and lock states. A local 3D mechanism uses those states for lever rotation, counterweight height and pin position, with immediate placement under reduced motion. Clicking the model focuses the existing chain target. Labels describe each stage and identify a spent floor mechanism. The old decorative hanging weights are removed. Local browser QA completed read → pawl → weight → reload → pin; state and labels persisted. No new downloaded assets are required.


### Tactical AI proposal integration

Paid AI modes can propose one legal action for the currently active tactical companion. The player still advances each visible step. Human turns, enemy turns and manual companion takeover do not request an AI decision. Free mode keeps deterministic tactics. Invalid or stale proposals never grant movement, resources, targets or extra turns; the companion uses validated fallback tactics instead.


### Sponsored tactical retry boundary

Retrying a sponsored companion action must not buy the same decision twice. While its decision is pending, the player receives a retry message and the action remains uncommitted. A failed or abandoned paid decision falls back to legal game tactics without another provider purchase for that command. Free mode never invokes a provider.


### Player-selected ability improvements

Curated campaigns offer an Ability Score Improvement at levels 4 and 8, plus Fighter level 6. The player selects each companion’s improvement as well as their own: +2 to one ability or +1 to two, capped at 20. Inventory & camp displays all six scores, their modifiers, a before/after preview, and a review step before committing a permanent choice. The oldest unspent milestone is offered first; postponing it does not block exploration. A visible inventory cue identifies an available choice. Choices require a conscious, living member outside combat and companion-story conversations. Legacy Echo Rules saves are unchanged.

Acceptance: choices persist through reload and later levels; repeat or forged requests cannot grant another bonus; Constitution adjusts maximum HP retroactively without restoring spent resources; XP level-up cannot revive a downed character and retains equipment defenses. This implements the curated Ability Score Improvement option, not the entire feat catalog.


### Vark’s optional accountability dialogue

Before the opening confrontation, curated parties can ask Vark why he imprisoned the courier and how to transfer the ward safely. Each authored answer is saved as an observed statement. After both questions, a party that freed the courier and learned Scrit’s explanation can confront Vark with those accounts. This reduces the existing final negotiation from DC16 to DC13. It does not complete the transfer; a failed final check still begins combat. Asking questions is optional, consumes no dice and awards no XP. Existing direct combat and negotiation routes remain available.


### Additional short-rest healing

After the existing first Hit Die is spent during short rest, injured conscious members can choose additional Hit Dice one at a time. All rolls belong to the same one-hour rest, do not repeat class recovery, and stop at full health or no Hit Dice. The window persists through reload and closes when the party performs any other game action. Inventory & camp and the contextual action list expose the choices.


### Object-label association and narration identity

Displaced world labels show a leader line and anchor dot to identify their owning object. An anchor covered by an interface panel is hidden instead of moving its label beside another object; its target remains available in the focus menu. Selected long labels have more width and up to two text lines. Narrative headings use the same entries as the displayed text: introductory scene descriptions cannot inherit a companion name from unrelated creation logs.


### Long narrative readability

The narrative passage can receive keyboard focus for native scrolling. Long passages show a scroll hint that changes at the end; short passages show no extra hint. Every new passage starts at its beginning. Text remains fully available without expanding the main panel over the dungeon.


### Action presentation hierarchy

Non-roll movement and action results use a compact panel below the visible board; dice retain the central presentation. The previous narration is hidden while this panel is active, and duplicate busy status is suppressed. The last-roll summary belongs inside the scrolling party panel so it cannot overlap companion controls. Playback still advances one committed action at a time and supports skipping without changing outcomes.


### Dice shape accuracy

D4, D6, D8, D10, D12 and D20 presentation uses a corresponding polyhedron. Geometry and animation remain decorative; the saved numeric result is authoritative. D10 no longer reuses the twenty-sided silhouette.


### Local tactical terrain update

Curated encounters use seven authored terrain arrangements across the opening and five later chapter environments. Solid stone pillars block movement and sight; amber rubble costs 10 feet per entered cell. Terrain is shown during combat and explained beside the turn controls. Exploration target labels are suppressed in combat so unavailable camp/clue interactions do not obscure actors.

The saved tactical grid owns both pathfinding and 3D terrain. New battles select their scene profile; resuming an existing battle retains its saved grid. Autonomous movement follows a complete legal route to an adjacent attack cell and can initially move away from a target to navigate around a wall. It respects living actor occupancy, difficult ground, movement budget, and blocked diagonal corners. Unreachable targets produce a defensive/end-turn fallback.

Verification: regression tests cover connected spawn cells across every authored encounter, disjoint terrain, independent layout copies, wall detours, insufficient movement and sealed targets. A local browser encounter at The Sluice Stair rendered the saved pillars/rubble and resolved an enemy attack with a visible die presentation. This is incremental local evidence, not campaign-duration or full visual acceptance. No deployment in this checkpoint.


### Local action-animation correction

Curated combat logs and presentation frames now carry an optional explicit animation cue (melee, ranged, spell, item or dodge). Spell and defensive actions produce a presentation even without a die roll. The renderer consumes confirmed cues and ignores AI prose; older attack logs retain a compatibility fallback. Rogue ranged attacks use the shipped shooting clip, while spell actions use the casting clip. Action clips play once; idle and walking loop. Repeated attack events restart their clip.

Verification covers Magic Missile, Sacred Flame, Bless, ranged attack and Dodge cues through rules resolution, presentation and serialization. All seven shipped character GLBs resolve locomotion, death and attack clip names; KayKit casting/ranged names are checked explicitly. This validates mappings and data flow, not all on-screen animation poses or weapon/projectile alignment. Local only; no new deployment.


### Local target-focus correction

Selecting a focus no longer silently substitutes all actions when that target has no legal action. Matching actor/target actions and untargeted controls remain available; an explicit message and Show all actions control explain an empty focus. Combat target menus exclude exploration props. The tactical heading uses the same canonical enemy names as initiative and world labels.

Verification: three regression tests cover unavailable targets, matching targets, global controls, actor focus and clearing. Local browser selection of Slime brute retained that focus, displayed guidance for the automatic Acid spitter turn and retained its advance button; Show all actions reset the selector and removed the message. Client type check passed. This checkpoint does not deploy or establish full-campaign acceptance.


### Local Scrit inquiry expansion

After Scrit’s initial introduction, the curated opening offers separate questions about stolen supplies and the captive. Hearing both unlocks his account of the seal’s purpose. Dialogue records only witnessed facts, grants no repeatable XP and remains optional. Existing ration, distraction and combat routes remain available. Responses acknowledge a key already transferred to the party.

A party that fed Scrit and heard about the captive may spend one additional ration to cancel an existing alarm. This removes its extra scout from the later Vark encounter; subsequent disturbances can raise a new alarm. The offer is unavailable without supplies, after combat victory, in combat, after slipping past by distraction or outside the cookfire scene. Each exchange persists and resolves once.

Verification: regression tests cover question prerequisites, persistent knowledge, duplicate rejection, supply cost, unavailable/hostile states, two-versus-three-enemy boss rosters and a later renewed alarm. Browser presentation of these new exchanges remains pending. This adds narrative choices and a resource consequence, not proof of a two-hour opening or 24-hour campaign. No deployment.


### Local narrative playback and revision verification

A fresh free-mode Elf Wizard (Scrit QA) reached the cookfire via the side ledge and completed the three Scrit questions through the browser. The second question unlocked the ward question; each consumed question disappeared. Long text displayed a scroll hint, accepted Page Down while focused, and changed to the end-of-passage hint. The next passage reset to its beginning. Reload/Continue retained character, location and completed questions. Offering a ration afterward reduced supplies from three to two and opened the prison route.

This playthrough exposed a quest-log revision bug: quest/loot hooks run after the resolver increments the save revision, so their log entries were stamped for the following action. The action commit boundary now assigns every newly emitted log and presentation log to the resulting revision, preserving earlier log entries. The regression traverses the quest completion and following Scrit conversation, including serialization, and verifies that the old reward does not contaminate the next speaker heading. All 203 tests and server type checking passed. Existing historical logs are preserved, not rewritten. No deployment or campaign-duration acceptance is claimed.


### Local personal-key provider verification

A bounded live evaluation used the existing authorized project credential through the personal-key module: six short replies generated successfully, plus a 74,496-byte speech response. Reviewed outputs maintained Mira/Oren identity, declined future-secret disclosure and declined a fabricated victory/inventory claim. The artifact is `artifacts/verification/personal-narrative-feedback.json`; no credential is included. These are Node module calls, not microphone capture or browser playback, and do not certify all generated responses.

Connection checking now requires a completed provider response with usable output text before the UI may show Connected. HTTP 200 with failed/incomplete/empty/refused or unreadable data is rejected. Network failures and timeouts have actionable messages and do not retain a candidate key. Tests cover these states and existing 401/403/429 handling. No new credential configuration or deployment occurred.


### Local browser voice checkpoint

On the Scrit QA adventure, selected the existing local shared allowance with automatic speech enabled. Let the DM narrate returned a grounded recap of the ration/key exchange. The browser exposed Stop; Stop returned to Listen. Listen replayed the saved narration and later returned to Listen without an error. No microphone input was captured, and subjective voice quality was not assessed. This is local sponsored-path browser evidence, distinct from the personal-key module evaluation.

Settings showed $0.1204 of local budget accounting after this test. Local speech uses a conservative $0.12 reservation, so the UI now explicitly labels the total as estimated budget accounted, not actual OpenAI billing. Usage refreshes when settings opens or speech changes state, with stale responses discarded after changing adventures. Public deployment remains unchanged.

Free-mode transition QA also exposed a stale enabled Listen control. Narration and journal replay controls now disable when AI is unavailable, with settings guidance; the generated text remains readable. The local browser confirmed Voice unavailable after switching back to free story mode. Client type checking passed.


### Curated Dash action (local)

Every conscious creature with positive Speed and an available action can take Dash: spend the main action and add current Speed to remaining movement for this turn. Movement is selected afterward and retains terrain/occupancy costs. Rogue Cunning Dash remains a separate bonus action; Fighter Action Surge can fund another Dash. No roll is required. Reference: https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game and SRD 5.2.1 https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf .

Automatic creatures can Dash when movement is exhausted and a legal approach exists. Saved turn state records the intent to use that movement; fallback advances on the next step instead of ending immediately. It stops on reaching an adjacent target and clears the intent when the turn changes. Tests cover spent movement, modified Speed, both class combinations, duplicate rejection, unconscious/zero-speed actors, save serialization and the automatic Dash/move/end sequence. Browser presentation and broader balance under the new action remain pending. No deployment.


### Chapter II Bell Index puzzle (local)

The curated Bell Index now includes a three-slot catalogue console. Reading its rubbings teaches the meanings of Witness, Keeper and Vessel, and their ordering clue. The player places unused plates, can reset safely, and submits the complete order. A wrong order resets without damage or blocking alternative choices/combat. Correct order records Ilyra’s name, but the room remains unresolved until the player chooses its outcome. Restoring the name then needs no random check, including after an earlier failed persuasion attempt. Puzzle steps grant no farmable XP; the existing room decision reward remains once-only.

Saved boolean slot flags project into `scene.bellIndex`; the original bronze console renders occupied slots and a solved color from that state. Controls require a conscious hero, exploration, the correct scene and an unresolved room. The console is hidden during combat. Legacy Echo Rules progression is unchanged.

Tests cover prerequisites, duplicate plates, partial-sequence serialization, wrong-order recovery, final decision without dice and unavailable contexts. 213 tests plus client/server type checks pass. The new console’s actual browser appearance remains pending; this content addition does not establish campaign duration. No deployment.


### Bell Index browser and missing-character correction

A separate Bell Index Visual QA fixture tested the room directly. The browser read the clue, placed Witness/Keeper/Vessel, submitted, reloaded and retained the solved state. The restore-name action lost its DC indicator, resolved without dice and awarded the existing 125 XP decision total. This is controlled room QA, not campaign traversal.

The inspection found that the described librarian and sentinel lacked exploration entities. The room now projects a bronze adaptation of the shipped KayKit Knight and the shipped skeleton, with name-restoration decisions targeting the librarian and combat targeting the sentinel. Both models were visually observed. Combat suppresses these exploration duplicates. Once resolved, the sentinel disappears and the restored librarian is named Ilyra; the scene description reflects the chosen outcome instead of describing the earlier captive drawer. Scene projection regression and client/server type checks pass. No deployment.


### Chapter II infirmary rescue and outcome visibility (local)

In curated rules, the Flooded Infirmary supports a deliberate rescue: inspect the safety marks, optionally signal to the medic, brace the cot using its existing tether, then drain slowly. The trapped medic has a stable air pocket; there is no real-time countdown. Each step persists across reload. Preparation does not consume health, potions or rations, grant XP, or complete the room. The final rescue remains a separate player commitment. It becomes certain after drainage, even following an earlier failed rushed attempt. The medicine remains with the medic for his patients. Existing immediate choices remain available until the pocket is drained; a completed drain cannot be offered as an unperformed alternative. The existing once-only room reward and later rescued-medic assistance remain intact. Legacy Echo Rules retain their earlier progression.

Acceptance: the medic and cot appear above the floor while suspended; the water pocket disappears and both lower after drainage; the label changes from trapped to waiting to rescued. Saved scene descriptions match the chosen outcome. Controls reject duplicates, skipped prerequisites, combat, unconscious heroes, other rooms and completed encounters. Level-up and XP messages must not replace the action's narrative outcome. Final exploration presentation must show the committed scene when its outcome is revealed.

Local browser QA completed inspection, signalling, bracing, a mid-rescue reload, drainage and prepared rescue. A second controlled fixture verified the drained scene while the playback panel was still open. These room checks establish behavior, not campaign duration or a full playthrough.


### Curated movement reactions (local)

Leaving a visible opponent's melee reach can trigger its opportunity attack before departure. Each creature has one reaction, renewed on its next turn. Movement previews identify threats on the chosen route. A creature reduced to zero health stays at the last reached cell; untraveled movement is not charged. Staying within reach, an unconscious opponent, blocked sight, a held/spent reaction, or Disengage suppresses the reaction. Reach weapons use their own boundary. Ranged attacks and cantrips are not opportunity attacks.

Disengage spends a main action and protects movement through the current turn. Rogue Cunning Disengage is available from level 2 and spends a bonus action. Party reactions default to automatic; the active character's tactics can hold them until explicitly enabled again. This is a deliberate curated automation policy, not a prompt for every reaction. Wounded ranged companions can disengage, withdraw, then use their remaining action on a later automatic step.

The reaction gets its own die/outcome frame and REACTING NOW label. The following movement frame restores the mover's highlight without advancing initiative. Status shows ready/spent reactions and current Disengage protection. Reference for the underlying rule: [D&D Basic Rules, opportunity attacks](https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game).


### Quest deadlines and unreachable objectives (local)

Objectives close as missed when an unfinished required stage can no longer be reached on the linear route. This applies to main objectives as well as optional ones: leaving the captive behind must not keep “Free the captive courier” active forever. Opening investigations carry deadlines for location-specific prerequisites. Multi-room side adventures follow the next required meeting: acceptance, investigation, then the final decision. Skipping acceptance or evidence therefore closes the quest immediately after that room, rather than leaving it active until a later chapter boundary.

Completed, declined and previously missed records remain durable. Reading an old active record recomputes availability without granting rewards or rewriting the save. The journal groups missed objectives under Opportunities passed, retains incomplete steps, and explains that they cannot be completed on this route. Side-quest NPC visibility uses the same prerequisite boundary, so an old active record cannot display a meeting that has already become impossible.

### Local checkpoint: peaceful cookfire ordering
Curated adventures preserve Scrit’s introduction, remaining questions, and a one-time food offer after negotiated passage. Players may feed the camp before introducing themselves or offer food after persuasion. Successful distraction still represents leaving the conversation behind. A failed distraction followed by peace must not close dialogue. Text acknowledges food and key ownership; the cook label and scene objective reflect the peaceful outcome.

### Local checkpoint: prisoner testimony investigation
Curated prison exploration offers three saved conversations: the reason for detention, a witnessed brace transfer, and comparison with the supply ledger. The first two can happen through the bars. Comparison requires the courier to be free and the ledger to have been read. Corroboration supplies an alternative seal-knowledge route for players who missed Scrit, allowing Vark negotiation without fabricating a prior conversation. The courier distinguishes observed events from the unseen force. Conversations spend no resources and grant no dialogue XP.

### Local checkpoint: labels preserve character visibility
World labels must avoid projected character bodies as well as HUD panels and other labels. This applies to party members, enemies, and rendered NPCs, including characters without a visible name label. Selected labels retain priority but cannot cover bodies. Crowded labels may hide; their targets remain selectable in the action focus menu. Leader lines associate displaced labels with the original target.

### Local checkpoint: exploration party spacing
Curated adventures use a wider triangular formation at creation, room arrival, and existing authored approach interactions. Party members should remain at least 1.5 world units apart at these settled positions. Inspection in the live counterweight hall keeps every party member behind the pressure-plate line. Legacy exploration placement and tactical combat cells retain their existing behavior.
