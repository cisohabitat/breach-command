// Splits the stylesheet by when it is needed. A rule that can style anything
// the assignment screen shows stays in app/globals.css, which the page links
// and waits for; every other rule moves to components/game/game.css, which
// loads with the game bundle (lib/game-loader.ts). Order is kept inside each
// file. Run against a production server, from a stylesheet that is still one
// file:  node scripts/split-css.ts http://localhost:3200
//
// A rule stays when any selector in it, with its pseudo-classes, pseudo-
// elements and attribute conditions removed, matches an element in any of the
// states the assignment screen can be in: at four widths, first visit and
// returning, with a saved operation, with notices, in the pseudo-locale, with
// every fold open, and with the placeholder the page shows while the game
// loads. Removing those conditions only widens a selector, so a rule for a
// hover, a focus or a pressed state of something on the assignment screen
// stays with it.
import { readFileSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";
import { newGame } from "../lib/advanced-game.ts";
import { serialiseSession } from "../lib/session.ts";
import { SESSION_KEY } from "../lib/session-keys.ts";
import { LAST_OPERATION_KEY } from "../lib/last-operation.ts";
import { LEDGER_KEY } from "../lib/ledger.ts";
import { CAMPAIGN_KEY, defaultCampaign } from "../lib/campaign.ts";
import { msg, ref } from "../lib/i18n/message.ts";
import { commandEvents, sectorSetPieces, type Game } from "../lib/advanced-game.ts";
import { pendingDecisionGame, responsePhaseGame, twoStagesGame } from "../tests/e2e/fixtures.ts";

type Item = { kind: "comment" | "rule" | "at" | "block"; text: string; selector?: string; prelude?: string; children?: Item[] };

// The stylesheet as top-level items, and the rules inside @media and @supports.
function parse(source: string, nested = false): Item[] {
  const items: Item[] = [];
  let i = 0;
  while (i < source.length) {
    while (i < source.length && /\s/.test(source[i])) i++;
    if (i >= source.length) break;
    const start = i;
    if (source.startsWith("/*", i)) {
      const end = source.indexOf("*/", i) + 2;
      items.push({ kind: "comment", text: source.slice(start, end) });
      i = end;
      continue;
    }
    // Up to the rule's brace or the at-rule's semicolon, skipping strings.
    let j = i;
    let quote = "";
    while (j < source.length) {
      const c = source[j];
      if (quote) { if (c === quote) quote = ""; }
      else if (c === "\"" || c === "'") quote = c;
      else if (c === "{" || c === ";") break;
      j++;
    }
    if (source[j] === ";") { items.push({ kind: "at", text: source.slice(start, j + 1) }); i = j + 1; continue; }
    let depth = 1;
    let k = j + 1;
    quote = "";
    while (k < source.length && depth) {
      const c = source[k];
      if (quote) { if (c === quote) quote = ""; }
      else if (c === "\"" || c === "'") quote = c;
      else if (source.startsWith("/*", k)) { k = source.indexOf("*/", k) + 2; continue; }
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      k++;
    }
    const prelude = source.slice(start, j).trim();
    const text = source.slice(start, k);
    if (!nested && /^@(media|supports)\b/.test(prelude)) items.push({ kind: "block", text, prelude, children: parse(source.slice(j + 1, k - 1), true) });
    else if (prelude.startsWith("@")) items.push({ kind: "at", text });
    else items.push({ kind: "rule", text, selector: prelude });
    i = k;
  }
  return items;
}

// Top-level commas only: :is(.a, .b) is one selector.
function selectors(list: string) {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const c of list) {
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === "," && !depth) { out.push(current.trim()); current = ""; } else current += c;
  }
  out.push(current.trim());
  return out.filter(Boolean);
}

function widen(selector: string) {
  let s = selector;
  for (let previous = ""; previous !== s;) { previous = s; s = s.replace(/::?[a-zA-Z-]+(\((?:[^()]|\([^()]*\))*\))?/g, ""); }
  s = s.replace(/\[[^\]]*\]/g, "");
  s = s.replace(/\s*([>+~])\s*(?=[>+~]|$)/g, " ").replace(/^\s*[>+~]\s*/, "").replace(/\s*[>+~]\s*$/, "").trim();
  return s.split(/\s+/).filter(part => part && !/^[>+~]$/.test(part)).length ? s : "*";
}

const base = process.argv[2] ?? "http://localhost:3200";
const sheet = readFileSync("app/globals.css", "utf8");
const items = parse(sheet);
const rules = items.flatMap(item => item.kind === "rule" ? [item] : item.kind === "block" ? item.children!.filter(child => child.kind === "rule") : []);
const widened = rules.map(rule => selectors(rule.selector!).map(widen));
const needed = new Set<number>();

async function collect(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll("details").forEach(details => { details.open = true; });
    // What the page shows between choosing to play and the game's script arriving.
    const placeholder = document.createElement("main");
    placeholder.className = "game-screen game-loading";
    placeholder.innerHTML = "<h1>Opening the operation</h1>";
    document.body.append(placeholder);
  });
  const matched: number[] = await page.evaluate(lists => lists.flatMap((list, index) => list.some(selector => { try { return !!document.querySelector(selector); } catch { return true; } }) ? [index] : []), widened);
  for (const index of matched) needed.add(index);
}

const won = { scenario: 0, difficulty: "training", outcome: "won", ending: msg("record.endingStoodDown"), score: 82, endedAt: Date.UTC(2026, 9, 1), next: { scenario: 1, difficulty: "operational", title: msg("record.nextTitle", { number: 2, title: ref("scenarios.care-network.title"), difficulty: ref("difficulties.operational.title") }), reason: msg("record.clearedOperational", { score: 82 }) } };
const entry = { at: Date.UTC(2026, 9, 1), scenario: 0, difficulty: "training", mode: "standard", outcome: "won", score: 82, hypothesis: 8, stages: 4, turns: 9, code: null };
const finished = { ...defaultCampaign, completed: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], xp: 900, operations: 12, leadershipTrust: 80, readiness: 80 };
const states: { name: string; storage: Record<string, string>; path?: string; then?: (page: Page) => Promise<void> }[] = [
  { name: "first visit", storage: {} },
  { name: "tutorial done", storage: { "breach-command.tutorial-complete": "true" } },
  { name: "saved operation", storage: { "breach-command.tutorial-complete": "true", [SESSION_KEY]: serialiseSession(newGame(0, "training", () => 0), false, false) } },
  { name: "returning", storage: { "breach-command.tutorial-complete": "true", [LAST_OPERATION_KEY]: JSON.stringify(won), [LEDGER_KEY]: JSON.stringify([entry, { ...entry, outcome: "lost", score: 40 }]) } },
  { name: "campaign finished", storage: { "breach-command.tutorial-complete": "true", [CAMPAIGN_KEY]: JSON.stringify(finished) } },
  { name: "unreadable save", storage: { "breach-command.tutorial-complete": "true", [SESSION_KEY]: "{not json" } },
  { name: "pseudo-locale", storage: { "breach-command.tutorial-complete": "true" }, path: "/?locale=en-XA" },
  { name: "options chosen", storage: { "breach-command.tutorial-complete": "true" }, then: async page => {
    for (const button of await page.locator(".briefing-screen button:not([disabled])").all()) {
      const label = (await button.innerText().catch(() => "")).trim();
      if (/settings|guide|new incident|begin|resume|download/i.test(label)) continue;
      await button.click({ timeout: 1000 }).catch(() => {});
    }
  } },
];

// Optional, as in playwright.config.ts, for a machine with its own Chromium.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
for (const width of [320, 390, 820, 1280]) {
  for (const state of states) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.setDefaultTimeout(15000);
    console.log(`assignment screen: ${state.name} at ${width}`);
    await page.addInitScript(storage => { try { localStorage.clear(); for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); } catch { /* storage refused */ } }, state.storage);
    await page.goto(base + (state.path ?? "/"), { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await state.then?.(page);
    await page.waitForTimeout(200);
    await collect(page);
    await page.close();
  }
}

// The second pass reads the game's own screens. In one stylesheet a rule kept
// for the assignment screen that came after a moved rule won wherever both
// applied; with the game's styles loading after the page's it would lose. So a
// copy of it goes into the game's sheet at its place, wherever both rules match
// one element on a game screen and set a property of the same family
// ("margin" and "margin-top"). The copy then sits after kept rules that used to
// follow it, so the condition is transitive: walking the rules in order, a kept
// rule is copied when any earlier rule already in the game's sheet, moved or
// copied, overlaps it. Copying where it is not needed costs bytes, not pixels,
// so the matching is the same widened one.
const family = (name: string) => name.replace(/^-(webkit|moz|ms)-/, "").split("-")[0];
const properties = rules.map(rule => new Set(rule.text.slice(rule.text.indexOf("{") + 1, rule.text.lastIndexOf("}")).replace(/\/\*[\s\S]*?\*\//g, "").split(";").map(part => part.split(":")[0].trim().toLowerCase()).filter(Boolean).map(family)));
const copied = new Set<number>();
const screens: number[][][] = [];
async function collectGame(page: Page) {
  await page.evaluate(() => document.querySelectorAll("details").forEach(details => { details.open = true; }));
  const matches: number[][] = await page.evaluate(lists => {
    const all = [...document.querySelectorAll("*")];
    const index = new Map(all.map((element, position) => [element, position]));
    return lists.map(list => {
      const found = new Set<number>();
      for (const selector of list) { try { document.querySelectorAll(selector).forEach(element => found.add(index.get(element)!)); } catch { /* not a selector the browser reads */ } }
      return [...found];
    });
  }, widened);
  screens.push(matches);
}
function decideCopies() {
  const inGame = (index: number) => !needed.has(index) || copied.has(index);
  for (let kept = 0; kept < rules.length; kept++) {
    if (!needed.has(kept)) continue;
    for (const matches of screens) {
      if (!matches[kept].length) continue;
      const elements = new Set(matches[kept]);
      const overlaps = (earlier: number) => inGame(earlier) && matches[earlier].length > 0 && [...properties[earlier]].some(name => properties[kept].has(name)) && matches[earlier].some(element => elements.has(element));
      let found = false;
      for (let earlier = 0; earlier < kept && !found; earlier++) found = overlaps(earlier);
      if (found) { copied.add(kept); break; }
    }
  }
}
async function openGame(page: Page, game: Game) {
  page.setDefaultTimeout(15000);
  await page.addInitScript(save => { try { localStorage.clear(); localStorage.setItem("breach-command.tutorial-complete", "true"); localStorage.setItem("breach-command.session", save); } catch { /* storage refused */ } }, serialiseSession(game, false, false));
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForTimeout(600);
}
const pause = (page: Page) => page.waitForTimeout(400);
for (const width of [320, 390, 820, 1280]) {
  console.log(`game screens at ${width}`);
  let page = await browser.newPage({ viewport: { width, height: 900 } });
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => { try { localStorage.clear(); localStorage.setItem("breach-command.tutorial-complete", "true"); } catch { /* storage refused */ } });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  for (const name of ["Game settings", "Field guide"]) { await page.getByRole("button", { name }).click(); await pause(page); await collectGame(page); await page.keyboard.press("Escape"); await pause(page); }
  await page.close();
  page = await browser.newPage({ viewport: { width, height: 900 } });
  await openGame(page, twoStagesGame());
  await collectGame(page);
  await page.keyboard.press("Escape"); await pause(page); await collectGame(page);
  for (const tab of [0, 1, 2]) { await page.locator(".workspace-tabs > button").nth(tab).click(); await pause(page); await collectGame(page); }
  await page.getByRole("button", { name: "New incident" }).click(); await pause(page); await collectGame(page);
  await page.close();
  for (const game of [pendingDecisionGame(), { ...twoStagesGame(), pendingSetPiece: sectorSetPieces[twoStagesGame().scenario].id }, { ...twoStagesGame(), pendingCommand: Object.keys(commandEvents)[0] as keyof typeof commandEvents }]) {
    page = await browser.newPage({ viewport: { width, height: 900 } });
    await openGame(page, game);
    await collectGame(page);
    await page.keyboard.press("Escape"); await pause(page); await collectGame(page);
    await page.close();
  }
  page = await browser.newPage({ viewport: { width, height: 900 } });
  await openGame(page, responsePhaseGame());
  await collectGame(page);
  for (let phase = 0; phase < 3; phase++) { await page.locator(".response-options > button").first().click(); await page.waitForTimeout(300); await collectGame(page); }
  await page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/ }).click(); await page.waitForTimeout(800);
  await collectGame(page);
  await page.close();
}
await browser.close();
decideCopies();

// Hard-kept whatever matched: the tokens, the theme, fonts, keyframes, imports.
const keep = (item: Item) => item.kind !== "rule" || needed.has(rules.indexOf(item));
let global = "";
let game = "";
let pending = "";
for (const item of items) {
  if (item.kind === "comment") { pending += `${item.text}\n`; continue; }
  if (item.kind === "block") {
    const kept: string[] = [];
    const moved: string[] = [];
    let inner = "";
    for (const child of item.children!) {
      if (child.kind === "comment") { inner += `  ${child.text}\n`; continue; }
      if (keep(child)) kept.push(`${inner}  ${child.text.trim()}`);
      if (!keep(child) || copied.has(rules.indexOf(child))) moved.push(`${keep(child) ? "" : inner}  ${child.text.trim()}`);
      inner = "";
    }
    const block = (list: string[]) => `${item.prelude} {\n${list.join("\n")}\n}\n`;
    if (kept.length) global += pending + block(kept);
    if (moved.length) game += (kept.length ? "" : pending) + block(moved);
    pending = "";
    continue;
  }
  if (keep(item)) global += `${pending}${item.text.trim()}\n`;
  if (!keep(item)) game += `${pending}${item.text.trim()}\n`;
  else if (item.kind === "rule" && copied.has(rules.indexOf(item))) game += `${item.text.trim()}\n`;
  pending = "";
}
global += pending;
writeFileSync("app/globals.css", global);
writeFileSync("components/game/game.css", `/* The game screen's and the dialogs' styles: everything the assignment screen
   does not show, loaded with the game bundle (lib/game-loader.ts) rather than
   with the page, which waits for app/globals.css before it paints. Split by
   scripts/split-css.ts; a rule that styles the assignment screen belongs in
   app/globals.css. */
${game}`);
console.log(`kept ${needed.size} of ${rules.length} rules in app/globals.css (${global.split("\n").length} lines); moved ${rules.length - needed.size} to components/game/game.css (${game.split("\n").length} lines), with copies of ${copied.size} kept rules that followed a moved one`);
