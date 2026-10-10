"use client";

import { useSyncExternalStore } from "react";
import { isLocale, translate, type Locale, type MessageKey } from "@/lib/i18n";

// The locale is read on the client only, from ?locale= on the address, so the
// prerendered page hydrates in English and switches after. Until a second
// catalogue ships, the only other locale is the pseudo-locale used to test
// layouts with longer strings.
const noSubscription = () => () => {};
function readLocale(): Locale {
  try {
    const requested = new URLSearchParams(window.location.search).get("locale");
    return isLocale(requested) ? requested : "en";
  } catch {
    return "en";
  }
}

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

export function useMessages(): { locale: Locale; t: Translate } {
  const locale = useSyncExternalStore(noSubscription, readLocale, () => "en" as Locale);
  return { locale, t: (key: MessageKey, params?: Record<string, string | number>) => translate(locale, key, params) };
}

// For a class component or a helper outside a component, which cannot call a
// hook: the same messages, read for the locale at the moment of the call.
export function textFor(key: MessageKey, params?: Record<string, string | number>) {
  return translate(typeof window === "undefined" ? "en" : readLocale(), key, params);
}
