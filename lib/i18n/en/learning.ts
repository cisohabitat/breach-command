import { catalogue } from "../catalogue.ts";
export const learningMessages = catalogue({ learning: {
  confidence: "Optional confidence reflection", intro: "How confident are you in the evidence supporting your next response decision? This changes no odds, score or choices.",
  low: "Low", medium: "Medium", high: "High", skip: "Skip reflection",
  practice: "Practise this lesson", signal: "Read a bounded signal", comparison: "Test confidence", containment: "Choose a containment boundary",
  signalReason: "Practise what a completed or failed check can establish.", comparisonReason: "Practise testing a causal explanation with independent evidence.", containmentReason: "Practise protecting essential service while limiting confirmed access.",
  recordLink: "Open practice and learning record", reflections: "Your confidence at the decision",
  recentReflections: "Latest ten response confidence reflections",
  snapshot: "Stages confirmed: {confirmed}. Findings with strong interpretation confidence: {strong} of {findings}. Business impact {impact}; service continuity {continuity}.",
  response: "Response decision {phase}: {confidence}",
  bounded: "High personal confidence still needs a stated boundary: the recorded evidence included weak interpretations or no findings. Review what remained untested; this is a reflection prompt, not a score penalty.",
  measured: "Compare your confidence with the evidence recorded at that moment. A later result does not change what was available when you chose. Low confidence can be appropriate when uncertainty remains.",
} });
