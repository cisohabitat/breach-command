import { catalogue } from "../catalogue.ts";

// The strings of components/game/sector-board.tsx (app/page.tsx for page), loaded with it.
export const sectorBoardMessages = catalogue({
  missionBriefingDialog: {
    "attribution": "Attribution",
  },
  sectorBoard: {
    "confidence": "Confidence: ",
    "sectorMargin": "Sector margin",
    "whyAndWhat": "Why, and what moves it",
    "liveTransmission": "Live transmission",
    "specialist": "Specialist",
    "adversaryProgress": "Adversary progress: {objectiveTitle}",
    "adversaryObjectiveSmall": "Adversary objective<small>Confidence: {confidence}</small>",
    "spanSpanFatigue": "<span>{callsign}</span>, fatigue {specialistFatigue} of 6",
    "attributed": "attributed",
  },
});
