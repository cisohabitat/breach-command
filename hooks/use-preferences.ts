"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { readStored, writeStored } from "@/lib/storage";

const PREFERENCES_KEY = "breach-command.preferences";

// Audio, haptics and contrast belong to the player, not to an operation: they
// are loaded once and persisted on every change, and they outlive every
// incident. Keeping them here leaves the session hook to the game itself.
export function usePreferences(onUnreadable: (notice: string) => void) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
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
          const parsed = JSON.parse(stored) as { sound?: boolean; music?: boolean; haptics?: boolean; highContrast?: boolean };
          setSoundEnabled(parsed.sound !== false);
          setMusicEnabled(parsed.music !== false);
          setHapticsEnabled(parsed.haptics !== false);
          setHighContrast(parsed.highContrast === true);
        } catch {
          report("Stored settings could not be read, so defaults are in use.");
        }
      }
      setLoaded(true);
    }, 0);
    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeStored(PREFERENCES_KEY, JSON.stringify({ sound: soundEnabled, music: musicEnabled, haptics: hapticsEnabled, highContrast }));
  }, [loaded, soundEnabled, musicEnabled, hapticsEnabled, highContrast]);

  return { soundEnabled, setSoundEnabled, musicEnabled, setMusicEnabled, hapticsEnabled, setHapticsEnabled, highContrast, setHighContrast };
}
