// Consolidates a stylesheet without changing what it computes: rules that name
// the same selectors in the same media query become one rule, rules with the
// same declarations become one rule with a selector list, and blocks for the
// same media query become one block. Each of these moves declarations past the
// rules between their old and new place, so a move is made only when no rule
// it crosses could compete with it: one that sets a related property (the
// property itself, its shorthand or one of its longhands) through a selector
// of equal specificity that could match the same element, in any media query.
// A rule with a vendor-prefixed selector is never put in a list, since one
// selector a browser does not know drops the whole rule there.
//
//   node scripts/css-consolidate.ts components/game/game.css           count
//   node scripts/css-consolidate.ts components/game/game.css --apply   rewrite
//
// The cascade check is what makes a move safe in principle; the computed
// styles and the visual baselines are what show it, so run them after.
import { readFileSync, writeFileSync } from "node:fs";

type Rule = { kind: "rule"; comments: string[]; selector: string; body: string[] };
type Block = { kind: "block"; comments: string[]; prelude: string; children: Node[]; trailing: string[] };
type Raw = { kind: "raw"; text: string };
type Node = Rule | Block | Raw;

// One declaration per line, a rule's lines indented a step inside its block:
// the house format, which the parser relies on and the writer restores.
export function parse(source: string): Node[] {
  const lines = source.split("\n");
  let index = 0;
  function container(depth: number): { nodes: Node[]; trailing: string[] } {
    const nodes: Node[] = [];
    let comments: string[] = [];
    const pad = "  ".repeat(depth);
    while (index < lines.length) {
      const line = lines[index];
      const text = line.trim();
      if (depth > 0 && text === "}") { index++; return { nodes, trailing: comments }; }
      if (text.startsWith("/*")) {
        const start = index;
        while (!lines[index].includes("*/")) index++;
        comments.push(lines.slice(start, index + 1).map(item => item.slice(pad.length)).join("\n"));
        index++;
        continue;
      }
      if (text === "") {
        if (index === lines.length - 1) { index++; continue; }
        throw new Error(`blank line ${index + 1}`);
      }
      if (/^@(media|supports)\b/.test(text)) {
        const prelude = text.replace(/\s*\{$/, "");
        index++;
        const inner = container(depth + 1);
        nodes.push({ kind: "block", comments, prelude, children: inner.nodes, trailing: inner.trailing });
        comments = [];
        continue;
      }
      if (text.startsWith("@") && !text.endsWith("{")) {
        for (const comment of comments) nodes.push({ kind: "raw", text: indent(comment, pad) });
        comments = [];
        nodes.push({ kind: "raw", text: line });
        index++;
        continue;
      }
      if (text.startsWith("@") || depth > 1) {
        // An at-rule this tool does not look inside (@theme, @keyframes): kept
        // whole, in place, with the comments before it.
        const start = index;
        let open = 0;
        do { open += (lines[index].match(/\{/g) ?? []).length - (lines[index].match(/\}/g) ?? []).length; index++; } while (open > 0);
        for (const comment of comments) nodes.push({ kind: "raw", text: indent(comment, pad) });
        comments = [];
        nodes.push({ kind: "raw", text: lines.slice(start, index).join("\n") });
        continue;
      }
      if (!text.endsWith("{")) throw new Error(`unexpected line ${index + 1}: ${text}`);
      const selector = text.replace(/\s*\{$/, "");
      const body: string[] = [];
      index++;
      while (lines[index].trim() !== "}") {
        body.push(lines[index].slice(pad.length + 2));
        index++;
      }
      index++;
      nodes.push({ kind: "rule", comments, selector, body });
      comments = [];
    }
    return { nodes, trailing: comments };
  }
  const top = container(0);
  if (top.trailing.length) top.nodes.push(...top.trailing.map(text => ({ kind: "raw" as const, text })));
  return top.nodes;
}

function indent(text: string, pad: string) { return text.split("\n").map(line => pad + line).join("\n"); }

export function write(nodes: Node[], depth = 0): string {
  const pad = "  ".repeat(depth);
  const out: string[] = [];
  for (const node of nodes) {
    if (node.kind === "raw") { out.push(node.text); continue; }
    for (const comment of node.comments) out.push(indent(comment, pad));
    if (node.kind === "rule") {
      out.push(`${pad}${node.selector} {`, ...node.body.map(line => `${pad}  ${line}`), `${pad}}`);
    } else {
      out.push(`${pad}${node.prelude} {`);
      const inner = write(node.children, depth + 1);
      if (inner) out.push(inner);
      for (const comment of node.trailing) out.push(indent(comment, pad + "  "));
      out.push(`${pad}}`);
    }
  }
  return out.join("\n");
}

// Selectors: split a list, a selector's specificity, and its subject.
export function splitList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) { parts.push(list.slice(start, i).trim()); start = i + 1; }
  }
  parts.push(list.slice(start).trim());
  return parts;
}

export function specificity(selector: string): [number, number, number] {
  let a = 0, b = 0, c = 0;
  let i = 0;
  const s = selector;
  const add = (other: [number, number, number]) => { a += other[0]; b += other[1]; c += other[2]; };
  const argument = (from: number) => {
    let depth = 1, j = from;
    while (depth) { j++; if (s[j] === "(") depth++; else if (s[j] === ")") depth--; }
    return { text: s.slice(from + 1, j), end: j + 1 };
  };
  const max = (list: string) => splitList(list).map(specificity).sort((x, y) => y[0] - x[0] || y[1] - x[1] || y[2] - x[2])[0] ?? [0, 0, 0];
  while (i < s.length) {
    const ch = s[i];
    if (ch === "#") { a++; i++; while (i < s.length && /[\w-]/.test(s[i])) i++; }
    else if (ch === ".") { b++; i++; while (i < s.length && /[\w-]/.test(s[i])) i++; }
    else if (ch === "[") { b++; while (s[i] !== "]") i++; i++; }
    else if (ch === ":") {
      const element = s[i + 1] === ":";
      i += element ? 2 : 1;
      const start = i;
      while (i < s.length && /[\w-]/.test(s[i])) i++;
      const name = s.slice(start, i).toLowerCase();
      const call = s[i] === "(" ? argument(i) : null;
      if (call) i = call.end;
      if (element || ["before", "after", "first-line", "first-letter"].includes(name)) c++;
      else if (name === "where") { /* nothing */ }
      else if (["is", "not", "has", "matches"].includes(name) && call) add(max(call.text));
      else if (["nth-child", "nth-last-child"].includes(name) && call && / of /.test(call.text)) { b++; add(max(call.text.split(/ of /)[1])); }
      else b++;
    }
    else if (/[a-zA-Z]/.test(ch)) { c++; while (i < s.length && /[\w-]/.test(s[i])) i++; }
    else i++;
  }
  return [a, b, c];
}

function subject(selector: string): string {
  let depth = 0, start = 0;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (depth === 0 && /[\s>+~]/.test(c)) start = i + 1;
  }
  return selector.slice(start);
}

function pseudoElement(compound: string): string {
  const match = compound.match(/::?(before|after|first-line|first-letter|marker|placeholder|backdrop|selection|file-selector-button|-[\w-]+)\b/);
  if (!match) return "";
  return compound.includes("::" + match[1]) || ["before", "after", "first-line", "first-letter"].includes(match[1]) ? match[1] : "";
}

// Whether two selectors could ever style the same box. Only what is certain
// rules a pair out: a different pseudo-element, or a different element type.
function mayMatchSame(x: string, y: string): boolean {
  const sx = subject(x), sy = subject(y);
  if (pseudoElement(sx) !== pseudoElement(sy)) return false;
  const tx = sx.match(/^[a-zA-Z][\w-]*/)?.[0], ty = sy.match(/^[a-zA-Z][\w-]*/)?.[0];
  if (tx && ty && tx.toLowerCase() !== ty.toLowerCase()) return false;
  return true;
}

const vendor = /::?-(webkit|moz|ms)-/;

// Properties that set the same thing: a shorthand and its longhands, logical
// and physical sides, and every property in families whose members interact.
const families: [RegExp, string][] = [
  [/^(margin|padding|scroll-margin|scroll-padding)(-|$)/, "$1"],
  [/^(border|outline|column-rule)(-|$)/, "$1"],
  [/^(inset|top|right|bottom|left)(-|$)/, "inset"],
  [/^(grid|gap|row-gap|column-gap|grid-gap)(-|$)/, "grid"],
  [/^(flex)(-|$)/, "flex"],
  [/^(place|align|justify)-/, "align"],
  [/^(font|line-height)(-|$)/, "font"],
  [/^(background)(-|$)/, "background"],
  [/^(transition)(-|$)/, "transition"],
  [/^(animation)(-|$)/, "animation"],
  [/^(text-decoration)(-|$)/, "text-decoration"],
  [/^(overflow)(-|$)/, "overflow"],
  [/^(list-style)(-|$)/, "list-style"],
  [/^(columns|column-count|column-width)$/, "columns"],
  [/^(width|min-width|max-width|inline-size|min-inline-size|max-inline-size|height|min-height|max-height|block-size|min-block-size|max-block-size)$/, "size"],
  [/^(mask)(-|$)/, "mask"],
  [/^(container)(-|$)/, "container"],
  [/^(contain-intrinsic)(-|$)/, "contain-intrinsic"],
  [/^(white-space|text-wrap|white-space-collapse|text-wrap-mode|text-wrap-style)$/, "white-space"],
  [/^(overflow-wrap|word-wrap)$/, "overflow-wrap"],
  [/^(line-clamp|box-orient)$/, "line-clamp"],
];
function family(property: string): string {
  const bare = property.replace(/^-(webkit|moz|ms)-/, "");
  if (bare.startsWith("--")) return bare;
  for (const [pattern, name] of families) {
    const match = bare.match(pattern);
    if (match) return name === "$1" ? match[1] : name;
  }
  return bare;
}
function related(x: string, y: string) {
  if (x === "all" || y === "all") return !x.startsWith("--") && !y.startsWith("--");
  return family(x) === family(y);
}

type Declaration = { property: string; important: boolean };
function declarations(body: string[]): Declaration[] {
  const out: Declaration[] = [];
  for (const line of body) {
    const match = line.match(/^\s*(--[\w-]+|-?[a-zA-Z][\w-]*)\s*:(.*)$/);
    if (match) out.push({ property: match[1].toLowerCase(), important: /!important/.test(match[2]) });
  }
  return out;
}

type Flat = { rule: Rule; context: string; parent: Node[]; block?: Block; selectors: string[]; specs: string[]; decls: Declaration[] };
function flatten(nodes: Node[], context = "", block?: Block, out: Flat[] = []): Flat[] {
  for (const node of nodes) {
    if (node.kind === "rule") {
      const selectors = splitList(node.selector);
      out.push({ rule: node, context, parent: nodes, block, selectors, specs: selectors.map(item => specificity(item).join(",")), decls: declarations(node.body) });
    } else if (node.kind === "block") flatten(node.children, (context ? context + " & " : "") + node.prelude.replace(/\s+/g, " "), node, out);
  }
  return out;
}

// Can these declarations, through these selectors, move past the rules at
// positions start to end - 1 without any of them deciding differently?
function canMove(moving: Flat, flat: Flat[], start: number, end: number) {
  for (let k = start; k < end; k++) {
    const other = flat[k];
    if (other === moving) continue;
    for (const d of moving.decls) for (const o of other.decls) {
      if (!related(d.property, o.property)) continue;
      if (d.important || o.important) return false;
      for (let i = 0; i < moving.selectors.length; i++) for (let j = 0; j < other.selectors.length; j++) {
        if (moving.specs[i] === other.specs[j] && mayMatchSame(moving.selectors[i], other.selectors[j])) return false;
      }
    }
  }
  return true;
}

function remove(list: Node[], node: Node) { list.splice(list.indexOf(node), 1); }
function bodyKey(body: string[]) { return body.map(line => line.trim()).filter(line => !line.startsWith("/*")).sort().join("\n"); }

export type Change = { kind: "same selector" | "same declarations" | "same query"; detail: string };

// One consolidation, if any is possible; the tree is changed in place.
function step(nodes: Node[]): Change | null {
  const flat = flatten(nodes);
  // Same selector, same media query: one rule.
  for (let i = 0; i < flat.length; i++) for (let j = i + 1; j < flat.length; j++) {
    const a = flat[i], b = flat[j];
    if (a.context !== b.context || a.rule.selector !== b.rule.selector) continue;
    if (b.decls.some(d => a.decls.some(e => e.property === d.property))) continue;
    if (canMove(b, flat, i + 1, j)) {
      a.rule.body.push(...b.rule.body);
      a.rule.comments.push(...b.rule.comments);
      remove(b.parent, b.rule);
      return { kind: "same selector", detail: `${a.context ? a.context + " " : ""}${a.rule.selector}` };
    }
    if (canMove(a, flat, i + 1, j)) {
      b.rule.body.unshift(...a.rule.body);
      b.rule.comments.unshift(...a.rule.comments);
      remove(a.parent, a.rule);
      return { kind: "same selector", detail: `${a.context ? a.context + " " : ""}${a.rule.selector}` };
    }
  }
  // Same declarations, same media query: one rule with both selector lists.
  const byBody = new Map<string, number[]>();
  flat.forEach((item, index) => {
    if (!item.decls.length || vendor.test(item.rule.selector)) return;
    const key = item.context + "\u0000" + bodyKey(item.rule.body);
    byBody.set(key, [...(byBody.get(key) ?? []), index]);
  });
  for (const indices of byBody.values()) for (let x = 0; x < indices.length; x++) for (let y = x + 1; y < indices.length; y++) {
    const i = indices[x], j = indices[y];
    const a = flat[i], b = flat[j];
    if (a.rule.body.some(line => line.trim().startsWith("/*")) || b.rule.body.some(line => line.trim().startsWith("/*"))) continue;
    if (canMove(b, flat, i + 1, j)) {
      a.rule.selector = `${a.rule.selector},${b.rule.selector}`;
      a.rule.comments.push(...b.rule.comments);
      remove(b.parent, b.rule);
      return { kind: "same declarations", detail: a.rule.selector };
    }
    if (canMove(a, flat, i + 1, j)) {
      b.rule.selector = `${a.rule.selector},${b.rule.selector}`;
      b.rule.comments.unshift(...a.rule.comments);
      remove(a.parent, a.rule);
      return { kind: "same declarations", detail: b.rule.selector };
    }
  }
  // Two blocks for the same query: the later block's rules join the earlier
  // block, or the earlier's join the later, when every one of them can move.
  const blocks: { block: Block; parent: Node[]; context: string }[] = [];
  (function collect(list: Node[], context: string) {
    for (const node of list) if (node.kind === "block") { const inner = (context ? context + " & " : "") + node.prelude.replace(/\s+/g, " "); blocks.push({ block: node, parent: list, context: inner }); collect(node.children, inner); }
  })(nodes, "");
  for (let x = 0; x < blocks.length; x++) for (let y = x + 1; y < blocks.length; y++) {
    const first = blocks[x], second = blocks[y];
    if (first.context !== second.context || first.parent !== second.parent) continue;
    if (first.block.trailing.length || second.block.trailing.length) continue;
    if (first.block.children.some(node => node.kind !== "rule") || second.block.children.some(node => node.kind !== "rule")) continue;
    const position = (rule: Node) => flat.findIndex(item => item.rule === rule);
    const firstEnd = position(first.block.children.at(-1)!), secondStart = position(second.block.children[0]);
    const up = second.block.children.every(rule => { const at = position(rule); return canMove(flat[at], flat, firstEnd + 1, at); });
    if (up) {
      first.block.children.push(...second.block.children);
      first.block.comments.push(...second.block.comments);
      remove(second.parent, second.block);
      return { kind: "same query", detail: first.context };
    }
    const down = first.block.children.every(rule => { const at = position(rule); return canMove(flat[at], flat, at + 1, secondStart); });
    if (down) {
      second.block.children.unshift(...first.block.children);
      second.block.comments.unshift(...first.block.comments);
      remove(first.parent, first.block);
      return { kind: "same query", detail: second.context };
    }
  }
  return null;
}

export function consolidate(source: string): { output: string; changes: Change[] } {
  const nodes = parse(source);
  const changes: Change[] = [];
  for (let change = step(nodes); change; change = step(nodes)) changes.push(change);
  return { output: write(nodes) + "\n", changes };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  const source = readFileSync(path, "utf8");
  // The round trip may only re-indent: nothing but whitespace can change.
  if ((write(parse(source)) + "\n").replace(/\s+/g, "") !== source.replace(/\s+/g, "")) throw new Error(`${path} does not survive a round trip through the parser`);
  const { output, changes } = consolidate(source);
  const counts: Record<string, number> = {};
  for (const change of changes) counts[change.kind] = (counts[change.kind] ?? 0) + 1;
  console.log(path, source.split("\n").length - 1, "lines ->", output.split("\n").length - 1, counts);
  if (process.argv.includes("--verbose")) for (const change of changes) console.log(`  ${change.kind}: ${change.detail}`);
  if (process.argv.includes("--apply")) writeFileSync(path, output);
}
