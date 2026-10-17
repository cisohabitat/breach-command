import { catalogue } from "../catalogue.ts";

// The strings of components/game/known-facts.tsx (app/page.tsx for page), loaded with it.
export const knownFactsMessages = catalogue({
  knownFacts: {
    "whatWeAlready": "What we already know",
    "unverified": "Unverified",
    "of4Stages": ", {confirmed} of 4 stages confirmed",
    "observation2Plural": { one: "{count} observation", other: "{count} observations" },
  },
  endState: {
    "confirmed": "Confirmed",
  },
});
