import { ArrowRight, Check, CircleSlash, ClipboardCheck, ShieldCheck } from "lucide-react";
import { getLossReason, getOperationalLabel } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";

// Three end states, three different beats. A win is a stand-down that the
// incident visibly settles out of; a loss is a quiet closure with nothing
// recovered; an exercise is a controlled stop at the drill boundary. The
// debrief opens on request in every case so the resolution lands first.
export function EndState({ session }: { session: GameSession }) {
  const { game, outcome, setDebrief } = session;
  if (!game) return null;
  const openDebrief = () => setDebrief(true);

  if (game.status === "won") {
    return (
      <section className="resolution resolution-won" data-resolution="won">
        <span className="resolution-sweep" aria-hidden="true" />
        <div className="end-banner end-won">
          <div className="end-icon"><ShieldCheck /></div>
          <div>
            <span className="eyebrow">RESOLUTION · STAND DOWN</span>
            <h2>{outcome?.title}</h2>
            <p>{outcome?.detail} Impact is {game.impact} and {getOperationalLabel(game).toLowerCase()} is {game.continuity}. The captain has closed the active response.</p>
          </div>
          <button className="primary-button" onClick={openDebrief}>Open after-action review <ArrowRight size={17} /></button>
        </div>
        <ol className="resolution-steps">
          <li><Check size={15} /> Attack chain confirmed · {game.revealed.length} of 4 stages identified</li>
          <li><Check size={15} /> Response recorded · containment, assurance and recovery</li>
          <li><Check size={15} /> Outcome scored · grade {outcome?.grade}, {outcome?.breakdown.total}/100</li>
        </ol>
      </section>
    );
  }

  if (game.status === "lost") {
    return (
      <section className="resolution resolution-lost" data-resolution="lost">
        <div className="end-banner end-lost">
          <div className="end-icon"><CircleSlash /></div>
          <div>
            <span className="eyebrow">OPERATION CLOSED</span>
            <h2>{getLossReason(game).title}.</h2>
            <p>{getLossReason(game).detail} {game.revealed.length} of 4 stages were confirmed, leaving impact at {game.impact}. No stand-down was issued.</p>
          </div>
          <button className="secondary-button" onClick={openDebrief}>Review the record <ArrowRight size={17} /></button>
        </div>
        <p className="resolution-note">Unresolved stages remain open questions, not conclusions. The record is preserved for the next shift.</p>
      </section>
    );
  }

  if (game.status === "exercise") {
    return (
      <section className="resolution resolution-exercise" data-resolution="exercise">
        <div className="end-banner end-exercise">
          <div className="end-icon"><ClipboardCheck /></div>
          <div>
            <span className="eyebrow">AUTHORISED EXERCISE</span>
            <h2>Exercise concluded at the boundary.</h2>
            <p>{game.revealed.length} of 4 stages were identified before the drill stopped. No live incident was declared and no service action was taken.</p>
          </div>
          <button className="secondary-button" onClick={openDebrief}>Review the drill <ArrowRight size={17} /></button>
        </div>
        <div className="resolution-stamp" aria-hidden="true"><span>EXERCISE</span></div>
      </section>
    );
  }

  return null;
}
