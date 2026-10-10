// Every module the page imports statically, as paths from the repository root.
// Type-only imports and import() are not followed: neither ships with the page.
import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";

export const root = new URL("..", import.meta.url).pathname;
function resolve(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/") ? root + specifier.slice(2) : specifier.startsWith(".") ? new URL(specifier, `file://${from}`).pathname : null;
  if (!base) return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) if (existsSync(candidate) && !candidate.endsWith("/")) try { readFileSync(candidate); return candidate; } catch { /* a directory */ }
  return null;
}
export function firstLoad(entry: string) {
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
