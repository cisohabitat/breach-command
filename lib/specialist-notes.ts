// What each specialist says after an operation, and how they develop across a
// campaign: read by the review, so it loads with the game rather than with the
// assignment screen's campaign route.
import type { SpecialistId } from "./command-systems.ts";
import { registerContent } from "./i18n/content/registry.ts";
import { lit, msg, type Message } from "./i18n/message.ts";

const specialistNames: Record<SpecialistId, string> = {
  hunter: "Maya",
  forensics: "Elias",
  identity: "Noor",
  ot: "Daniel",
  continuity: "Sofia",
  communications: "Marcus",
};

type ReactionTone = "loss" | "excellent" | "strong" | "cohesive" | "steady";

// Each specialist speaks in five outcome tones. Selection is a pure function of the debrief inputs, so
// the same specialist, result, score and bond always produce the same after-action note.
const specialistReactions: Record<SpecialistId, Record<ReactionTone, string[]>> = {
  hunter: {
    loss: ["We lost the window, not the lessons. Preserve the sequence and rebuild the plan.", "The behaviour was visible; our timing was not. Keep the evidence boundary intact next run."],
    excellent: ["The team anticipated the decision points. That is repeatable command practice.", "Behaviour testing stayed ahead of the actor. Document that decision order."],
    strong: ["The evidence carried us to the chain. Tighten the correlation step and it repeats.", "We tested behaviour before assuming intent. That is the correct order."],
    cohesive: ["We held the line together. Next time we can reduce the uncertainty earlier.", "The team stayed aligned under pressure. Carry that coordination into the next incident."],
    steady: ["The service is stable. The review should focus on where our shared picture arrived late.", "We reached the answer. Look first at which signal we discounted."],
  },
  forensics: {
    loss: ["Artefacts outlived the incident; our access to them did not. Fix the capture order first.", "The loss was procedural, not evidential. Rebuild the collection sequence."],
    excellent: ["The sequence survived every action. That is disciplined evidence handling.", "We reconstructed the timeline cleanly. Keep the collection order documented."],
    strong: ["The artefact chain held. Record where it held and where it nearly broke.", "We preserved what mattered. Tighten the memory capture step."],
    cohesive: ["The team trusted the evidence over instinct. That is how reconstruction works.", "We kept the sequence intact together. Capture earlier next time."],
    steady: ["The reconstruction is defensible. Review which artefact we almost overwrote.", "The host told most of the story. Ask what we changed before we read it."],
  },
  identity: {
    loss: ["A valid credential is still not a valid action. We will prove that faster next time.", "We revoked late. The review starts with who held approval authority."],
    excellent: ["We separated identity from intent at every step. That is the standard.", "Token and action were never conflated. Keep that discipline."],
    strong: ["We questioned the credential before acting on it. That order worked.", "The trust path was clear. Document where authority slowed us down."],
    cohesive: ["We agreed on the identity boundary together. Preserve that shared reading.", "The team did not confuse access with authority. Hold that line."],
    steady: ["Trust decisions held. Examine where the identity picture arrived last.", "We got the revocation right. Ask why it needed two approvals."],
  },
  ot: {
    loss: ["We protected the process, but not the timeline. The safe response needs a rehearsed decision path.", "Operations held while the investigation slipped. Rehearse the split next time."],
    excellent: ["Safety and security stayed in step throughout. That is the result to repeat.", "We contained the support environment without disturbing the plant. Document it."],
    strong: ["The operational boundary held. Keep the safe-response sequence recorded.", "We separated cyber and process-safety decisions correctly."],
    cohesive: ["Operations and security moved together. That coordination is the lesson.", "We held the plant and the case at once. Keep that balance."],
    steady: ["The process stayed stable. Review which decision waited on an authority.", "We kept operations safe. Ask where the safe path was slowest."],
  },
  continuity: {
    loss: ["We traded availability at the wrong moment. Rehearse that trade-off deliberately.", "The service survived; the plan did not. Rebuild the continuity assumptions."],
    excellent: ["Availability and integrity stayed balanced throughout. That is the target.", "We delivered continuity without hiding the risk. Keep that judgement."],
    strong: ["Service margin held. Record where the fallback earned its place.", "We kept essential services running. Tighten the recovery sequencing."],
    cohesive: ["The team protected continuity together. Keep fallback ownership clear.", "We accepted disruption knowingly, not by accident. Hold that."],
    steady: ["The service is stable. Review where continuity was assumed rather than verified.", "We held the line on availability. Ask what that cost us in clarity."],
  },
  communications: {
    loss: ["We informed late and assumptions filled the gap. Fix the trigger, not the wording.", "The message trailed the event. Build the disclosure sequence earlier."],
    excellent: ["Statements tracked the confirmed facts precisely. That is the discipline to keep.", "We said what we knew and no more. That restraint worked."],
    strong: ["Our messaging stayed factual under pressure. Keep the confirmation step.", "We separated fact from assumption openly. That held the room together."],
    cohesive: ["The team spoke with one voice. Keep the single-source brief.", "We aligned before we spoke. That is why it held."],
    steady: ["Communication held together. Review where the first brief arrived late.", "We kept the record accurate. Ask who waited too long for an update."],
  },
};

export function specialistReaction(id: SpecialistId, won: boolean, score: number, bond: number): Message {
  const name = specialistNames[id];
  const tone: ReactionTone = !won
    ? "loss"
    : score >= 88
      ? "excellent"
      : score >= 78
        ? "strong"
        : bond >= 70
          ? "cohesive"
          : "steady";
  const lines = specialistReactions[id][tone];
  const index = Math.abs(Math.round(score) * 7 + Math.round(bond) * 3) % lines.length;
  return msg("engine.campaign.reaction", { name, line: lit(lines[index]) });
}

// Each specialist develops across a campaign as rapport grows: a request, then
// a disagreement, then a change of role. Rapport rises with every operation
// they are deployed on, so a team kept together becomes a cast.
export const ARC_THRESHOLDS = [50, 65, 80] as const;
const specialistArcs: Record<SpecialistId, [string, string, string]> = {
  hunter: [
    "Maya asks for an hour a week to hunt without an alert to chase. She thinks the quiet cases are the ones being missed.",
    "Maya disagrees with the last call: she would have kept watching one turn longer. She says so in the review, not in the room.",
    "Maya now runs the hunt rota for the whole team. New analysts shadow her first.",
  ],
  forensics: [
    "Elias asks for a second evidence store. The current one is full of cases nobody has closed.",
    "Elias pushes back on speed: he would rather lose a turn than lose an artefact, and he wants that written into the plan.",
    "Elias has been asked to train the regional teams on evidence handling. He agreed on condition the course uses a real case.",
  ],
  identity: [
    "Noor asks for authority to suspend a privileged account without waiting for its owner. She has had to wait twice.",
    "Noor disagrees with how approvals were handled: two people signed, and neither checked. She wants it fixed before the next case.",
    "Noor now owns the privileged access review. The first thing she did was remove her own standing access.",
  ],
  ot: [
    "Daniel asks for a seat at the plant's shift briefings. He says the operators notice things the logs do not.",
    "Daniel objects to the last containment: right for the network, wrong for the plant. He wants operations to sign off the next one.",
    "Daniel has moved to a joint role between engineering and security. The operators asked for him by name.",
  ],
  continuity: [
    "Sofia asks for the fallback plans to be tested with real staff, not on paper.",
    "Sofia disagrees with the cost the team accepted last time: the service paid it, and nobody asked the service.",
    "Sofia now chairs the resilience board. Every response plan crosses her desk before it is approved.",
  ],
  communications: [
    "Marcus asks to be in the room for the first hour, not briefed after it.",
    "Marcus pushes back on a holding statement he was asked to sign: it said more than the team knew. He rewrote it.",
    "Marcus has become the organisation's incident spokesperson. Reporters now ask for him rather than the press office.",
  ],
};

export function specialistArc(id: SpecialistId, bond: number): string | null {
  const reached = ARC_THRESHOLDS.filter(threshold => bond >= threshold).length;
  return reached ? specialistArcs[id][reached - 1] : null;
}

// The words of these tables are a locale's to replace (lib/i18n/content/).
registerContent({ specialistNames, specialistReactions, specialistArcs });
