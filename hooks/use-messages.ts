"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { isLocale, translate, type Locale, type MessageKey } from "@/lib/i18n";
import { richText } from "@/lib/i18n/rich";
import { say as sayIn, type Message } from "@/lib/i18n/message";

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
// A message with markup: "<strong>{figure}</strong> of {limit} turns remaining".
// Each tag is rendered by the component's own function, so the element keeps
// its class and the translator can move it within the sentence. Tags do not
// nest, and only the names the component passes are read as tags.
export type Rich = (key: MessageKey, params: Record<string, string | number>, tags: Record<string, (chunk: string) => ReactNode>) => ReactNode;

// The content tables' words for a locale other than English are replaced once,
// on the client, after the page has hydrated in English: the overlay loads with
// import(), so English carries none of it. Every component that reads messages
// subscribes to the revision, and renders again once the content has changed.
let contentRevision = 0;
let contentLocale: Locale = "en";
const contentListeners = new Set<() => void>();
const subscribeContent = (listener: () => void) => { contentListeners.add(listener); return () => { contentListeners.delete(listener); }; };
function loadContent(locale: Locale) {
  if (locale === contentLocale) return;
  contentLocale = locale;
  void import("@/lib/i18n/content/overlay").then(({ applyLocaleContent }) => {
    applyLocaleContent(locale);
    contentRevision++;
    for (const listener of contentListeners) listener();
  });
}

export function useMessages(): { locale: Locale; t: Translate; rich: Rich; say: (message: Message) => string } {
  const locale = useSyncExternalStore(noSubscription, readLocale, () => "en" as Locale);
  useSyncExternalStore(subscribeContent, () => contentRevision, () => 0);
  useEffect(() => loadContent(locale), [locale]);
  return {
    locale,
    t: (key, params) => translate(locale, key, params),
    rich: (key, params, tags) => richText(translate(locale, key, params), tags),
    // A message the engine wrote (lib/i18n/message.ts), in this locale. The
    // component must import "@/lib/i18n/engine-messages" for its words.
    say: message => sayIn(message, locale),
  };
}

// For a class component or a helper outside a component, which cannot call a
// hook: the same messages, read for the locale at the moment of the call.
export function textFor(key: MessageKey, params?: Record<string, string | number>) {
  return translate(activeLocale(), key, params);
}

// The locale at the moment of the call, for code outside a component.
export function activeLocale(): Locale {
  return typeof window === "undefined" ? "en" : readLocale();
}
