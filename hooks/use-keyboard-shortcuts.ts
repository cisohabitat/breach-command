"use client";

import { useEffect, useEffectEvent } from "react";

// F field guide, M mute, G guided reflection. Single-key shortcuts must be able
// to be turned off (WCAG 2.1.4), and typing into a field or jumping through a
// select is never a shortcut.
export function useKeyboardShortcuts(enabled: boolean, actions: { f: () => void; m: () => void; g: () => void }) {
  const run = useEffectEvent((key: "f" | "m" | "g") => actions[key]());

  useEffect(() => {
    if (!enabled) return;
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable)) return;
      const key = event.key.toLowerCase();
      if (key === "f" || key === "m" || key === "g") run(key);
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [enabled]);
}
