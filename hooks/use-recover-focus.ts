"use client";

import { useEffect, type RefObject } from "react";

// When a blocking panel replaces the control the player just used, the browser
// drops focus to the page body and a keyboard user starts again from the top.
// Bring focus to the panel's heading instead — only when focus was actually
// lost, so a player who has moved somewhere else is never pulled back.
// For an overlay's close: the control that opened it is usually gone by then, so
// focus would fall to the page. When something is waiting for the player — a
// command event, a sector decision, the response or the ending, each marked
// `data-awaiting-heading` — focus goes there instead, and it is brought into view
// because it may have appeared behind the overlay.
export function returnFocusToAwaiting(event: Event) {
  const awaiting = document.querySelector<HTMLElement>("[data-awaiting-heading]");
  if (!awaiting) return;
  event.preventDefault();
  awaiting.focus();
  awaiting.scrollIntoView({ block: "center" });
}

export function useRecoverFocus(target: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const active = document.activeElement;
    if (active && active !== document.body) return;
    target.current?.focus();
  }, [target, key]);
}
