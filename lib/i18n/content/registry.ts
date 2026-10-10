// The content tables, registered by the modules that hold them when they load,
// as a component's catalogue registers itself. A locale's overlay
// (./overlay.ts, loaded only for a locale other than English) replaces their
// words in place, including tables whose module loads after it. This file is
// on the first load, so it holds nothing but the registry.
export const contentTables: Record<string, unknown> = {};
let onRegister: ((tables: Record<string, unknown>) => void) | null = null;

export function registerContent(tables: Record<string, unknown>) {
  Object.assign(contentTables, tables);
  onRegister?.(tables);
}

export function whenContentRegisters(apply: (tables: Record<string, unknown>) => void) {
  onRegister = apply;
}
