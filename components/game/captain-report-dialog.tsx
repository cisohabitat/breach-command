import { ArrowRight, BrainCircuit, CheckCheck, Eye, MessagesSquare, Shield, ShieldCheck, Siren, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { attacks, getOperationalLabel, procedureIntensities, procedureScopes, procedures, stages } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";

export function CaptainReportDialog({ session }: { session: GameSession }) {
  const { report, game, ended, config, dismissReport, decide } = session;
  // A decision belongs to a running operation. Once the operation has ended the
  // options are not offered, whatever the engine left behind.
  const decision = game?.status === "playing" ? session.decision : null;
  const awaitingDecision = !!decision && !!game?.pendingDecision;

  return (
    <Dialog open={!!report} onOpenChange={open => { if (!open) dismissReport(); }}>
      <DialogContent className="game-dialog report-dialog" showCloseButton={!awaitingDecision} onEscapeKeyDown={event => { if (awaitingDecision) event.preventDefault(); }}>
        <DialogHeader>
          <div className="eyebrow">CAPTAIN’S REPORT <span className="separator">/</span> TURN {report?.number}</div>
          <DialogTitle>{report?.revealed ? "Evidence confirmed." : report?.success ? "No new attack identified." : "The action was unsuccessful."}</DialogTitle>
          <DialogDescription>{report && procedures.find(procedure => procedure.id === report.procedure)?.title}</DialogDescription>
        </DialogHeader>
        {report && game && <>
          <div className={`report-layout ${report.inject || decision ? "with-briefing" : "single"}`}>
            <section className="report-summary" aria-label="Procedure result">
              <div className={`result-roll ${report.success ? "success" : "failure"}`}>
                <span className="result-die">{report.raw}</span>
                <div><span>Natural roll {report.raw} {report.modifier >= 0 ? "+" : "−"} {Math.abs(report.modifier)} modifier{report.planningBonus ? " including hypothesis bonus" : ""}</span><strong>{report.total} <span>/ {config.threshold} needed · {report.success ? "Success" : "Failure"}</span></strong></div>
                {report.success ? <CheckCheck size={23} /> : <X size={23} />}
              </div>
              <div className="turn-effects"><span>{procedureScopes[report.plan.scope].title} scope</span><span>{procedureIntensities[report.plan.intensity].title} analysis</span>{report.specialistBonus > 0 && <span>Specialist +{report.specialistBonus}</span>}<span>Sector {report.sectorChange >= 0 ? "+" : ""}{report.sectorChange}</span><span>Actor objective +{report.objectiveChange}</span></div>
              <p className="report-narrative">{report.narrative}</p>
              {report.revealed && <div className="discovery"><ShieldCheck size={22} /><div><span>{stages[attacks.find(attack => attack.id === report.revealed)!.stage].name}</span><strong>{attacks.find(attack => attack.id === report.revealed)?.title}</strong></div></div>}
              {report.adversaryEvent && <div className="adversary-event"><Siren size={20} /><div><span className="eyebrow">ACTOR MOVEMENT</span><p>{report.adversaryEvent}</p></div></div>}
            </section>
            {(report.inject || decision) && <section className="report-briefing" aria-label="Operational update">
              {report.inject && <div className="inject-box"><span className="eyebrow">INJECT <span className="separator">/</span> {report.inject.reason}</span><h3>{report.inject.title}</h3><p>{report.inject.text}</p><strong>{report.inject.effectLabel}</strong></div>}
              {decision && (
                <div className="evidence-decision">
                  <span className="eyebrow">OPERATIONAL DECISION REQUIRED</span>
                  <h3>{decision.attack.title}: choose a command response.</h3>
                  <div>
                    {decision.options.map(option => (
                      <button key={option.id} onClick={() => decide(option.id)}>
                        {option.id === "observe" ? <Eye size={20} /> : option.id === "act" ? <Siren size={20} /> : option.id === "attribute" ? <BrainCircuit size={20} /> : option.id === "contain" ? <Shield size={20} /> : <MessagesSquare size={20} />}
                        <strong>{option.title}</strong>
                        <span>{option.description}<br /><b>{option.evidence}</b> · {option.risk} · {option.service}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>}
          </div>
          <p className="report-impact small muted">Business impact changed by {report.impactChange >= 0 ? "+" : ""}{report.impactChange}; {getOperationalLabel(game).toLowerCase()} changed by {report.continuityChange}. Decision quality is explained in the debrief.</p>
          {awaitingDecision ? <p className="report-gate" role="status">Resolve the operational decision above to continue. This report stays open until the choice is recorded.</p> : <button className="primary-button full" onClick={dismissReport}>{game.status === "response" ? "Enter response phase" : ended ? "Open debrief" : "Continue investigation"}<ArrowRight size={17} /></button>}
        </>}
      </DialogContent>
    </Dialog>
  );
}
