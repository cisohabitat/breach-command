import { catalogue } from "../catalogue.ts";

// The strings of components/game/discard-dialog.tsx, loaded with it.
export const discardDialogMessages = catalogue({
  discardDialog: {
    "discardTitle": "Discard the saved operation?",
    "discardStarted": "It cannot be resumed, and having been played it is recorded as a loss: trust −8, readiness −3, one more unresolved access.",
    "discardUnstarted": "It cannot be resumed. No turn was played, so the campaign is unchanged.",
    "keepSaved": "Keep the saved operation",
    "confirmDiscard": "Discard it",
  },
});
