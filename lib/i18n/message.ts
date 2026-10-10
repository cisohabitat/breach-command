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
export type Form = "inSentence" | "lower";
export type Message = { key: MessageKey; params?: Record<string, Param> } | { ref: string; params?: Record<string, Param>; form?: Form };

export const msg = (key: MessageKey, params?: Record<string, Param>): Message => params ? { key, params } : { key };
export const ref = (path: string, params?: Record<string, Param>, form?: Form): Message => ({ ref: path, ...(params ? { params } : {}), ...(form ? { form } : {}) });
// A sentence from a save made before messages (session version 18 and
// earlier), kept as the player read it.
export const legacy = (text: string): Message => ({ key: "legacy.text", params: { text } });

// The text at a content path, found the way lib/i18n/content/walk.ts names it:
// an array item by its id, or by its position when it has none.
export function resolveRef(path: string): string | undefined {
  let value: unknown = contentTables;
  for (const segment of path.split(".")) {
    if (Array.isArray(value)) value = value.find(item => item && typeof item === "object" && (item as { id?: unknown }).id === segment) ?? value[Number(segment)];
    else if (value && typeof value === "object") value = (value as Record<string, unknown>)[segment];
    else return undefined;
  }
  return typeof value === "string" ? value : undefined;
}

export function say(message: Message, locale: Locale = "en"): string {
  const params = Object.fromEntries(Object.entries(message.params ?? {}).map(([name, value]) => [name, typeof value === "object" ? say(value, locale) : value]));
  if ("ref" in message) {
    const text = interpolate(locale, resolveRef(message.ref) ?? message.ref, params);
    if (!message.form || (locale !== "en" && locale !== "en-XA")) return text;
    return message.form === "lower" ? text.toLowerCase() : text.split(" ").map(word => /[A-Z].*[A-Z0-9]|\d/.test(word) ? word : word.toLowerCase()).join(" ");
  }
  return translate(locale, message.key, params);
}

export const sameMessage = (a: Message | null | undefined, b: Message | null | undefined) => JSON.stringify(a) === JSON.stringify(b);
// An older save's sentence, as the player read it; null for a message.
export const legacyText = (message: Message | null | undefined) => message && "key" in message && message.key === "legacy.text" ? String(message.params?.text ?? "") : null;
export const isMessage = (value: unknown): value is Message => !!value && typeof value === "object" && ("key" in value || "ref" in value);
