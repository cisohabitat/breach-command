import type { Game, ResponseProfile } from "./advanced-game.ts";
import type { RecordedCaptainCue } from "./captain-debrief.ts";

export type CaptainReaction = { game: Game; beat: "decision" } | { game: Game; beat: "response" | "ending"; profile: ResponseProfile };

// Live commentary reads only recorded choices and the terms shown before them.
// Decision quality, response fit and hidden incident answers belong to review.
export function captainReactionFor(request: CaptainReaction): { cue: RecordedCaptainCue; playbackKey: string } | null {
  const { game, beat } = request;
  if (beat === "decision") {
    const last = game.decisions.at(-1);
    const turn = game.turns.at(-1);
    if (game.status !== "playing" || game.pendingDecision || !last || !turn || (last.stage !== turn.revealed && last.stage !== turn.injectReveal)) return null;
    const cues = { contain: "decisionContain", notify: "decisionNotify", act: "decisionAct", observe: "decisionObserve", attribute: "decisionAttribute" } as const;
    return { cue: cues[last.choice], playbackKey: `decision:${game.decisions.length}` };
  }
  if (beat === "ending" && game.status !== "won" && game.status !== "lost" && game.status !== "exercise") return null;
  if (beat === "response" && game.status !== "response") return null;
  if (game.status === "lost" || game.status === "exercise") return { cue: game.status, playbackKey: game.status };
  const count = game.responseChoices.length;
  if (beat === "ending" && count !== 3) return { cue: "won", playbackKey: "won" };
  if (!count) return { cue: "response", playbackKey: "response" };
  const phase = count === 1 ? "containment" : count === 2 ? "assurance" : "recovery";
  const option = request.profile[phase].find(item => item.id === game.responseChoices.at(-1));
  if (!option) return null;
  const band = option.residual === "Low" ? 0 : option.residual === "High" ? 2 : 1;
  const cues = {
    containment: ["containmentLow", "containmentModerate", "containmentHigh"],
    assurance: ["assuranceLow", "assuranceModerate", "assuranceHigh"],
    recovery: ["recoveryLow", "recoveryModerate", "recoveryHigh"],
  } as const;
  return { cue: cues[phase][band], playbackKey: `response:${count}` };
}
