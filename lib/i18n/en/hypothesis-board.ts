import { catalogue } from "../catalogue.ts";

// The strings of components/game/hypothesis-board.tsx (app/page.tsx for page), loaded with it.
export const hypothesisBoardMessages = catalogue({
  hypothesisBoard: {
    "questionEntry": "How did they get in?",
    "questionMovement": "Where did they go, and as whom?",
    "questionPersistence": "How do they keep access?",
    "questionOutbound": "What leaves, and how?",
    "ruledOutAt": "Ruled out at the ",
    "stage": " stage",
    "workingHypothesis": "Working reading",
    "selectTheExplanation": "Choose the explanation you are testing. One working reading is recorded per turn.",
    "readingForStage": "Reading for stage",
    "compareAllFour": "Compare all four readings",
    "currentReading": "Current reading",
    "changeFrom": "change from ",
    "noneRecorded": "none recorded",
    "backIn": " (back in {availableIn})",
    "adversaryPace2": "Adversary pace: {getAdversaryState}",
    "evidence2": "Evidence: {evidenceSources}",
    "evidence3": "Evidence: {list}",
    "sources2": "Sources: {list}",
  },
  facilitatorSheet: {
    "stage": "Stage",
  },
});
