import { BrainCircuit, Gauge } from "lucide-react";
import {
  getAdversaryProfile,
  getAdversaryState,
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
  const profile = getAdversaryProfile(game);
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
          title={profile.description}
        >
          <Gauge size={14} /> ACTOR: {getAdversaryState(game).toUpperCase()}
        </span>
      </div>
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
