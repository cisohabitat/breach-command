// Material for a trainer running Breach Command with a group: three sets of
// debrief questions, and what each difficulty is for. The educator pack page
// and the facilitator sheet both read this, so the room and the handout agree.

export type QuestionSet = { id: "reading" | "decisions" | "response"; title: string; purpose: string; questions: string[] };

export const debriefQuestionSets: QuestionSet[] = [
  {
    id: "reading",
    title: "Reading the route",
    purpose: "For a group that lost to the window, or kept one reading too long.",
    questions: [
      "At which stage did your reading stop matching what the team was seeing, and what on the board said so first?",
      "Which check that found nothing ruled the most out, and did you use what it ruled out?",
      "When a source shared between routes found a later stage, what did that tell you about the stage you were testing, and what did it not?",
      "If you played this stage again, which single check would you run first, and why that one?",
    ],
  },
  {
    id: "decisions",
    title: "Decisions under pressure",
    purpose: "For a group whose evidence decisions or sector crisis shaped the result.",
    questions: [
      "Which decision traded the most service for the least certainty, and would the people who run that service have agreed?",
      "Where did watching longer pay off, and where did it hand the adversary time?",
      "Who in a real organisation would have owned the sector decision, and who would they have needed in the room?",
      "Which choice would you defend to a regulator the next morning, and which would you rather not?",
    ],
  },
  {
    id: "response",
    title: "Response and recovery",
    purpose: "For a group that reached the response, or won and wants to know whether it was the right win.",
    questions: [
      "Did the containment you chose close the access the chain showed, or only the part you could see?",
      "What did assurance check, and what would have happened had you skipped it?",
      "Was the recovery you chose the one that removes the adversary's foothold, or the fastest one back to service?",
      "What would your organisation need, that it does not have today, to make the same call in the same time?",
    ],
  },
];

export function questionsFor(status: string): QuestionSet {
  const id = status === "lost" ? "reading" : status === "exercise" ? "decisions" : "response";
  return debriefQuestionSets.find(set => set.id === id)!;
}

export const difficultyTeaches: Record<"training" | "operational" | "crisis", string> = {
  training: "The loop: declare a reading, test it with one of its own sources, revise when the board says it is weakening, and compare two confirmed findings. A clue at each stage keeps the first reading from being a guess, and the board marks what checks have ruled out.",
  operational: "Reading the route without the clue. The standing and the ruled-out marks remain, so a group learns to reason from what checks have excluded rather than from a hint.",
  crisis: "Judgement under pressure: fewer map actions, a faster adversary that re-routes the stage after the one under test, and a shorter window. The reasoning is the same; the cost of a slow or unsound reading is higher.",
};
