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
export interface GameLog {
  id: string;
  revision: number;
  speaker: Speaker | string;
  text: string;
  source: "authored" | "rules" | "ai";
  rolls: Roll[];
}
export interface PresentationFrame {
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
  check?: { dc: number; attribute: string };
}
export interface Entity {
  id: string;
  name: string;
  description: string;
  position: [number, number];
  open?: boolean;
  kind: "clue" | "door" | "npc" | "trap" | "exit" | "camp" | "seal";
}
export interface Scene {
  id: SceneId;
  title: string;
  subtitle: string;
  description: string;
  objective: string;
  entities: Entity[];
  index: number;
}
export interface PublicSave {
  xp?: number;
  level?: number;
  presentation?: PresentationFrame[];
  id: string;
  name: string;
  revision: number;
  schemaVersion: 1;
  rulesVersion: "echo-v1";
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
  checkpoints: { id: string; label: string }[];
  createdAt: string;
  updatedAt: string;
}
export interface CreateSaveRequest {
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
