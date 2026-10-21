"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/advanced-game";
import { IMPACT_CRITICAL, CONTINUITY_AT_RISK, OBJECTIVE_IMMINENT } from "../lib/meter-thresholds";
export { IMPACT_CRITICAL, CONTINUITY_AT_RISK, OBJECTIVE_IMMINENT } from "../lib/meter-thresholds";

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
