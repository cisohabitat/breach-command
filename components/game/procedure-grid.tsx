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
import { useEffect, useRef, useState } from "react";

register(procedureGridMessages);

export function ProcedureGrid({
  game,
  disabled,
  onChoose,
  reportOpen = false,
  receipt = 0,
}: {
  game: Game;
  disabled: boolean;
  onChoose: (id: string) => void;
  reportOpen?: boolean;
  receipt?: number;
}) {
  const { t, rich } = useMessages("procedureGrid");
  const [focused, setFocused] = useState(false);
  const canFocus = !!game.hypothesis && game.mode !== "expert";
  const all = proceduresFor(game);
  const shownProcedures = focused && canFocus ? all.filter(procedure => availableIn(game, procedure.id) === 0 && sourceSeesReading(game, procedure.id) === true) : all;
  const routeSources = game.hypothesis ? hypothesisSources(game, game.hypothesis) : [];
  const grid = useRef<HTMLDivElement>(null);
  const last = game.turns.at(-1);
  const lastNumber = last?.number;
  const shown = useRef(0);
  useEffect(() => {
    if (reportOpen || !receipt || receipt !== lastNumber || shown.current === receipt) return;
    const button = grid.current?.querySelector<HTMLElement>("[data-last-used=true]");
    if (!button) return;
    shown.current = receipt;
    const previous = button.style.boxShadow;
    button.style.boxShadow = "inset 0 0 0 1px currentColor";
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animation = !motion.matches && button.animate ? button.animate([
      { boxShadow: "inset 0 0 0 1px currentColor", offset: 0 },
      { boxShadow: "inset 0 0 0 1px currentColor", offset: .6 },
      { boxShadow: "inset 0 0 0 1px transparent" },
    ], { duration: 2000 }) : null;
    const stop = () => { if (motion.matches) animation?.cancel(); };
    motion.addEventListener("change", stop);
    const clear = () => { animation?.cancel(); button.style.boxShadow = previous; };
    const timer = setTimeout(clear, 2000);
    return () => { clearTimeout(timer); clear(); motion.removeEventListener("change", stop); };
  }, [lastNumber, reportOpen, receipt]);
  return (
    <>
    {canFocus && <div className="procedure-filter">
      <button className="text-action" aria-pressed={focused} aria-controls="procedure-source-list" onClick={() => setFocused(value => !value)}>{t(focused ? "procedureGrid.showAllSources" : "procedureGrid.focusReading")}</button>
      {focused && <p>{t("sourcesShown", { shown: shownProcedures.length, total: all.length })}</p>}
    </div>}
    <div className="procedure-grid" ref={grid} id="procedure-source-list">
      {focused && canFocus && !shownProcedures.length && <p>{t("noReadySource")}</p>}
      {shownProcedures.map(procedure => {
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
            data-last-used={last?.procedure === procedure.id}
            className={`procedure-card ${established ? "established" : ""} ${cooldown ? "cooling" : ""} ${aligned ? "hypothesis-aligned" : ""}`}
            disabled={disabled || cooldown > 0 || !!game.pendingDecision}
            onClick={() => onChoose(procedure.id)}
            aria-label={`${procedure.title}${established ? t("establishedPlus2") : ""}${aligned ? t("ownSourceForReading") : ""}${aligned && blind ? t("cannotSeeThis") : ""}${seesOther ? t("canAlsoTest2") : ""}${read && read.spent ? t("checkedTimesWith", { spent: read.spent }) : read && read.inconclusive ? t("attemptsFailedWithout", { inconclusive: read.inconclusive }) : ""}${cooldown ? t("availableInTurns", { cooldown }) : ""}`}
          >
            <div className="procedure-top">
              <span className="procedure-code" aria-hidden="true" />
              {/* The badge carries the cooldown only. The established bonus is stated
                  once, in the footer; a "+2" badge said it a second time. */}
              {cooldown > 0 && <span className="procedure-badge">{t("turnPlural", { count: cooldown })}</span>}
            </div>
            <h3>{procedure.title}</h3>
            <p>{procedure.short}</p>
            {/* One tag, not two that read as a contradiction: the bonus still
                applies, but the source cannot test the reading at this stage. */}
            {/* An established source says so where the own-source tag does, under
                the description: one sat beside it and the other below. */}
            {!cooldown && (established || aligned || seesOther || !!read?.spent || !!read?.inconclusive) && <div className="procedure-state">
              {established && <small className="alignment-label established-label">{t("establishedSource")}<span className="nowrap">+2</span></small>}
              {aligned && (blind
                ? <small className="alignment-label blind">{rich("ownSourceSpan", { ownSourceBonus: OWN_SOURCE_BONUS }, { span: chunk => <span className="nowrap">{chunk}</span> })}</small>
                : <small className="alignment-label">{rich("ownSourceSpan2", { ownSourceBonus: OWN_SOURCE_BONUS }, { span: chunk => <span className="nowrap">{chunk}</span> })}</small>)}
              {seesOther && <small className="alignment-label other-sees">{t("canAlsoTest")}</small>}
              {read && read.spent > 0 && <small className="spent-label">{t("checkedNoStage", { spent: read.spent })}</small>}
              {read && !read.spent && read.inconclusive > 0 && <small className="spent-label inconclusive">{t("attempt2Plural", { count: read.inconclusive })}{t("failedInconclusive")}</small>}
            </div>}
            <div className="procedure-bottom">
              {/* An ordinary source carries no label: "STANDARD" told a newcomer nothing. */}
              <span>{cooldown ? t("onCooldown") : null}</span>
            </div>
          </button>
        );
      })}
    </div>
    </>
  );
}
