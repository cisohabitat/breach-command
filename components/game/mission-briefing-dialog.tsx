import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { gameModes, getAttributionRead, sectorSystems, specialists } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";
import { campaignRoutes } from "@/lib/phase9";
import type { GameSession } from "@/hooks/use-game-session";

export function MissionBriefingDialog({ session }: { session: GameSession }) {
  const { missionBriefing, setMissionBriefing, game, activeScenario } = session;

  return (
    <Dialog open={missionBriefing} onOpenChange={setMissionBriefing}>
      <DialogContent className="game-dialog paper-dialog cinematic-briefing" showCloseButton={false}>
        <DialogHeader><div className="eyebrow">Secure command briefing · case {String((game?.scenario ?? 0) + 1).padStart(2, "0")}</div><DialogTitle>{activeScenario.title}</DialogTitle><DialogDescription>{activeScenario.brief}</DialogDescription></DialogHeader>
        {game && <>
          {/* What shapes the first decisions stays open: the sector's condition,
              the specialist on hand and what is known of the operator. The rest
              is context, and six readouts put the button a screen and a half down
              on a phone. */}
          <div className="briefing-readouts">
            <div><span>Sector condition</span><strong>{sectorSystems[game.scenario].title}</strong><small>{sectorSystems[game.scenario].plain} The operation ends if it reaches zero.</small><details className="brief-rule-fold"><summary>What moves it</summary><small>{sectorSystems[game.scenario].rule}</small></details></div>
            <div><span>Deployed specialist</span><strong>{namedSpecialists[game.specialist].name} / {namedSpecialists[game.specialist].callsign}</strong><small>{specialists[game.specialist].ability}</small></div>
            <div><span>Attribution</span><strong>{getAttributionRead(game).title}</strong><small>{getAttributionRead(game).detail}</small></div>
          </div>
          {/* Expert withholds coaching; its brief said "Your first move" all the same. */}
          {game.mode !== "expert" && <div className="briefing-first-move"><span>01</span><p><strong>Your first move</strong>Assume command, open Investigate, choose a working hypothesis and run a procedure marked “Own source”.</p></div>}
          <details className="briefing-more">
            <summary>Operation context<span>{gameModes[game.mode].title}{game.mode === "campaign" ? ` · ${campaignRoutes[game.campaignRoute].title}` : ""} · {game.variant.title}</span></summary>
            <div className="briefing-readouts">
              <div><span>MODE</span><strong>{gameModes[game.mode].title}</strong><small>{gameModes[game.mode].description}</small></div>
              {/* Only a campaign operation runs under the campaign's route; an Expert
                  brief named one that was not in effect. */}
              {game.mode === "campaign" && <div><span>CAMPAIGN ROUTE</span><strong>{campaignRoutes[game.campaignRoute].title}</strong><small>{campaignRoutes[game.campaignRoute].order}</small></div>}
              <div><span>INCIDENT VARIANT</span><strong>{game.variant.title}</strong><small>{game.variant.briefing}</small></div>
            </div>
            <div className="director-order"><p><span className="eyebrow">Director’s intent</span>{game.mode === "campaign" ? `${campaignRoutes[game.campaignRoute].order} ` : ""}Establish the chain, declare an objective theory and preserve the essential service.</p></div>
          </details>
          <button className="primary-button full" onClick={() => setMissionBriefing(false)}>Assume command</button>
        </>}
      </DialogContent>
    </Dialog>
  );
}
