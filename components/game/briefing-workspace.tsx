import { Switch } from "@/components/ui/switch";
import { getAdversaryRead, OWN_SOURCE_BONUS, procedureById } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { Glossed } from "@/components/game/glossed";

export function BriefingWorkspace({ session }: { session: GameSession }) {
  const {
    game, activeWorkspace, activeScenario, config, question, setQuestion, answer,
    guided, setGuided, fastResolve, setFastResolve, setReport,
  } = session;

  if (!game) return null;

  return (
    <aside className="captain-column" hidden={activeWorkspace !== "briefing"}>
      <section className="captain-panel">
        <div className="captain-label"><div><h2>Incident Captain</h2><span>Adaptive computer facilitator</span></div></div>
        <div className="brief-label">Situation</div>
        <p className="captain-brief"><Glossed text={activeScenario.brief} /></p>
        <div className="captain-divider" />
        <div className="brief-label">Questions for the captain <span>Free action</span></div>
        <div className="question-list">
          {[
            { id: "scope", label: "What is in scope?" },
            { id: "known", label: "What is confirmed?" },
            { id: "adversary", label: "What is the actor doing?" },
            { id: "impact", label: "What is at risk?" },
            { id: "constraints", label: "What limits us?" },
            { id: "assumptions", label: "What should we challenge?" },
          ].map((item, index) => <button key={item.id} className={question === item.id ? "active" : ""} aria-pressed={question === item.id} onClick={() => setQuestion(question === item.id ? null : item.id)}><span className="q-no">Q{index + 1}</span>{item.label}</button>)}
        </div>
        {question && <div className="captain-answer" aria-live="polite">{answer}</div>}
        <div className="guided-inline"><label htmlFor="guided-game">{game.mode === "expert" ? "Guidance disabled in Expert" : "Guided reflection"}</label><Switch id="guided-game" checked={guided} disabled={game.mode === "expert"} onCheckedChange={setGuided} /></div>
        <div className="guided-inline"><label htmlFor="fast-game">Fast resolution</label><Switch id="fast-game" checked={fastResolve} onCheckedChange={setFastResolve} /></div>
        <div className="adversary-read"><span className="eyebrow">Actor model</span><p>{getAdversaryRead(game)}</p></div>
      </section>

      <section className="journal-panel">
        <div className="section-heading"><h2>Incident log</h2><span className="mono muted">{String(game.turns.length).padStart(2, "0")}</span></div>
        {!game.turns.length ? (
          <div className="empty-log"><p>Investigation opened.</p><small>Hypotheses, findings and actor movements will appear here.</small></div>
        ) : (
          <div className="journal-entries">
            {[...game.turns].reverse().map(turn => (
              <button className="log-entry" key={turn.number} onClick={() => setReport(turn)}>
                <span className={`log-number ${turn.revealed ? "found" : turn.success ? "passed" : "failed"}`}>{String(turn.number).padStart(2, "0")}</span>
                <div><strong>{procedureById(game, turn.procedure)?.title}</strong><span>{turn.revealed ? "Stage revealed" : turn.adversaryEvent ? "Actor advanced" : turn.success ? "No new evidence" : "Action unsuccessful"} · Impact {turn.impactChange >= 0 ? "+" : ""}{turn.impactChange}</span></div>
                <span className="roll-total">{turn.total}</span>
              </button>
            ))}
          </div>
        )}
      </section>
      <div className="rules-reminder"><p>A d20 roll plus its modifier must reach {config.threshold} to succeed. One of your reading&apos;s own sources adds +{OWN_SOURCE_BONUS}, right or wrong; an established source adds +2.</p></div>
    </aside>
  );
}
