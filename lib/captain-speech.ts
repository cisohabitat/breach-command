import { setNarrationActive } from "./feedback-lazy.ts";
import { captainAudio } from "./captain-media.ts";
import type { CaptainVoiceCue } from "./captain-voice.ts";
import type { RecordedCaptainCue } from "./captain-debrief.ts";

export type CaptainSpeechState = "idle" | "queued" | "waiting" | "speaking" | "unavailable";
let activeStop: (() => void) | null = null;
let lastFinished = -Infinity;

// Routine speech waits for a quiet moment and never interrupts another line.
// Urgent public warnings may interrupt; an explicit Listen bypasses this queue.
export function scheduleCaptain(
  cues: readonly RecordedCaptainCue[],
  onState: (state: CaptainSpeechState) => void,
  onStart: () => void,
  activity: EventTarget,
  urgent = false,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopSpeech = () => {};
  let stopped = false;
  const events = ["pointerdown", "keydown", "wheel"];
  const detach = () => { for (const event of events) activity.removeEventListener(event, arm); };
  const attempt = () => {
    timer = null;
    if (stopped) return;
    if (!urgent && (activeStop || Date.now() - lastFinished < 1500)) { arm(); return; }
    detach();
    stopSpeech = speakCaptain(cues, onState, onStart);
  };
  function arm() {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(attempt, urgent ? 300 : 1500);
  }
  if (!urgent) for (const event of events) activity.addEventListener(event, arm);
  onState("queued");
  arm();
  return () => {
    stopped = true;
    if (timer !== null) clearTimeout(timer);
    detach();
    stopSpeech();
    if (timer !== null) onState("idle");
  };
}

// Bundled recordings give every device the same Captain. Playback failures
// leave the transcript usable and always release the music and cue mix.
export function speakCaptain(cue: Exclude<CaptainVoiceCue, "debrief"> | readonly RecordedCaptainCue[], onState: (state: CaptainSpeechState) => void, onStart: () => void = () => {}): () => void {
  activeStop?.();
  const cues = typeof cue === "string" ? [cue] : cue;
  let index = 0;
  let stopped = false;
  let started = false;
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
    if (activeStop === stop) { activeStop = null; lastFinished = Date.now(); }
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
    audio = captainAudio();
    audio.volume = 0.9;
    audio.onplaying = () => {
      if (stopped) return;
      if (!started) { started = true; onStart(); }
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
