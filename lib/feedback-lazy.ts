// Sound and haptics load on first use. The procedural audio is a large module
// that a first visit does not need before the page answers, and every cue is
// fire-and-forget, so the call returns at once and the cue plays when the module
// arrives. Calls keep their order, because each waits on the same import. A
// module that fails to load is swallowed like any other feedback failure: sound
// never throws into the game.
import type { FeedbackContext, FeedbackCue } from "./feedback.ts";

let loaded: Promise<typeof import("./feedback.ts")> | null = null;
const load = () => (loaded ??= import("./feedback.ts"));

export function playFeedback(cue: FeedbackCue, sound = true, haptics = true, context?: FeedbackContext | null) {
  if (!sound && !haptics) return;
  load().then(module => module.playFeedback(cue, sound, haptics, context)).catch(() => {});
}

export function setAdaptiveScore(enabled: boolean, tension = 0, sector = 0) {
  load().then(module => module.setAdaptiveScore(enabled, tension, sector)).catch(() => {});
}
