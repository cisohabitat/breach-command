import { useRef } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { describePart, getDiscriminatingRead, getModifierBreakdown, procedureIntensities, procedureScopes, type ProcedureIntensity, type ProcedureScope, meterEffect, type Effect } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { Glossed } from "@/components/game/glossed";
import { EffectList } from "@/components/game/effect-list";
import { useMessages } from "@/hooks/use-messages";
import { actionSheetMessages } from "@/lib/i18n/en/action-sheet";
import { register } from "@/lib/i18n";

register(actionSheetMessages);

// A plan's change to this roll, in the words EffectList reads.
const rollLine = (modifier: number): Effect => ({ kind: "roll", which: "this", amount: modifier, cap: null });

export function ActionSheet({ session }: { session: GameSession }) {
  const { t, rich, say } = useMessages();
  const {
    proc, rolling, setSelected, game, run,
    actionScope, setActionScope, actionIntensity, setActionIntensity, procedureAligned, config,
  } = session;
  const content = useRef<HTMLDivElement>(null);

  // Expert operations disable guidance entirely, so the read is withheld there.
  const read = proc && game && game.mode !== "expert" ? getDiscriminatingRead(game, proc.id) : null;
  const breakdown = proc && game ? getModifierBreakdown(game, proc.id, { scope: actionScope, intensity: actionIntensity }) : null;

  return (
    <Sheet open={!!proc && !rolling} onOpenChange={open => { if (!open) setSelected(null); }}>
      <SheetContent
        ref={content}
        className="action-sheet"
        side="right"
        // The first tabbable control in this sheet is a plan toggle, so the dialog's own
        // autofocus would put the keys used to read a dialog — Space to scroll, Tab to
        // browse — onto controls that silently change the plan. Rapid sits two tabs away.
        onOpenAutoFocus={event => { event.preventDefault(); content.current?.focus(); }}
      >
        <SheetHeader><SheetTitle>{proc?.title}</SheetTitle><SheetDescription>{proc && <Glossed text={proc.description} />}</SheetDescription></SheetHeader>
        {proc && game && <p className="carried-plan" role="status">{game.turns.length ? t("actionSheet.carriedFromYour") : t("actionSheet.startingPlan")}<strong>{procedureScopes[actionScope].title}{t("actionSheet.scope")}</strong>{t("actionSheet.and")}<strong>{procedureIntensities[actionIntensity].title}{t("actionSheet.analysis")}</strong>. {game.turns.length ? t("actionSheet.theseStaySelected") : t("actionSheet.changeThemIn")}</p>}
        {proc && game && <>
          <div className="action-note"><span className="eyebrow">{t("actionSheet.hypothesisCheck")}</span><p><Glossed text={proc.question} /></p></div>
          <div className={`alignment-notice ${procedureAligned ? "aligned" : ""} ${read ? `level-${read.level}` : ""}`}>
            <span>
              {read && <strong>{read.label}. </strong>}
              {read ? read.detail : procedureAligned ? t("actionSheet.thisProcedureTests") : t("actionSheet.thisProcedureDoes")}
            </span>
          </div>
          {/* What the roll needs sits above the plan that changes it: below the
              planner it was under the pinned run button on a tablet. */}
          {/* One typed line of the procedure form, not a row of big-number tiles. */}
          <p className="roll-preview">{t("actionSheet.roll")}<b>d20 {(breakdown?.total ?? 0) < 0 ? "−" : "+"} {Math.abs(breakdown?.total ?? 0)}</b>{rich("actionSheet.needBB", { threshold: config.threshold }, { b: chunk => <b>{chunk}</b> })}</p>
          {breakdown && (
            <details className="modifier-details">
              <summary>{t("actionSheet.howThisModifier")}<span>{breakdown.parts.filter(part => part.value !== 0 || part.shown).map(part => say(describePart(part))).join(", ") || (breakdown.parts.some(part => part.suppressed) ? t("actionSheet.oneBonusIs") : t("actionSheet.nothingApplies"))}</span></summary>
              <ul className="modifier-breakdown">
                {breakdown.parts.filter(part => part.value !== 0 || part.suppressed || part.shown).map(part => (
                  <li key={say(part.label)} className={part.suppressed ? "suppressed" : ""}><span>{say(part.label)}</span><strong>{part.suppressed ? "—" : `${part.value < 0 ? "−" : "+"}${Math.abs(part.value)}`}</strong><small>{part.detail}</small></li>
                ))}
                {breakdown.parts.every(part => part.value === 0 && !part.suppressed && !part.shown) && <li><span>{t("actionSheet.noModifiersApply")}</span><strong>0</strong><small>{t("actionSheet.thisIsPlain")}</small></li>}
              </ul>
            </details>
          )}
          <div className="procedure-planner">
            <div role="group" aria-label={t("actionSheet.scope2")}><span className="eyebrow">{t("actionSheet.scope2")}</span><div>{(Object.keys(procedureScopes) as ProcedureScope[]).map(id => <button key={id} type="button" aria-pressed={actionScope === id} className={actionScope === id ? "active" : ""} onClick={() => setActionScope(id)}><strong>{procedureScopes[id].title}{actionScope === id && <b className="plan-selected">{t("actionSheet.selected")}</b>}</strong><small>{procedureScopes[id].description}</small><EffectList className="plan-effects" items={[rollLine(procedureScopes[id].modifier), meterEffect(game, "impact", procedureScopes[id].impact), meterEffect(game, "objective", procedureScopes[id].objective)]} /></button>)}</div></div>
            <div role="group" aria-label={t("actionSheet.intensity")}><span className="eyebrow">{t("actionSheet.intensity")}</span><div>{(Object.keys(procedureIntensities) as ProcedureIntensity[]).map(id => <button key={id} type="button" aria-pressed={actionIntensity === id} className={actionIntensity === id ? "active" : ""} onClick={() => setActionIntensity(id)}><strong>{procedureIntensities[id].title}{actionIntensity === id && <b className="plan-selected">{t("actionSheet.selected")}</b>}</strong><small>{procedureIntensities[id].description}</small><EffectList className="plan-effects" items={[rollLine(procedureIntensities[id].modifier), meterEffect(game, "impact", procedureIntensities[id].impact), !!procedureIntensities[id].cooldown && t("actionSheet.sourceRestsLonger", { count: procedureIntensities[id].cooldown })]} /></button>)}</div></div>
          </div>
          <p className="muted small">{t("actionSheet.successRevealsStage")}</p>
          <button className="primary-button full" onClick={() => run(proc.id)}>{t("actionSheet.runProcedure")}</button>
        </>}
      </SheetContent>
    </Sheet>
  );
}
