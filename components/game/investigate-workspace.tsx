import { BrainCircuit, GraduationCap, Sparkles, X } from "lucide-react";
import { EvidenceWorkspace } from "@/components/game/evidence-workspace";
import { HypothesisBoard } from "@/components/game/hypothesis-board";
import { InfrastructureConsole } from "@/components/game/infrastructure-console";
import { ProcedureGrid } from "@/components/game/procedure-grid";
import { SpecialistTransmission } from "@/components/game/living-incident";
import { getCoachPrompt } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";

export function InvestigateWorkspace({ session }: { session: GameSession }) {
  const {
    game, guided, guidance, suggestion, rolling, fastResolve,
    inlineReport, setInlineReport, pendingUndo, undo,
    focusInfrastructure, mapAction, chooseHypothesis, correlate, chooseCaseTheory, run, setSelected,
  } = session;

  if (!game) return null;

  return (
    <div className="investigation-dashboard">
      <div className="investigation-context">
        <InfrastructureConsole game={game} blocked={!!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onFocus={focusInfrastructure} onAction={mapAction} />
        <SpecialistTransmission game={game} />
        {!game.pendingCommand && !game.pendingSetPiece && <HypothesisBoard game={game} onChoose={chooseHypothesis} />}
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
              <div><h2>Investigation procedures</h2><p>Choose one action per turn. Used actions cool down for three turns.</p></div>
              <span className="established-key">+2 Established</span>
            </div>
            {guidance !== "off" && <div className="guide-nudge"><Sparkles size={15} /><span><strong>Captain’s prompt:</strong> {getCoachPrompt(game, guided)}</span></div>}
            {suggestion && <div className="guide-nudge"><GraduationCap size={15} /><span><strong>Training aid:</strong> Suggested next evidence source: {suggestion.title}. The chain is still yours to confirm.</span></div>}
            {!game.hypothesis && <div className="guide-nudge hypothesis-gate" role="status"><BrainCircuit size={15} /><span><strong>Record a working hypothesis to unlock procedures.</strong>Choose the explanation that best fits the current intelligence. Matching evidence then earns the reasoning bonus.</span></div>}
            <ProcedureGrid game={game} disabled={rolling || !game.hypothesis} onChoose={id => fastResolve && game.turns.length > 0 ? run(id) : setSelected(id)} />
          </section>
        )}
      </div>
    </div>
  );
}
