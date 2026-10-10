// The translatable words in the content tables, each at a stable path:
// table, then an item's id (or its position when it has none), then the field,
// "attacks.phish.clue". A leaf is translatable when it reads as words and its
// field is not one the rules key on. An object reached twice (a table that
// reuses another's items) is visited once, at its first path.
export type Leaf = { path: string; text: string; set: (text: string) => void };

// Fields the rules or the Bot Commander key on: ids, and the response options'
// levels (disruption, confidence, residual), which game-bot.ts scores by word.
// A level is translated where it is shown, through the catalogue.
const structural = new Set(["id", "icon", "color", "vector", "kind", "type", "route", "detect", "procedures", "scenarios", "from", "to", "event", "choice", "tone", "disruption", "confidence", "residual"]);
export const readsAsWords = (text: string) => /[A-Za-z]{2,}/.test(text) && (/[A-Za-z]\S*\s+\S*[A-Za-z]/.test(text) || /^[^A-Za-z]*[A-Z][a-z]/.test(text));

export function contentLeaves(tables: Record<string, unknown>): Leaf[] {
  const seen = new WeakSet<object>();
  const leaves: Leaf[] = [];
  const visit = (value: unknown, path: string, field: string, set: (text: string) => void) => {
    if (typeof value === "string") {
      if (!structural.has(field) && readsAsWords(value)) leaves.push({ path, text: value, set });
      return;
    }
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const id = item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string" ? (item as { id: string }).id : String(index);
        visit(item, `${path}.${id}`, field, text => { value[index] = text; });
      });
      return;
    }
    for (const [key, item] of Object.entries(value)) {
      if (structural.has(key)) continue;
      visit(item, `${path}.${key}`, key, text => { (value as Record<string, unknown>)[key] = text; });
    }
  };
  for (const [name, table] of Object.entries(tables)) visit(table, name, name, () => {});
  return leaves;
}
