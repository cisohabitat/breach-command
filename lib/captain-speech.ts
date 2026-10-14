import { setNarrationActive } from "./feedback-lazy.ts";
import type { CaptainVoiceCue } from "./captain-voice.ts";
import type { RecordedCaptainCue } from "./captain-debrief.ts";

export type CaptainSpeechState = "idle" | "waiting" | "speaking" | "unavailable";
let activeStop: (() => void) | null = null;

// Bundled recordings give every device the same Captain. Playback failures
// leave the transcript usable and always release the music and cue mix.
export function speakCaptain(cue: Exclude<CaptainVoiceCue, "debrief"> | readonly RecordedCaptainCue[], onState: (state: CaptainSpeechState) => void): () => void {
  activeStop?.();
  const cues = typeof cue === "string" ? [cue] : cue;
  let index = 0;
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
  const playNext = () => {
    if (stopped || !audio) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => finish("unavailable"), 25_000);
    audio.src = "/audio/captain/" + cues[index] + ".mp3";
    void audio.play().catch(() => finish("unavailable"));
  };
  activeStop = stop;
  try {
    if (!cues.length) { finish("idle"); return stop; }
    audio = new window.Audio();
    audio.volume = 0.9;
    audio.onplaying = () => {
      if (stopped) return;
      setNarrationActive(true);
      onState("speaking");
    };
    audio.onended = () => {
      if (stopped) return;
      if (++index < cues.length) playNext();
      else finish("idle");
    };
    audio.onerror = () => finish("unavailable");
    onState("waiting");
    playNext();
  } catch { finish("unavailable"); }
  return stop;
}
