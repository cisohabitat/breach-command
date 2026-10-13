import { useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { gameModes, getAttributionRead, sectorSystems, specialists } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";
import { campaignRoutes } from "@/lib/phase9";
import type { GameSession } from "@/hooks/use-game-session";
import { useMessages } from "@/hooks/use-messages";
import { missionBriefingDialogMessages } from "@/lib/i18n/en/mission-briefing-dialog";
import { SpecialistPortrait } from "./story-art";
import { register } from "@/lib/i18n";
import { returnFocusToAwaiting } from "@/hooks/use-recover-focus";
import { SectorIllustration } from "./sector-illustration";
import { CaptainVoice } from "./captain-voice-lazy";

register(missionBriefingDialogMessages);

export function MissionBriefingDialog({ session }: { session: GameSession }) {
  const { t, rich, say } = useMessages();
  const { missionBriefing, setMissionBriefing, game, activeScenario } = session;
  // The brief opens on itself, as every report does, so it is read from its
  // title; it opened on a fold half-way down. Closed, focus goes to the next
  // order rather than to the start button that opened it, which is gone.
  const content = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={missionBriefing} onOpenChange={setMissionBriefing}>
      <DialogContent ref={content} className="game-dialog paper-dialog cinematic-briefing" showCloseButton={false} onOpenAutoFocus={event => { event.preventDefault(); content.current?.focus(); }} onCloseAutoFocus={returnFocusToAwaiting}>
        <DialogHeader><div className="eyebrow">{rich("missionBriefingDialog.formBc1002", { scenario: (game?.scenario ?? 0) + 1 }, { span: chunk => <span className="separator">{chunk}</span> })}</div><DialogTitle>{activeScenario.title}</DialogTitle><DialogDescription>{activeScenario.brief}</DialogDescription></DialogHeader>
        {game && <>
          {game.scenario === 0 && !session.botRun && <CaptainVoice cue="opening" enabled={session.voiceEnabled && missionBriefing && !session.settings && !session.rules && !session.newConfirm} history={session.voiceHistory} />}
          {/* What shapes the first decisions stays open: the sector's condition,
              the specialist on hand and what is known of the operator. The rest
              is context, and six readouts put the button a screen and a half down
              on a phone. */}
          <div className="briefing-readouts">
            <div><span>{t("fieldGuideDialog.sectorCondition")}</span><strong>{sectorSystems[game.scenario].title}</strong><small>{t("missionBriefingDialog.theOperationEnds2", { plain: sectorSystems[game.scenario].plain })}</small><details className="brief-rule-fold"><summary>{t("gameScreen.whatMovesIt")}</summary><small>{sectorSystems[game.scenario].rule}</small></details></div>
            <div><span>{t("missionBriefingDialog.deployedSpecialist")}</span><strong className="specialist-name"><SpecialistPortrait specialist={game.specialist} />{namedSpecialists[game.specialist].name} / {namedSpecialists[game.specialist].callsign}</strong><small>{specialists[game.specialist].ability}</small></div>
            <div><span>{t("missionBriefingDialog.attribution")}</span><strong>{say(getAttributionRead(game).title)}</strong><small>{say(getAttributionRead(game).detail)}</small></div>
          </div>
          {/* Expert withholds coaching; its brief said "Your first move" all the same. */}
          {game.mode !== "expert" && <div className="briefing-first-move"><span>01</span><p>{rich("missionBriefingDialog.strongYourFirst", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p></div>}
          <details className="briefing-more">
            <summary>{t("missionBriefingDialog.operationContext")}<span>{gameModes[game.mode].title}{game.mode === "campaign" ? `, ${campaignRoutes[game.campaignRoute].title}` : ""}, {say(game.variant.title)}</span></summary>
            <SectorIllustration scenarioId={activeScenario.id} />
            <div className="briefing-readouts">
              <div><span>{t("missionBriefingDialog.mode")}</span><strong>{gameModes[game.mode].title}</strong><small>{gameModes[game.mode].description}</small></div>
              {/* Only a campaign operation runs under the campaign's route; an Expert
                  brief named one that was not in effect. */}
              {game.mode === "campaign" && <div><span>{t("commandWorkspace.campaignRoute")}</span><strong>{campaignRoutes[game.campaignRoute].title}</strong><small>{campaignRoutes[game.campaignRoute].order}</small></div>}
              <div><span>{t("missionBriefingDialog.incidentVariant")}</span><strong>{say(game.variant.title)}</strong><small>{say(game.variant.briefing)}</small></div>
            </div>
            <div className="director-order"><p><span className="eyebrow">{t("missionBriefingDialog.directorIntent")}</span>{game.mode === "campaign" ? `${campaignRoutes[game.campaignRoute].order} ` : ""}{t("missionBriefingDialog.establishTheChain")}</p></div>
          </details>
          <button className="primary-button full" onClick={() => setMissionBriefing(false)}>{t("missionBriefingDialog.assumeCommand")}</button>
        </>}
      </DialogContent>
    </Dialog>
  );
}
