import type { CSSProperties } from "react";
import { ArrowRight, Zap, ShieldCheck, HeartPulse } from "lucide-react";
import { responseOptionsFor, type Game } from "@/lib/advanced-game";

export function ResponsePanel({ game, onChoose }: { game: Game; onChoose: (choice: string) => void }) {
  const phase = game.responseChoices.length === 0 ? "containment" : game.responseChoices.length === 1 ? "assurance" : "recovery";
  const containment = phase === "containment";
  const assurance = phase === "assurance";
  const profile = responseOptionsFor(game);
  const options = profile[phase];
  return (
    <section className="response-panel" data-phase={phase}>
      <div className="response-sequence" aria-label="Response sequence"><span className={game.responseChoices.length >= 0 ? "active" : ""}>1 Contain</span><span className={game.responseChoices.length >= 1 ? "active" : ""}>2 Assure</span><span className={game.responseChoices.length >= 2 ? "active" : ""}>3 Recover</span></div>
      {/* Each phase swaps the animation on this wrapper, so the beat restarts without remounting the controls. */}
      <div className="response-stage">
        <div className="response-heading">
          <span className="response-icon">{containment ? <Zap size={24} /> : assurance ? <ShieldCheck size={24} /> : <HeartPulse size={24} />}</span>
          <div><span className="eyebrow">{containment ? "CONTAINMENT DECISION" : assurance ? "ASSURANCE GATE" : "RECOVERY DECISION"}</span><h2>{containment ? "The chain is known. Stop the active risk." : assurance ? "Prove the boundary is ready for restoration." : "The threat is constrained. Restore trusted service."}</h2><p>{containment ? "Balance attacker access, evidence and operational continuity." : assurance ? "Decide what must be validated or preserved before systems change again." : "Choose how much confidence, time and disruption the organisation can accept."}</p><p className="muted small"><strong>Sector constraint:</strong> {profile.constraint}</p></div>
        </div>
        <div className="response-options">
          {options.map((option, index) => <button key={option.id} style={{ "--option-index": index } as CSSProperties} onClick={() => onChoose(option.id)}><strong>{option.title}</strong><span>{option.description}</span><small>DISRUPTION {option.disruption} · CONFIDENCE {option.confidence} · RESIDUAL RISK {option.residual}</small><ArrowRight size={17} /></button>)}
        </div>
      </div>
    </section>
  );
}
