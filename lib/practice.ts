import type { MessageKey } from "./i18n/keys.ts";
import type { LessonId } from "./learning.ts";

type Question = { context: MessageKey; prompt: MessageKey; options: [MessageKey, MessageKey, MessageKey]; why: MessageKey; correct: number };
export const practiceCases: Record<LessonId, Question[]> = {
  signal: [
    { context: "practiceDesk.signal1Context", prompt: "practiceDesk.signal1Prompt", options: ["practiceDesk.signal1A", "practiceDesk.signal1B", "practiceDesk.signal1C"], why: "practiceDesk.signal1Why", correct: 1 },
    { context: "practiceDesk.signal2Context", prompt: "practiceDesk.signal2Prompt", options: ["practiceDesk.signal2A", "practiceDesk.signal2B", "practiceDesk.signal2C"], why: "practiceDesk.signal2Why", correct: 0 },
    { context: "practiceDesk.signal3Context", prompt: "practiceDesk.signal3Prompt", options: ["practiceDesk.signal3A", "practiceDesk.signal3B", "practiceDesk.signal3C"], why: "practiceDesk.signal3Why", correct: 2 },
  ],
  confidence: [
    { context: "practiceDesk.confidence1Context", prompt: "practiceDesk.confidence1Prompt", options: ["practiceDesk.confidence1A", "practiceDesk.confidence1B", "practiceDesk.confidence1C"], why: "practiceDesk.confidence1Why", correct: 0 },
    { context: "practiceDesk.confidence2Context", prompt: "practiceDesk.confidence2Prompt", options: ["practiceDesk.confidence2A", "practiceDesk.confidence2B", "practiceDesk.confidence2C"], why: "practiceDesk.confidence2Why", correct: 1 },
    { context: "practiceDesk.confidence3Context", prompt: "practiceDesk.confidence3Prompt", options: ["practiceDesk.confidence3A", "practiceDesk.confidence3B", "practiceDesk.confidence3C"], why: "practiceDesk.confidence3Why", correct: 2 },
  ],
  containment: [
    { context: "practiceDesk.containment1Context", prompt: "practiceDesk.containment1Prompt", options: ["practiceDesk.containment1A", "practiceDesk.containment1B", "practiceDesk.containment1C"], why: "practiceDesk.containment1Why", correct: 1 },
    { context: "practiceDesk.containment2Context", prompt: "practiceDesk.containment2Prompt", options: ["practiceDesk.containment2A", "practiceDesk.containment2B", "practiceDesk.containment2C"], why: "practiceDesk.containment2Why", correct: 0 },
    { context: "practiceDesk.containment3Context", prompt: "practiceDesk.containment3Prompt", options: ["practiceDesk.containment3A", "practiceDesk.containment3B", "practiceDesk.containment3C"], why: "practiceDesk.containment3Why", correct: 2 },
  ],
};
export const lessonTitles = { signal: "practiceDesk.signal", confidence: "practiceDesk.confidence", containment: "practiceDesk.containment" } as const;
export const lessonDetails = { signal: "practiceDesk.signalDetail", confidence: "practiceDesk.confidenceDetail", containment: "practiceDesk.containmentDetail" } as const;
export function practiceScore(lesson: LessonId, answers: number[]) {
  return answers.reduce((score, answer, index) => score + (practiceCases[lesson][index]?.correct === answer ? 1 : 0), 0);
}
