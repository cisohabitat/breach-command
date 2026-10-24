import { ArrowRight, Check, X } from "lucide-react";
import type { Game } from "@/lib/advanced-game";
import { useMessages } from "@/hooks/use-messages";
import { tutorialCoachMessages } from "@/lib/i18n/en/tutorial-coach";
import { register } from "@/lib/i18n";

register(tutorialCoachMessages);

export function TutorialCoach({ game, workspace, onNavigate, onDismiss, focused }: { game: Game; workspace: "command" | "investigate" | "briefing"; onNavigate: () => void; onDismiss: () => void; focused: boolean }) {
  const { t } = useMessages("tutorialCoach");
  const steps = [
    { done: !!game.hypothesis, title: t("formAWorking"), detail: t("chooseTheAccess") },
    { done: game.turns.length > 0, title: t("planAnEvidence"), detail: t("selectAProcedure") },
    { done: game.decisions.length > 0, title: t("balanceEvidenceAnd"), detail: t("whenAStage") },
    { done: !!game.caseTheory, title: t(game.revealed.length < 2 ? "tutorialCoach.confirmASecondStage" : "tutorialCoach.inferTheObjective"), detail: t("twoConfirmedStages") },
  ];
  const current = steps.findIndex(step => !step.done);
  const nextMove = current === 0
    ? workspace === "investigate" ? t("chooseTheExplanation") : t("openInvestigateThen")
    : current === 1
      ? workspace === "investigate" ? t("chooseAProcedure") : t("openInvestigateAnd")
      : current === 2
        ? t("continueTestingEvidence")
        : current === 3
          ? game.revealed.length < 2 ? t("confirmASecond") : t("useTheEvidence")
          : t("youHaveCompleted");
  const actionLabel = current < 0 ? t("finishTutorial") : workspace === "investigate" ? null : t("openInvestigate");
  // On Investigate the next-step note above the procedures already says what to
  // do, and the full card said it again above the board, pushing the grid down
  // for exactly the player who most needs it in view. There it is a progress line,
  // and once the academy is complete it is nothing: "Field qualification complete"
  // held a row above the procedures for the rest of the operation.
  if (workspace === "investigate" && current < 0) return null;
  if (workspace === "investigate") return (
    <section className="tutorial-coach compact" aria-label={t("commandAcademyTutorial")}>
            <p><span className="eyebrow" aria-label={t("commandAcademyStep", { current: current + 1, steps: steps.length })}>{t("academyStepOf", { current: current + 1, steps: steps.length })}</span><strong>{steps[current].title}</strong></p>
      <button onClick={onDismiss} aria-label={t("dismissTutorial")}><X size={17} /></button>
    </section>
  );
  return (
    <section className="tutorial-coach" aria-label={t("commandAcademyTutorial")}>
      <div className="tutorial-head"><div><span className="eyebrow">{t("commandAcademy")}</span><strong>{current < 0 ? t("fieldQualificationComplete") : t("stepOf", { current: current + 1, steps: steps.length })}</strong></div><button onClick={onDismiss} aria-label={t("dismissTutorial")}><X size={17} /></button></div>
      <div className="tutorial-steps">{steps.map((step, index) => (!focused || current < 0 || index === current) && <div key={step.title} className={step.done ? "done" : index === current ? "current" : ""}><span>{step.done ? <Check size={14} /> : index + 1}</span><p><strong>{step.title}</strong><small>{step.detail}</small></p></div>)}</div>
      <div className="tutorial-next"><div><span className="eyebrow">{t("yourNextMove")}</span><p>{nextMove}</p></div>{actionLabel && <button onClick={current < 0 ? onDismiss : onNavigate}>{actionLabel} <ArrowRight size={16} /></button>}</div>
    </section>
  );
}
