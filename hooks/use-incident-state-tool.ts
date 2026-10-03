"use client";

import { useEffect, type RefObject } from "react";
import { attacks, availableIn, getAdversaryState, getLead, getTurnLimit, proceduresFor, scenarios, type Game } from "@/lib/advanced-game";

// Registers a read-only tool for browser agents that support document.modelContext.
// It reports what the player can already see — never the hidden attack chain —
// and does nothing in browsers without the API.
export function useIncidentStateTool(stateRef: RefObject<Game | null>) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      const registration = context.registerTool({
        name: "read_incident_state",
        title: "Read incident state",
        description: "Read the visible incident, working hypothesis, operational condition and available procedures. Hidden attacks are not disclosed.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input: unknown) {
          if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length) throw new Error("Expected an empty object.");
          const current = stateRef.current;
          if (!current) return { status: "briefing" };
          return {
            status: current.status,
            difficulty: current.difficulty,
            incident: scenarios[current.scenario].title,
            turnsUsed: current.turns.length,
            turnsRemaining: Math.max(0, getTurnLimit(current) - current.turns.length),
            impact: current.impact,
            operationalCondition: current.continuity,
            hypothesis: current.hypothesis,
            adversaryState: getAdversaryState(current),
            discovered: current.revealed.map(id => attacks.find(attack => attack.id === id)?.title),
            lead: getLead(current),
            procedures: proceduresFor(current).map(procedure => ({
              id: procedure.id,
              title: procedure.title,
              established: current.established.includes(procedure.id),
              cooldown: availableIn(current, procedure.id),
            })),
          };
        },
      }, { signal: lifecycle.signal });
      Promise.resolve(registration).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [stateRef]);
}
