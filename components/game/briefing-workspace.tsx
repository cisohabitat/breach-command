import { Switch } from "@/components/ui/switch";
import { getAdversaryRead, OWN_SOURCE_BONUS, procedureById } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { Glossed } from "@/components/game/glossed";
import { useMessages } from "@/hooks/use-messages";
import { briefingWorkspaceMessages } from "@/lib/i18n/en/briefing-workspace";
import { register } from "@/lib/i18n";
import { DecisionCarry } from "./decision-carry";

register(briefingWorkspaceMessages);

export function BriefingWorkspace({ session }: { session: GameSession }) {
  const { t, rich, say } = useMessages("briefingWorkspace");
  const {
    game, activeWorkspace, activeScenario, config, question, setQuestion, answer,
    guided, setGuided, fastResolve, setFastResolve, setReport,
  } = session;

  if (!game) return null;

  return (
    <aside className="captain-column" hidden={activeWorkspace !== "briefing"}>
      <section className="captain-panel">
        <div className="captain-label section-heading"><h2>{t("incidentCaptain")}</h2><span className="muted">{t("adaptiveComputerFacilitator")}</span></div>
        <div className="brief-label">{t("situation")}</div>
        <p className="captain-brief"><Glossed text={activeScenario.brief} /></p>
        <div className="captain-divider" />
        <div className="brief-label">{rich("questionsForThe2", {  }, { span: chunk => <span>{chunk}</span> })}</div>
        <div className="question-list">
          {[
            { id: "scope", label: t("whatIsIn") },
            { id: "known", label: t("whatIsConfirmed") },
            { id: "adversary", label: t("whatIsThe") },
            { id: "impact", label: t("whatIsAt") },
            { id: "constraints", label: t("whatLimitsUs") },
            { id: "assumptions", label: t("whatShouldWe") },
          ].map(item => <button key={item.id} className={question === item.id ? "active" : ""} aria-pressed={question === item.id} onClick={() => setQuestion(question === item.id ? null : item.id)}>{item.label}</button>)}
        </div>
        {question && <div className="captain-answer" aria-live="polite">{answer && say(answer)}</div>}
        <div className="guided-inline"><label htmlFor="guided-game">{game.mode === "expert" ? t("guidanceDisabledIn") : t("guidedReflection")}</label><Switch id="guided-game" checked={guided} disabled={game.mode === "expert"} onCheckedChange={setGuided} /></div>
        <div className="guided-inline"><label htmlFor="fast-game">{t("briefingScreen.fastResolution")}</label><Switch id="fast-game" checked={fastResolve} onCheckedChange={setFastResolve} /></div>
        <div className="adversary-read"><span className="eyebrow">{t("actorModel")}</span><p>{say(getAdversaryRead(game))}</p></div>
        <DecisionCarry game={game} />
      </section>

      <section className="journal-panel">
        <div className="section-heading"><h2>{t("incidentLog")}</h2><span className="muted">{t("entries", { count: game.turns.length })}</span></div>
        {!game.turns.length ? (
          <div className="empty-log"><p>{t("investigationOpened")}</p><small>{t("hypothesesFindingsAnd")}</small></div>
        ) : (
          <div className="journal-entries">
            {[...game.turns].reverse().map(turn => (
              <button className="log-entry" key={turn.number} onClick={() => setReport(turn)}>
                <span className={`log-number ${turn.revealed ? "found" : turn.success ? "passed" : "failed"}`}>{String(turn.number)}</span>
                <div><strong>{procedureById(game, turn.procedure)?.title}</strong><span>{turn.revealed ? t("stageRevealed") : turn.adversaryEvent ? t("actorAdvanced") : turn.success ? t("noNewEvidence") : t("actionUnsuccessful")}{t("briefingScreen.impact")}{turn.impactChange >= 0 ? "+" : ""}{turn.impactChange}</span></div>
                <span className="roll-total">{turn.total}</span>
              </button>
            ))}
          </div>
        )}
      </section>
      <div className="rules-reminder"><p>{t("aD20Roll2", { threshold: config.threshold, ownSourceBonus: OWN_SOURCE_BONUS })}</p></div>
    </aside>
  );
}
