import { useRef } from "react";
import { CheckCheck, CircleHelp, Dices } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { describeMeterChange, describePart, getDiscriminatingRead, getModifierBreakdown, procedureIntensities, procedureScopes, type ProcedureIntensity, type ProcedureScope } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { Glossed } from "@/components/game/glossed";
import { EffectList } from "@/components/game/effect-list";

// A plan's change to this roll, in the words EffectList reads.
const rollLine = (modifier: number) => modifier === 0 ? "this roll unchanged" : `this roll ${modifier > 0 ? "+" : "−"}${Math.abs(modifier)}`;

export function ActionSheet({ session }: { session: GameSession }) {
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
        <SheetHeader><div className="eyebrow">Prepare action</div><SheetTitle>{proc?.title}</SheetTitle><SheetDescription>{proc && <Glossed text={proc.description} />}</SheetDescription></SheetHeader>
        {proc && game && <p className="carried-plan" role="status">{game.turns.length ? "Carried from your last action: " : "Starting plan: "}<strong>{procedureScopes[actionScope].title} scope</strong> and <strong>{procedureIntensities[actionIntensity].title} analysis</strong>. {game.turns.length ? "These stay selected until you change them in the plan options in this sheet." : "Change them in the plan options in this sheet; whatever you choose stays selected for later turns until you change it."}</p>}
        {proc && game && <>
          <div className="action-note"><span className="eyebrow">Hypothesis check</span><p><Glossed text={proc.question} /></p></div>
          <div className={`alignment-notice ${procedureAligned ? "aligned" : ""} ${read ? `level-${read.level}` : ""}`}>
            <BrainLabel aligned={procedureAligned} />
            <span>
              {read && <strong>{read.label}. </strong>}
              {read ? read.detail : procedureAligned ? "This procedure tests your working hypothesis and earns the own-source bonus shown below." : "This procedure does not directly test your working hypothesis. It may still collect useful evidence, but earns no own-source bonus."}
            </span>
          </div>
          {/* What the roll needs sits above the plan that changes it: below the
              planner it was under the pinned run button on a tablet. */}
          {/* One typed line of the procedure form, not a row of big-number tiles. */}
          <p className="roll-preview">Roll <b>d20 {(breakdown?.total ?? 0) < 0 ? "−" : "+"} {Math.abs(breakdown?.total ?? 0)}</b>, need <b>{config.threshold}</b> or better</p>
          {breakdown && (
            <details className="modifier-details">
              <summary>How this modifier is calculated<span>{breakdown.parts.filter(part => part.value !== 0 || part.shown).map(part => describePart(part.label, part.value)).join(" · ") || (breakdown.parts.some(part => part.suppressed) ? "One bonus is unavailable — see why" : "Nothing applies")}</span></summary>
              <ul className="modifier-breakdown">
                {breakdown.parts.filter(part => part.value !== 0 || part.suppressed || part.shown).map(part => (
                  <li key={part.label} className={part.suppressed ? "suppressed" : ""}><span>{part.label}</span><strong>{part.suppressed ? "—" : `${part.value < 0 ? "−" : "+"}${Math.abs(part.value)}`}</strong><small>{part.detail}</small></li>
                ))}
                {breakdown.parts.every(part => part.value === 0 && !part.suppressed && !part.shown) && <li><span>No modifiers apply</span><strong>0</strong><small>This is a plain d20 against the difficulty threshold.</small></li>}
              </ul>
            </details>
          )}
          <div className="procedure-planner">
            <div role="group" aria-label="Scope"><span className="eyebrow">Scope</span><div>{(Object.keys(procedureScopes) as ProcedureScope[]).map(id => <button key={id} type="button" aria-pressed={actionScope === id} className={actionScope === id ? "active" : ""} onClick={() => setActionScope(id)}><strong>{procedureScopes[id].title}{actionScope === id && <b className="plan-selected">Selected</b>}</strong><small>{procedureScopes[id].description}</small><EffectList className="plan-effects" items={[rollLine(procedureScopes[id].modifier), describeMeterChange(game, "impact", procedureScopes[id].impact), describeMeterChange(game, "objective", procedureScopes[id].objective)]} /></button>)}</div></div>
            <div role="group" aria-label="Intensity"><span className="eyebrow">Intensity</span><div>{(Object.keys(procedureIntensities) as ProcedureIntensity[]).map(id => <button key={id} type="button" aria-pressed={actionIntensity === id} className={actionIntensity === id ? "active" : ""} onClick={() => setActionIntensity(id)}><strong>{procedureIntensities[id].title}{actionIntensity === id && <b className="plan-selected">Selected</b>}</strong><small>{procedureIntensities[id].description}</small><EffectList className="plan-effects" items={[rollLine(procedureIntensities[id].modifier), describeMeterChange(game, "impact", procedureIntensities[id].impact), !!procedureIntensities[id].cooldown && `the source rests ${procedureIntensities[id].cooldown} turn longer`]} /></button>)}</div></div>
          </div>
          <p className="muted small">Success reveals a stage only when this evidence source matches an undiscovered technique. The plan&apos;s effects above add to what every turn costs: time passes, so business impact and adversary progress usually rise and the sector meter wears down. A failed check costs more; finding a stage pushes them back.</p>
          <button className="primary-button full" onClick={() => run(proc.id)}><Dices size={19} /> Run procedure</button>
        </>}
      </SheetContent>
    </Sheet>
  );
}

function BrainLabel({ aligned }: { aligned: boolean }) {
  return <span aria-hidden="true" className="alignment-icon">{aligned ? <CheckCheck size={18} /> : <CircleHelp size={18} />}</span>;
}
