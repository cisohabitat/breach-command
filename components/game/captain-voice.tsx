import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { CaptainVoiceCue } from "@/lib/captain-voice";
import type { Game, Turn } from "@/lib/advanced-game";
import type { RecordedCaptainCue } from "@/lib/captain-debrief";
import { captainReactionFor, type CaptainReaction } from "@/lib/captain-reaction";
import { captainUpdateFor } from "@/lib/captain-update";
import { scheduleCaptain, speakCaptain, type CaptainSpeechState } from "@/lib/captain-speech";
import { register } from "@/lib/i18n";
import { captainVoiceMessages } from "@/lib/i18n/en/captain-voice";

register(captainVoiceMessages);

const lineKeys = {
  confidenceStrengthened: "captainVoice.confidenceStrengthened",
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

export function CaptainVoiceTest() {
  const { t } = useMessages();
  const [state, setState] = useState<CaptainSpeechState>("idle");
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const cancel = useRef<() => void>(() => {});
  useEffect(() => () => cancel.current(), []);
  const busy = state === "waiting" || state === "speaking";
  return <section className="captain-voice" aria-label={t("captainVoice.test")}>
    <button className="text-action" onClick={() => {
      cancel.current();
      if (!busy) {
        setTranscriptOpen(true);
        cancel.current = speakCaptain("noFinding", setState);
      }
    }}>{t(busy ? "captainVoice.stopTest" : "captainVoice.test")}</button>
    <p className="captain-voice-status" role="status">{t(state === "unavailable" ? "captainVoice.unavailable" : state === "speaking" ? "captainVoice.speaking" : state === "waiting" ? "captainVoice.loading" : "captainVoice.testHelp")}</p>
    <details className="modifier-details" open={transcriptOpen} onToggle={event => setTranscriptOpen(event.currentTarget.open)}><summary>{t("captainVoice.sampleTranscript")}</summary><p className="captain-voice-transcript">{t("captainVoice.noFinding")}</p></details>
  </section>;
}

// Mounted at a visible narrative beat, never under a closed dialog.
type VoiceProps = { cue: CaptainVoiceCue | { game: Game; turn: Turn; reaction?: boolean } | CaptainReaction; lines?: readonly RecordedCaptainCue[]; enabled: boolean; decisionPending?: boolean; history: RefObject<Set<string>> };

export function CaptainVoice(props: VoiceProps) {
  const request: CaptainReaction | null = typeof props.cue === "string" ? null
    : "beat" in props.cue ? props.cue
    : props.cue.reaction && props.cue.turn.number === props.cue.game.turns.length
      ? { game: props.cue.game, beat: "decision" } : null;
  const reaction = request ? captainReactionFor(request) : null;
  if (reaction && request) {
    const turn = request.game.turns.at(-1);
    const decision = request.game.decisions.at(-1);
    const throughDecision = turn && decision ? { ...turn,
      impactChange: turn.impactChange + decision.impactChange,
      continuityChange: turn.continuityChange + decision.continuityChange,
    } : turn;
    // A quick choice must not replace an unheard public pressure warning.
    // Include its recorded meter changes so the crossing is still measured
    // from before this procedure; a choice that relieves the pressure can clear it.
    if (request.beat === "decision" && throughDecision && !props.history.current.has("pressure") && captainUpdateFor(request.game, throughDecision) === "pressure") {
      return <CaptainLine {...props} cue="pressure" />;
    }
    return <CaptainLine {...props} {...reaction} />;
  }
  if (typeof props.cue !== "string" && "beat" in props.cue) return null;
  const cue = typeof props.cue === "string" ? props.cue : captainUpdateFor(props.cue.game, props.cue.turn);
  return cue ? <CaptainLine {...props} cue={cue} /> : null;
}

function CaptainLine({ cue, playbackKey = cue, lines, enabled, decisionPending = false, history }: Omit<VoiceProps, "cue"> & { cue: CaptainVoiceCue | RecordedCaptainCue; playbackKey?: string }) {
  const { t, locale } = useMessages();
  const cues = lines ?? (cue === "debrief" ? [] : [cue]);
  const text = cues.map(line => t(lineKeys[line])).join(" ");
  const [state, setState] = useState<CaptainSpeechState>("idle");
  const cancel = useRef<() => void>(() => {});
  const play = () => {
    cancel.current();
    cancel.current = speakCaptain(cues, setState, () => history.current.add(playbackKey));
  };
  const schedule = useEffectEvent((urgent: boolean) => {
    cancel.current = scheduleCaptain(cues, setState, () => history.current.add(playbackKey), document, urgent);
  });
  const skip = () => {
    history.current.add(playbackKey);
    cancel.current();
  };

  useEffect(() => {
    const urgent = cue === "pressure" || cue === "lost";
    if (enabled && (!decisionPending || urgent) && !history.current.has(playbackKey) && !document.hidden) schedule(urgent);
    const stop = () => cancel.current();
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", hide);
    return () => { stop(); document.removeEventListener("visibilitychange", hide); };
  }, [enabled, decisionPending, cue, playbackKey, text, locale, history]);

  if (!enabled || !cues.length) return null;
  const busy = state === "speaking" || state === "waiting";
  const status = state === "unavailable" ? "captainVoice.unavailable" : state === "speaking" ? "captainVoice.speaking" : state === "waiting" ? "captainVoice.loading" : decisionPending && cue !== "pressure" && cue !== "lost" ? "captainVoice.decisionWait" : state === "queued" ? cue === "pressure" || cue === "lost" ? "captainVoice.priorityWait" : "captainVoice.quietWait" : "captainVoice.replayReady";
  return (
    <section className="captain-voice" aria-label={t("captainVoice.captain")}>
      <p className="captain-voice-transcript"><strong>{t("captainVoice.captain")}: </strong>{text}</p>
      <div className="captain-voice-controls">
        <button className="text-action" onClick={() => { if (!busy) play(); }} aria-disabled={busy}>{t("captainVoice.listen")}</button>
        <button className="text-action" onClick={skip}>{t("captainVoice.skip")}</button>
      </div>
      <p className="captain-voice-status" role="status">{t(status)}</p>
    </section>
  );
}
