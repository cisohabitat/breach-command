import { catalogue } from "../catalogue.ts";

// The strings of components/game/effect-list.tsx (app/page.tsx for page), loaded with it.
export const effectListMessages = catalogue({
  effectList: {
    "unchanged": "unchanged",
    "better": "better",
    "worse": "worse",
    "faster": "faster",
    "slower": "slower",
    "adversaryPace": "Adversary pace",
    "nextRoll": "Next roll",
    "thisRoll": "This roll",
    "rollsCarry": " (rolls carry {cap} at most)",
    "withCarried": " with what was already carried",
    "rollUnchangedCapped": "{roll} unchanged (rolls carry {cap} at most)",
  },
});
