import { useLayoutEffect, type RefObject } from "react";
import type { Game } from "@/lib/advanced-game";
import { captainDebriefFor } from "@/lib/captain-debrief";
import { CaptainVoice } from "./captain-voice";

export function CaptainDebrief({ game, grade, recoveryRisk, history }: { game: Game; grade: string; recoveryRisk?: string; history: RefObject<Set<string>> }) {
  const lines = captainDebriefFor(game, grade, recoveryRisk);
  useLayoutEffect(() => {
    // The deferred transcript can arrive after the player has tabbed onward.
    // Keep their chosen control visible without moving focus to another one.
    const focused = document.activeElement;
    if (lines.length && focused instanceof HTMLElement && focused.closest(".debrief-dialog")) focused.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [lines.length]);
  return lines.length ? <CaptainVoice cue="debrief" lines={lines} enabled history={history} /> : null;
}
