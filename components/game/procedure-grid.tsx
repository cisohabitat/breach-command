import {
  availableIn,
  getDiscriminatingRead,
  hypothesisSources,
  proceduresFor,
  sourceSeesReading,
  type Game,
  OWN_SOURCE_BONUS,
} from "@/lib/advanced-game";

export function ProcedureGrid({
  game,
  disabled,
  onChoose,
}: {
  game: Game;
  disabled: boolean;
  onChoose: (id: string) => void;
}) {
  const routeSources = game.hypothesis ? hypothesisSources(game, game.hypothesis) : [];
  return (
    <div className="procedure-grid">
      {proceduresFor(game).map((procedure, index) => {
        const cooldown = availableIn(game, procedure.id);
        const established = game.established.includes(procedure.id);
        const aligned = routeSources.includes(procedure.id);
        const read = game.mode === "expert" ? null : getDiscriminatingRead(game, procedure.id);
        // Withheld at Expert with the other per-card reads.
        const blind = game.mode !== "expert" && sourceSeesReading(game, procedure.id) === false;
        // A source outside the reading's list that can still see one of its open
        // techniques here. With every own source cooling or blind, a playtest found
        // the sources that could test the reading only by opening five sheets.
        const seesOther = game.mode !== "expert" && !aligned && !!game.hypothesis && sourceSeesReading(game, procedure.id) === true;
        return (
          <button
            key={procedure.id}
            data-procedure={procedure.id}
            className={`procedure-card ${established ? "established" : ""} ${cooldown ? "cooling" : ""} ${aligned ? "hypothesis-aligned" : ""}`}
            disabled={disabled || cooldown > 0 || !!game.pendingDecision}
            onClick={() => onChoose(procedure.id)}
            aria-label={`${procedure.title}${established ? ", established, plus 2" : ""}${aligned ? ", supports current hypothesis" : ""}${aligned && blind ? ", cannot see this stage for the current hypothesis" : ""}${seesOther ? ", can also test the current hypothesis" : ""}${read && read.spent ? `, checked ${read.spent} times with no stage found` : read && read.inconclusive ? `, ${read.inconclusive} attempts failed without a result` : ""}${cooldown ? `, available in ${cooldown} turns` : ""}`}
          >
            <div className="procedure-top">
              {/* A procedure's number in the manual, not an icon: a glyph on every
                  card read as a feature grid, and the sector action shared a bank icon. */}
              <span className="procedure-code">{String(index + 1)}</span>
              {/* The badge carries the cooldown only. The established bonus is stated
                  once, in the footer; a "+2" badge said it a second time. */}
              {cooldown > 0 && <span className="procedure-badge">{cooldown} turn{cooldown === 1 ? "" : "s"}</span>}
            </div>
            <h3>{procedure.title}</h3>
            <p>{procedure.short}</p>
            {/* One tag, not two that read as a contradiction: the bonus still
                applies, but the source cannot test the reading at this stage. */}
            {/* An established source says so where the own-source tag does, under
                the description: one sat beside it and the other below. */}
            {established && !cooldown && <small className="alignment-label established-label">Established <span className="nowrap">· +2</span></small>}
            {aligned && !cooldown && (blind
              ? <small className="alignment-label blind">Own source <span className="nowrap">· +{OWN_SOURCE_BONUS}</span>, can&apos;t test this reading here</small>
              : <small className="alignment-label">Own source <span className="nowrap">· +{OWN_SOURCE_BONUS}</span></small>)}
            {seesOther && !cooldown && <small className="alignment-label other-sees">Can also test this reading</small>}
            {read && !cooldown && read.spent > 0 && <small className="spent-label">Checked {read.spent}×, no stage found</small>}
            {read && !cooldown && !read.spent && read.inconclusive > 0 && <small className="spent-label inconclusive">{read.inconclusive} attempt{read.inconclusive === 1 ? "" : "s"} failed, inconclusive</small>}
            <div className="procedure-bottom">
              {/* An ordinary source carries no label: "STANDARD" told a newcomer nothing. */}
              <span>{cooldown ? "On cooldown" : null}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
