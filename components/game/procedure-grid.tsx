import {
  availableIn,
  getDiscriminatingRead,
  hypothesisSources,
  proceduresFor,
  sourceSeesReading,
  type Game,
  OWN_SOURCE_BONUS,
} from "@/lib/advanced-game";
import { useMessages } from "@/hooks/use-messages";
import { procedureGridMessages } from "@/lib/i18n/en/procedure-grid";
import { register } from "@/lib/i18n";

register(procedureGridMessages);

export function ProcedureGrid({
  game,
  disabled,
  onChoose,
}: {
  game: Game;
  disabled: boolean;
  onChoose: (id: string) => void;
}) {
  const { t } = useMessages();
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
            aria-label={`${procedure.title}${established ? t("procedureGrid.establishedPlus2") : ""}${aligned ? t("procedureGrid.supportsCurrentHypothesis") : ""}${aligned && blind ? t("procedureGrid.cannotSeeThis") : ""}${seesOther ? t("procedureGrid.canAlsoTest2") : ""}${read && read.spent ? t("procedureGrid.checkedTimesWith", { spent: read.spent }) : read && read.inconclusive ? t("procedureGrid.attemptsFailedWithout", { inconclusive: read.inconclusive }) : ""}${cooldown ? t("procedureGrid.availableInTurns", { cooldown }) : ""}`}
          >
            <div className="procedure-top">
              {/* A procedure's number in the manual, not an icon: a glyph on every
                  card read as a feature grid, and the sector action shared a bank icon. */}
              <span className="procedure-code">{String(index + 1)}</span>
              {/* The badge carries the cooldown only. The established bonus is stated
                  once, in the footer; a "+2" badge said it a second time. */}
              {cooldown > 0 && <span className="procedure-badge">{t("procedureGrid.turnPlural", { count: cooldown })}</span>}
            </div>
            <h3>{procedure.title}</h3>
            <p>{procedure.short}</p>
            {/* One tag, not two that read as a contradiction: the bonus still
                applies, but the source cannot test the reading at this stage. */}
            {/* An established source says so where the own-source tag does, under
                the description: one sat beside it and the other below. */}
            {established && !cooldown && <small className="alignment-label established-label">{t("procedureGrid.establishedSource")}<span className="nowrap">+2</span></small>}
            {aligned && !cooldown && (blind
              ? <small className="alignment-label blind">{t("procedureGrid.ownSource")}<span className="nowrap">+{OWN_SOURCE_BONUS}</span>{t("procedureGrid.canTestThis")}</small>
              : <small className="alignment-label">{t("procedureGrid.ownSource")}<span className="nowrap">+{OWN_SOURCE_BONUS}</span></small>)}
            {seesOther && !cooldown && <small className="alignment-label other-sees">{t("procedureGrid.canAlsoTest")}</small>}
            {read && !cooldown && read.spent > 0 && <small className="spent-label">{t("procedureGrid.checkedNoStage", { spent: read.spent })}</small>}
            {read && !cooldown && !read.spent && read.inconclusive > 0 && <small className="spent-label inconclusive">{t("procedureGrid.attempt2Plural", { count: read.inconclusive })}{t("procedureGrid.failedInconclusive")}</small>}
            <div className="procedure-bottom">
              {/* An ordinary source carries no label: "STANDARD" told a newcomer nothing. */}
              <span>{cooldown ? t("procedureGrid.onCooldown") : null}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
