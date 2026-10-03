"use client";

import { useEffect, type RefObject } from "react";

// When a blocking panel replaces the control the player just used, the browser
// drops focus to the page body and a keyboard user starts again from the top.
// Bring focus to the panel's heading instead — only when focus was actually
// lost, so a player who has moved somewhere else is never pulled back.
export function useRecoverFocus(target: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const active = document.activeElement;
    if (active && active !== document.body) return;
    target.current?.focus();
  }, [target, key]);
}
