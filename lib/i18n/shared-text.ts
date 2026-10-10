// The engine's catalogue and the glossary, which the game screen and every
// dialog show, load once, in one script, before any of them renders:
// app/page.tsx loads each part together with loadSharedText(). A component
// imported them directly before, and each part's script carried its own copy.
import type * as Glossary from "../glossary.ts";

let glossaryModule: typeof Glossary | null = null;
let loading: Promise<void> | null = null;

export function loadSharedText(): Promise<void> {
  loading ??= import("./shared-text-bundle.ts").then(bundle => { glossaryModule = bundle.glossary; });
  return loading;
}

export function glossary(): typeof Glossary {
  if (!glossaryModule) throw new Error("The glossary was read before the shared text loaded; load the part with loadSharedText().");
  return glossaryModule;
}
