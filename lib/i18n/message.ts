// What the engine writes for a player to read, as data rather than English: a
// catalogue key with its parameters, or a reference to a piece of content by
// its path ("attacks.phish.evidence"), which reads in whatever language the
// content overlay has put there. A parameter is a number, a string, or another
// message. The saved game stores these, so a save made in one language reads
// in another, and say() puts them into words for the locale at hand.
import { contentTables } from "./content/registry.ts";
import { interpolate, translate, type Locale, type MessageKey } from "./index.ts";

export type Param = string | number | Message;
// A reference may ask for its English form inside a sentence: "inSentence"
// lower-cases a title's words but not its acronyms ("Found by endpoint
// analysis"), "lower" lower-cases it all. Other languages case their own words,
// so a translation is used as it is.
export type Form = "inSentence" | "lower" | "lowerFirst" | "capital";
// A message may also be text already in the reader's language (content the
// overlay has translated, said at once rather than stored), kept as text so it
// can still take an English form.
export type Message = ({ key: MessageKey; params?: Record<string, Param> } | { ref: string; params?: Record<string, Param> } | { text: string }) & { form?: Form };

export const msg = (key: MessageKey, params?: Record<string, Param>): Message => params ? { key, params } : { key };
type Suffix<P extends string, K = MessageKey> = K extends `${P}.${infer S}` ? S : never;
// Keep repeated trusted namespaces out of the shipped call sites. Literal
// suffixes stay type checked and expand to the same saved message identifiers.
export function scopedMsg<const P extends string>(prefix: P) {
  return (key: Suffix<P>, params?: Record<string, Param>): Message => msg(`${prefix}.${key}` as MessageKey, params);
}
export const MAX_MESSAGE_OUTPUT = 16_000;
export const ref = (path: string, params?: Record<string, Param>, form?: Form): Message => ({ ref: path, ...(params ? { params } : {}), ...(form ? { form } : {}) });
export const lit = (text: string, form?: Form): Message => form ? { text, form } : { text };
// The same message in an English form: "lower" for a title inside a sentence.
export const withForm = (message: Message, form: Form): Message => ({ ...message, form });
// A sentence from a save made before messages (session version 18 and
// earlier), kept as the player read it.
export const legacy = (text: string): Message => ({ key: "legacy.text", params: { text } });

// The text at a content path, found the way lib/i18n/content/walk.ts names it:
// an array item by its id, or by its position when it has none.
export function resolveRef(path: string): string | undefined {
  let value: unknown = contentTables;
  for (const segment of path.split(".")) {
    if (Array.isArray(value)) value = value.find(item => item && typeof item === "object" && (item as { id?: unknown }).id === segment) ?? value[Number(segment)];
    else if (value && typeof value === "object" && Object.hasOwn(value, segment)) value = (value as Record<string, unknown>)[segment];
    else return undefined;
  }
  return typeof value === "string" ? value : undefined;
}

export function say(message: Message, locale: Locale = "en"): string {
  const params = "params" in message ? Object.fromEntries(Object.entries(message.params ?? {}).map(([name, value]) => [name, typeof value === "object" ? say(value, locale) : value])) : {};
  const resolved = "ref" in message ? resolveRef(message.ref) : undefined;
  // An unresolved reference is an identifier, never an untrusted template.
  // Bound every recursive result before its parent can interpolate it again.
  const text = ("text" in message ? message.text : "ref" in message ? resolved === undefined ? message.ref : interpolate(locale, resolved, params) : translate(locale, message.key, params)).slice(0, MAX_MESSAGE_OUTPUT);
  if (!message.form || (locale !== "en" && locale !== "en-XA")) return text;
  const formed = message.form === "capital" ? text.charAt(0).toUpperCase() + text.slice(1)
    : message.form === "lowerFirst" ? text.charAt(0).toLowerCase() + text.slice(1)
    : message.form === "lower" ? text.toLowerCase() : text.split(" ").map(word => /[A-Z].*[A-Z0-9]|\d/.test(word) ? word : word.toLowerCase()).join(" ");
  return formed.slice(0, MAX_MESSAGE_OUTPUT);
}

export const sameMessage = (a: Message | null | undefined, b: Message | null | undefined) => JSON.stringify(a) === JSON.stringify(b);
// An older save's sentence, as the player read it; null for a message.
export const legacyText = (message: Message | null | undefined) => message && "key" in message && message.key === "legacy.text" ? String(message.params?.text ?? "") : null;
// A level the rules key on ("Moderate", "LOW") as the word for it: the
// response options' disruption, confidence and residual risk, and the
// attribution, objective and evidence confidence. The rules compare the
// English value; this is how it is shown.
const levels: Record<string, MessageKey> = { low: "level.low", moderate: "level.moderate", high: "level.high", strong: "level.strong", developing: "level.developing", limited: "level.limited" };
export const level = (value: string): Message => Object.hasOwn(levels, value.toLowerCase()) ? msg(levels[value.toLowerCase()]) : lit(value);
// A message's key, if it is one.
export const keyOf = (message: Message | null | undefined) => message && "key" in message ? message.key : null;
export function isMessage(value: unknown): value is Message {
  let remaining = 256;
  function valid(input: unknown, depth: number): boolean {
    if (--remaining < 0 || depth > 12 || !input || typeof input !== "object" || Array.isArray(input)) return false;
    const record = input as Record<string, unknown>;
    const kinds = ["key", "ref", "text"].filter(key => Object.hasOwn(record, key));
    if (kinds.length !== 1 || Object.keys(record).some(key => ![kinds[0], "params", "form"].includes(key))) return false;
    const text = record[kinds[0]];
    if (typeof text !== "string" || text.length > 2000) return false;
    if (kinds[0] !== "text" && !/^[A-Za-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+$/.test(text)) return false;
    if (record.form !== undefined && !["inSentence", "lower", "lowerFirst", "capital"].includes(record.form as string)) return false;
    if (record.params === undefined) return true;
    if (kinds[0] === "text" || !record.params || typeof record.params !== "object" || Array.isArray(record.params)) return false;
    const entries = Object.entries(record.params);
    return entries.length <= 32 && entries.every(([name, param]) => /^[a-zA-Z][a-zA-Z0-9_]{0,127}$/.test(name)
      && name !== "constructor" && name !== "prototype"
      && (typeof param === "string" ? param.length <= 2000 : typeof param === "number" ? Number.isFinite(param) : valid(param, depth + 1)));
  }
  return valid(value, 0);
}
