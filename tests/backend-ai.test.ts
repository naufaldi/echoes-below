import { test } from "node:test";
import assert from "node:assert/strict";
import { Storage } from "../server/storage.js";
import { OpenAIProvider } from "../server/ai.js";
import { createSave } from "../server/game.js";
const hero = {
  name: "Ash",
  classId: "guardian" as const,
  backgroundId: "envoy" as const,
  appearanceId: "moss" as const,
};
test("AI dialogue and cached voice use persisted public text, never mutate game facts", async () => {
  const db = new Storage(":memory:");
  const s = createSave(hero);
  db.put(s);
  const before = structuredClone(db.read(s.id));
  const originalFetch = globalThis.fetch;
  let calls = 0;
  let sent = "";
  globalThis.fetch = async (_url, init) => {
    calls++;
    sent = String(init?.body);
    if (String(_url).endsWith("/audio/speech"))
      return new Response(Buffer.from("mock-mp3"), { status: 200 });
    return Response.json({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                text: "Those tracks may tell us more than the broken cart.",
                factIds: [],
              }),
            },
          ],
        },
      ],
      usage: { input_tokens: 100, output_tokens: 30 },
    });
  };
  try {
    const provider = new OpenAIProvider(db, "test-not-a-real-key");
    const dialogue = await provider.dialogue(s, "mira", "What do you see?");
    assert.equal(dialogue.source, "ai");
    assert.equal(sent.includes("sealKnowledge"), false);
    assert.equal(sent.includes("resonance seal suppresses"), false);
    const first = await provider.audio(dialogue.id);
    const second = await provider.audio(dialogue.id);
    assert.deepEqual(first, second);
    assert.equal(calls, 2);
    assert.equal(sent.includes(dialogue.text), true);
    assert.deepEqual(db.read(s.id), before);
    assert.ok(db.usage(s.id).campaignUsd > 0);
  } finally {
    globalThis.fetch = originalFetch;
    db.close();
  }
});
test("unknown AI fact references are rejected and unavailable AI stays unavailable", async () => {
  const db = new Storage(":memory:");
  const s = createSave(hero);
  db.put(s);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                text: "An invented discovery.",
                factIds: ["secret-boss-fact"],
              }),
            },
          ],
        },
      ],
      usage: { input_tokens: 100, output_tokens: 30 },
    });
  try {
    await assert.rejects(
      new OpenAIProvider(db, "fake-test-key").dialogue(
        s,
        "oren",
        "Tell me secrets",
      ),
      /knowledge validation/,
    );
    await assert.rejects(
      new OpenAIProvider(db, "").dialogue(s, "oren", "Hello"),
      /not configured/,
    );
    assert.equal(db.read(s.id).revision, 0);
  } finally {
    globalThis.fetch = originalFetch;
    db.close();
  }
});
test("audio duration is verified from bytes, not the claimed client duration", async () => {
  const db = new Storage(":memory:");
  const s = createSave(hero);
  db.put(s);
  const seconds = 32,
    rate = 8000;
  const pcm = Buffer.alloc(44 + seconds * rate * 2);
  pcm.write("RIFF", 0);
  pcm.writeUInt32LE(pcm.length - 8, 4);
  pcm.write("WAVEfmt ", 8);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(rate, 24);
  pcm.writeUInt32LE(rate * 2, 28);
  pcm.writeUInt16LE(2, 32);
  pcm.writeUInt16LE(16, 34);
  pcm.write("data", 36);
  pcm.writeUInt32LE(pcm.length - 44, 40);
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw Error("Must not bill");
  };
  try {
    await assert.rejects(
      new OpenAIProvider(db, "fake-test-key").transcribe(
        s.id,
        pcm,
        "audio/wav",
        1,
      ),
      /no more than 30 seconds/,
    );
    assert.equal(called, false);
    assert.equal(db.usage(s.id).campaignUsd, 0);
  } finally {
    globalThis.fetch = originalFetch;
    db.close();
  }
});
