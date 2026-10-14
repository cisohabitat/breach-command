import type { RefObject } from "react";
import type { Game } from "@/lib/advanced-game";
import type { CaptainVoiceCue } from "@/lib/captain-voice";
import { captainDebriefFor } from "@/lib/captain-debrief";
import { CaptainVoice } from "./captain-voice";

export function CaptainDebrief({ game, grade, history }: { game: Game; grade: string; history: RefObject<Set<CaptainVoiceCue>> }) {
  const lines = captainDebriefFor(game, grade);
  return lines.length ? <CaptainVoice cue="debrief" lines={lines} enabled history={history} /> : null;
}
