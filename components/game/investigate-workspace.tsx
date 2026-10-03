import { BrainCircuit, GraduationCap, Sparkles, X } from "lucide-react";
import { EvidenceWorkspace } from "@/components/game/evidence-workspace";
import { HypothesisBoard } from "@/components/game/hypothesis-board";
import { InfrastructureConsole } from "@/components/game/infrastructure-console";
import { KnownFacts } from "@/components/game/known-facts";
import { ProcedureGrid } from "@/components/game/procedure-grid";
import { SpecialistTransmission } from "@/components/game/living-incident";
import { OWN_SOURCE_BONUS, cooldownWindow, getCoachPrompt, procedureIntensities, procedureScopes } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";

export function InvestigateWorkspace({ session }: { session: GameSession }) {
  const {
    game, guided, guidance, trainingPrompt, rolling, fastResolve, actionScope, actionIntensity,
    inlineReport, setInlineReport, pendingUndo, undo,
    focusInfrastructure, mapAction, chooseHypothesis, correlate, chooseCaseTheory, run, setSelected,
  } = session;

  if (!game) return null;

  // The prompt's longer explanation folds away where the board already carries
  // it — the reading's standing says why to test or revise — and stays inline
  // where it is the instruction itself.
  const foldWhy = trainingPrompt?.step === "test" || trainingPrompt?.step === "revise";
  const trainingNote = trainingPrompt && (
    <div className={`guide-nudge training-prompt step-${trainingPrompt.step}`}>
      <GraduationCap size={15} />
      <span>
        <strong>{trainingPrompt.title}.</strong>{foldWhy
          ? <> <details className="prompt-why"><summary>Why</summary>{trainingPrompt.detail}</details></>
          : <> {trainingPrompt.detail}</>}
        {trainingPrompt.clue && <b className="prompt-clue">What the team is seeing: {trainingPrompt.clue}</b>}
        {!!trainingPrompt.sources.length && <b className="prompt-sources">{trainingPrompt.sources.map(source => source.title).join(" · ")}</b>}
      </span>
    </div>
  );

  return (
    <div className="investigation-dashboard">
      {/* The reading leads, because every procedure is gated on it. The actions come
          next and the reference material after, so the grid a player touches every
          turn is not six screens below the fold on a phone. */}
      <div className="investigation-lead">
        {/* Until a reading is declared, the prompt and its clue are what the choice
            is made from, so they sit above the four readings rather than below
            them; once one is declared they move back beside the procedures. */}
        {!game.hypothesis && !game.pendingCommand && !game.pendingSetPiece && trainingNote}
        {!game.pendingCommand && !game.pendingSetPiece && <HypothesisBoard game={game} onChoose={chooseHypothesis} />}
      </div>
      <div className="investigation-context">
        {!game.pendingCommand && !game.pendingSetPiece && <KnownFacts game={game} />}
        <InfrastructureConsole game={game} blocked={!!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onFocus={focusInfrastructure} onAction={mapAction} />
        <SpecialistTransmission game={game} />
        <EvidenceWorkspace game={game} onCorrelate={correlate} onTheory={chooseCaseTheory} />
      </div>
      <div className="investigation-actions" role="region" aria-label="Investigation actions" tabIndex={0}>
        {inlineReport && (
          <section className={`inline-result ${inlineReport.success ? "success" : "failure"}`} aria-live="polite">
            <div>
              <span className="eyebrow">TURN {inlineReport.number} · QUICK RESULT</span>
              <strong>{inlineReport.success ? "Procedure succeeded" : "Procedure unsuccessful"} · {inlineReport.total}</strong>
              <p>{inlineReport.narrative}</p>
            </div>
            <button onClick={() => setInlineReport(null)} aria-label="Dismiss quick result"><X size={18} /></button>
          </section>
        )}
        {pendingUndo && (
          <section className="undo-strip" role="status">
            <div><span className="eyebrow">LAST ACTION</span><strong>{pendingUndo.label}</strong></div>
            <button onClick={undo}>Undo</button>
          </section>
        )}
        {!game.pendingCommand && !game.pendingSetPiece && (
          <section className="procedure-section">
            <div className="section-heading">
              <div><h2>Investigation procedures</h2><p>One action per turn. A used source sits out the next {cooldownWindow(game) === 3 ? "two turns" : "three turns"}; its card counts them down.</p></div>
              <span className="established-key">{procedureScopes[actionScope].title} · {procedureIntensities[actionIntensity].title}</span>
            </div>
            {/* One next step above the cards, not three: until a reading exists, the
                hint that unlocks them; then the Training prompt where there is one,
                or the Captain's prompt. Stacked, they put the first card below the
                fold on a desktop. */}
            {!game.hypothesis
              ? <div className="guide-nudge hypothesis-gate" role="status"><BrainCircuit size={15} /><span><strong>Record a working hypothesis to unlock procedures.</strong> Choose the explanation that best fits what the team is seeing. Its own sources then earn the +{OWN_SOURCE_BONUS} own-source bonus.</span></div>
              : trainingNote
                ? trainingNote
                : guidance !== "off" && <div className="guide-nudge"><Sparkles size={15} /><span><strong>Captain’s prompt:</strong> {getCoachPrompt(game, guided)}</span></div>}
            <ProcedureGrid game={game} disabled={rolling || !game.hypothesis} onChoose={id => fastResolve && game.turns.length > 0 ? run(id) : setSelected(id)} />
          </section>
        )}
      </div>
    </div>
  );
}
