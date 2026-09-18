export type FeedbackCue = "open" | "success" | "failure" | "warning" | "decision" | "complete";

const cueNotes: Record<FeedbackCue, number[]> = {
  open: [220, 330],
  success: [440, 660, 880],
  failure: [190, 150],
  warning: [260, 260, 220],
  decision: [330, 440],
  complete: [392, 523, 659, 784],
};

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
