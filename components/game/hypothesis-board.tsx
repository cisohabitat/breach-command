import { BrainCircuit, Gauge } from "lucide-react";
import {
  getAttributionRead,
  getAdversaryState,
  getHypothesisStanding,
  hypotheses,
  procedures,
  type Game,
  type HypothesisId,
} from "@/lib/advanced-game";

export function HypothesisBoard({
  game,
  onChoose,
}: {
  game: Game;
  onChoose: (id: HypothesisId) => void;
}) {
  const attribution = getAttributionRead(game);
  // Expert operations withhold every read, this one included.
  const standing = game.mode === "expert" ? null : getHypothesisStanding(game);
  return (
    <section className="hypothesis-board" aria-labelledby="hypothesis-heading">
      <div className="hypothesis-heading">
        <div>
          <BrainCircuit size={20} />
          <span>
            <strong id="hypothesis-heading">Working hypothesis</strong>
            <small>Select the explanation you are testing. One hypothesis is recorded per turn.</small>
          </span>
        </div>
        <span
          className={`adversary-state tempo-${game.adversaryTempo}`}
          title={attribution.detail}
        >
          <Gauge size={14} /> ACTOR: {getAdversaryState(game).toUpperCase()}
        </span>
      </div>
      {standing && standing.level !== "none" && (
        <div className={`hypothesis-standing level-${standing.level}`} role="status">
          <span className="eyebrow">CURRENT READING</span>
          <strong>{standing.label}</strong>
          <span className="standing-meter" aria-hidden="true">
            {Array.from({ length: standing.sources }).map((_, index) => <i key={index} className={index < standing.spent ? "spent" : ""} />)}
          </span>
          <p>{standing.detail}</p>
        </div>
      )}
      <div className="hypothesis-options">
        {hypotheses.map(hypothesis => {
          const evidenceSources = hypothesis.procedures
            .map(id => procedures.find(procedure => procedure.id === id)?.title)
            .filter(Boolean)
            .join(" · ");
          return (
            <button
              key={hypothesis.id}
              className={game.hypothesis === hypothesis.id ? "active" : ""}
              disabled={!!game.pendingDecision}
              onClick={() => onChoose(hypothesis.id)}
              aria-pressed={game.hypothesis === hypothesis.id}
            >
              <strong>{hypothesis.title}</strong>
              <span>{hypothesis.premise}</span>
              <small>Evidence: {evidenceSources}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
