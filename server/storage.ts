import { DatabaseSync } from "node:sqlite";
import { randomUUID, createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { GameError, publicSave, sceneTitle, assertSaveVersion, type Save } from "./game.js";
import type { PublicSave, Preview, Dialogue } from "../shared/types.js";
export class Storage {
  db: DatabaseSync;
  readonly limits: { hourUsd: number; campaignUsd: number };
  constructor(path: string) {
    const limit = (raw: string | undefined, max: number) => {
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? Math.min(n, max) : max;
    };
    this.limits = {
      hourUsd: limit(process.env.AI_HOURLY_LIMIT_USD, 2),
      campaignUsd: limit(process.env.AI_CAMPAIGN_LIMIT_USD, 25),
    };
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db
      .exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS saves (id TEXT PRIMARY KEY, snapshot TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS commands (id TEXT PRIMARY KEY, save_id TEXT NOT NULL, hash TEXT NOT NULL, result TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS previews (id TEXT PRIMARY KEY, value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS checkpoints (id TEXT PRIMARY KEY, save_id TEXT NOT NULL, label TEXT NOT NULL, snapshot TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS dialogues (id TEXT PRIMARY KEY, save_id TEXT NOT NULL, value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS conversation_exchanges (id TEXT PRIMARY KEY, save_id TEXT NOT NULL, speaker TEXT NOT NULL, player_text TEXT NOT NULL, reply_text TEXT NOT NULL, created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS audio (id TEXT PRIMARY KEY, bytes BLOB NOT NULL);
 CREATE TABLE IF NOT EXISTS usage (id TEXT PRIMARY KEY,save_id TEXT NOT NULL, created_ms INTEGER NOT NULL,cost REAL NOT NULL,role TEXT NOT NULL,status TEXT NOT NULL);
 `);
    // Older saves stored the reply only. Preserve it without inventing a player utterance.
    this.db.exec(
      `INSERT OR IGNORE INTO conversation_exchanges SELECT id,save_id,json_extract(value,'$.speaker'),'',json_extract(value,'$.text'),json_extract(value,'$.createdAt') FROM dialogues`,
    );
  }
  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const value = fn();
      this.db.exec("COMMIT");
      return value;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  read(id: string): Save {
    const row = this.db
      .prepare("SELECT snapshot FROM saves WHERE id=?")
      .get(id);
    if (!row) throw new GameError(404, "NOT_FOUND", "Save not found.");
    const s = JSON.parse(row.snapshot as string) as Save;
    assertSaveVersion(s);
    return s;
  }
  put(s: Save) {
    this.db
      .prepare(
        "INSERT INTO saves(id,snapshot) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot",
      )
      .run(s.id, JSON.stringify(s));
  }
  checkpoint(s: Save, label: string) {
    const id = randomUUID();
    s.checkpointIds.push({ id, label });
    this.db
      .prepare("INSERT INTO checkpoints VALUES(?,?,?,?)")
      .run(id, s.id, label, JSON.stringify(s));
  }
  list() {
    return this.db
      .prepare("SELECT snapshot FROM saves")
      .all()
      .map((row) => {
        const s = JSON.parse(row.snapshot as string) as Save;
        return {
          id: s.id,
          name: s.name,
          sceneTitle: sceneTitle(s.sceneId),
          mode: s.mode,
          updatedAt: s.updatedAt,
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  duplicate(id: string, saveId: string, payload: unknown): PublicSave | null {
    const row = this.db.prepare("SELECT * FROM commands WHERE id=?").get(id);
    if (!row) return null;
    if (row.save_id !== saveId || row.hash !== this.hash(payload))
      throw new GameError(
        409,
        "COMMAND_REUSED",
        "This command ID was already used for a different action.",
      );
    return JSON.parse(row.result as string);
  }
  hash(value: unknown) {
    return createHash("sha256").update(JSON.stringify(value)).digest("hex");
  }
  commit(id: string, s: Save, payload: unknown, result: PublicSave) {
    this.put(s);
    this.db
      .prepare("INSERT INTO commands VALUES(?,?,?,?)")
      .run(id, s.id, this.hash(payload), JSON.stringify(result));
  }
  addPreview(p: Preview) {
    this.db
      .prepare("INSERT INTO previews VALUES(?,?)")
      .run(p.previewId, JSON.stringify(p));
  }
  preview(id: string): Preview {
    const row = this.db
      .prepare("SELECT value FROM previews WHERE id=?")
      .get(id);
    if (!row) throw new GameError(404, "NOT_FOUND", "Preview not found.");
    return JSON.parse(row.value as string);
  }
  restore(saveId: string, id: string) {
    const row = this.db
      .prepare("SELECT snapshot FROM checkpoints WHERE id=? AND save_id=?")
      .get(id, saveId);
    if (!row) throw new GameError(404, "NOT_FOUND", "Checkpoint not found.");
    const s = JSON.parse(row.snapshot as string) as Save;
    s.campaignId = s.campaignId ?? s.id;
    s.id = randomUUID();
    s.revision = 0;
    s.checkpointIds = [];
    s.createdAt = s.updatedAt = new Date().toISOString();
    s.logs.push({
      id: randomUUID(),
      revision: 0,
      speaker: "dm",
      text: "You return to an earlier moment. The road you left stays where it was.",
      source: "rules",
      rolls: [],
    });
    return this.transaction(() => {
      this.checkpoint(s, "Restored checkpoint");
      this.put(s);
      return publicSave(s);
    });
  }
  dialogue(d: Dialogue, saveId: string, playerText: string) {
    this.transaction(() => {
      this.db
        .prepare("INSERT INTO dialogues VALUES(?,?,?)")
        .run(d.id, saveId, JSON.stringify(d));
      this.db
        .prepare("INSERT INTO conversation_exchanges VALUES(?,?,?,?,?,?)")
        .run(d.id, saveId, d.speaker, playerText, d.text, d.createdAt);
    });
  }
  conversation(saveId: string, speaker: Dialogue["speaker"]) {
    return this.dialogueHistory(saveId, speaker, 6);
  }
  dialogueHistory(saveId: string, speaker?: Dialogue["speaker"], limit = 50) {
    const statement = this.db.prepare(
      `SELECT id,speaker,player_text,reply_text,created_at FROM conversation_exchanges WHERE save_id=? ${speaker ? "AND speaker=?" : ""} ORDER BY rowid DESC LIMIT ?`,
    );
    const rows = speaker
      ? statement.all(saveId, speaker, limit)
      : statement.all(saveId, limit);
    return rows
      .reverse()
      .map((row) => ({
        id: row.id as string,
        speaker: row.speaker as Dialogue["speaker"],
        playerText: row.player_text as string,
        replyText: row.reply_text as string,
        createdAt: row.created_at as string,
      }));
  }
  readDialogue(id: string): { dialogue: Dialogue; saveId: string } {
    const row = this.db.prepare("SELECT * FROM dialogues WHERE id=?").get(id);
    if (!row) throw new GameError(404, "NOT_FOUND", "Dialogue not found.");
    return {
      dialogue: JSON.parse(row.value as string),
      saveId: row.save_id as string,
    };
  }
  usage(saveId: string) {
    return this.usageFor(this.read(saveId).campaignId ?? saveId);
  }
  private usageFor(campaignId: string) {
    const campaign = Number(
      this.db
        .prepare(
          "SELECT COALESCE(SUM(cost),0) AS cost FROM usage WHERE save_id=?",
        )
        .get(campaignId)!.cost,
    );
    const hour = Number(
      this.db
        .prepare(
          "SELECT COALESCE(SUM(cost),0) AS cost FROM usage WHERE created_ms>?",
        )
        .get(Date.now() - 3600000)!.cost,
    );
    return {
      campaignUsd: campaign,
      hourUsd: hour,
      limits: this.limits,
      warning: campaign >= this.limits.campaignUsd * 0.6,
    };
  }
  reserve(saveId: string, cost: number, role: string) {
    return this.transaction(() => {
      const campaignId = this.read(saveId).campaignId ?? saveId;
      const u = this.usageFor(campaignId);
      if (
        u.campaignUsd + cost > this.limits.campaignUsd ||
        u.hourUsd + cost > this.limits.hourUsd
      )
        throw new GameError(
          429,
          "BUDGET_EXCEEDED",
          "AI dialogue has paused at its spending limit. Your adventure goes on without it.",
        );
      const id = randomUUID();
      this.db
        .prepare("INSERT INTO usage VALUES(?,?,?,?,?,?)")
        .run(
          id,
          campaignId,
          Date.now(),
          cost,
          role,
          "reserved",
        );
      return id;
    });
  }
  settle(id: string, cost?: number) {
    if (cost !== undefined)
      this.db
        .prepare("UPDATE usage SET cost=?,status='settled' WHERE id=?")
        .run(cost, id);
    else
      this.db.prepare("UPDATE usage SET status='uncertain' WHERE id=?").run(id);
  }
  close() {
    this.db.close();
  }
}
