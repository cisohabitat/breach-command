import { setNarrationActive } from "./feedback-lazy.ts";

export type CaptainSpeechState = "idle" | "waiting" | "speaking" | "unavailable";
let activeStop: (() => void) | null = null;

// Use an installed voice rather than a platform's network-backed speech.
// Delayed voice discovery, rejected playback and a missing end event all leave
// a readable transcript and release the mix. Nothing throws into play.
export function speakCaptain(text: string, language: string, onState: (state: CaptainSpeechState) => void): () => void {
  activeStop?.();
  let stopped = false;
  let utterance: SpeechSynthesisUtterance | null = null;
  let synth: SpeechSynthesis | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let listening = false;
  const finish = (state: CaptainSpeechState) => {
    if (stopped) return;
    stopped = true;
    if (timer !== null) clearTimeout(timer);
    try {
      if (listening) synth?.removeEventListener("voiceschanged", attempt);
      if (utterance) {
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
        synth?.cancel();
      }
    } catch {}
    if (activeStop === stop) activeStop = null;
    setNarrationActive(false);
    onState(state);
  };
  const stop = () => finish("idle");
  const attempt = () => {
    if (stopped || utterance || !synth) return;
    try {
      const lang = language.toLowerCase().split("-")[0];
      const voices = synth.getVoices().filter(voice => voice.localService && voice.lang.toLowerCase().split("-")[0] === lang);
      const voice = voices.find(voice => voice.default) ?? voices[0];
      if (!voice) return;
      if (timer !== null) clearTimeout(timer);
      utterance = new window.SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.95;
      utterance.volume = 0.85;
      utterance.onstart = () => { if (!stopped) onState("speaking"); };
      utterance.onend = () => finish("idle");
      utterance.onerror = () => finish("unavailable");
      timer = setTimeout(() => finish("unavailable"), 25_000);
      setNarrationActive(true);
      synth.speak(utterance);
    } catch { finish("unavailable"); }
  };
  activeStop = stop;
  try {
    if (typeof window === "undefined" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      finish("unavailable");
      return stop;
    }
    synth = window.speechSynthesis;
    onState("waiting");
    synth.addEventListener("voiceschanged", attempt);
    listening = true;
    timer = setTimeout(() => finish("unavailable"), 1500);
    attempt();
  } catch { finish("unavailable"); }
  return stop;
}
