import {checkInActions,resolveCheckIn} from './party-checkin.js';
import {CURATED_ENCOUNTERS,encounterEnemies} from './encounters.js';
import {speakerLabel} from '../shared/speaker-label.js';
import {explorationHealingActions,resolveExplorationHealing} from './exploration-healing.js';
import {sideActions,sideEntities,resolveSide} from './side-adventures.js';
import {questProgress,updateQuests,questActions,declineQuest} from './quests.js';
import {logisticsFor,logisticsActions,applyLogistics,grantLogisticsLoot} from './logistics.js';
import {makeCharacter,restoreClassResources,classResources} from '../shared/curated-rules.js';
import {initializeTactical,startTacticalCombat,tacticalActions,applyTactical} from './tactical.js';
import {availableConsequences,campaignEffects} from './campaign-consequences.js';
import {COMPANION_STORIES} from '../shared/companion-stories.js';
import {EXPEDITION,expeditionRoom,expeditionScene} from "../shared/campaign.js";
import { randomUUID } from "node:crypto";
import type {
  Actor,
  ActionOption,
  CreateSaveRequest,
  GameLog,
  PublicSave,
  Scene,
  SceneId,
  Roll,
} from "../shared/types.js";
import {
  attackRoll,
  damageRoll,
  distance,
  rollD20,
  type Dice,
} from "./rules.js";
export class GameError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export interface Save
  extends Omit<PublicSave, "scene" | "actions" | "checkpoints"> {
  sceneId: SceneId;
  flags: Record<string, boolean>;
  attempts: string[];
  turnIndex: number;
  checkpointIds: { id: string; label: string }[];
  campaignId?: string;
  plans?: Record<string, string>;
}
export function assertSaveVersion(s:Save){
 const tactical=s.rulesVersion==='curated-srd-5.2.1-v1';
 if(s.schemaVersion!==1||s.contentVersion!=='briarwatch-1'||(!tactical&&s.rulesVersion!=='echo-v1')||tactical!==!!s.tactical||tactical&&s.party.some(a=>!s.tactical!.actors[a.id]))throw new GameError(409,'INCOMPATIBLE_SAVE','This save uses an unsupported or incomplete rules version.');
}
const CLASSES = {
  cleric:{hp:20,defense:13,attributes:{might:1,agility:0,insight:3,presence:2}},
  guardian: {
    hp: 24,
    defense: 14,
    attributes: { might: 3, agility: 1, insight: 0, presence: 1 },
  },
  scout: {
    hp: 18,
    defense: 12,
    attributes: { might: 1, agility: 3, insight: 2, presence: 0 },
  },
  adept: {
    hp: 16,
    defense: 11,
    attributes: { might: 0, agility: 1, insight: 3, presence: 2 },
  },
};
export function actor(
  id: string,
  name: string,
  classId: CreateSaveRequest["classId"],
  backgroundId: CreateSaveRequest["backgroundId"],
  appearanceId = "moss",
): Actor {
  const c = CLASSES[classId];
  return {
    id,
    name,
    classId,
    backgroundId,
    appearanceId,
    side: "party",
    hp: c.hp,
    maxHp: c.hp,
    defense: c.defense,
    attributes: { ...c.attributes },
    focus: 2,
    maxFocus: 2,
    potions: 2,
    rations: 1,
    position: [id === "mira" ? -1 : id === "oren" ? 1 : 0, -2],
    guard: false,
    aim: false,
  };
}
function enemy(id: string, vark = false): Actor {
  return {
    ...actor(
      id,
      vark
        ? "Commander Vark"
        : id === "guard-2"
          ? "Goblin guard"
          : "Goblin sentry",
      "guardian",
      "survivor",
    ),
    classId: vark ? "vark" : "goblin",
    side: "enemy",
    hp: vark ? 28 : 8,
    maxHp: vark ? 28 : 8,
    defense: vark ? 13 : 11,
    attributes: { might: vark ? 3 : 2, agility: 1, insight: 0, presence: 0 },
    focus: 0,
    potions: 0,
    rations: 0,
    position: [id.endsWith("2") ? 2 : id.endsWith("3") ? -2 : 0, 2],
  };
}
const baseScenes: Record<SceneId, Scene> = {
  ...Object.fromEntries(EXPEDITION.map(r=>[r.id,expeditionScene(r)])) as Record<SceneId,Scene>,
  approach: {
    id: "approach",
    index: 1,
    title: "Broken Approach",
    subtitle: "THE BELL BENEATH BRIARWATCH",
    description:
      "Rain gathers in the ruts of a shattered supply cart. Far beneath the hillside, a bell sounds once, though no wind reaches it. Mira kneels beside a trail of bootprints. Oren tends a sheltered campfire.",
    objective: "Find a way into the abandoned relay.",
    entities: [
      {
        id: "tracks",
        name: "Cart tracks",
        kind: "clue",
        position: [-2, 1],
        description:
          "Bootprints and wheel ruts disappear toward the old relay.",
      },
      {
        id: "camp",
        name: "Sheltered camp",
        kind: "camp",
        position: [2, -1],
        description: "A quiet place to share your supplies and recover.",
      },
      {
        id: "entrance",
        name: "Relay entrance",
        kind: "exit",
        position: [0, 4],
        description: "Stone steps descend beneath the hill.",
      },
    ],
  },
  hall: {
    id: "hall",
    index: 2,
    title: "Counterweight Hall",
    subtitle: "STONE REMEMBERS EVERY FOOTSTEP",
    description:
      "Iron chains vanish into a vaulted ceiling. Long seams cross the dusty floor, and narrow slits scar the walls. A ledge follows the western wall. Beyond the chamber, smoke carries the smell of onions.",
    objective: "Cross the hall safely, or accept the risk.",
    entities: [
      {
        id: "floor",
        name: "Seamed floor",
        kind: "trap",
        position: [0, 0],
        description: "Dust has collected unevenly around the flagstones.",
      },
      {
        id: "ledge",
        name: "Side ledge",
        kind: "exit",
        position: [-3, 1],
        description:
          "A visible narrow route around the chamber. Slow, but safe.",
      },
      {
        id: "chain",
        name: "Counterweight chain",
        kind: "clue",
        position: [2, 2],
        description: "A hanging chain is connected to the old relay mechanism.",
      },
    ],
  },
  cookfire: {
    id: "cookfire",
    index: 3,
    title: "Goblin Cookfire",
    subtitle: "A MEAL BETWEEN ENEMIES",
    description:
      "Two goblin guards rise as you enter. Behind them, Scrit grips an empty ladle. His pot holds more water than food. “Weapons down,” he says. “We have enough trouble below.”",
    objective: "Get past the guards. How you treat Scrit matters.",
    entities: [
      {
        id: "scrit",
        name: "Scrit, hungry cook",
        kind: "npc",
        position: [-2, 1],
        description: "A tired goblin guarding a thin pot of soup.",
      },
      {
        id: "guards",
        name: "Goblin guards",
        kind: "npc",
        position: [1, 2],
        description: "Two armed guards watch the passage to the prison.",
      },
      {
        id: "passage",
        name: "Prison passage",
        kind: "door",
        position: [0, 4],
        description: "Cold air moves through a barred arch.",
      },
    ],
  },
  prison: {
    id: "prison",
    index: 4,
    title: "Prison Alcove",
    subtitle: "A VOICE BEHIND IRON",
    description:
      "A courier sits behind a locked gate, one arm bound in torn cloth. A ledger lies on a nearby desk. “Please,” the courier says. “Vark is holding that thing shut. He is as trapped as we are.”",
    objective: "Free the courier and learn what the bell guards.",
    entities: [
      {
        id: "gate",
        name: "Courier’s locked gate",
        kind: "door",
        position: [0, 2],
        description: "An iron lock secures the captive courier.",
      },
      {
        id: "courier",
        name: "Captive courier",
        kind: "npc",
        position: [0, 3],
        description: "A witness to what happened beneath the relay.",
      },
      {
        id: "ledger",
        name: "Supply ledger",
        kind: "clue",
        position: [-2, 0],
        description: "Caravan movements are recorded in a hurried hand.",
      },
    ],
  },
  bell: {
    id: "bell",
    index: 5,
    title: "Bell Chamber",
    subtitle: "THE THING THAT HOLDS THE DARK",
    description:
      "The bell hangs above a circle of pale light. Commander Vark stands beneath it, one gauntlet pressed against a trembling seal. A sentry draws a blade. “One more step,” Vark warns, “and all of us hear what is underneath.”",
    objective: "Resolve the standoff and secure the resonance seal.",
    entities: [
      {
        id: "vark",
        name: "Commander Vark",
        kind: "npc",
        position: [0, 2],
        description:
          "An armored commander stands between you and the resonance seal.",
      },
      {
        id: "seal",
        name: "Resonance seal",
        kind: "seal",
        position: [0, 4],
        description: "A circle of pale light pulses in time with the bell.",
      },
      {
        id: "maintenance",
        name: "Service wall",
        kind: "clue",
        position: [-3, 1],
        description: "Old relay fittings line the western wall.",
      },
    ],
  },
  aftermath: {
    id: "aftermath",
    index: 6,
    title: "After the Last Echo",
    subtitle: "SOME DOORS SHOULD OPEN SLOWLY",
    description:
      "The bell settles. In the silence, a deeper door unlocks beneath the relay. Your companions gather around the seal, battered but alive. The next decision belongs to you.",
    objective: "Choose who will guard the seal and finish this adventure.",
    entities: [
      {
        id: "seal",
        name: "Resonance seal",
        kind: "seal",
        position: [0, 1],
        description: "Quiet now, but still holding something below.",
      },
      {
        id: "deeper-door",
        name: "Deeper door",
        kind: "door",
        position: [0, 4],
        description: "The ledger points onward to the Drowned Archive.",
      },
    ],
  },
};
export function log(
  s: Save,
  text: string,
  speaker = "dm",
  rolls: Roll[] = [],
  source: GameLog["source"] = "rules",
) {
  s.logs.push({
    id: randomUUID(),
    revision: s.revision + 1,
    speaker,
    speakerName:speakerLabel({speaker,source},s.party,s.enemies),
    text,
    source,
    rolls,
  });
  if (s.logs.length > 250) s.logs.shift();
  if (s.presentation && (rolls.length || /moves|guards|aims|runs|restores/.test(text))) {
    s.presentation.push({...(s.tactical?{tactical:structuredClone(s.tactical)}:{}),mode:s.mode,turn:structuredClone(s.turn),actorId:speaker,sceneId:s.sceneId,party:structuredClone(s.party),enemies:structuredClone(s.enemies),log:structuredClone(s.logs.at(-1)!)});
  }
}
export function createSave(input: CreateSaveRequest): Save {
  const now = new Date().toISOString();
  const s: Save = {
    id: randomUUID(),
    name: input.name,
    revision: 0,
    xp: 0,
    level: 1,
    schemaVersion: 1,
    rulesVersion: "echo-v1",
    contentVersion: "briarwatch-1",
    mode: "explore",
    sceneId: "approach",
    party: [
      actor(
        "hero",
        input.name,
        input.classId,
        input.backgroundId,
        input.appearanceId,
      ),
      actor("mira", "Mira", input.companions?.mira.classId??"scout", "survivor", input.companions?.mira.appearanceId??"moss"),
      actor("oren", "Oren", input.companions?.oren.classId??"guardian", "envoy", input.companions?.oren.appearanceId??"ember"),
    ],
    enemies: [],
    logs: [],
    facts: [],
    relationships: { mira: 0, oren: 0 },
    ticks: 0,
    turn: null,
    turnIndex: 0,
    inventory: { guardKey: false, ledger: false, seal: false },
    ending: null,
    flags: {},
    attempts: [],
    checkpointIds: [],
    createdAt: now,
    updatedAt: now,
  };
  log(
    s,
    "“My brother travelled with these caravans,” Mira says. “I would like to find more than his footprints.”",
    "mira",
    [],
    "authored",
  );
  log(
    s,
    "“We bring back everyone we can,” Oren answers. “That is the promise I can keep.”",
    "oren",
    [],
    "authored",
  );
  s.party[0]!.raceId=input.raceId??"human";
  s.party[1]!.raceId=input.companions?.mira.raceId??"elf";s.party[2]!.raceId=input.companions?.oren.raceId??"dwarf";
  s.logs.forEach(entry=>{entry.revision=0;});
  if(input.rulesVersion==="curated-srd-5.2.1-v1"){initializeTactical(s);s.logistics=logisticsFor(s);s.quests=questProgress(s);}
  return s;
}
function opt(
  id: string,
  label: string,
  description: string,
  kind = "interact",
  targetId?: string,
  actorId?: string,
  dc?: number,
  attribute?: string,
  dangerous = false,
): ActionOption {
  return {
    id,
    label,
    description,
    kind,
    ...(targetId ? { targetId } : {}),
    ...(actorId ? { actorId } : {}),
    ...(dc ? { check: { dc, attribute: attribute! } } : {}),
    ...(dangerous ? { dangerous } : {}),
  };
}
function attempted(s: Save, key: string) {
  return s.attempts.includes(key);
}
// Authored interaction anchors stay inside each room's walkable approach area.
// In the hall, inspection never steps across the unresolved pressure-plate line.
function approachTarget(s: Save, option: ActionOption) {
  if (
    option.kind === "move" ||
    option.id === "fight" ||
    option.id === "negotiate"
  )
    return;
  const entity = baseScenes[s.sceneId].entities.find(
    (e) => e.id === option.targetId,
  );
  if (!entity) return;
  const leader =
    s.party.find((a) => a.id === (option.actorId ?? "hero") && a.hp > 0) ??
    s.party.find((a) => a.hp > 0);
  if (!leader) return;
  const x = Math.max(-2.3, Math.min(2.3, entity.position[0]));
  let z = Math.max(-2.3, Math.min(2.8, entity.position[1] - 1.2));
  if (s.sceneId === "hall" && !s.flags.trapSpent) z = Math.min(z, -1.2);
  leader.position = [x, z];
  let follower = 0;
  for (const member of s.party) {
    if (member.id === leader.id) continue;
    member.position = [
      x + (follower++ === 0 ? -0.65 : 0.65),
      Math.max(-3, z - 0.7),
    ];
  }
}
export function legalActions(s:Save):ActionOption[]{const actions=[...baseActions(s),...checkInActions(s)];return s.tactical?[...actions.filter(a=>a.id!=='rest'&&a.id!=='exp_rest'&&!a.id.startsWith('campheal:')&&a.id!=='potion'),...logisticsActions(s),...questActions(s),...sideActions(s),...explorationHealingActions(s)]:actions;}
function baseActions(s: Save): ActionOption[] {
  if(s.tactical&&s.mode==="combat")return tacticalActions(s);
  const a: ActionOption[] = [];
  const h = s.party[0]!;
  const f = s.flags;
  if(s.mode==="complete"&&s.sceneId==="aftermath") return [opt("continue_campaign","Continue to the Drowned Archive","Begin Chapter II with your party, choices and experience intact.","move")];
  if (
    s.mode === "defeat" ||
    s.mode === "complete" ||
    s.party.every((x) => x.hp <= 0)
  )
    return a;
  if(s.companionStoryId){const story=COMPANION_STORIES.find(story=>story.id===s.companionStoryId);if(story)return story.responses.map((response,i)=>opt(`bond_reply:${i}`,response.label,'Answer honestly. This reply becomes part of your shared history.','interact',story.speaker));}
  if (s.mode === "combat") {
    if (s.party.filter((x) => x.hp > 0).every((x) => x.position[1] <= -2))
      a.push(
        opt(
          "retreat",
          "Retreat through the entrance",
          "Recover downed companions and return to the previous chamber.",
          "retreat",
        ),
      );
    else if (!f.retreatRequested)
      a.push(
        opt(
          "regroup",
          "Gather party at the exit",
          "Ask standing companions to move toward the exit and Guard on their turns. Move your hero to the exit, then retreat.",
          "retreat",
        ),
      );
    if (f.retreatRequested)
      a.push(
        opt(
          "cancel_regroup",
          "Cancel retreat plan",
          "Companions resume their normal tactics on their next turns.",
          "retreat",
        ),
      );
    if (h.hp === 0)
      return [
        ...a,
        opt(
          "continue",
          "Let companions act",
          "Continue the battle while your hero is downed.",
          "end_turn",
        ),
      ];
    if (s.turn?.actorId !== "hero") return a;
    if (s.turn.actionRemaining) {
      const ranged = h.classId !== "guardian";
      for (const e of s.enemies.filter((e) => e.hp > 0))
        if (distance(h, e) <= (ranged ? 8 : 1.5))
          a.push(
            opt(
              `attack:${e.id}`,
              `Attack ${e.name}`,
              `Attack against Defense ${e.defense + (e.guard ? 2 : 0)}. One action.`,
              "attack",
              e.id,
              "hero",
            ),
          );
      a.push(
        opt(
          "guard",
          "Guard",
          "Gain +2 Defense until the start of your next turn.",
          "guard",
        ),
      );
      if (h.classId === "scout")
        a.push(
          opt(
            "aim",
            "Aim",
            "Spend your action; your next attack has advantage.",
            "aim",
          ),
        );
      if (h.classId !== "scout" && h.focus > 0)
        for (const ally of s.party)
          if (
            ally.hp < ally.maxHp &&
            distance(h, ally) <= (h.classId === "guardian" ? 1.5 : 6)
          )
            a.push(
              opt(
                `heal:${ally.id}`,
                `${h.classId === "guardian" ? "Rally" : "Mend"} ${ally.name}`,
                "Restore 1d6+2 health; costs 1 focus and your action.",
                "heal",
                ally.id,
              ),
            );
      if (h.potions > 0 && h.hp < h.maxHp)
        a.push(
          opt(
            "potion",
            "Drink healing potion",
            "Restore 1d6+2 health. Costs one potion and your action.",
            "use_item",
          ),
        );
      a.push(
        opt("run", "Run", "Spend your action to gain 6m movement.", "run"),
      );
    }
    if (s.turn.movementM > 0) {
      for (const [id, pos, label] of movementAnchors(s)) {
        const dist = Math.hypot(pos[0] - h.position[0], pos[1] - h.position[1]);
        if (dist > 0.1 && dist <= s.turn.movementM + 0.001)
          a.push(
            opt(
              `move:${id}`,
              label,
              `Move ${dist.toFixed(1)}m. Movement does not use your action.`,
              "move",
              id,
            ),
          );
      }
    }
    a.push(
      opt(
        "end_turn",
        "End turn",
        "Let companions and enemies take their turns.",
        "end_turn",
      ),
    );
    return a;
  }
  const safeForConversation=s.sceneId==='approach'||s.sceneId==='aftermath'||s.sceneId==='prison'&&f.rescued||!!f[`${s.sceneId}:resolved`];
  for(const story of COMPANION_STORIES){if(safeForConversation&&s.relationships[story.speaker]>=story.threshold&&(!story.fact||s.facts.some(fact=>fact.id===story.fact))&&!f[`bond:${story.id}`]&&s.party.find(member=>member.id===story.speaker)!.hp>0)a.push(opt(`bond_begin:${story.id}`,story.title,`A private conversation with ${story.speaker==='mira'?'Mira':'Oren'}. Unlocked by trust and shared experiences.`,'interact',story.speaker));}
  if(!expeditionRoom(s.sceneId)&&!f[`cache:${s.sceneId}`])a.push(opt('loot_cache','Search the forgotten chest','Recover one healing potion. Each room’s chest can be searched once.','inspect','cache'));
  for (const healer of s.party.filter(
    (x) => x.hp > 0 && x.classId !== "scout" && x.focus > 0,
  ))
    for (const target of s.party.filter((x) => x.hp < x.maxHp))
      a.push(
        opt(
          `campheal:${healer.id}:${target.id}`,
          `${healer.name}: heal ${target.name}`,
          "Restore 1d6+2 health; uses one focus.",
          "heal",
          target.id,
          healer.id,
        ),
      );
  if (h.potions > 0 && h.hp > 0 && h.hp < h.maxHp)
    a.push(
      opt(
        "potion",
        "Drink healing potion",
        "Restore 1d6+2 health. Uses one personal potion.",
        "use_item",
      ),
    );
  const inspect = (key: string, target: string, label: string, dc: number) => {
    for (const actor of s.party.filter((x) => x.hp > 0))
      if (!attempted(s, `${key}:${actor.id}`))
        a.push(
          opt(
            `${key}:${actor.id}`,
            `${label} · ${actor.name}`,
            `One attempt per character. Insight check, DC ${dc}.`,
            "inspect",
            target,
            actor.id,
            dc,
            "insight",
          ),
        );
  };
  const expedition=expeditionRoom(s.sceneId);
  if(expedition){
    const prefix=s.sceneId;
    const effects=campaignEffects(prefix,f);
    const dc=expedition.dc-effects.dcReduction;
    const defeated=!!f[`${prefix}:defendersDefeated`];
    if(!f[`${prefix}:resolved`])for(const help of availableConsequences(prefix,f))a.push(opt('exp_ally:'+help.id,help.label,help.arrival,'interact',help.name==='Mira'?'mira':'ally:'+help.id));
    if(!f[`${prefix}:evidence`])a.push(opt('exp_evidence','Examine the evidence','Record an observable clue before committing to a choice.','inspect','evidence'));
    if(!f[`${prefix}:talk`])a.push(opt('exp_talk','Hear your companions','Listen to the party’s personal response.','interact','encounter'));
    if(!f[`${prefix}:supplies`])a.push(opt('exp_supplies','Search the supplies','Recover one potion for each party member. One cache per location.','inspect','supplies'));
    if(!f[`${prefix}:resolved`]){
      if(defeated||(h.hp>0&&!f[`${prefix}:tried`]))a.push(opt('exp_choice:0',expedition.choice[0],defeated?'The defenders are defeated. Choose this outcome without another check.':`A ${expedition.challenge} check, DC ${dc}. Evidence grants advantage. Failure costs health; the alternative remains available.`, 'interact','encounter',defeated?undefined:'hero',defeated?undefined:dc,defeated?undefined:expedition.challenge,!defeated));
      a.push(opt('exp_choice:1',expedition.choice[1],'Commit to this alternative and its consequences without a check.','interact','encounter'));
      if(!defeated&&(!s.tactical||CURATED_ENCOUNTERS[s.sceneId]))a.push(opt('exp_fight','Confront the chamber’s defenders','Resolve the obstruction in turn-based combat, then choose the outcome.','attack','encounter',undefined,undefined,undefined,true));
    }else{
      if(!f[`${prefix}:rest`])a.push(opt('exp_rest','Rest with your companions','Recover health and focus; the sheltered rest is available once.','rest','camp'));
      a.push(opt('exp_next',EXPEDITION.at(-1)!.id===s.sceneId?'Finish the campaign':'Continue the descent','Travel onward with this decision recorded.','move','encounter'));
    }
    return a;
  }
  switch (s.sceneId) {
    case "approach":
      if (!f.tracks) inspect("tracks", "tracks", "Inspect tracks", 10);
      if (!f.rested && s.party.every((x) => x.rations > 0))
        a.push(
          opt(
            "rest",
            "Rest at camp",
            "Consume one ration per character; fully restore health and focus. Two ticks.",
            "rest",
            "camp",
          ),
        );
      a.push(
        opt(
          "enter",
          "Descend into the relay",
          "Leave the camp and enter the counterweight hall.",
          "move",
          "entrance",
        ),
      );
      break;
    case "hall":
      if (!f.plate && !f.trapSpent)
        inspect("inspect", "floor", "Inspect floor", 13);
      if (f.plate && !f.trapSpent)
        for (const actor of s.party.filter((x) => x.hp > 0))
          if (!attempted(s, `disarm:${actor.id}`))
            a.push(
              opt(
                `disarm:${actor.id}`,
                `Disarm plate · ${actor.name}`,
                "Agility DC 13. Failure triggers 1d6 damage and raises alarm.",
                "disarm",
                "floor",
                actor.id,
                13,
                "agility",
                true,
              ),
            );
      a.push(
        opt(
          "ledge",
          "Take the side ledge",
          "A safe longer route. Four exploration ticks.",
          "move",
          "ledge",
        ),
      );
      a.push(
        opt(
          "cautious",
          "Cross cautiously",
          "Two ticks. When undiscovered, one Insight DC13 check can detect the trap and halt travel.",
          "move",
          "floor",
        ),
      );
      a.push(
        opt(
          "quick",
          "Cross quickly",
          f.trapSpent
            ? "The spent mechanism is safe. One tick."
            : "One tick. An active pressure plate may trigger.",
          "move",
          "floor",
          undefined,
          undefined,
          undefined,
          !f.trapSpent,
        ),
      );
      if (!f.maintenance) inspect("chain", "chain", "Study the mechanism", 10);
      break;
    case "cookfire":
      if (f.passage) {
        a.push(
          opt(
            "prison",
            "Continue to the prison",
            "Follow the passage beyond the cookfire.",
            "move",
            "passage",
          ),
        );
        break;
      }
      if (s.party.some((x) => x.rations > 0))
        a.push(
          opt(
            "offer",
            "Offer a ration",
            "Give one party ration for peaceful passage. No roll.",
            "offer",
            "scrit",
          ),
        );
      if (h.hp > 0 && f.tracks && !f.persuadeFailed)
        a.push(
          opt(
            "persuade",
            "Mention the captive tracks",
            "Use your evidence to argue for passage. Presence DC13; failure raises alarm.",
            "persuade",
            "guards",
            "hero",
            13,
            "presence",
            true,
          ),
        );
      if (h.hp > 0 && !f.distractTried)
        a.push(
          opt(
            "distract",
            "Distract the guards",
            "Agility DC13. Success gains passage, but no supplies. Failure raises alarm.",
            "distract",
            "guards",
            "hero",
            13,
            "agility",
            true,
          ),
        );
      if (!f.scritTalk)
        a.push(
          opt(
            "scrit-talk",
            "Talk to Scrit",
            "Ask the cook what brought the goblins here. No roll.",
            "talk",
            "scrit",
          ),
        );
      a.push(
        opt(
          "fight",
          "Attack the guards",
          "Begin combat against two goblins.",
          "attack",
          "guards",
          undefined,
          undefined,
          undefined,
          true,
        ),
      );
      break;
    case "prison":
      if (!f.rescued) {
        if (s.inventory.guardKey)
          a.push(
            opt(
              "unlock",
              "Use the guard key",
              "Open the courier’s gate with the recovered key.",
              "interact",
              "gate",
            ),
          );
        if (h.hp > 0 && !f.pickTried)
          a.push(
            opt(
              "pick",
              "Pick the gate lock",
              "One Agility DC13 attempt. Failure costs a tick; you can then break the gate.",
              "interact",
              "gate",
              "hero",
              13,
              "agility",
            ),
          );
        a.push(
          opt(
            "force",
            "Break open the gate",
            "Free the courier without a roll. One tick; noise raises alarm.",
            "force",
            "gate",
            undefined,
            undefined,
            undefined,
            true,
          ),
        );
      }
      if (!s.inventory.ledger)
        a.push(
          opt(
            "ledger",
            "Read the ledger",
            "Discover where the missing supplies were sent.",
            "inspect",
            "ledger",
          ),
        );
      a.push(
        opt(
          "bell",
          "Enter the bell chamber",
          f.rescued
            ? "Take the courier’s testimony to Vark."
            : "Leave the courier behind and confront Vark.",
          "move",
          "bell",
        ),
      );
      break;
    case "bell":
      a.push(
        opt(
          "fight",
          "Fight Vark",
          "Begin combat. Alarm may have brought reinforcements.",
          "attack",
          "vark",
          undefined,
          undefined,
          undefined,
          true,
        ),
      );
      if (h.hp > 0 && f.rescued && f.sealKnowledge)
        a.push(
          opt(
            "negotiate",
            "Negotiate a seal transfer",
            "Present the courier’s testimony and Scrit’s explanation. Presence DC16; failure begins combat.",
            "persuade",
            "vark",
            "hero",
            16,
            "presence",
            true,
          ),
        );
      if (f.maintenance)
        a.push(
          opt(
            "maintenance",
            "Use the maintenance entrance",
            "Begin combat with advantage on party initiative. No surprise damage.",
            "move",
            "maintenance",
            undefined,
            undefined,
            undefined,
            true,
          ),
        );
      break;
    case "aftermath":
      a.push(
        opt(
          "secure",
          "Secure the seal",
          "Keep the seal under your party’s protection. Finish the opening adventure.",
          "interact",
          "seal",
        ),
      );
      if (f.fed)
        a.push(
          opt(
            "entrust",
            "Entrust Scrit with its guard",
            "Let Scrit guard the seal while you investigate the deeper door. Finish the adventure.",
            "interact",
            "seal",
          ),
        );
      break;
  }
  return a;
}
function movementAnchors(s: Save): [string, [number, number], string][] {
  const entries: [string, [number, number], string][] = [
    ["exit", [0, -3], "Move to the exit"],
    ["center", [0, 0], "Move to the center"],
    ["left", [-2, 0], "Move left"],
    ["right", [2, 0], "Move right"],
  ];
  for (const e of s.enemies.filter((x) => x.hp > 0))
    entries.push([
      e.id,
      [e.position[0], e.position[1] - 1.2],
      `Approach ${e.name}`,
    ]);
  return entries;
}
export function publicSave(s: Save): PublicSave {
  const {
    flags,
    attempts,
    sceneId,
    turnIndex,
    checkpointIds,
    plans,
    campaignId,
    ...visible
  } = s;
  const scene=structuredClone(baseScenes[sceneId]);
  scene.entities.push(...sideEntities(s));
  if(expeditionRoom(sceneId)&&s.mode==='explore'&&!flags[`${sceneId}:resolved`]){
    const aid=availableConsequences(sceneId,flags);
    aid.filter(c=>c.name!=='Mira').forEach((c,i)=>scene.entities.push({id:'ally:'+c.id,name:c.name,kind:'npc',modelClassId:c.effect==='healing'?'cleric':c.effect==='preparation'?'adept':'scout',position:[-4,1+i*1.5],description:c.arrival}));
    if(aid.length)scene.description+=' '+aid.map(c=>c.arrival).join(' ');
    if(flags[`${sceneId}:defendersDefeated`])scene.objective='The defenders are defeated. Decide what happens here before continuing.';
  }
  if(!expeditionRoom(sceneId)&&s.mode==='explore'&&!flags[`cache:${sceneId}`])scene.entities.push({id:'cache',name:'Forgotten chest',kind:'clue',position:[4.6,-.7],description:'A dusty chest with a salvageable healing potion.'});
  if(sceneId==='prison'&&flags.rescued){
    const gate=scene.entities.find(e=>e.id==='gate')!;
    gate.open=true;gate.name='Courier’s open gate';gate.description='The gate is open. The courier is free.';
    scene.description='The courier stands free beside the open gate, ready to testify about Vark and the dangerous force below. A ledger lies on the nearby desk.';
    scene.objective='Follow the courier’s testimony to the bell chamber.';
  }
  if(s.mode==='combat')scene.entities=scene.entities.filter(e=>!['guards','vark'].includes(e.id));
  // Existing saves also retain the defeated guards, so this survives reloads without a migration.
  const guardsDefeated=flags.guardsDefeated||(sceneId==='cookfire'&&s.enemies.length>0&&s.enemies.every(e=>e.hp===0));
  if(sceneId==='cookfire'&&guardsDefeated){
    scene.entities=scene.entities.filter(e=>!['scrit','guards'].includes(e.id));
    scene.description='The guards have fallen. Scrit has fled deeper into the relay. The passage to the prison is clear.';
    scene.objective='Continue through the open prison passage.';
  }
  return {
    ...structuredClone(visible),
    ...(s.tactical?{logistics:structuredClone(logisticsFor(s)),quests:questProgress(s)}:{}),
    scene,
    actions: legalActions(s),
    checkpoints: checkpointIds,
  };
}
function fact(s: Save, id: string, text: string) {
  if (!s.facts.some((x) => x.id === id)) {
    s.facts.push({ id, text });
    log(s, text);
    awardExperience(s, `fact:${id}`, 35);
  }
}
export const LEVEL_THRESHOLDS = [0,300,900,2700,6500,14000,23000,34000];
function awardExperience(s:Save,key:string,amount:number){
  if(s.flags[`xp:${key}`])return;
  s.flags[`xp:${key}`]=true;
  s.xp=(s.xp??0)+amount;
  const level=LEVEL_THRESHOLDS.filter(n=>s.xp!>=n).length;
  const gained=level-(s.level??1);
  log(s,`The party gains ${amount} XP.`, 'dm');
  if(gained>0){
    for(const member of s.party){
      if(s.tactical){const old=s.tactical.actors[member.id],next=makeCharacter(old.classId,level);const increase=next.maxHp-old.maxHp;next.hp=old.dead?0:Math.min(next.maxHp,old.hp+increase);next.slots=next.maxSlots.map((n,i)=>Math.min(n,(old.slots[i]??0)+n-(old.maxSlots[i]??0)));next.features={...classResources(old),secondWind:classResources(old).secondWind+Math.max(0,classResources(next).secondWind-(old.classId==="fighter"?(old.level>=4?3:2):0)),actionSurge:classResources(old).actionSurge+(old.classId==="fighter"&&old.level<2&&level>=2?1:0)};next.death=next.hp>0?{successes:0,failures:0,stable:false}:old.death;next.dead=old.dead;next.concentration=old.concentration;s.tactical.actors[member.id]=next;member.hp=next.hp;member.maxHp=next.maxHp;}
      else{member.maxHp+=gained*6;member.hp=Math.min(member.maxHp,member.hp+gained*6);member.maxFocus+=gained;member.focus+=gained;}
    }
    log(s,s.tactical?`Level ${level}! Your class health and spell slot capacity increase.`:`Level ${level}! Everyone gains ${gained*6} maximum health and ${gained} focus.`, 'dm');
  }
  s.level=level;
}
function trust(s: Save, who: "mira" | "oren", key: string) {
  if (!s.flags[`trust:${key}`]) {
    s.flags[`trust:${key}`] = true;
    s.relationships[who] = Math.min(3, s.relationships[who] + 1);
    log(s, `${who === "mira" ? "Mira" : "Oren"} trusts you more.`, who);
  }
}
function check(
  s: Save,
  dice: Dice,
  a: Actor,
  attribute: keyof Actor["attributes"],
  dc: number,
  training: string,
  purpose: string,
) {
  if (a.hp <= 0)
    throw new GameError(
      422,
      "ACTOR_DOWNED",
      "A downed character cannot attempt a check.",
    );
  const trained =
    (training === "inspect" && a.backgroundId === "delver") ||
    (training === "persuade" && a.backgroundId === "envoy") ||
    (training === "disarm" && a.backgroundId === "survivor");
  const r = rollD20(dice, a.attributes[attribute] + (trained ? 2 : 0), purpose);
  const success = r.total >= dc;
  log(
    s,
    `${a.name}: ${purpose} ${success ? "succeeded" : "failed"} (${r.total} vs DC ${dc}).`,
    a.id,
    [r],
  );
  return success;
}
function enterScene(s: Save, id: SceneId) {
  awardExperience(s,`entered:${id}`,50);
  delete s.flags.retreatRequested;
  s.sceneId = id;
  s.enemies = [];
  s.turn = null;
  s.mode = "explore";
  s.party.forEach((a, i) => {
    a.position = [i === 1 ? -1 : i === 2 ? 1 : 0, -2];
    a.guard = false;
    a.aim = false;
  });
  log(s, publicSave(s).scene.description, "dm", [], "authored");
}
function trap(s: Save, a: Actor, dice: Dice) {
  const r = damageRoll(dice, 6, 0, "Pressure plate");
  a.hp = Math.max(0, a.hp - r.total);
  s.flags.trapSpent = true;
  s.flags.alarm = true;
  log(
    s,
    `The plate drops. A dart strikes ${a.name} for ${r.total} damage. The chain crashes; the mechanism is spent.`,
    a.id,
    [r],
  );
}
function rescue(s: Save) {
  s.flags.rescued = true;
  fact(
    s,
    "courier",
    "The rescued courier testifies that Vark is containing a dangerous force, not ringing the bell to summon an army.",
  );
  trust(s, "oren", "rescue");
}
function startCombat(s: Save, dice: Dice, advantage = false) {
  s.mode = "combat";
  s.enemies =
    s.sceneId === "cookfire"
      ? [enemy("guard-1"), enemy("guard-2")]
      : [
          enemy("vark", true),
          enemy("sentry-1"),
          ...(s.flags.alarm ? [enemy("sentry-2")] : []),
        ];
  const room=expeditionRoom(s.sceneId);
  if(room){
    const level=s.level??1;
    s.enemies=Array.from({length:(room.enemy==='vark'?2:3)-campaignEffects(s.sceneId,s.flags).fewerEnemies},(_,i)=>({...enemy(`exp-${i}`),name:room.enemy==='vark'?(i===0?'Resonant guardian':'Bound sentry'):room.enemy==='skeleton'?'Bound skeleton':room.enemy==='slime'?'Luminous slime':room.enemy==='spider'?'Cavern spider':'Goblin defender',classId:i&&room.enemy==='vark'?'skeleton':room.enemy,hp:10+level*3+(room.enemy==='vark'&&i===0?12:0),maxHp:10+level*3+(room.enemy==='vark'&&i===0?12:0),defense:11+Math.floor(level/3),attributes:{might:2+Math.floor(level/3),agility:1,insight:0,presence:0},position:[(i-1)*2,2] as [number,number]}));
  }
  if(s.tactical){s.enemies=encounterEnemies(s.sceneId,enemy('template'),campaignEffects(s.sceneId,s.flags).fewerEnemies,!!s.flags.alarm);if(!s.enemies.length)throw new GameError(422,'NO_ENCOUNTER','This room has no authored combat encounter.');startTacticalCombat(s,dice);return;}
  const rolls = [...s.party, ...s.enemies]
    .map((a) => {
      const r = rollD20(
        dice,
        a.attributes.agility,
        "Initiative",
        advantage && a.side === "party",
      );
      log(s, `${a.name} rolls initiative ${r.total}.`, a.id, [r]);
      return { a, total: r.total };
    })
    .sort(
      (a, b) =>
        b.total - a.total ||
        b.a.attributes.agility - a.a.attributes.agility ||
        a.a.id.localeCompare(b.a.id),
    );
  s.turnIndex = 0;
  s.turn = {
    actorId: rolls[0]!.a.id,
    order: rolls.map((x) => x.a.id),
    round: 1,
    movementM: 6,
    actionRemaining: true,
  };
  log(s, "Combat begins. Movement and one action are available each turn.");
  autoTurns(s, dice);
}
function allActors(s: Save) {
  return [...s.party, ...s.enemies];
}
export function finishCheck(s: Save) {
  if (s.party.every((a) => a.hp === 0)) {
    s.mode = "defeat";
    s.turn = null;
    log(s, "The party falls. Your story can continue from a saved checkpoint.");
    return true;
  }
  if (s.enemies.every((a) => a.hp === 0)) {
    awardExperience(s,`encounter:${s.sceneId}`,s.sceneId==='bell'?250:100);
    s.mode = "explore";
    s.turn = null;
    s.party.forEach((a) => {
      a.guard = false;
      a.aim = false;
    });
    if(expeditionRoom(s.sceneId)){
      s.flags[`${s.sceneId}:defendersDefeated`]=true;
      fact(s,`victory:${s.sceneId}`,`At ${baseScenes[s.sceneId].title}, the party defeated the defenders. The room’s consequential decision remains with the party.`);
      log(s,'The defenders fall. You can now choose either outcome without another check. Decide what happens here before continuing.');
    } else if (s.sceneId === "cookfire") {
      s.flags.passage = true;
      s.flags.guardsDefeated = true;
      s.inventory.guardKey = true;
      log(
        s,
        "The guards fall. You recover a prison key. Scrit flees deeper into the relay.",
      );
    } else {
      log(s, "Vark falls to one knee. The seal is yours to protect.");
      enterScene(s, "aftermath");
    }
    return true;
  }
  return false;
}
function nextTurn(s: Save) {
  if (!s.turn) return;
  const t = s.turn;
  s.turnIndex = (s.turnIndex + 1) % t.order.length;
  if (s.turnIndex === 0) t.round++;
  t.actorId = t.order[s.turnIndex]!;
  t.actionRemaining = true;
  t.movementM = 6;
  const a = allActors(s).find((x) => x.id === t.actorId);
  if (a) a.guard = false;
}
function strike(s: Save, a: Actor, b: Actor, dice: Dice) {
  const modifier =
    a.classId === "scout"
      ? a.attributes.agility
      : (a.classId === "adept" || a.classId === "cleric")
        ? a.attributes.insight
        : a.attributes.might;
  const sides =
    a.classId === "guardian" || a.classId === "vark"
      ? 8
      : a.classId === "goblin"
        ? 4
        : 6;
  const result = attackRoll(
    dice,
    modifier,
    b.defense + (b.guard ? 2 : 0),
    sides,
    a.aim,
    a.classId === "goblin" ? 1 : a.classId === "vark" ? 2 : modifier,
  );
  a.aim = false;
  b.hp = Math.max(0, b.hp - result.damage);
  log(
    s,
    `${a.name} attacks ${b.name}: ${result.hit ? `${result.damage} damage${b.hp === 0 ? "; downed" : ""}` : "miss"}.`,
    a.id,
    result.rolls,
  );
}
function heal(s: Save, a: Actor, b: Actor, dice: Dice, potion = false) {
  const r = damageRoll(dice, 6, 2, potion ? "Healing potion" : "Healing");
  const before = b.hp;
  b.hp = Math.min(b.maxHp, b.hp + r.total);
  if (potion) a.potions--;
  else a.focus--;
  log(s, `${a.name} restores ${b.hp - before} health to ${b.name}.`, a.id, [r]);
}
function moveToward(a: Actor, b: Actor, max = 6, stop = 1.2) {
  const d = distance(a, b);
  if (d <= stop) return;
  const travel = Math.min(max, d - stop);
  a.position = [
    a.position[0] + ((b.position[0] - a.position[0]) / d) * travel,
    a.position[1] + ((b.position[1] - a.position[1]) / d) * travel,
  ];
}
function autoTurns(s: Save, dice: Dice, skipHero = false) {
  let turns = 0;
  while (s.mode === "combat" && s.turn && turns++ < 100) {
    if (finishCheck(s)) return;
    const a = allActors(s).find((x) => x.id === s.turn!.actorId)!;
    if (a.id === "hero" && !skipHero) return;
    skipHero = false;
    if (a.hp > 0) {
      if (a.side === "party" && a.id !== "hero" && s.flags.retreatRequested) {
        const exit = {
          ...a,
          position: [a.id === "mira" ? -1 : 1, -3] as [number, number],
        };
        moveToward(a, exit, 6, 0);
        a.guard = true;
        log(s, `${a.name} moves toward the exit and guards.`, a.id);
        nextTurn(s);
        continue;
      }
      const planned = s.plans?.[a.id];
      if (planned) {
        delete s.plans![a.id];
        const [choice, targetId] = planned.split(":");
        const target = allActors(s).find((x) => x.id === targetId);
        let used = false;
        if (choice === "guard") {
          a.guard = true;
          log(s, `${a.name} chooses to guard.`, a.id, [], "ai");
          used = true;
        } else if (
          choice === "attack" &&
          target?.side === "enemy" &&
          target.hp > 0 &&
          distance(a, target) <= 6 + (a.classId === "scout" ? 8 : 1.5)
        ) {
          moveToward(a, target, 6, a.classId === "scout" ? 7 : 1.2);
          strike(s, a, target, dice);
          used = true;
        } else if (
          choice === "heal" &&
          a.classId === "guardian" &&
          a.focus > 0 &&
          target?.side === "party" &&
          target.hp < target.maxHp &&
          distance(a, target) <= 7.5
        ) {
          moveToward(a, target);
          heal(s, a, target, dice);
          used = true;
        }
        if (used) {
          log(s, `${a.name} followed an AI-selected legal action.`, a.id);
          if (finishCheck(s)) return;
          nextTurn(s);
          continue;
        }
        log(
          s,
          `${a.name}'s planned target changed; using a legal tactical fallback.`,
          a.id,
        );
      }
      const foes = (a.side === "party" ? s.enemies : s.party).filter(
        (x) => x.hp > 0,
      );
      const target = foes.sort(
        (x, y) => x.hp - y.hp || x.id.localeCompare(y.id),
      )[0]!;
      const hurt = s.party
        .filter((x) => x.hp < x.maxHp / 2)
        .sort((x, y) => x.hp - y.hp || x.id.localeCompare(y.id))[0];
      if (a.id === "oren" && a.focus > 0 && hurt) {
        moveToward(a, hurt);
        if (distance(a, hurt) <= 1.5) heal(s, a, hurt, dice);
        else {
          a.guard = true;
          log(s, `${a.name} guards while closing in.`, a.id);
        }
      } else {
        if (
          a.classId === "guardian" ||
          a.classId === "skeleton" || a.classId === "slime" || a.classId === "spider" ||
          a.classId === "goblin" ||
          a.classId === "vark"
        )
          moveToward(a, target);
        else if (distance(a, target) > 8) moveToward(a, target, 6, 7);
        if (
          distance(a, target) <=
          (a.classId === "scout" || (a.classId === "adept" || a.classId === "cleric") ? 8 : 1.5)
        )
          strike(s, a, target, dice);
        else {
          a.guard = true;
          log(s, `${a.name} guards.`, a.id);
        }
      }
    }
    if (finishCheck(s)) return;
    nextTurn(s);
    if (s.turn?.actorId === "hero" && s.party[0]!.hp === 0) return;
  }
  if (turns >= 100)
    throw new GameError(500, "TURN_LIMIT", "Combat could not advance safely.");
}
export function applyAction(original: Save, id: string, dice: Dice): Save {
 const result=resolveAction(original,id,dice);updateQuests(result,original);return result;
}
function resolveAction(original: Save, id: string, dice: Dice): Save {
  if(id.startsWith("checkin:"))return resolveCheckIn(original,id);
  if(id.startsWith("recover:"))return resolveExplorationHealing(original,id,dice);
  if(id.startsWith("side:"))return resolveSide(original,id);
  if(id.startsWith("quest:"))return declineQuest(original,id);
  if(original.tactical&&(id.startsWith('gear:')||id.startsWith('camp:')))return applyLogistics(original,id,dice);
  if(original.tactical&&original.mode==='combat')return applyTactical(original,id,dice);
  const result=applyLegacyAction(original,id,dice);grantLogisticsLoot(result,original);
  if(result.tactical&&result.mode!=='combat')for(const actor of result.party){const c=result.tactical.actors[actor.id];if(c.dead)actor.hp=0;c.hp=actor.hp;c.maxHp=actor.maxHp;if(c.hp>0)c.death={successes:0,failures:0,stable:false};if(c.hp===0)c.concentration=null;if(id==='rest'||id==='exp_rest'||id==='continue_campaign'){c.slots=[...c.maxSlots];c.hitDice=c.level;restoreClassResources(c);}}
  return result;
}
function applyLegacyAction(original: Save, id: string, dice: Dice): Save {
  const s = structuredClone(original);
  s.presentation = [];
  const option = legalActions(s).find((x) => x.id === id);
  if (!option)
    throw new GameError(
      422,
      "ILLEGAL_ACTION",
      "That action is not available in the current state.",
    );
  const h = s.party[0]!;
  const f = s.flags;
  const [kind, actorId] = id.split(":");
  const a = s.party.find((x) => x.id === actorId) ?? h;
  const leader = s.party.find((x) => x.hp > 0) ?? h;
  if(kind==='bond_begin'){
    const story=COMPANION_STORIES.find(story=>story.id===actorId)!;s.companionStoryId=story.id;log(s,story.opening,story.speaker,[],'authored');s.revision++;s.updatedAt=new Date().toISOString();return s;
  }
  if(kind==='bond_reply'){
    const story=COMPANION_STORIES.find(story=>story.id===s.companionStoryId)!;const choice=Number(actorId) as 0|1;
    log(s,story.responses[choice].label,'hero',[],'authored');log(s,story.responses[choice].answer,story.speaker,[],'authored');
    s.flags[`bond:${story.id}`]=true;s.companionStoryId=null;s.relationships[story.speaker]=Math.min(20,s.relationships[story.speaker]+1);
    const member=s.party.find(member=>member.id===story.speaker)!;if(story.speaker==='mira'){member.maxHp+=2;member.hp+=2;}else{member.maxFocus++;member.focus++;}
    s.facts.push({id:`bond:${story.id}`,text:story.memory[choice]});log(s,story.speaker==='mira'?`${member.name} gains Steady Nerves: +2 maximum health from your strengthened bond.`:`${member.name} gains Shared Resolve: +1 maximum focus from your strengthened bond.`,story.speaker);
    s.revision++;s.updatedAt=new Date().toISOString();return s;
  }
  if(kind==='continue_campaign'){
    s.ending=null;enterScene(s,'archive-1');s.party.forEach(member=>{member.hp=member.maxHp;member.focus=member.maxFocus;});
  } else if(kind.startsWith('exp_')) {
    const room=expeditionRoom(s.sceneId)!;const prefix=s.sceneId;
    approachTarget(s,option);
    if(kind==='exp_ally'){
      const help=availableConsequences(prefix,f).find(c=>c.id===actorId)!;f[`aid:${help.id}`]=true;
      if(help.effect==='supplies')s.party.forEach(member=>member.potions++);
      if(help.effect==='healing')s.party.forEach(member=>member.hp=member.maxHp);
      fact(s,'consequence:'+help.id,help.result);
    }
    else if(kind==='exp_evidence'){f[`${prefix}:evidence`]=true;fact(s,`evidence:${prefix}`,room.clue);}
    else if(kind==='exp_talk'){f[`${prefix}:talk`]=true;log(s,room.voice,room.voice.startsWith('Mira')?'mira':'oren',[],'authored');}
    else if(kind==='exp_supplies'){f[`${prefix}:supplies`]=true;s.party.forEach(member=>member.potions++);log(s,'The cache contains three healing potions. Each party member takes one.');}
    else if(kind==='exp_rest'){f[`${prefix}:rest`]=true;s.party.forEach(member=>{member.hp=member.maxHp;member.focus=member.maxFocus;});log(s,'The party shares a sheltered rest. Health and focus are restored.');}
    else if(kind==='exp_fight')startCombat(s,dice);
    else if(kind==='exp_choice'){
      const choice=Number(actorId) as 0|1;
      let success=true;
      if(choice===0&&!f[`${prefix}:defendersDefeated`]){f[`${prefix}:tried`]=true;const r=rollD20(dice,h.attributes[room.challenge]+Math.floor((s.level??1)/2),room.choice[0],!!f[`${prefix}:evidence`]);const dc=room.dc-campaignEffects(prefix,f).dcReduction;success=r.total>=dc;log(s,`${h.name}: ${room.choice[0]} ${success?'succeeded':'failed'} (${r.total} vs DC ${dc}).`,'hero',[r]);}
      if(success){f[`${prefix}:resolved`]=true;f[`${prefix}:choice:${choice}`]=true;fact(s,`decision:${prefix}`,room.outcomes[choice]);awardExperience(s,`room:${prefix}`,room.xp);s.relationships[choice===0?'mira':'oren']=Math.min(20,s.relationships[choice===0?'mira':'oren']+1);}
      else{const r=damageRoll(dice,6,0,'Setback');h.hp=Math.max(1,h.hp-r.total);log(s,`The attempt costs ${r.total} health. You can choose the alternative or confront the defenders.`,'hero',[r]);}
    }else if(kind==='exp_next'){
      const next=EXPEDITION[EXPEDITION.findIndex(r=>r.id===s.sceneId)+1];
      if(next)enterScene(s,next.id);else{s.mode='complete';s.ending=room.outcomes[f[`${prefix}:choice:0`]?0:1];log(s,'The descent is complete. Your choices remain in the journal.','dm',[],'authored');}
    }
    s.revision++;s.updatedAt=new Date().toISOString();return s;
  } else if (s.mode === "explore") approachTarget(s, option);
  if(kind==="continue_campaign"){s.revision++;s.updatedAt=new Date().toISOString();return s;}
  if (s.mode === "combat") {
    if (kind === "regroup") {
      s.flags.retreatRequested = true;
      log(
        s,
        "The party prepares to retreat. Companions will move to the entrance on their next turns.",
      );
    } else if (kind === "cancel_regroup") {
      delete s.flags.retreatRequested;
      log(s, "The party resumes its normal tactics.");
    } else if (kind === "attack") {
      strike(s, h, s.enemies.find((e) => e.id === actorId)!, dice);
      s.turn!.actionRemaining = false;
      finishCheck(s);
    } else if (kind === "heal") {
      heal(s, h, s.party.find((e) => e.id === actorId)!, dice);
      s.turn!.actionRemaining = false;
    } else if (kind === "potion") {
      heal(s, h, h, dice, true);
      s.turn!.actionRemaining = false;
    } else if (kind === "guard") {
      h.guard = true;
      s.turn!.actionRemaining = false;
      log(s, `${h.name} guards (+2 Defense).`, "hero");
    } else if (kind === "aim") {
      h.aim = true;
      s.turn!.actionRemaining = false;
      log(s, `${h.name} aims. The next attack has advantage.`, "hero");
    } else if (kind === "run") {
      s.turn!.movementM += 6;
      s.turn!.actionRemaining = false;
      log(s, `${h.name} runs: 6m additional movement.`, "hero");
    } else if (kind === "move") {
      const pos = movementAnchors(s).find((x) => x[0] === actorId)![1];
      s.turn!.movementM -= Math.hypot(
        pos[0] - h.position[0],
        pos[1] - h.position[1],
      );
      h.position = pos;
      log(
        s,
        `${h.name} moves to ${option.label.toLowerCase().replace("move to the ", "")}.`,
        "hero",
      );
    } else if (kind === "end_turn" || kind === "continue") {
      nextTurn(s);
      autoTurns(s, dice);
    } else if (kind === "retreat") {
      s.party.forEach((x) => {
        if (x.hp === 0) x.hp = 1;
      });
      enterScene(s, expeditionRoom(s.sceneId)?s.sceneId:s.sceneId === "cookfire" ? "hall" : "prison");
      log(s, "The party retreats and recovers its downed members.");
    }
  } else if (kind === "loot_cache") {s.flags[`cache:${s.sceneId}`]=true;h.potions++;log(s,"You find a sealed healing potion in the chest.");}
  else if (kind === "campheal")
    heal(s, a, s.party.find((x) => x.id === id.split(":")[2])!, dice);
  else if (kind === "potion") heal(s, h, h, dice, true);
  else
    switch (s.sceneId) {
      case "approach":
        if (kind === "tracks") {
          s.attempts.push(id);
          if (check(s, dice, a, "insight", 10, "inspect", "Read the tracks")) {
            f.tracks = true;
            fact(
              s,
              "captives",
              "The tracks show captives were marched alive into the relay.",
            );
          }
        } else if (kind === "rest") {
          s.party.forEach((a) => {
            a.rations--;
            a.hp = a.maxHp;
            a.focus = a.maxFocus;
          });
          s.ticks += 2;
          f.rested = true;
          log(
            s,
            "You share a meal and rest. Everyone recovers health and focus.",
          );
        } else enterScene(s, "hall");
        break;
      case "hall":
        if (kind === "inspect") {
          s.attempts.push(id);
          if (
            check(s, dice, a, "insight", 13, "inspect", "Inspect the floor")
          ) {
            f.plate = true;
            fact(
              s,
              "plate",
              "A pressure plate is connected to the wall slits. The side ledge avoids it.",
            );
          }
        } else if (kind === "chain") {
          s.attempts.push(id);
          if (check(s, dice, a, "insight", 10, "inspect", "Study the chain")) {
            f.maintenance = true;
            fact(
              s,
              "maintenance",
              "A relay diagram marks a maintenance entrance into the bell chamber.",
            );
          }
        } else if (kind === "disarm") {
          s.attempts.push(id);
          if (check(s, dice, a, "agility", 13, "disarm", "Disarm the plate")) {
            f.trapSpent = true;
            trust(s, "mira", "trap");
            log(s, "The counterweight settles. The plate is safe.");
          } else trap(s, a, dice);
        } else if (kind === "ledge") {
          s.ticks += 4;
          trust(s, "mira", "warning");
          enterScene(s, "cookfire");
        } else if (
          kind === "cautious" &&
          !f.plate &&
          !f.trapSpent &&
          !f.cautionTried
        ) {
          f.cautionTried = true;
          s.ticks += 2;
          if (
            check(
              s,
              dice,
              leader,
              "insight",
              13,
              "inspect",
              "Cautious crossing",
            )
          ) {
            f.plate = true;
            fact(
              s,
              "plate",
              "You halt at a hidden pressure plate. The side ledge avoids it.",
            );
          } else {
            trap(s, leader, dice);
            if(s.party.some(x=>x.hp>0))enterScene(s, "cookfire");
          }
        } else {
          s.ticks += kind === "quick" ? 1 : 2;
          if (!f.trapSpent) trap(s, leader, dice);
          if(s.party.some(x=>x.hp>0))enterScene(s, "cookfire");
        }
        break;
      case "cookfire":
        if (kind === "offer") {
          s.party.find((x) => x.rations > 0)!.rations--;
          f.fed = true;
          f.passage = true;
          f.sealKnowledge = true;
          s.inventory.guardKey = true;
          fact(
            s,
            "seal-purpose",
            "Scrit explains: the resonance seal suppresses a hungry force beneath the relay. Removing it carelessly would release that force.",
          );
          log(
            s,
            "Scrit takes the ration, then offers a key. “The courier is through there. Tell Vark we can still choose better.”",
            "scrit",
            [],
            "authored",
          );
          trust(s, "oren", "scrit");
        } else if (kind === "persuade") {
          if (
            check(s, dice, h, "presence", 13, "persuade", "Persuade the guards")
          ) {
            f.passage = true;
            s.inventory.guardKey = true;
            log(s, "The guards lower their spears and hand over the gate key.");
          } else {
            f.persuadeFailed = true;
            f.alarm = true;
          }
        } else if (kind === "distract") {
          f.distractTried = true;
          if (
            check(s, dice, h, "agility", 13, "distract", "Distract the guards")
          ) {
            f.passage = true;
            log(
              s,
              "Mira knocks a pot into the fire. You slip past while the guards stamp out the sparks.",
              "mira",
              [],
              "authored",
            );
          } else f.alarm = true;
        } else if (kind === "scrit-talk") {
          f.scritTalk = true;
          log(
            s,
            "“Caravans stopped. Everyone blames us,” Scrit says. “I just want my people to eat. Can you spare a ration?”",
            "scrit",
            [],
            "authored",
          );
        } else if (kind === "fight") startCombat(s, dice);
        else enterScene(s, "prison");
        break;
      case "prison":
        if (kind === "unlock") rescue(s);
        else if (kind === "pick") {
          f.pickTried = true;
          if (check(s, dice, h, "agility", 13, "pick", "Pick the gate"))
            rescue(s);
          else {
            s.ticks++;
            log(s, "The lock jams. You can still break the gate.");
          }
        } else if (kind === "force") {
          s.ticks++;
          f.alarm = true;
          rescue(s);
          log(
            s,
            "The gate breaks with a ringing crash. The bell chamber is alerted.",
          );
        } else if (kind === "ledger") {
          s.inventory.ledger = true;
          fact(
            s,
            "ledger",
            "The ledger points to the Drowned Archive beyond the relay: the next destination.",
          );
        } else enterScene(s, "bell");
        break;
      case "bell":
        if (kind === "negotiate") {
          if (
            check(
              s,
              dice,
              h,
              "presence",
              16,
              "persuade",
              "Negotiate the seal transfer",
            )
          ) {
            f.negotiated = true;
            trust(s, "oren", "vark");
            log(
              s,
              "Vark studies the courier’s testimony, then nods. Together, you transfer the seal without breaking its ward.",
              "dm",
              [],
              "authored",
            );
            enterScene(s, "aftermath");
          } else startCombat(s, dice);
        } else startCombat(s, dice, kind === "maintenance");
        break;
      case "aftermath":
        s.mode = "complete";
        s.inventory.seal = kind === "secure";
        s.ending =
          kind === "secure" ? "The Keepers of the Bell" : "A Promise Shared";
        log(
          s,
          kind === "secure"
            ? "You secure the resonance seal. Mira studies the ledger while Oren checks on the survivors. Beneath your feet, the road to the Drowned Archive waits. The first adventure is complete."
            : "Scrit accepts the watch with both hands. “We will keep it quiet,” he promises. Your party turns toward the Drowned Archive, leaving a former enemy as the relay’s guardian. The first adventure is complete.",
          "dm",
          [],
          "authored",
        );
        break;
    }
  if (s.party.every((x) => x.hp <= 0)) {
    s.mode = "defeat";
    s.turn = null;
    log(s, "The party falls. Restore a checkpoint to continue.");
  }
  s.revision++;
  s.updatedAt = new Date().toISOString();
  return s;
}
