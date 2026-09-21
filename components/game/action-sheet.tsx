import { CheckCheck, CircleHelp, Dices } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getDiscriminatingRead, getModifierBreakdown, procedureIntensities, procedureScopes, type ProcedureIntensity, type ProcedureScope } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";

export function ActionSheet({ session }: { session: GameSession }) {
  const {
    proc, rolling, setSelected, game, run,
    actionScope, setActionScope, actionIntensity, setActionIntensity, procedureAligned, config,
  } = session;

  // Expert operations disable guidance entirely, so the read is withheld there.
  const read = proc && game && game.mode !== "expert" ? getDiscriminatingRead(game, proc.id) : null;
  const breakdown = proc && game ? getModifierBreakdown(game, proc.id, { scope: actionScope, intensity: actionIntensity }) : null;

  return (
    <Sheet open={!!proc && !rolling} onOpenChange={open => { if (!open) setSelected(null); }}>
      <SheetContent className="action-sheet" side="right">
        <SheetHeader><div className="eyebrow">PREPARE ACTION</div><SheetTitle>{proc?.title}</SheetTitle><SheetDescription>{proc?.description}</SheetDescription></SheetHeader>
        {proc && game && <>
          <div className="action-note"><span className="eyebrow">HYPOTHESIS CHECK</span><p>{proc.question}</p></div>
          <div className="procedure-planner">
            <div><span className="eyebrow">SCOPE</span><div>{(Object.keys(procedureScopes) as ProcedureScope[]).map(id => <button key={id} className={actionScope === id ? "active" : ""} onClick={() => setActionScope(id)}><strong>{procedureScopes[id].title}</strong><small>{procedureScopes[id].description}</small><small className="plan-effects">ROLL {procedureScopes[id].modifier >= 0 ? "+" : ""}{procedureScopes[id].modifier} · IMPACT +{procedureScopes[id].impact} · ACTOR PROGRESS {procedureScopes[id].objective >= 0 ? "+" : "−"}{Math.abs(procedureScopes[id].objective)}</small></button>)}</div></div>
            <div><span className="eyebrow">INTENSITY</span><div>{(Object.keys(procedureIntensities) as ProcedureIntensity[]).map(id => <button key={id} className={actionIntensity === id ? "active" : ""} onClick={() => setActionIntensity(id)}><strong>{procedureIntensities[id].title}</strong><small>{procedureIntensities[id].description}</small><small className="plan-effects">ROLL {procedureIntensities[id].modifier >= 0 ? "+" : ""}{procedureIntensities[id].modifier} · IMPACT {procedureIntensities[id].impact >= 0 ? "+" : "−"}{Math.abs(procedureIntensities[id].impact)}{procedureIntensities[id].cooldown ? ` · COOLDOWN +${procedureIntensities[id].cooldown}` : ""}</small></button>)}</div></div>
          </div>
          <div className={`alignment-notice ${procedureAligned ? "aligned" : ""} ${read ? `level-${read.level}` : ""}`}>
            <BrainLabel aligned={procedureAligned} />
            <span>
              {read && <strong>{read.label}. </strong>}
              {read ? read.detail : procedureAligned ? "This procedure tests your working hypothesis. Sound alignment can add +2 when the theory matches the next unresolved stage." : "This procedure does not directly test your working hypothesis. It may still collect useful evidence, but receives no reasoning bonus."}
            </span>
          </div>
          <div className="roll-preview">
            <div><span>D20</span><small>Dice roll</small></div><span>+</span>
            <div><span>{breakdown && breakdown.total >= 0 ? "+" : ""}{breakdown?.total ?? 0}</span><small>Known modifier</small></div><span>≥</span>
            <div><span>{config.threshold}</span><small>To succeed</small></div>
          </div>
          {breakdown && (
            <details className="modifier-details">
              <summary>How this modifier is calculated<span>{breakdown.parts.filter(part => part.value !== 0).map(part => `${part.label} ${part.value > 0 ? "+" : ""}${part.value}`).join(" · ") || "Nothing applies"}</span></summary>
              <ul className="modifier-breakdown">
                {breakdown.parts.filter(part => part.value !== 0).map(part => (
                  <li key={part.label}><span>{part.label}</span><strong>{part.value > 0 ? "+" : ""}{part.value}</strong><small>{part.detail}</small></li>
                ))}
                {breakdown.parts.every(part => part.value === 0) && <li><span>No modifiers apply</span><strong>0</strong><small>This is a plain d20 against the difficulty threshold.</small></li>}
                <li className="pending"><span>Hypothesis</span><strong>+2?</strong><small>Added on resolution only if your working hypothesis matches the next unresolved stage. It is not shown in advance, because that would answer the question you are investigating.</small></li>
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
