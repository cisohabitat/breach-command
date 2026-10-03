import { useRef } from "react";
import { CheckCheck, CircleHelp, Dices } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { describeChange, getDiscriminatingRead, getModifierBreakdown, procedureIntensities, procedureScopes, type ProcedureIntensity, type ProcedureScope } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";

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
        <SheetHeader><div className="eyebrow">PREPARE ACTION</div><SheetTitle>{proc?.title}</SheetTitle><SheetDescription>{proc?.description}</SheetDescription></SheetHeader>
        {proc && game && <p className="carried-plan" role="status">{game.turns.length ? "Carried from your last action: " : "Starting plan: "}<strong>{procedureScopes[actionScope].title} scope</strong> and <strong>{procedureIntensities[actionIntensity].title} analysis</strong>. {game.turns.length ? "These stay selected until you change them." : "Whatever you choose here stays selected for later turns until you change it."}</p>}
        {proc && game && <>
          <div className="action-note"><span className="eyebrow">HYPOTHESIS CHECK</span><p>{proc.question}</p></div>
          <div className="procedure-planner">
            <div role="group" aria-label="Scope"><span className="eyebrow">SCOPE</span><div>{(Object.keys(procedureScopes) as ProcedureScope[]).map(id => <button key={id} type="button" aria-pressed={actionScope === id} className={actionScope === id ? "active" : ""} onClick={() => setActionScope(id)}><strong>{procedureScopes[id].title}{actionScope === id && <b className="plan-selected">SELECTED</b>}</strong><small>{procedureScopes[id].description}</small><small className="plan-effects">Roll {procedureScopes[id].modifier >= 0 ? "+" : "−"}{Math.abs(procedureScopes[id].modifier)} · {describeChange("impact", procedureScopes[id].impact)} · {describeChange("objective", procedureScopes[id].objective)}</small></button>)}</div></div>
            <div role="group" aria-label="Intensity"><span className="eyebrow">INTENSITY</span><div>{(Object.keys(procedureIntensities) as ProcedureIntensity[]).map(id => <button key={id} type="button" aria-pressed={actionIntensity === id} className={actionIntensity === id ? "active" : ""} onClick={() => setActionIntensity(id)}><strong>{procedureIntensities[id].title}{actionIntensity === id && <b className="plan-selected">SELECTED</b>}</strong><small>{procedureIntensities[id].description}</small><small className="plan-effects">Roll {procedureIntensities[id].modifier >= 0 ? "+" : "−"}{Math.abs(procedureIntensities[id].modifier)} · {describeChange("impact", procedureIntensities[id].impact)}{procedureIntensities[id].cooldown ? ` · Cooldown +${procedureIntensities[id].cooldown} turn` : ""}</small></button>)}</div></div>
          </div>
          <div className={`alignment-notice ${procedureAligned ? "aligned" : ""} ${read ? `level-${read.level}` : ""}`}>
            <BrainLabel aligned={procedureAligned} />
            <span>
              {read && <strong>{read.label}. </strong>}
              {read ? read.detail : procedureAligned ? "This procedure tests your working hypothesis and earns the own-source bonus shown below." : "This procedure does not directly test your working hypothesis. It may still collect useful evidence, but earns no own-source bonus."}
            </span>
          </div>
          <div className="roll-preview">
            <div><span>D20</span><small>Dice roll</small></div><span>+</span>
            <div><span>{breakdown && breakdown.total >= 0 ? "+" : ""}{breakdown?.total ?? 0}</span><small>Modifier</small></div><span>≥</span>
            <div><span>{config.threshold}</span><small>To succeed</small></div>
          </div>
          {breakdown && (
            <details className="modifier-details">
              <summary>How this modifier is calculated<span>{breakdown.parts.filter(part => part.value !== 0).map(part => `${part.label} ${part.value > 0 ? "+" : ""}${part.value}`).join(" · ") || (breakdown.parts.some(part => part.suppressed) ? "One bonus is unavailable — see why" : "Nothing applies")}</span></summary>
              <ul className="modifier-breakdown">
                {breakdown.parts.filter(part => part.value !== 0 || part.suppressed).map(part => (
                  <li key={part.label} className={part.suppressed ? "suppressed" : ""}><span>{part.label}</span><strong>{part.suppressed ? "—" : `${part.value > 0 ? "+" : ""}${part.value}`}</strong><small>{part.detail}</small></li>
                ))}
                {breakdown.parts.every(part => part.value === 0 && !part.suppressed) && <li><span>No modifiers apply</span><strong>0</strong><small>This is a plain d20 against the difficulty threshold.</small></li>}
              </ul>
            </details>
          )}
          <p className="muted small">Success reveals a stage only when this evidence source matches an undiscovered technique. The action consumes one turn and may increase impact.</p>
          <button className="primary-button full" onClick={() => run(proc.id)}><Dices size={19} /> Run procedure</button>
        </>}
      </SheetContent>
    </Sheet>
  );
}

function BrainLabel({ aligned }: { aligned: boolean }) {
  return <span aria-hidden="true" className="alignment-icon">{aligned ? <CheckCheck size={18} /> : <CircleHelp size={18} />}</span>;
}
