// Unlock in the actual user gesture, before an asynchronous audio-module load.
// Firefox can leave a context created only after that load suspended.
let context: AudioContext | null = null;
let unavailable = false;

export function feedbackAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || unavailable) return null;
  try {
    const Constructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return null;
    context ??= new Constructor();
    if (context.state === "closed") return null;
    if (context.state === "suspended") void context.resume().catch(() => {});
    return context;
  } catch {
    unavailable = true;
    return null;
  }
}
