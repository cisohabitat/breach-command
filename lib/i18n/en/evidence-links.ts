import { catalogue } from "../catalogue.ts";

export const evidenceLinksMessages = catalogue({
  evidenceLinks: {
    "title": "Linked evidence",
    "explanation": "Connections reflect tested comparisons. Collection order does not establish causal direction.",
    "selectPair": "Select two findings above to preview a connection, then test your assessment below.",
    "turn": "Turn {turn}",
    "supported": "Supported causal link",
    "unrelated": "No causal link",
    "notEstablished": "Link not established",
    "disputed": "Causal link disputed",
    "untested": "Untested connection",
    "noInference": "This pair has not been compared. No causal relationship is established yet.",
  },
});
