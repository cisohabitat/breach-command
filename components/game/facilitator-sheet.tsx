import { attackMitre, attacks, difficulties, gameModes, getCounterfactuals, getHypothesisLedger, getOutcome, getLossReason, hypotheses, procedureById, scenarios, stages, type Game } from "@/lib/advanced-game";
import { questionsFor } from "@/lib/educators";
import { useMessages } from "@/hooks/use-messages";
import { facilitatorSheetMessages } from "@/lib/i18n/en/facilitator-sheet";
import { register } from "@/lib/i18n";

register(facilitatorSheetMessages);

// A one- or two-page print for a trainer debriefing a room: the whole hidden
// chain, how each stage was found, the turn ledger, the decisions and the
// questions to ask. It spoils the chain, so it is never on screen; the review
// prints it on request, with that warning beside the button.
export function FacilitatorSheet({ game }: { game: Game }) {
  const { t, say } = useMessages();
  const scenario = scenarios[game.scenario];
  const outcome = getOutcome(game);
  const ledger = getHypothesisLedger(game);
  const questions = questionsFor(game.status);
  const routeTitle = (id: string | null) => hypotheses.find(item => item.id === id)?.title ?? "none";
  const result = game.status === "won" ? t("facilitatorSheet.stoodDownGrade", { grade: outcome.grade }) : game.status === "exercise" ? t("facilitatorSheet.authorisedExerciseConcluded") : getLossReason(game).title;
  return (
    <section className="facilitator-sheet" aria-hidden="true">
      <p className="facilitator-form">{t("facilitatorSheet.formBc320Facilitator")}</p>
      <h2>{scenario.title}</h2>
      <p>{t("facilitatorSheet.caseOf100", { scenario: game.scenario + 1, sector: scenario.sector, difficultiesTitle: difficulties[game.difficulty].title, gameModesTitle: gameModes[game.mode].title, result, total: outcome.breakdown.total, revealed: game.revealed.length, turns: game.turns.length })}</p>
      <h3>{t("facilitatorSheet.theChain")}</h3>
      <table>
        <thead><tr><th>{t("facilitatorSheet.stage")}</th><th>{t("facilitatorSheet.technique")}</th><th>{t("facilitatorSheet.route")}</th><th>{t("facilitatorSheet.attCk")}</th><th>{t("facilitatorSheet.found")}</th></tr></thead>
        <tbody>{game.chain.map((id, index) => {
          const attack = attacks.find(item => item.id === id)!;
          const turn = game.turns.find(item => item.revealed === id || item.injectReveal === id);
          return <tr key={id}><td>{index + 1}, {stages[index].name}</td><td>{attack.title}</td><td>{routeTitle(attack.vector)}</td><td>{attackMitre[id].join(", ")}</td><td>{turn ? t("facilitatorSheet.turnSource", { number: turn.number, source: turn.injectReveal === id ? t("facilitatorSheet.partnerDisclosure") : String(procedureById(game, turn.procedure)?.title) }) : t("facilitatorSheet.notFound")}</td></tr>;
        })}</tbody>
      </table>
      <h3>{t("facilitatorSheet.turnByTurn")}</h3>
      <table>
        <thead><tr><th>{t("captainReportDialog.turn")}</th><th>{t("facilitatorSheet.reading")}</th><th>{t("facilitatorSheet.routeUnderTest")}</th><th>{t("facilitatorSheet.check")}</th><th>{t("facilitatorSheet.credit")}</th></tr></thead>
        <tbody>{ledger.map(row => <tr key={row.turn}><td>{row.turn}</td><td>{row.predicted ?? t("facilitatorSheet.noneDeclared")}</td><td>{row.actualRoute ?? row.testedAgainst}</td><td>{procedureById(game, row.procedure)?.title ?? row.procedure}{row.found ? `, found ${row.found}` : ""}</td><td>{row.credit === 1 ? t("facilitatorSheet.full") : row.credit ? t("facilitatorSheet.half") : t("facilitatorSheet.none")}</td></tr>)}</tbody>
      </table>
      {(game.decisions.length > 0 || game.commandHistory.length > 0 || game.setPieceHistory.length > 0) && <>
        <h3>{t("facilitatorSheet.decisions")}</h3>
        <ul>
          {game.decisions.map((decision, index) => <li key={`d${index}`}>{say(decision.title)}: {decision.choice}{t("facilitatorSheet.gradedOf5", { quality: decision.quality })}</li>)}
          {game.setPieceHistory.map((record, index) => <li key={`s${index}`}>{t("facilitatorSheet.sectorDecisionGraded", { recordTitle: say(record.title), quality: record.quality })}</li>)}
          {game.commandHistory.map((record, index) => <li key={`c${index}`}>{t("facilitatorSheet.commandEventGraded", { recordTitle: say(record.title), quality: record.quality })}</li>)}
        </ul>
      </>}
      <h3>{t("debriefDialog.whatMightHave")}</h3>
      <ul>{getCounterfactuals(game).slice(0, 4).map(item => <li key={item}>{item}</li>)}</ul>
      <h3>{t("facilitatorSheet.questionsForThe2", { questionsTitle: questions.title.toLowerCase() })}</h3>
      <ol>{questions.questions.map(question => <li key={question}>{question}</li>)}</ol>
    </section>
  );
}
