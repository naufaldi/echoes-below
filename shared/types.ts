import type {ExpeditionId} from "./campaign.js";
export type ClassId = "guardian" | "scout" | "adept" | "cleric";
export type RaceId = "human" | "elf" | "dwarf" | "halfling";
export type BackgroundId = "delver" | "envoy" | "survivor";
export type SceneId =
  | "approach"
  | "hall"
  | "cookfire"
  | "prison"
  | "bell"
  | "aftermath"
  | ExpeditionId;
export type Mode = "explore" | "combat" | "defeat" | "complete";
export type Speaker = "dm" | "mira" | "oren";
export interface Actor {
  enemyRole?: import("./enemy-roles.js").EnemyRole;
  motion?:{id:string;points:[number,number][]};
  assetId?: import("./visual-identity.js").CharacterAssetId;
  raceId?: RaceId;
  id: string;
  name: string;
  classId: ClassId | "goblin" | "vark" | "skeleton" | "slime" | "spider";
  backgroundId: BackgroundId;
  appearanceId: string;
  side: "party" | "enemy";
  hp: number;
  maxHp: number;
  defense: number;
  focus: number;
  maxFocus: number;
  potions: number;
  rations: number;
  attributes: {
    might: number;
    agility: number;
    insight: number;
    presence: number;
  };
  position: [number, number];
  guard: boolean;
  aim: boolean;
}
export interface Roll {
  sides: number;
  values: number[];
  kept: number;
  modifier: number;
  total: number;
  purpose: string;
}
export type AnimationCue = "melee" | "ranged" | "spell" | "item" | "dodge";
/** The public numbers of one d20 roll that decided an outcome. `dc` is the armor class for an attack; for a save, `actorId` is the creature saving. */
export interface OutcomeCheck {kind:"check"|"attack"|"save";actorId:string;targetId?:string;skill:string;sides:number;natural:number;modifier:number;total:number;dc:number;success:boolean;critical?:true;advantage?:true;disadvantage?:true;xp?:number}
export interface GameLog {
  /** Story-only consequence of the roll: no numbers, verdicts or XP. Absent on older saves; fall back to `text`. */
  prose?: string;
  check?: OutcomeCheck;
  actionKind?: 'reaction';
  animation?: AnimationCue;
  speakerName?: string;
  id: string;
  revision: number;
  speaker: Speaker | string;
  text: string;
  source: "authored" | "rules" | "ai";
  rolls: Roll[];
}
export interface PresentationFrame {
  tactical?: import("./tactical-state.js").TacticalState;
  mode?: Mode;
  turn?: PublicSave["turn"];
  actorId: string;
  sceneId: SceneId;
  party: Actor[];
  enemies: Actor[];
  log: GameLog;
}
export interface ActionOption {
  id: string;
  label: string;
  description: string;
  targetId?: string;
  actorId?: string;
  kind: string;
  dangerous?: boolean;
  check?: PublicCheck;
}
/** Everything the odds band needs, derived from public numbers only. `dc` is the defense for an attack. Older or interpreted options may carry only `dc` and `attribute`. */
export interface PublicCheck {
  dc: number;
  attribute: string;
  /** Total flat bonus; the sum of `parts`. */
  modifier?: number;
  parts?: { label: string; value: number }[];
  /** Why the roll has advantage or disadvantage (e.g. "Help", "Guarded"). */
  advantage?: string;
  disadvantage?: string;
  /** An extra die added to the total, such as Bless's d4. */
  bonusDie?: number;
  /** Attacks only: a natural roll at or above this always succeeds and a natural 1 always fails. Checks have no natural rules. */
  critOn?: number;
  /** How much help already lowered `dc`. */
  dcHelp?: number;
}
export interface Entity {
  elevation?: number;
  appearanceId?: string;
  modelClassId?: Actor['classId'];
  id: string;
  name: string;
  description: string;
  position: [number, number];
  open?: boolean;
  kind: "clue" | "door" | "npc" | "trap" | "exit" | "camp" | "seal";
}
export interface Scene {
  inkGarden?: {sleeved:boolean;ready:boolean;departed:boolean;lanternTaken:boolean};
  infirmary?: {braced:boolean;drained:boolean;rescued:boolean};
  bellIndex?: {read:boolean;solved:boolean;sequence:import("./bell-index.js").IndexPlate[]};
  counterweight?:{pawlReleased:boolean;weightSeated:boolean;locked:boolean};
  id: SceneId;
  title: string;
  subtitle: string;
  description: string;
  objective: string;
  entities: Entity[];
  index: number;
}
export interface PublicSave {
  /** Client presentation only; never a pending rules action. */
  activeReaction?: string;
  tacticalProposal?:{actorId:string;directive:string;actions:ActionOption[]};
  quests?: import("./quests.js").QuestProgress[];
  logistics?: import("./logistics.js").Logistics;
  companionStoryId?: string | null;
  xp?: number;
  level?: number;
  presentation?: PresentationFrame[];
  id: string;
  name: string;
  revision: number;
  schemaVersion: 1;
  rulesVersion: "echo-v1" | "curated-srd-5.2.1-v1";
  tactical?: import("./tactical-state.js").TacticalState;
  contentVersion: "briarwatch-1";
  mode: Mode;
  scene: Scene;
  party: Actor[];
  enemies: Actor[];
  actions: ActionOption[];
  logs: GameLog[];
  facts: { id: string; text: string }[];
  relationships: { mira: number; oren: number };
  ticks: number;
  turn: null | {
    actorId: string;
    round: number;
    order: string[];
    movementM: number;
    actionRemaining: boolean;
  };
  inventory: { guardKey: boolean; ledger: boolean; seal: boolean };
  ending: string | null;
  /** #69: present only on a completed descent whose ending names its title. */
  recap?: import("./endings.js").CampaignRecap;
  checkpoints: { id: string; label: string }[];
  createdAt: string;
  updatedAt: string;
}
export interface CompanionSetup {classId:ClassId;raceId:RaceId;appearanceId:'ember'|'moss'|'moon';}
export interface CreateSaveRequest {
  rulesVersion?: "echo-v1" | "curated-srd-5.2.1-v1";
  companions?: {mira:CompanionSetup;oren:CompanionSetup};
  raceId?: RaceId;
  name: string;
  classId: ClassId;
  backgroundId: BackgroundId;
  appearanceId: "ember" | "moss" | "moon";
}
export interface ActionRequest {
  commandId: string;
  expectedRevision: number;
  actionId: string;
}
export interface Preview {
  previewId: string;
  saveId: string;
  revision: number;
  action: ActionOption;
  expiresAt: string;
}
export interface Dialogue {
  id: string;
  speaker: Speaker;
  text: string;
  source: "ai";
  createdAt: string;
}
export interface ApiError {
  error: string;
  message: string;
  currentRevision?: number;
}
