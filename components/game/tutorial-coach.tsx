import { ArrowRight, Check, X } from "lucide-react";
import type { Game } from "@/lib/advanced-game";
import { useMessages } from "@/hooks/use-messages";
import { tutorialCoachMessages } from "@/lib/i18n/en/tutorial-coach";
import { register } from "@/lib/i18n";

register(tutorialCoachMessages);

export function TutorialCoach({ game, workspace, onNavigate, onDismiss }: { game: Game; workspace: "command" | "investigate" | "briefing"; onNavigate: () => void; onDismiss: () => void }) {
  const { t } = useMessages();
  const steps = [
    { done: !!game.hypothesis, title: t("tutorialCoach.formAWorking"), detail: t("tutorialCoach.chooseTheAccess") },
    { done: game.turns.length > 0, title: t("tutorialCoach.planAnEvidence"), detail: t("tutorialCoach.selectAProcedure") },
    { done: game.decisions.length > 0, title: t("tutorialCoach.balanceEvidenceAnd"), detail: t("tutorialCoach.whenAStage") },
    { done: !!game.caseTheory, title: t("tutorialCoach.inferTheObjective"), detail: t("tutorialCoach.twoConfirmedStages") },
  ];
  const current = steps.findIndex(step => !step.done);
  const nextMove = current === 0
    ? workspace === "investigate" ? t("tutorialCoach.chooseTheExplanation") : t("tutorialCoach.openInvestigateThen")
    : current === 1
      ? workspace === "investigate" ? t("tutorialCoach.chooseAProcedure") : t("tutorialCoach.openInvestigateAnd")
      : current === 2
        ? t("tutorialCoach.continueTestingEvidence")
        : current === 3
          ? game.revealed.length < 2 ? t("tutorialCoach.confirmASecond") : t("tutorialCoach.useTheEvidence")
          : t("tutorialCoach.youHaveCompleted");
  const actionLabel = current < 0 ? t("tutorialCoach.finishTutorial") : workspace === "investigate" ? null : t("tutorialCoach.openInvestigate");
  // On Investigate the next-step note above the procedures already says what to
  // do, and the full card said it again above the board, pushing the grid down
  // for exactly the player who most needs it in view. There it is a progress line,
  // and once the academy is complete it is nothing: "Field qualification complete"
  // held a row above the procedures for the rest of the operation.
  if (workspace === "investigate" && current < 0) return null;
  if (workspace === "investigate") return (
    <section className="tutorial-coach compact" aria-label={t("tutorialCoach.commandAcademyTutorial")}>
            <p><span className="eyebrow" aria-label={t("tutorialCoach.commandAcademyStep", { current: current + 1, steps: steps.length })}>{t("tutorialCoach.academyStepOf", { current: current + 1, steps: steps.length })}</span><strong>{steps[current].title}</strong></p>
      <button onClick={onDismiss} aria-label={t("tutorialCoach.dismissTutorial")}><X size={17} /></button>
    </section>
  );
  return (
    <section className="tutorial-coach" aria-label={t("tutorialCoach.commandAcademyTutorial")}>
      <div className="tutorial-head"><div><span className="eyebrow">{t("tutorialCoach.commandAcademy")}</span><strong>{current < 0 ? t("tutorialCoach.fieldQualificationComplete") : t("tutorialCoach.stepOf", { current: current + 1, steps: steps.length })}</strong></div><button onClick={onDismiss} aria-label={t("tutorialCoach.dismissTutorial")}><X size={17} /></button></div>
      <div className="tutorial-steps">{steps.map((step, index) => <div key={step.title} className={step.done ? "done" : index === current ? "current" : ""}><span>{step.done ? <Check size={14} /> : index + 1}</span><p><strong>{step.title}</strong><small>{step.detail}</small></p></div>)}</div>
      <div className="tutorial-next"><div><span className="eyebrow">{t("tutorialCoach.yourNextMove")}</span><p>{nextMove}</p></div>{actionLabel && <button onClick={current < 0 ? onDismiss : onNavigate}>{actionLabel} <ArrowRight size={16} /></button>}</div>
    </section>
  );
}
