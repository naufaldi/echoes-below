import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { buildApp } from "../server/app.js";
test("creation, revision, command retry and peaceful six-scene ending survive read", async () => {
  const app = await buildApp({
    database: ":memory:",
    dice: (sides) => sides,
    ai: false,
  });
  const token = (await app.inject({ url: "/api/session" })).json().csrfToken;
  const post = async (url: string, payload: Record<string, unknown>) =>
    app.inject({
      method: "POST",
      url,
      headers: { "x-csrf-token": token },
      payload,
    });
  let res = await post("/api/saves", {
    name: "Ash",
    classId: "adept",
    backgroundId: "envoy",
    appearanceId: "moon",
  });
  assert.equal(res.statusCode, 200);
  let s = res.json();
  const act = async (actionId: string) => {
    const body = {
      commandId: randomUUID(),
      expectedRevision: s.revision,
      actionId,
    };
    const r = await post(`/api/saves/${s.id}/actions`, body);
    assert.equal(r.statusCode, 200, r.body);
    s = r.json();
    return body;
  };
  const first = await act("tracks:hero");
  const duplicate = await post(`/api/saves/${s.id}/actions`, first);
  assert.deepEqual(duplicate.json(), s);
  const stale = await post(`/api/saves/${s.id}/actions`, {
    ...first,
    commandId: randomUUID(),
  });
  assert.equal(stale.statusCode, 409);
  for (const id of [
    "enter",
    "ledge",
    "offer",
    "prison",
    "unlock",
    "ledger",
    "bell",
    "negotiate",
    "entrust",
  ])
    await act(id);
  assert.equal(s.mode, "complete");
  assert.equal(s.ending, "A Promise Shared");
  assert.equal(s.party[0].classId, "adept");
  assert.equal(
    s.facts.some((f: any) => f.id === "courier"),
    true,
  );
  assert.deepEqual((await app.inject({ url: `/api/saves/${s.id}` })).json(), s);
  assert.equal(
    (
      await post("/api/saves", {
        name: "x",
        classId: "rogue",
        backgroundId: "envoy",
        appearanceId: "moon",
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (await app.inject({ method: "POST", url: "/api/saves", payload: {} }))
      .statusCode,
    403,
  );
  await app.close();
});
