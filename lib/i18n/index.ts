import { en } from "./en.ts";
import type { MessageKey } from "./keys.ts";

// The message catalogue. English is the source of truth; another locale is a
// catalogue of the same keys, and a missing key falls back to English. Plurals
// choose by Intl.PluralRules and numbers format by Intl.NumberFormat, so a
// locale needs no code of its own. "en-XA" is a pseudo-locale generated from
// English at runtime: accented and a third longer, as German runs, to show
// where a layout would break before a translator is involved.
export type { MessageKey } from "./keys.ts";
export type Locale = "en" | "en-XA";
export const locales: Locale[] = ["en", "en-XA"];

type Value = string | Readonly<Partial<Record<Intl.LDMLPluralRule, string>>>;

// The messages loaded so far: the shared base, and each component's own
// catalogue, which registers itself when the component's module loads, so a
// lazily loaded dialog carries its strings with it.
const registry: Record<string, Value> = { ...en };
export function register(catalogue: Readonly<Record<string, Value>>) {
  Object.assign(registry, catalogue);
}
export function registered(key: string) {
  return key in registry;
}
type Params = Record<string, string | number>;

const accents: Record<string, string> = { a: "á", e: "é", i: "î", o: "ö", u: "ü", c: "ç", n: "ñ", s: "š", y: "ý", A: "Á", E: "É", I: "Î", O: "Ö", U: "Ü", C: "Ç", N: "Ñ", S: "Š" };
// Placeholders and markup tags stay as they are; everything else is accented.
export function accent(text: string) {
  return text.split(/(\{[a-zA-Z]+\}|<\/?[a-z][a-z0-9]*>)/).map(part => /^(\{[a-zA-Z]+\}|<\/?[a-z][a-z0-9]*>)$/.test(part) ? part : [...part].map(char => accents[char] ?? char).join("")).join("");
}
export function pseudo(text: string) {
  const pad = "·".repeat(Math.max(1, Math.round(text.length / 3)));
  return `[${accent(text)}${pad}]`;
}

function lookup(locale: Locale, key: MessageKey): Value {
  // A key whose catalogue has not loaded shows itself rather than nothing;
  // tests/i18n.test.ts checks each component registers what it reads.
  const value = registry[key] ?? key;
  if (locale !== "en-XA") return value;
  if (typeof value === "string") return pseudo(value) as Value;
  return Object.fromEntries(Object.entries(value).map(([category, text]) => [category, pseudo(text as string)])) as unknown as Value;
}

export function formatNumber(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "en-XA" ? "en" : locale).format(value);
}

export function translate(locale: Locale, key: MessageKey, params: Params = {}) {
  const value = lookup(locale, key);
  let text: string;
  if (typeof value === "string") text = value;
  else {
    const count = Number(params.count ?? 0);
    const category = new Intl.PluralRules(locale === "en-XA" ? "en" : locale).select(count) as keyof typeof value;
    text = (value as Record<string, string>)[category] ?? (value as Record<string, string>).other;
  }
  return text.replace(/\{([a-zA-Z]+)\}/g, (whole, name: string) => name in params ? (typeof params[name] === "number" ? formatNumber(locale, params[name] as number) : String(params[name])) : whole);
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as string[]).includes(value);
}
