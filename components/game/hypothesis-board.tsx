import { BrainCircuit, Gauge } from "lucide-react";
import {
  getAttributionRead,
  getAdversaryState,
  getHypothesisStanding,
  getRuledOutRoutes,
  hypotheses,
  procedureById, hypothesisSources,
  type Game,
  type HypothesisId,
} from "@/lib/advanced-game";
import { Glossed } from "@/components/game/glossed";

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
  const active = hypotheses.find(item => item.id === game.hypothesis);
  const ruledOut = game.mode === "expert" ? null : getRuledOutRoutes(game);
  // Only routes the player's own completed checks have closed are marked. A route
  // the incident does not use at this stage would be marked before any work was
  // done, and where it was the only one left that handed over the answer; the
  // standing still says so for a reading that is declared.
  const outMark = (id: HypothesisId) => ruledOut?.reason[id] === "excluded" && <em className="route-ruled-out">Ruled out at the {ruledOut.stage} stage</em>;
  return (
    <section className={`hypothesis-board ${active ? "has-reading" : ""}`} aria-labelledby="hypothesis-heading">
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
          {active && <b className="standing-reading">{active.title}</b>}
          <strong>{standing.label}</strong>
          <span className="standing-meter" aria-hidden="true">
            {Array.from({ length: standing.sources }).map((_, index) => <i key={index} className={index < standing.spent ? "spent" : ""} />)}
          </span>
          <p>{standing.detail}</p>
        </div>
      )}
      <div className="hypothesis-options">
        {hypotheses.map(hypothesis => {
          const evidenceSources = hypothesisSources(game, hypothesis.id)
            .map(id => procedureById(game, id)?.title)
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
              {outMark(hypothesis.id)}
              <span>{hypothesis.premise}</span>
              <small>Evidence: {evidenceSources}</small>
            </button>
          );
        })}
      </div>
      {/* At phone width the four premises are nine hundred pixels and push the
          procedure grid three screens down, so there they fold: the reading you
          have declared stays open and the rest sit one tap away. Nothing is lost,
          and the summary carries the state it hides. */}
      {active && (
        <div className="hypothesis-detail">
          <strong>{active.title}</strong>
          <span><Glossed text={active.premise} /></span>
          <small>Evidence: {hypothesisSources(game, active.id).map(id => procedureById(game, id)?.title).filter(Boolean).join(" · ")}</small>
        </div>
      )}
      <details className="hypothesis-compare">
        <summary>Compare all four readings<span>{active ? "change from " + active.title.toLowerCase() : "none recorded"}</span></summary>
        <div className="hypothesis-compare-options">
          {hypotheses.map(hypothesis => (
            <button
              key={hypothesis.id}
              className={game.hypothesis === hypothesis.id ? "active" : ""}
              disabled={!!game.pendingDecision}
              onClick={() => onChoose(hypothesis.id)}
              aria-pressed={game.hypothesis === hypothesis.id}
            >
              <strong>{hypothesis.title}</strong>
              {outMark(hypothesis.id)}
              <span>{hypothesis.premise}</span>
            </button>
          ))}
        </div>
        {active && <small className="hypothesis-compare-sources">Evidence this reading predicts: {hypothesisSources(game, active.id).map(id => procedureById(game, id)?.title).filter(Boolean).join(" · ")}</small>}
      </details>
    </section>
  );
}
