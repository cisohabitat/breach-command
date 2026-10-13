import { setNarrationActive } from "./feedback-lazy.ts";
import type { CaptainVoiceCue } from "./captain-voice.ts";

export type CaptainSpeechState = "idle" | "waiting" | "speaking" | "unavailable";
let activeStop: (() => void) | null = null;

// Bundled recordings give every device the same Captain. Playback failures
// leave the transcript usable and always release the music and cue mix.
export function speakCaptain(cue: CaptainVoiceCue, onState: (state: CaptainSpeechState) => void): () => void {
  activeStop?.();
  let stopped = false;
  let audio: HTMLAudioElement | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const finish = (state: CaptainSpeechState) => {
    if (stopped) return;
    stopped = true;
    if (timer !== null) clearTimeout(timer);
    if (audio) {
      audio.onplaying = null;
      audio.onended = null;
      audio.onerror = null;
      try { audio.pause(); audio.removeAttribute("src"); audio.load(); } catch {}
    }
    if (activeStop === stop) activeStop = null;
    setNarrationActive(false);
    onState(state);
  };
  const stop = () => finish("idle");
  activeStop = stop;
  try {
    audio = new window.Audio("/audio/captain/" + cue + ".mp3");
    audio.volume = 0.9;
    audio.onplaying = () => {
      if (stopped) return;
      setNarrationActive(true);
      onState("speaking");
    };
    audio.onended = () => finish("idle");
    audio.onerror = () => finish("unavailable");
    onState("waiting");
    timer = setTimeout(() => finish("unavailable"), 25_000);
    void audio.play().catch(() => finish("unavailable"));
  } catch { finish("unavailable"); }
  return stop;
}
