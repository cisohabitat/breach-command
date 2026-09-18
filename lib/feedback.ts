export type FeedbackCue = "open" | "success" | "failure" | "warning" | "decision" | "complete";

const cueNotes: Record<FeedbackCue, number[]> = {
  open: [220, 330],
  success: [440, 660, 880],
  failure: [190, 150],
  warning: [260, 260, 220],
  decision: [330, 440],
  complete: [392, 523, 659, 784],
};

let ambientContext: AudioContext | null = null;
let ambientGain: GainNode | null = null;
let ambientFilter: BiquadFilterNode | null = null;
let ambientNodes: OscillatorNode[] = [];

export function setAdaptiveScore(enabled: boolean, tension = 0, sector = 0) {
  if (typeof window === "undefined") return;
  if (!enabled) {
    ambientGain?.gain.setTargetAtTime(0.0001, ambientContext?.currentTime ?? 0, 0.2);
    window.setTimeout(() => {
      ambientNodes.forEach(node => { try { node.stop(); } catch {} });
      ambientNodes = [];
      void ambientContext?.close();
      ambientContext = null;
      ambientGain = null;
      ambientFilter = null;
    }, 500);
    return;
  }
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  if (!ambientContext) {
    ambientContext = new AudioContextClass();
    ambientGain = ambientContext.createGain();
    ambientFilter = ambientContext.createBiquadFilter();
    ambientFilter.type = "lowpass";
    ambientFilter.frequency.value = 520;
    ambientFilter.Q.value = 0.8;
    ambientGain.gain.value = 0.0001;
    ambientGain.connect(ambientFilter).connect(ambientContext.destination);
    const root = [55, 58.27, 61.74, 65.41, 73.42][sector % 5];
    [root, root * 1.5, root * 2].forEach((frequency, index) => {
      const oscillator = ambientContext!.createOscillator();
      const layer = ambientContext!.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      layer.gain.value = index === 0 ? 0.5 : 0.16;
      oscillator.connect(layer).connect(ambientGain!);
      oscillator.start();
      ambientNodes.push(oscillator);
    });
  }
  if (ambientContext.state === "suspended") void ambientContext.resume();
  const level = 0.008 + Math.min(1, Math.max(0, tension)) * 0.012;
  ambientGain?.gain.setTargetAtTime(level, ambientContext.currentTime, 0.35);
  ambientFilter?.frequency.setTargetAtTime(420 + tension * 900 + (sector % 3) * 90, ambientContext.currentTime, 0.5);
  ambientNodes.forEach((node, index) => node.detune.setTargetAtTime(tension * (index + 1) * 7, ambientContext!.currentTime, 0.5));
}

export function playFeedback(cue: FeedbackCue, sound = true, haptics = true) {
  if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
    const pattern = cue === "warning" ? [35, 45, 70] : cue === "failure" ? [70, 35, 70] : [30];
    navigator.vibrate(pattern);
  }
  if (!sound || typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const now = context.currentTime;
  cueNotes[cue].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = cue === "warning" || cue === "failure" ? "sawtooth" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.045, now + index * 0.1 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 0.13);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + index * 0.1);
    oscillator.stop(now + index * 0.1 + 0.14);
  });
  window.setTimeout(() => void context.close(), 900);
}
