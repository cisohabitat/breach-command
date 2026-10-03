"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/advanced-game";

// Moment-to-moment feedback for the case meters. The deltas describe what the
// last resolved step did to business impact and operational continuity, plus
// whether that step pushed either readout across a meaningful threshold.
export type MeterPulse = {
  key: number;
  impact: number;
  continuity: number;
  objective: number;
  impactCritical: boolean;
  continuityAtRisk: boolean;
  objectiveImminent: boolean;
};
export const IMPACT_CRITICAL = 70;
export const CONTINUITY_AT_RISK = 45;
// Adversary progress is the clock that actually closes most operations, so it
// gets the same threshold treatment as the other two pressure readouts.
export const OBJECTIVE_IMMINENT = 70;

export function useMeterPulse() {
  const [meterPulse, setMeterPulse] = useState<MeterPulse | null>(null);
  const pulseKey = useRef(0);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Describe the meter movement caused by one resolved step. Threshold crossings
  // are recorded as a boolean so the interface can mark them as an event even
  // when the underlying number only moved by a single point.
  function pulseMeters(previous: Game | null, next: Game) {
    if (!previous) return;
    const impact = next.impact - previous.impact;
    const continuity = next.continuity - previous.continuity;
    const objective = next.objectiveProgress - previous.objectiveProgress;
    const impactCritical = previous.impact < IMPACT_CRITICAL && next.impact >= IMPACT_CRITICAL;
    const continuityAtRisk = previous.continuity > CONTINUITY_AT_RISK && next.continuity <= CONTINUITY_AT_RISK;
    const objectiveImminent = previous.objectiveProgress < OBJECTIVE_IMMINENT && next.objectiveProgress >= OBJECTIVE_IMMINENT;
    if (!impact && !continuity && !objective && !impactCritical && !continuityAtRisk && !objectiveImminent) return;
    pulseKey.current += 1;
    setMeterPulse({ key: pulseKey.current, impact, continuity, objective, impactCritical, continuityAtRisk, objectiveImminent });
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setMeterPulse(null), 1400);
  }

  function clearMeterPulse() {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setMeterPulse(null);
  }

  useEffect(() => () => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
  }, []);

  return { meterPulse, pulseMeters, clearMeterPulse };
}
