import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { CaptainVoiceCue } from "@/lib/captain-voice";
import { speakCaptain, type CaptainSpeechState } from "@/lib/captain-speech";
import { register } from "@/lib/i18n";
import { captainVoiceMessages } from "@/lib/i18n/en/captain-voice";

register(captainVoiceMessages);

const lineKeys = {
  opening: "captainVoice.opening",
  firstFinding: "captainVoice.firstFinding",
  connectedFindings: "captainVoice.connectedFindings",
  pressure: "captainVoice.pressure",
  response: "captainVoice.response",
  won: "captainVoice.won",
  lost: "captainVoice.lost",
  exercise: "captainVoice.exercise",
} as const;

// Mounted at a visible narrative beat, never under a closed dialog.
export function CaptainVoice({ cue, enabled, history }: { cue: CaptainVoiceCue; enabled: boolean; history: RefObject<Set<CaptainVoiceCue>> }) {
  const { t, locale } = useMessages();
  const text = t(lineKeys[cue]);
  const [state, setState] = useState<CaptainSpeechState>("idle");
  const cancel = useRef<() => void>(() => {});
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const play = () => {
    if (pending.current !== null) clearTimeout(pending.current);
    pending.current = null;
    history.current.add(cue);
    cancel.current();
    cancel.current = speakCaptain(text, locale === "en-XA" ? "en" : locale, setState);
  };
  const autoPlay = useEffectEvent(play);
  const skip = () => {
    if (pending.current !== null) clearTimeout(pending.current);
    pending.current = null;
    history.current.add(cue);
    cancel.current();
  };

  useEffect(() => {
    if (enabled && !history.current.has(cue) && !document.hidden) pending.current = setTimeout(() => autoPlay(), 900);
    const stop = () => {
      if (pending.current !== null) clearTimeout(pending.current);
      pending.current = null;
      cancel.current();
    };
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", hide);
    return () => { stop(); document.removeEventListener("visibilitychange", hide); };
  }, [enabled, cue, text, locale, history]);

  if (!enabled) return null;
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
