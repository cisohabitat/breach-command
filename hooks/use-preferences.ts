"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { readStored, writeStored } from "@/lib/storage";
import { msg, type Message } from "@/lib/i18n/message";
import { register } from "@/lib/i18n";
import { sessionMessages } from "@/lib/i18n/en/session";

register(sessionMessages);


const PREFERENCES_KEY = "breach-command.preferences";

// Audio, haptics and contrast belong to the player, not to an operation: they
// are loaded once and persisted on every change, and they outlive every
// incident. Keeping them here leaves the session hook to the game itself.
export function usePreferences(onUnreadable: (notice: Message) => void) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  // Single-key shortcuts must be able to be turned off (WCAG 2.1.4): a speech
  // input user saying a word with an F in it should not open the field guide.
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  // Both effects run on mount. Until the stored settings have actually been
  // read, the persist effect would write the defaults straight over them, which
  // is why nothing the player chose ever survived a reload.
  const [loaded, setLoaded] = useState(false);
  const report = useEffectEvent(onUnreadable);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      const stored = readStored(PREFERENCES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { sound?: boolean; music?: boolean; haptics?: boolean; highContrast?: boolean; shortcuts?: boolean };
          setSoundEnabled(parsed.sound !== false);
          setMusicEnabled(parsed.music !== false);
          setHapticsEnabled(parsed.haptics !== false);
          setHighContrast(parsed.highContrast === true);
          setShortcutsEnabled(parsed.shortcuts !== false);
        } catch {
          report(msg("session.settingsUnreadable"));
        }
      }
      setLoaded(true);
    }, 0);
    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeStored(PREFERENCES_KEY, JSON.stringify({ sound: soundEnabled, music: musicEnabled, haptics: hapticsEnabled, highContrast, shortcuts: shortcutsEnabled }));
  }, [loaded, soundEnabled, musicEnabled, hapticsEnabled, highContrast, shortcutsEnabled]);

  // Dialogs and sheets render into a portal outside the application shell, so
  // the contrast tokens are carried on the document root as well, where every
  // overlay inherits them.
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  return { soundEnabled, setSoundEnabled, musicEnabled, setMusicEnabled, hapticsEnabled, setHapticsEnabled, highContrast, setHighContrast, shortcutsEnabled, setShortcutsEnabled };
}
