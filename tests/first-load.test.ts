// What the assignment screen parses before it answers. The engine, the
// session's migration, the Bot Commander, the game screen, the dialogs and the
// text they share load later, in one bundle (lib/game-loader.ts); this follows
// every static import from the page and fails if one of them is reached, so a
// new feature cannot pull the engine back onto the first load unnoticed.
// Type-only imports and import() are not followed: neither ships with the page.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const root = new URL("..", import.meta.url).pathname;
function resolve(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/") ? root + specifier.slice(2) : specifier.startsWith(".") ? new URL(specifier, `file://${from}`).pathname : null;
  if (!base) return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) if (existsSync(candidate) && !candidate.endsWith("/")) try { readFileSync(candidate); return candidate; } catch { /* a directory */ }
  return null;
}
function firstLoad(entry: string) {
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const tree = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    for (const statement of tree.statements) {
      if (!(ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) || !statement.moduleSpecifier) continue;
      if (ts.isImportDeclaration(statement)) {
        const clause = statement.importClause;
        if (clause?.isTypeOnly) continue;
        const named = clause?.namedBindings;
        if (clause && !clause.name && named && ts.isNamedImports(named) && named.elements.length && named.elements.every(element => element.isTypeOnly)) continue;
      }
      if (ts.isExportDeclaration(statement) && statement.isTypeOnly) continue;
      const target = resolve(file, (statement.moduleSpecifier as ts.StringLiteral).text);
      if (target) visit(target);
    }
  };
  visit(entry);
  return [...seen].map(file => file.slice(root.length));
}

test("the assignment screen loads without the engine", () => {
  const modules = firstLoad(`${root}app/page.tsx`);
  assert.ok(modules.includes("components/game/briefing-screen.tsx") && modules.includes("hooks/use-game-session.ts"), "the walk reaches the assignment screen and the session hook");
  const engine = /^(lib\/advanced-game\.ts|lib\/engine\/(content|transitions|reads|review|rules)\.ts|lib\/session\.ts|lib\/game-bot\.ts|lib\/glossary\.ts|lib\/i18n\/en\/engine\.ts|lib\/i18n\/engine-messages\.ts|components\/game\/(game-bundle|game-screen|action-sheet|roll-dialog|mission-briefing-dialog|captain-report-dialog|field-guide-dialog|debrief-dialog|settings-dialog|new-incident-dialog)\.tsx?)$/;
  assert.deepEqual(modules.filter(file => engine.test(file)), [], "load it through lib/game-loader.ts instead");
});
