// The message catalogue: interpolation, plurals and numbers through Intl, the
// pseudo-locale, and a ratchet on the strings still written into components.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { en } from "../lib/i18n/en.ts";
import { formatNumber, pseudo, register, translate } from "../lib/i18n/index.ts";
import { catalogueFiles } from "../lib/i18n/keys.ts";

// The shared base and each component's catalogue, by file stem.
const catalogues: Record<string, Record<string, unknown>> = {};
for (const stem of catalogueFiles) {
  const loaded: Record<string, Record<string, unknown>> = await import(`../lib/i18n/en/${stem}.ts`);
  catalogues[stem] = Object.values(loaded)[0];
  register(catalogues[stem] as Parameters<typeof register>[0]);
}
const every = [en, ...Object.values(catalogues)].flatMap(catalogue => Object.entries(catalogue)) as [string, string | Record<string, string>][];

test("messages interpolate, pluralise by Intl and format numbers", () => {
  assert.equal(translate("en", "tabs.stages", { found: 3 }), "3 of 4 stages");
  assert.equal(translate("en", "tabs.turns", { count: 1 }), "1 turn");
  assert.equal(translate("en", "tabs.turns", { count: 4 }), "4 turns");
  assert.equal(translate("en", "tabs.turns", { count: 0 }), "0 turns");
  assert.equal(formatNumber("en", 12500), "12,500");
  assert.equal(translate("en", "window.remaining", {}), "of {limit} turns remaining", "a missing parameter is left visible, not blanked");
  for (const [key, value] of every) {
    if (typeof value === "string") assert.ok(value.trim(), `${key} has text`);
    else assert.ok(value.other, `${key} has an "other" form`);
  }
});

test("the pseudo-locale lengthens every string by about a third and keeps its placeholders", () => {
  for (const [key, value] of every) {
    for (const text of typeof value === "string" ? [value] : Object.values(value)) {
      const out = pseudo(text);
      for (const placeholder of text.match(/\{[a-zA-Z]+\}/g) ?? []) assert.ok(out.includes(placeholder), `${key} keeps ${placeholder}`);
      assert.ok(out.length >= text.length * 1.3, `${key} is lengthened`);
    }
  }
  assert.match(translate("en-XA", "tabs.turns", { count: 2 }), /^\[2 /);
});

// No interface string is written into a component. Read with the TypeScript
// parser, not a pattern: every JSX text, and every string or template literal
// that reads as words (two words, or a capitalised one) anywhere in
// components/game and the page shell, unless its position says it is not text.
// Those positions are structural, never a list of strings: imports and types,
// attributes other than aria-label, aria-description, aria-valuetext,
// placeholder, title and alt; comparison operands and object keys; arguments
// to string methods, DOM and storage calls, console, Error and t() itself;
// class names; media queries; and a statement marked "i18n: maintainer
// English", which a player copies into a report for whoever fixes the game.
// A single lowercase word reads like an id and is not caught; catalogue one by
// hand ("none", "stable").
const shownAttributes = new Set(["aria-label", "aria-description", "aria-valuetext", "aria-roledescription", "placeholder", "title", "alt"]);
const notText = /^(includes|match|matchAll|startsWith|endsWith|replace|replaceAll|split|indexOf|lastIndexOf|test|querySelector|querySelectorAll|getElementById|addEventListener|removeEventListener|setItem|getItem|removeItem|closest|matches|getPropertyValue|setProperty|createElement|postMessage|dispatchEvent|toLocaleString|toLocaleDateString|toLocaleTimeString|setAttribute|getAttribute|hasAttribute|removeAttribute|play|has|get|set|delete|add|push|join|padStart|padEnd|t|textFor|log|warn|error|info|debug|register|useMessages|cue|track|record|matchMedia)$/;
const reads = (text: string) => /[A-Za-z]{2,}/.test(text) && (/[A-Za-z]\S*\s+\S*[A-Za-z]/.test(text) || /^[^A-Za-z]*[A-Z][a-z]/.test(text));
function literalText(node: ts.Node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map(span => span.literal.text)].join(" ");
  return null;
}
function notInterface(node: ts.Node): boolean {
  for (let statement: ts.Node | undefined = node; statement; statement = statement.parent) {
    if ((ts.isStatement(statement) || ts.isClassElement(statement)) && /i18n: maintainer English/.test(statement.getFullText().slice(0, statement.getStart() - statement.getFullStart()))) return true;
  }
  const parent = node.parent;
  if (/^\((prefers-|max-|min-|orientation|hover|pointer)[a-z-]*:/.test(literalText(node) ?? "")) return true;
  if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isLiteralTypeNode(parent) || ts.isExpressionStatement(parent) || ts.isCaseClause(parent)) return true;
  if (ts.isJsxAttribute(parent)) return !shownAttributes.has(parent.name.getText());
  if (ts.isBinaryExpression(parent) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.InKeyword].includes(parent.operatorToken.kind)) return true;
  if ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent) || ts.isMethodDeclaration(parent)) && parent.name === node) return true;
  if (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) return true;
  if (ts.isCallExpression(parent) || ts.isNewExpression(parent)) {
    const callee = parent.expression.getText();
    if (notText.test(callee.split(".").pop()!) || /^console\./.test(callee) || /^(Error|Event|CustomEvent|URL|URLSearchParams|RegExp|Set|Map|Intl\.)/.test(callee)) return true;
  }
  // Up through conditionals, templates and joins to the attribute or property it sets.
  let up: ts.Node | undefined = parent;
  while (up && (ts.isConditionalExpression(up) || ts.isParenthesizedExpression(up) || ts.isTemplateSpan(up) || ts.isTemplateExpression(up) || ts.isBinaryExpression(up) || ts.isArrayLiteralExpression(up) || ts.isCallExpression(up) && /\.(join|filter)$/.test(up.expression.getText()))) {
    if (ts.isConditionalExpression(up) && up.condition === node) return true;
    up = up.parent;
  }
  if (up && ts.isJsxExpression(up) && up.parent && ts.isJsxAttribute(up.parent)) return !shownAttributes.has(up.parent.name.getText());
  if (up && ts.isPropertyAssignment(up) && /^(className|key|id|href|role|type|tone|kind|variant|status|mode|state|cls|tag|sound|cue)$/.test(up.name.getText())) return true;
  return false;
}
const componentFiles = [...readdirSync(new URL("../components/game/", import.meta.url)).filter(name => name.endsWith(".tsx")).map(name => `../components/game/${name}`), "../app/page.tsx"];
function hardCoded() {
  const found: string[] = [];
  for (const file of componentFiles) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const where = (node: ts.Node) => `${file}:${tree.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node) && /[A-Za-z]{2,}/.test(node.getText())) found.push(`${where(node)}: ${node.getText().trim().slice(0, 60)}`);
      const text = literalText(node);
      if (text !== null && reads(text) && !notInterface(node)) found.push(`${where(node)}: ${node.getText().slice(0, 60)}`);
      if (ts.isTemplateExpression(node)) node.templateSpans.forEach(span => visit(span.expression));
      else ts.forEachChild(node, visit);
    };
    visit(tree);
  }
  return found;
}
test("no interface string is written into a component", () => {
  assert.deepEqual(hardCoded(), [], "move it into the component's catalogue in lib/i18n/en/ and read it with t()");
});

// A component's strings travel with it: every key a file reads is in the shared
// base or in the catalogue that file registers, so a lazily loaded dialog never
// shows a bare key, and no key is defined twice with different words.
test("every key a component reads is in the base or its own catalogue", () => {
  // Any literal shaped like a key counts as a read, so a key held in a table
  // and translated at render is checked like one passed to t() directly.
  const missing: string[] = [];
  const unused: string[] = [];
  for (const file of componentFiles) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const stem = source.match(/from "@\/lib\/i18n\/en\/([a-z-]+)"/)?.[1];
    const own = stem ? catalogues[stem] : {};
    const prefixes = new Set([...Object.keys(en), ...Object.keys(own)].map(key => key.split(".")[0]));
    for (const [, key] of source.matchAll(/"([a-z][A-Za-z]*\.[A-Za-z0-9]+)"/g)) if (prefixes.has(key.split(".")[0]) && !(key in en) && !(key in own)) missing.push(`${file}: ${key}`);
    for (const key of Object.keys(own)) if (!source.includes(`"${key}"`)) unused.push(`${stem}: ${key}`);
  }
  assert.deepEqual(missing, []);
  assert.deepEqual(unused, [], "a key nothing reads only adds bytes; remove it");
  const seen = new Map<string, unknown>();
  for (const [key, value] of every) {
    if (seen.has(key)) assert.deepEqual(value, seen.get(key), `${key} has one wording`);
    seen.set(key, value);
  }
  assert.equal(Object.keys(catalogues).length, readdirSync(new URL("../lib/i18n/en/", import.meta.url)).length, "keys.ts lists every catalogue");
});
