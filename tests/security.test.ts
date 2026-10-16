import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { newGame } from "../lib/advanced-game.ts";
import { MAX_SAVE_CHARS, parseSaveJson } from "../lib/safe-json.ts";
import { parseSession, serialiseSession } from "../lib/session.ts";
import { isMessage, level, msg, resolveRef, say } from "../lib/i18n/message.ts";
import { interpolate, registered, translate, type MessageKey } from "../lib/i18n/index.ts";
import { ledgerCsv, parseLedger } from "../lib/ledger.ts";

test("untrusted saves have bounded structure and cannot carry prototype keys", () => {
  for (const key of ["__proto__", "constructor", "prototype"]) {
    assert.throws(() => parseSaveJson(`{"nested":{"${key}":{}}}`));
  }
  assert.throws(() => parseSaveJson(" ".repeat(MAX_SAVE_CHARS + 1)));
  assert.throws(() => parseSaveJson("[".repeat(34) + "0" + "]".repeat(34)));
  assert.throws(() => parseSaveJson(JSON.stringify(Array(5001).fill(0))));
  assert.deepEqual(parseSaveJson('{"message":"<script>text only</script>"}'), { message: "<script>text only</script>" });
  const sound = newGame(0, "training", () => 0);
  const saved = JSON.parse(serialiseSession(sound, true, false));
  for (const override of [{ difficulty: "constructor" }, { hypothesis: "toString" }, { campaignRoute: "toString" }, { caseTheory: "__proto__" }, { turns: [{ number: 1, raw: 10, modifier: 0, total: 10, procedure: "network", plan: { scope: "toString", intensity: "rapid" } }] }, { injectDeck: [999] }, { adversaryMemory: {} }, { hypothesisHistory: [null] }, { lastUsed: { email: {} } }]) {
    assert.equal(parseSession(JSON.stringify({ ...saved, game: { ...sound, ...override } })), null);
  }
  assert.ok(parseSession(JSON.stringify(saved)), "ordinary saves still migrate");
});

test("saved messages validate their entire tree before rendering", () => {
  for (const bad of [{ key: null }, { ref: [] }, { text: 4 }, { key: "legacy.text", params: { text: null } }, { key: "legacy.text", params: [] }, { text: "ok", form: "invalid" }, { key: "legacy.text", text: "ambiguous" }]) assert.equal(isMessage(bad), false);
  const cycle = { key: "legacy.text", params: {} as Record<string, unknown> };
  cycle.params.text = cycle;
  assert.equal(isMessage(cycle), false);
  const good = msg("legacy.text", { text: msg("legacy.text", { text: "<img src=x onerror=alert(1)>" }) });
  assert.ok(isMessage(good));
  assert.equal(say(good), "<img src=x onerror=alert(1)>", "text remains text for React to escape");
  for (const key of ["constructor", "toString", "__proto__"]) {
    assert.equal(registered(key), false);
    assert.equal(translate("en", key as MessageKey), key);
    assert.equal(resolveRef(`attacks.${key}`), undefined);
    assert.equal(say(level(key)), key);
  }
  assert.equal(interpolate("en", "{constructor} {toString}"), "{constructor} {toString}");
});

test("nested save records cannot fault evidence, history or response views", () => {
  const sound = newGame(0, "training", () => 0);
  const saved = JSON.parse(serialiseSession(sound, true, false));
  const malformed = [
    { evidence: [{ id: {}, turn: 1, confidence: "HIGH" }] },
    { evidence: [{ id: "E1-network", turn: 1, confidence: "invalid" }] },
    { correlations: [{}] },
    { correlations: [{ evidence: "E1-network" }] },
    { correlations: [{ evidence: ["missing", "other"] }] },
    { mapHistory: [{ node: {}, action: "monitor", turn: 1 }] },
    { hypothesisHistory: [{ turn: 1, id: "toString" }] },
    { caseTheoryHistory: [{ turn: 1, objective: "toString" }] },
    { turns: [{ number: 1, raw: {}, modifier: 0, total: 1, procedure: "network" }] },
    { status: "response", revealed: sound.chain, responseChoices: ["missing-choice"] },
  ];
  for (const override of malformed) assert.equal(parseSession(JSON.stringify({ ...saved, game: { ...sound, ...override } })), null);
});

test("CSV exports neutralise spreadsheet formulas from imported records", () => {
  for (const formula of ["=1+1", "+1+1", "-1+1", "@SUM(1)", "\t=1+1", "\r=1+1", "\n=1+1", "  =1+1"]) {
    const records = parseLedger([{ at: 0, scenario: 0, difficulty: "training", mode: formula, outcome: "won", score: 80, hypothesis: 5, stages: 4, turns: 8, code: formula }], 10);
    assert.equal(records.length, 1);
    const csv = ledgerCsv(records, () => "Case");
    assert.ok(csv.includes(`'${formula}`));
    assert.ok(!csv.includes(`,${formula},`));
  }
});

test("service worker isolates game caches and only stores public assets", async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const deleted: string[] = [];
  const opened: string[] = [];
  const puts: string[] = [];
  const cache = { match: async (key: unknown) => key === "/" ? "current shell" : undefined, put: async (request: { url: string }) => { puts.push(request.url); } };
  const scope = {
    URL, Response,
    self: { location: new URL("https://game.test/sw.js?v=test"), clients: { claim: async () => {} }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
    caches: { keys: async () => ["other-app", "breach-command-old", "breach-command-test"], delete: async (key: string) => { deleted.push(key); }, open: async (key: string) => { opened.push(key); return cache; } },
    fetch: async () => { throw new Error("offline"); },
  };
  const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  const api = runInNewContext(source + "\n({ cacheableRequest, worthCaching })", scope);
  let lifetime: Promise<unknown> = Promise.resolve();
  handlers.activate({ waitUntil: (promise: Promise<unknown>) => { lifetime = promise; } });
  await lifetime;
  assert.deepEqual(deleted, ["breach-command-old"]);
  const request = (path: string, mode = "cors", headers = {}) => ({ url: new URL(path, "https://game.test").href, method: "GET", mode, headers: new Headers(headers) });
  const response = { ok: true, status: 200, type: "basic", redirected: false, headers: new Headers() };
  for (const path of ["/_next/static/a.js", "/art/sectors/quiet-office.webp", "/audio/captain/reviewReading.mp3"]) assert.ok(api.worthCaching(request(path), response));
  for (const path of ["/api/session", "/private", "/_next/static/a.js?secret=1", "https://other.test/a.js"]) assert.equal(api.cacheableRequest(request(path)), false);
  for (const headers of [{ authorization: "Bearer private" }, { range: "bytes=0-10" }, { rsc: "1" }]) assert.equal(api.cacheableRequest(request("/", "navigate", headers)), false);
  for (const change of [{ status: 206 }, { redirected: true }, { headers: new Headers({ "cache-control": "private, max-age=60" }) }, { headers: new Headers({ "cache-control": "no-store" }) }]) assert.equal(api.worthCaching(request("/", "navigate"), { ...response, ...change }), false);
  assert.equal(api.worthCaching(request("/?locale=en-XA", "navigate"), response), false);
  let answer: Promise<unknown> = Promise.resolve();
  handlers.fetch({ request: request("/?locale=en-XA", "navigate"), waitUntil: (p: Promise<unknown>) => { lifetime = p; }, respondWith: (p: Promise<unknown>) => { answer = p; } });
  assert.equal(await answer, "current shell");
  await lifetime;
  assert.deepEqual(opened, ["breach-command-test"]);
  assert.deepEqual(puts, []);
  runInNewContext(source, { ...scope, fetch: async () => ({ ...response, clone: () => response }) });
  handlers.fetch({ request: request("/_next/static/loaded.js"), waitUntil: (p: Promise<unknown>) => { lifetime = p; }, respondWith: (p: Promise<unknown>) => { answer = p; } });
  await answer;
  await lifetime;
  assert.deepEqual(puts, ["https://game.test/_next/static/loaded.js"], "the lifetime promise includes successful cache writes");
});
