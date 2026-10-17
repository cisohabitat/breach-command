import { catalogue } from "../catalogue.ts";

export const evidenceAssessmentMessages = catalogue({
  evidenceAssessment: {
    "sourceReview": "Source review: {name}, {role}",
    "supportedInterpretation": "supported interpretation",
    "seekCorroboration": "seek corroboration",
    "confidenceBasis": "Confidence basis",
    "strongSignal": "Signal: strong",
    "weakSignal": "Signal: weak",
    "strongConfidence": "Confidence: strong",
    "weakConfidence": "Confidence: weak",
    "signalConfirmed": "Strong signal: this establishes a stage, not the whole causal explanation.",
    "signalEmpty": "Weak signal: no new stage was found within this source’s coverage; absence here does not clear the incident.",
    "basisCorroborated": "A supported causal comparison across different collection sources strengthens confidence in the explanation.",
    "basisExhaustive": "Exhaustive collection strengthens confidence within this source's coverage. Independent comparison can still test the explanation.",
    "basisSingle": "Rapid or balanced collection from one source leaves the broader interpretation weakly supported. Compare a related finding from a different source.",
    "basisRecorded": "Confidence uses the recorded source assessment; collection depth is not available for this finding.",
    "signalGuide": "Training: signal and confidence",
    "axesExplained": "Signal describes how directly a finding establishes a stage. Confidence describes support for its causal interpretation, not certainty about the whole incident. Confirmed stages remain established facts.",
    "exampleStrongStrong": "Strong signal, strong confidence: a stage finding from exhaustive collection or a supported causal comparison across sources. Use it to build the explanation.",
    "exampleStrongWeak": "Strong signal, weak confidence: a stage found by rapid or balanced collection alone. The stage is established; test how it connects to other activity.",
    "exampleWeakStrong": "Weak signal, strong confidence: an exhaustive check finds no new stage. Trust the bounded result, while investigating sources it could not cover.",
    "exampleWeakWeak": "Weak signal, weak confidence: a rapid or balanced check finds no new stage. Seek another source; it does not clear the incident.",
    "responseTradeoff": "Judge response urgency using business impact and actor pace too. Waiting for confidence can cost time; early containment can disrupt service. A failed roll creates no finding and settles neither axis.",
  },
});
