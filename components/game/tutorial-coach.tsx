import { ArrowRight, Check, GraduationCap, X } from "lucide-react";
import type { Game } from "@/lib/advanced-game";

export function TutorialCoach({ game, workspace, onNavigate, onDismiss }: { game: Game; workspace: "command" | "investigate" | "briefing"; onNavigate: () => void; onDismiss: () => void }) {
  const steps = [
    { done: !!game.hypothesis, title: "Form a working hypothesis", detail: "Choose the access path that best explains the current intelligence." },
    { done: game.turns.length > 0, title: "Plan an evidence action", detail: "Select a procedure, its scope and how intensively to run it." },
    { done: game.decisions.length > 0, title: "Balance evidence and intervention", detail: "When a stage is confirmed, choose one of five responses, each trading evidence, service or time." },
    { done: !!game.caseTheory, title: "Infer the objective", detail: "Two confirmed stages improve the assessment of adversary intent; record it as a case theory." },
  ];
  const current = steps.findIndex(step => !step.done);
  const nextMove = current === 0
    ? workspace === "investigate" ? "Choose the explanation that best fits the current intelligence. The procedures it predicts will be marked as its own sources." : "Open Investigate, then choose the explanation that best fits the current intelligence."
    : current === 1
      ? workspace === "investigate" ? "Choose a procedure, review its roll modifier and operational cost, then run it." : "Open Investigate and run an evidence procedure that supports your hypothesis."
      : current === 2
        ? "Continue testing evidence. When a stage is confirmed, the report offers five responses; “How these responses differ” says what each one trades away."
        : current === 3
          ? game.revealed.length < 2 ? "Confirm a second attack stage. Then use the Evidence Workspace to declare what you think the actor wants." : "Use the Evidence Workspace to declare the actor's likely objective. You can revise it as evidence changes."
          : "You have completed the guided opening. The same Command, Investigate and Briefing workspaces remain available for the rest of the incident.";
  const actionLabel = current < 0 ? "Finish tutorial" : workspace === "investigate" ? null : "Open Investigate";
  // On Investigate the next-step note above the procedures already says what to
  // do, and the full card said it again above the board, pushing the grid down
  // for exactly the player who most needs it in view. There it is a progress line.
  if (workspace === "investigate") return (
    <section className="tutorial-coach compact" aria-label="Command academy tutorial">
      <GraduationCap size={17} />
      <p>{current >= 0
        ? <><span className="eyebrow" aria-label={`Command academy, step ${current + 1} of ${steps.length}`}>ACADEMY {current + 1}/{steps.length}</span><strong>{steps[current].title}</strong></>
        : <><span className="eyebrow">ACADEMY COMPLETE</span><strong>Field qualification complete</strong></>}</p>
      <button onClick={onDismiss} aria-label="Dismiss tutorial"><X size={17} /></button>
    </section>
  );
  return (
    <section className="tutorial-coach" aria-label="Command academy tutorial">
      <div className="tutorial-head"><GraduationCap size={20} /><div><span className="eyebrow">COMMAND ACADEMY</span><strong>{current < 0 ? "Field qualification complete" : `Step ${current + 1} of ${steps.length}`}</strong></div><button onClick={onDismiss} aria-label="Dismiss tutorial"><X size={17} /></button></div>
      <div className="tutorial-steps">{steps.map((step, index) => <div key={step.title} className={step.done ? "done" : index === current ? "current" : ""}><span>{step.done ? <Check size={14} /> : index + 1}</span><p><strong>{step.title}</strong><small>{step.detail}</small></p></div>)}</div>
      <div className="tutorial-next"><div><span className="eyebrow">YOUR NEXT MOVE</span><p>{nextMove}</p></div>{actionLabel && <button onClick={current < 0 ? onDismiss : onNavigate}>{actionLabel} <ArrowRight size={16} /></button>}</div>
    </section>
  );
}
