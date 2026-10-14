import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { CaptainVoiceCue } from "@/lib/captain-voice";
import type { Game, Turn } from "@/lib/advanced-game";
import type { RecordedCaptainCue } from "@/lib/captain-debrief";
import { captainUpdateFor } from "@/lib/captain-update";
import { captainReactionFor, type CaptainReaction } from "@/lib/captain-reaction";
import { speakCaptain, type CaptainSpeechState } from "@/lib/captain-speech";
import { register } from "@/lib/i18n";
import { captainVoiceMessages } from "@/lib/i18n/en/captain-voice";

register(captainVoiceMessages);

const lineKeys = {
  opening: "captainVoice.opening",
  opening1: "captainVoice.opening1",
  opening2: "captainVoice.opening2",
  opening3: "captainVoice.opening3",
  opening4: "captainVoice.opening4",
  opening5: "captainVoice.opening5",
  opening6: "captainVoice.opening6",
  opening7: "captainVoice.opening7",
  opening8: "captainVoice.opening8",
  opening9: "captainVoice.opening9",
  firstFinding: "captainVoice.firstFinding",
  connectedFindings: "captainVoice.connectedFindings",
  thirdFinding: "captainVoice.thirdFinding",
  unexpectedFinding: "captainVoice.unexpectedFinding",
  pressure: "captainVoice.pressure",
  serviceStabilising: "captainVoice.serviceStabilising",
  failedCheck: "captainVoice.failedCheck",
  weakSignal: "captainVoice.weakSignal",
  newDevelopment: "captainVoice.newDevelopment",
  noFinding: "captainVoice.noFinding",
  noFindingAgain: "captainVoice.noFindingAgain",
  response: "captainVoice.response",
  assurance: "captainVoice.assurance",
  recovery: "captainVoice.recovery",
  won: "captainVoice.won",
  lost: "captainVoice.lost",
  exercise: "captainVoice.exercise",
  reviewControlled: "captainVoice.reviewControlled",
  reviewStable: "captainVoice.reviewStable",
  reviewCostly: "captainVoice.reviewCostly",
  reviewFragile: "captainVoice.reviewFragile",
  reviewObjective: "captainVoice.reviewObjective",
  reviewImpact: "captainVoice.reviewImpact",
  reviewContinuityLost: "captainVoice.reviewContinuityLost",
  reviewSector: "captainVoice.reviewSector",
  reviewWindow: "captainVoice.reviewWindow",
  reviewExercise: "captainVoice.reviewExercise",
  reviewContain: "captainVoice.reviewContain",
  reviewObserve: "captainVoice.reviewObserve",
  reviewAttribute: "captainVoice.reviewAttribute",
  reviewNotify: "captainVoice.reviewNotify",
  reviewAct: "captainVoice.reviewAct",
  reviewEvidence: "captainVoice.reviewEvidence",
  reviewContinuity: "captainVoice.reviewContinuity",
  reviewAligned: "captainVoice.reviewAligned",
  reviewNoStrength: "captainVoice.reviewNoStrength",
  reviewReading: "captainVoice.reviewReading",
  reviewDecisions: "captainVoice.reviewDecisions",
  reviewServices: "captainVoice.reviewServices",
  reviewPractice: "captainVoice.reviewPractice",
  decisionContain: "captainVoice.decisionContain",
  decisionNotify: "captainVoice.decisionNotify",
  decisionAct: "captainVoice.decisionAct",
  decisionObserve: "captainVoice.decisionObserve",
  decisionAttribute: "captainVoice.decisionAttribute",
  containmentLow: "captainVoice.containmentLow",
  containmentModerate: "captainVoice.containmentModerate",
  containmentHigh: "captainVoice.containmentHigh",
  assuranceLow: "captainVoice.assuranceLow",
  assuranceModerate: "captainVoice.assuranceModerate",
  assuranceHigh: "captainVoice.assuranceHigh",
  recoveryLow: "captainVoice.recoveryLow",
  recoveryModerate: "captainVoice.recoveryModerate",
  recoveryHigh: "captainVoice.recoveryHigh",
} as const;

// Mounted at a visible narrative beat, never under a closed dialog.
type VoiceProps = { cue: CaptainVoiceCue | { game: Game; turn: Turn; reaction?: boolean } | CaptainReaction; lines?: readonly RecordedCaptainCue[]; enabled: boolean; history: RefObject<Set<string>> };

export function CaptainVoice(props: VoiceProps) {
  if (typeof props.cue !== "string" && "beat" in props.cue) {
    const reaction = captainReactionFor(props.cue);
    return reaction ? <CaptainLine {...props} {...reaction} /> : null;
  }
  if (typeof props.cue !== "string" && props.cue.reaction && props.cue.turn.number === props.cue.game.turns.length) {
    const reaction = captainReactionFor({ game: props.cue.game, beat: "decision" });
    if (reaction) return <CaptainLine {...props} {...reaction} />;
  }
  const cue = typeof props.cue === "string" ? props.cue : captainUpdateFor(props.cue.game, props.cue.turn);
  return cue ? <CaptainLine {...props} cue={cue} /> : null;
}

function CaptainLine({ cue, playbackKey = cue, lines, enabled, history }: Omit<VoiceProps, "cue"> & { cue: CaptainVoiceCue | RecordedCaptainCue; playbackKey?: string }) {
  const { t, locale } = useMessages();
  const cues = lines ?? (cue === "debrief" ? [] : [cue]);
  const text = cues.map(line => t(lineKeys[line])).join(" ");
  const [state, setState] = useState<CaptainSpeechState>("idle");
  const cancel = useRef<() => void>(() => {});
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const play = () => {
    if (pending.current !== null) clearTimeout(pending.current);
    pending.current = null;
    history.current.add(playbackKey);
    cancel.current();
    cancel.current = speakCaptain(cues, setState);
  };
  const autoPlay = useEffectEvent(play);
  const skip = () => {
    if (pending.current !== null) clearTimeout(pending.current);
    pending.current = null;
    history.current.add(playbackKey);
    cancel.current();
  };

  useEffect(() => {
    if (enabled && !history.current.has(playbackKey) && !document.hidden) pending.current = setTimeout(() => autoPlay(), 900);
    const stop = () => {
      if (pending.current !== null) clearTimeout(pending.current);
      pending.current = null;
      cancel.current();
    };
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", hide);
    return () => { stop(); document.removeEventListener("visibilitychange", hide); };
  }, [enabled, playbackKey, text, locale, history]);

  if (!enabled || !cues.length) return null;
  const busy = state === "speaking" || state === "waiting";
  return (
    <section className="captain-voice" aria-label={t("captainVoice.captain")}>
      <p className="captain-voice-transcript"><strong>{t("captainVoice.captain")}: </strong>{text}</p>
      <div className="captain-voice-controls">
        <button className="text-action" onClick={() => { if (!busy) play(); }} aria-disabled={busy}>{t("captainVoice.listen")}</button>
        <button className="text-action" onClick={skip}>{t("captainVoice.skip")}</button>
      </div>
      {state === "unavailable" && <p className="captain-voice-status" role="status">{t("captainVoice.unavailable")}</p>}
    </section>
  );
}
