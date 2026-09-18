import { Check, GraduationCap, X } from "lucide-react";
import type { Game } from "@/lib/advanced-game";

export function TutorialCoach({ game, onDismiss }: { game: Game; onDismiss: () => void }) {
  const steps = [
    { done: !!game.hypothesis, title: "Form a working hypothesis", detail: "Choose the access path that best explains the current intelligence." },
    { done: game.turns.length > 0, title: "Plan an evidence action", detail: "Select a procedure, its scope and how intensively to run it." },
    { done: game.decisions.length > 0, title: "Balance evidence and intervention", detail: "When evidence appears, decide whether to observe or act." },
    { done: game.revealed.length >= 2, title: "Infer the objective", detail: "Two confirmed stages improve the assessment of adversary intent." },
  ];
  const current = steps.findIndex(step => !step.done);
  return (
    <section className="tutorial-coach" aria-label="Command academy tutorial">
      <div className="tutorial-head"><GraduationCap size={20} /><div><span className="eyebrow">COMMAND ACADEMY</span><strong>{current < 0 ? "Field qualification complete" : `Step ${current + 1} of ${steps.length}`}</strong></div><button onClick={onDismiss} aria-label="Dismiss tutorial"><X size={17} /></button></div>
      <div className="tutorial-steps">{steps.map((step, index) => <div key={step.title} className={step.done ? "done" : index === current ? "current" : ""}><span>{step.done ? <Check size={14} /> : index + 1}</span><p><strong>{step.title}</strong><small>{step.detail}</small></p></div>)}</div>
    </section>
  );
}
