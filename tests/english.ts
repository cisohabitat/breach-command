// A result of the engine's, with every message in it said in English, so a test
// reads what a player reads: en(getBeginnerReview(game)).gap is a string.
import { isMessage, say, type Message } from "../lib/i18n/message.ts";
import "../lib/i18n/engine-messages.ts";

export type English<T> = T extends Message ? string : T extends readonly (infer U)[] ? English<U>[] : T extends object ? { [K in keyof T]: English<T[K]> } : T;

export function en<T>(value: T): English<T> {
  if (isMessage(value)) return say(value) as English<T>;
  if (Array.isArray(value)) return value.map(en) as English<T>;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, en(item)])) as English<T>;
  return value as English<T>;
}
