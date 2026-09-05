# Echoes Below — Product Requirements Document

Version 1.0 • 5 September 2026 • Status: product specification; opening implementation available

Project: `/Users/naufaldisatriya/WebApps/3d-dnd`. The originally requested `/WebApps/3d-dnd` is on a read-only macOS volume; the user approved this replacement. Technical design: [RFC](RFC.md).

## 1. Product promise

A single player leads a three-person party into a visible 3D dungeon, chooses what to attempt, and hears an AI Dungeon Master and two companions respond to the actual consequences. The game combines the readable choices of a visual novel with exploration, dice, and turn-based combat. Companions remember what happened and have reasons for their actions.

Audience: desktop players who want tabletop-style adventures without organizing a group or learning a complex tactical interface. First release is a personal, locally hosted browser game. English text and voice are the default. This is an original fantasy game with simplified D&D-inspired mechanics, not a claim of compatibility with an official rules edition.

The main measures of success are meaningful choices, believable companions, consistent rules, and reliable continuation tomorrow. Twenty-four hours is a content target across sessions, not a countdown, development deadline, or amount of mandatory generated speech.

### Scope boundaries

Include one human hero, two autonomous companions, authored dungeon scenes, contextual actions, creative text requests, push-to-talk, generated voice, dice, inventory, progression, and persistent saves. No human multiplayer, accounts, payments, public deployment, free steering, open-world simulation, runtime-generated geometry, voice cloning, lip synchronization, or unrestricted spell creation in the initial milestones. Character appearance uses existing models and palette presets.

## 2. Experience and interaction

Start → choose name, appearance, class and background → meet Mira and Oren → explore selected destinations → inspect or converse → preview an action → confirm → resolve checks → watch its presentation → hear reactions → continue or save and exit.

The player selects a visible target or its accessible target-list entry. The menu contains at most five immediate choices and “Try something else.” A corridor offers Explore cautiously or Move quickly. A chest offers Inspect, Disarm when discovered, or Open. A goblin offers Talk, Distract, or Attack while non-hostile. During combat, the action panel shows legal actions and remaining movement. No full-party micromanagement is required.

Free text and speech propose intent. A preview identifies actor, target, costs, and potential commitment before execution. Unsupported intent explains the limitation and offers supported actions without inventing a successful result. Saying “I have infinite health” is dialogue, not a state change. There is no arbitrary object destruction or creation.

Voice input is push-to-talk, maximum 30 seconds, followed by an editable transcript and confirmation. Text entry always remains available. Spoken output has subtitles, speaker name, stop/skip, replay, and separate voice/music volume. One character speaks at a time. Skipping audio does not skip or repeat a rules outcome. Show “AI-generated voices” in audio settings and onboarding.

### Companion behavior

Mira is a cautious scout, observant and dryly funny. She wants evidence about her missing brother and distrusts reckless promises. Oren is a compassionate guardian, protective but stubborn about surrendering enemies; he wants to repair harm caused by his former order. These goals influence conversation and suggested actions without changing dice or granting knowledge.

Both follow automatically and may look toward clues, exchange short remarks, and suggest plans. They do not independently open dangerous doors, start neutral encounters, spend rare items, or separate into undiscovered rooms. In combat each chooses a legal action, including defending or healing, using the same rules as the player. A player request applies to the companion's next turn; an impossible request explains why and leaves the player able to choose another request.

Relationships store trust from -3 to +3, initially zero, and witnessed event memories. An authored significant event changes trust by at most one, once. Mira values heeding a warning; Oren values sparing a surrendering foe. Gifts and repeated dialogue cannot farm trust. At -2 a companion expresses disagreement but stays playable; at +2 a personal conversation becomes available. Companions cannot abandon the party in the first chapter. Trust changes expression and story branches, never hidden combat bonuses.

Banter occurs at scene transitions or significant results, with at most one unsolicited exchange per three resolved exploration actions. The player can interrupt it. No endless companion-to-companion AI loop.

## 3. Rules baseline: Echo Rules v1

The RFC implements these original simplified rules exactly. Content balance can change through versioned data, not prompt improvisation.

| Hero preset | Health | Defense | Might / Agility / Insight / Presence | Basic attack | Special action |
|---|---:|---:|---|---|---|
| Guardian | 24 | 14 | +3 / +1 / +0 / +1 | Sword, Might, 1d8+3 | Rally: heal adjacent ally 1d6+2, one focus |
| Scout | 18 | 12 | +1 / +3 / +2 / +0 | Bow, Agility, range 8m, 1d6+3 | Aim: spend action, next attack has advantage |
| Adept | 16 | 11 | +0 / +1 / +3 / +2 | Spark, Insight, range 8m, 1d6+3 | Mend: heal ally within 6m 1d6+2, one focus |

Healing cannot target an enemy or exceed maximum health. All heroes start with two focus, two personal healing potions (1d6+2), and one ration. Mira uses Scout statistics with Survivor training; Oren uses Guardian statistics with Envoy training. Name/background do not alter these class statistics. Backgrounds are Delver (trained Inspect), Envoy (trained Persuade), and Survivor (trained Disarm); trained checks receive +2.

A check succeeds when d20 + relevant attribute + trained bonus meets its authored difficulty (10 easy, 13 standard, 16 hard). Advantage rolls two d20 and keeps the higher; disadvantage keeps the lower; both cancel and do not stack. Natural 1/20 are not automatic successes/failures on skill checks. Attack rolls use d20 + attack attribute against Defense; natural 1 misses and natural 20 hits and doubles damage dice, not the modifier. Damage cannot heal and health stays between zero and maximum.

Combat begins with d20 + Agility initiative; ties use Agility then stable actor ID. Each turn grants 6m movement and one action. Run uses the action for 6m extra movement. Melee reach is 1.5m; ranged attacks require an unobstructed line. No opportunity attacks, elevation modifiers, flanking, or reactions in v1. Guard grants +2 Defense until the start of the actor's next turn. Aim expires after the next attack or the encounter. Interact and potion use cost an action. Enemy AI uses deterministic tactics; companion AI proposes from legal actions.

Zero health means downed and unable to act. Healing revives; there are no death saves or permanent companion deaths in v1. All three downed causes defeat. Reload checkpoint restores that checkpoint explicitly; ordinary retries never reroll. Retreat is an explicit party action available only on a marked exit zone with all standing members there; downed companions are recovered after successful retreat.

Outside combat, cautious travel advances two exploration ticks and quick travel one. Ticks matter only to authored local hazards or patrols, never a global campaign timer. Cautious travel checks Insight once at marked clue boundaries; it does not guarantee discovery. Trap attempts are limited to one per trap per actor; failed disarm triggers its written consequence. Repeating unchanged persuasion cannot reroll. No-roll actions execute directly.

At marked safe camps only, rest consumes one ration per character, restores health/focus, and advances two ticks. The opening slice has one safe camp and enough supplies for one rest. Full campaign progression grants +3 maximum health and +1 focus capacity after each of chapters 1–5, restoring both on level-up; base attributes and attacks stay unchanged. Six levels maximum. Chapter content supplies potions, rations, keys, evidence, and cosmetic rewards; no random item generator or equipment-stat economy in v1.

## 4. Opening adventure: The Bell Beneath Briarwatch

Briarwatch's warning bell rings from an abandoned underground relay. Missing supply caravans point to a goblin occupation. Hobgoblin commander Vark holds a resonance seal that suppresses something beneath the relay. The party initially knows only about the caravans and the bell.

| Scene | What the player sees | Meaningful actions and consequences |
|---|---|---|
| 1. Broken approach | A damaged cart, tracks, a quiet camp | Inspect tracks (Insight 10) reveals captives were marched alive; failure leaves tracks ambiguous. Rest or continue. Mira introduces her concern. |
| 2. Counterweight hall | Floor seams, wall slits, a hanging chain | Inspect (Insight 13) reveals a pressure plate. Disarm (Agility 13) makes it safe; failure deals 1d6 to the actor and raises alarm. Quick traversal over an undiscovered plate triggers it. An already visible side ledge permits a safe longer route, two extra ticks. |
| 3. Goblin cookfire | Two guards and hungry cook Scrit | Offer one ration for passage without a roll; persuade with discovered captive evidence (Presence 13); distract (Agility 13) permits crossing but no supplies; attack starts combat. Failed persuasion raises alarm and closes that offer; ration or combat remain possible. Scrit reveals the seal's purpose if spared and fed. |
| 4. Prison alcove | Captive courier, locked gate, ledger | Guard key opens gate; a single Agility 13 pick attempt opens it, failure consumes one tick and allows breaking it loudly. Rescue provides testimony and a boss negotiation route. Ledger marks the next chapter. |
| 5. Bell chamber | Vark, a sentry, and the unstable seal | Fight, present courier testimony plus Scrit's explanation, or use a discovered maintenance entrance. Negotiation requires both facts and Presence 16; success gives a supervised seal transfer. Failure begins combat. Alarm adds one sentry. No surprise damage: maintenance route gives the party initiative advantage only. |
| 6. Aftermath | Bell settles; a deeper door opens | Secure the seal or entrust its guard to spared Scrit. Save, reward, show relationship consequences and next destination. Both choices reach a real ending to the slice. |

Slice enemies: goblin HP 8, Defense 11, attack +2, damage 1d4+1, movement 6m; Vark HP 28, Defense 13, attack +3, damage 1d8+2, movement 6m. Sentries use goblin stats. Enemy tactics: attack a reachable standing target with lowest health, stable ID tie-break; otherwise move toward nearest standing target, or Guard if unreachable. Scrit is initially noncombatant and never attacks before player hostility.

The slice contains all six compact scenes and targets 30–60 minutes. Chapter one expands these scenes with connected optional wings and personal discoveries to 3–4 hours, preserving the same core outcomes. No padding through repeated rolls or long mandatory voice playback.

## 5. Campaign target and progression

| Chapter | Target active hours | New play emphasis | Lasting consequence |
|---|---:|---|---|
| 1. The Bell Beneath Briarwatch | 3–4 | Goblins, traps, Vark, rescue | Who guards the first seal; Mira/Oren trust |
| 2. The Flooded Archive | 3–4 | Water routes, evidence, timed local mechanisms | Preserve records or save stranded archivists |
| 3. The Ash Market | 3–4 | Faction negotiation, scarcity, infiltration | Choose access ally and supply route |
| 4. The Rootbound Prison | 4–5 | Rescue planning, environmental puzzles | Resolve Mira's brother's fate and a promise |
| 5. The Hollow Choir | 4–5 | Conflicting testimony, advanced encounter combinations | Oren confronts his order; choose a seal strategy |
| 6. The Last Descent | 4–5 | Consequence-driven routes and final encounters | Seal, redirect, or release the resonance |

Total design range 21–27 hours, centered on 24, including normal decision time and optional exploration but excluding idle/background time. Each chapter has at least eight authored encounters with at least three social/exploration encounters, one companion scene, one consequential choice, and a climax. No requirement to fight in every encounter. Each main objective must remain reachable after failed checks. Full chapter scene graphs and encounter data are implementation content tasks; this outline is not a claim that a complete 24-hour script exists.

Record active time only while focused, with activity in the last two minutes; include voice playback while focused. Use at least five fresh-player campaign playthroughs to evaluate median duration and an 18–30 hour observed range. Report results honestly and revise content rather than enforce delays.

## 6. Art direction and interface

References: [taxi demo](https://crazy-taxi.astra.demos.sulat.com/), [Quaternius catalog](https://quaternius.com/index.html), [Bestiary kit](https://quaternius.com/packs/bestiarydungeonmonsterskit.html).

The taxi reference contributes scene readability, smooth movement, visible action feedback, and clean HTML overlays. Fantasy modeling follows Quaternius proportions and surfaces. Do not copy taxi branding, vehicle UI, fonts, sounds, or code. Primary palette: slate #27313B, stone #626970, torch amber #E6AC58, parchment #F1E6CE, ally teal #62C9BC, threat red #D96A65. Color is reinforced by icons, labels, and outlines.

Exploration camera: perspective, elevated approximately 45 degrees, party-centered, gentle zoom and 90-degree orbit controls. Dialogue uses a closer two-character shot with a safe wider shot when obstructed. Cutaway foreground walls preserve targets. Reduced-motion mode disables camera shake, snaps camera transitions, and shortens dice presentation.

At 1280×720 or larger: party cards upper left, objective upper right, transcript/subtitle panel bottom center, contextual action panel at lower right, compact dice result above dialogue. Normal overlays occupy no more than 35% of the viewport; dialogue history is an intentional expanded overlay. Text is at least 16px and subtitle size is adjustable. All actions are accessible through keyboard focus and a target list; no task depends solely on clicking a 3D mesh. Health and active turn are always visible during combat.

Heroes need distinct silhouette/color combinations. Goblins are visibly smaller than Vark; the boss gains armor/weapon distinction beyond a simple nameplate. Minimum performed actions: idle, walk/run, attack, hit, downed, and generic interaction. Trap disarm uses kneel/gesture when available or a standing interaction with visible tool/effect; no promise of bespoke animation for every verb. Facial realism and lip-sync are excluded. Texture and skeleton checks precede acceptance of any pack.

## 7. Requirements and acceptance

M1 = playable slice; M2 = expanded chapter one; M3 = full campaign. Each row is a testable user story.

| ID | Milestone | Player need | Acceptance criterion |
|---|---|---|---|
| EB-01 | M1 | Create a hero | Three classes, three backgrounds and appearance presets produce the documented legal stats and persist after reload. |
| EB-02 | M1 | Explore without steering | Selecting a reachable destination moves all companions along valid paths, stops at encounter boundaries, and never passes through closed geometry. |
| EB-03 | M1 | Attempt creative actions | Typed or confirmed speech produces a supported preview or clear limitation; no state mutation occurs before confirmation. |
| EB-04 | M1 | Understand chance | Checks expose die, modifiers, target and result; duplicate submissions cannot repeat the roll. |
| EB-05 | M1 | Fight with a party | Legal movement/action limits apply equally to heroes and enemies; companions complete turns; combat reaches victory, retreat or defeat. |
| EB-06 | M1 | Know my companions | Both have distinct voices/personas; they recall witnessed events and cannot cite unrevealed facts; major commitments need player choice. |
| EB-07 | M1 | Converse by text or voice | Editable push-to-talk transcript, readable dialogue, one speaker, skip/replay, mute, and keyboard text-only play all work. |
| EB-08 | M1 | Return tomorrow | Every committed action survives restart; remaining turn, inventory, health, discovered facts and narrative transcript agree. |
| EB-09 | M1 | Complete an adventure | All six opening scenes are reachable; at least combat and negotiation routes reach aftermath; failed checks do not soft-lock progression. |
| EB-10 | M1 | Read the 3D scene | Targets and party remain identifiable at 1280×720 and 1920×1080; camera/overlays meet section 6 and keyboard access covers all actions. |
| EB-11 | M1 | See consistent fantasy art | Every shipped model has a verified source/license and correct textures, scale and required animation; no placeholder cube substitutes for a hero or boss at release. |
| EB-12 | M1 | Recover from interruptions | Provider failure, refresh and audio cancellation preserve confirmed facts and expose retry/resume without invisible spending loops. |
| EB-13 | M1 | Control usage | Session/campaign estimated spend and configurable caps are visible in settings; exceeding a cap pauses new paid generation. |
| EB-14 | M2 | Develop relationships | Significant choices change trust once, unlock conversations at the defined threshold, and remain remembered across chapter-one scenes. |
| EB-15 | M3 | Play a long campaign | Six chapters, progression, cross-chapter consequences and an ending are playable; duration is measured as described in section 5. |
| EB-16 | M1 | Play responsively | On documented baseline hardware: p95 frame time ≤33.3ms at 1080p low preset; local action feedback ≤150ms; measured provider latency is reported separately. |

## 8. Milestones and release evidence

M1 delivers the six-scene condensed adventure, all three hero classes, two companions, mechanics above, Quaternius-based art, voice/text, saves, two resolution routes, defeat/retry, and usage controls. Run five fresh-player slice sessions: target median 30–60 minutes and at least four complete without developer intervention. Four of five testers should distinguish both companions and identify one remembered event. Targets are not current measurements.

M2 expands chapter one to 3–4 hours and adds full trust conversations, optional wings and level-up. M3 implements chapters 2–6 and their cross-chapter consequences. The same save model and content format serve all milestones.

Collect browser screenshots for creation, exploration, dialogue, trap, combat, Vark and aftermath. Record rules tests, reload/duplicate request tests, AI evaluation fixtures, asset audit, frame/latency measurements and cost estimates versus actual usage. The compact opening adventure has now been implemented. Actual runtime evidence and remaining gaps are recorded in [VERIFICATION.md](VERIFICATION.md); the targets above remain product acceptance goals, not a claim of five-player validation. RFC section 12 defines broader future checks.

## 9. Handoff

Read the RFC for architecture, action ownership, asset research and test mapping. Before application work, create an implementation plan that gives each task a user story, concrete edge cases, and a definition of done. Configure a fresh server-side credential separately; no credential belongs in these documents.

Proposed first execution goal: **Build a playable, voiced, saveable opening adventure in Echoes Below, using cohesive Quaternius-based fantasy assets, with functional AI companions, exploration, a trap, goblin interaction, combat, and a reachable ending.** This goal was subsequently activated for the opening adventure. The implementation plan and actual evidence are in IMPLEMENTATION.md and VERIFICATION.md; no recurring automation was created.
