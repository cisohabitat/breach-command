import type { CSSProperties } from "react";
import { ArrowRight, Check, Minus } from "lucide-react";
import { CommandEvent } from "@/components/game/command-event";
import { EndState } from "@/components/game/end-state";
import { ResponsePanel } from "@/components/game/response-panel";
import { SectorBoard } from "@/components/game/sector-board";
import { SectorSetPiece } from "@/components/game/sector-set-piece";
import { SectorOperationalScene, SectorSituation } from "@/components/game/living-incident";
import { attacks, getLead, stages } from "@/lib/advanced-game";
import { campaignRoutes } from "@/lib/phase9";
import type { GameSession } from "@/hooks/use-game-session";
import { useMessages } from "@/hooks/use-messages";
import { commandWorkspaceMessages } from "@/lib/i18n/en/command-workspace";
import { register } from "@/lib/i18n";
import { CaptainVoice } from "./captain-voice-lazy";
import { DecisionCarry } from "./decision-carry";

register(commandWorkspaceMessages);

export function CommandWorkspace({ session }: { session: GameSession }) {
  const { t, rich, say } = useMessages("commandWorkspace");
  const {
    game, activeWorkspace, ended, tutorial,
    setActiveWorkspace, respond, command, sectorDecision,
  } = session;

  if (!game) return null;
  // Only confirmed findings determine the open stage. Hidden techniques never
  // select a live marker, accessible label or visual treatment.
  const confirmed = attacks.filter(item => game.revealed.includes(item.id));
  const currentStage = game.status === "playing" ? stages.findIndex((_, index) => !confirmed.some(item => item.stage === index)) : -1;

  return (
    <>
      {/* What needs the player leads Command: a pending decision, the response
          sequence, the ending, or otherwise the current intelligence and the next
          move. The situation picture follows. Below it, on a phone, a decision
          sat two screens down with nothing on screen saying one was waiting. */}
      {activeWorkspace === "command" && game.status === "playing" && <CommandEvent game={game} onChoose={command} />}
      {activeWorkspace === "command" && game.status === "playing" && <SectorSetPiece game={game} onChoose={sectorDecision} />}
      {activeWorkspace === "command" && game.status === "response" && !session.botRun && <CaptainVoice cue={{ game, beat: "response", profile: session.responseProfile! }} decisionPending enabled={session.voiceEnabled && !session.report && !session.settings && !session.rules && !session.debrief && !session.newConfirm} history={session.voiceHistory} />}
      {activeWorkspace === "command" && (ended ? (
        <EndState session={session} />
      ) : game.status === "response" ? (
        <ResponsePanel game={game} onChoose={respond} reflectionEnabled={session.reflectionEnabled && !session.botRun} operation={session.learningId} onLearningSaveFailure={session.reportLearningFailure} />
      ) : (<>
        {/* What needs the player is an entry in the log like the rest, the order
            marked by its rule and its link in the text. A boxed "Next action" with
            a button on the right was the stock empty-state call to action. */}
        <section className="situation-log lead-log" aria-label={t("currentIntelligence")}>
          <div className="sit-entry"><span className="sit-label">{t("currentIntelligence")}</span><div className="sit-body"><p className="sit-lead">{say(getLead(game))}</p></div></div>
          {!tutorial && !game.pendingDecision && !game.pendingCommand && !game.pendingSetPiece && <div className="sit-entry sit-order"><span className="sit-label">{t("nextAction")}</span><div className="sit-body"><p>{rich("strongBuildAnd", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p><button className="sit-link" onClick={() => setActiveWorkspace("investigate")}>{t("openInvestigate")}<ArrowRight size={15} /></button></div></div>}
        </section>
      </>))}

      <section className={`attack-section ${game.status === "won" ? "resolved" : ""}`} hidden={activeWorkspace !== "command"}>
        <div className="section-heading"><h2>{t("attackChain")}</h2><span className="muted">{t("of4Revealed2", { revealed: game.revealed.length })}</span></div>
        {/* The chain as an evidence sheet: what is confirmed is typed in, what is
            not is redacted. Four equal cards with coloured tops and a centred icon
            read as a feature grid. */}
        <ol className="chain-sheet">
          {stages.map((stage, index) => {
            const attack = confirmed.find(item => item.stage === index);
            const revealed = !!attack;
            const current = index === currentStage;
            const Marker = revealed ? Check : current ? ArrowRight : Minus;
            return (
              <li className={revealed ? "confirmed" : "pending"} aria-current={current ? "step" : undefined} key={stage.name} style={{ "--stage-color": stage.color, "--redaction": `${[72, 58, 80, 64][index]}%` } as CSSProperties}>
                <span className="chain-no">{String(index + 1)}</span>
                <span className="chain-stage">{stage.name}</span>
                {revealed ? <strong className="chain-technique">{attack.title}</strong> : <span className="chain-redacted"><span className="sr-only">{t("unknownTechnique")}</span></span>}
                <span className="chain-status"><Marker size={14} aria-hidden="true" /> {revealed ? t("confirmed") : current ? t("currentStage") : t("awaitingEvidence")}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="situation-log" hidden={activeWorkspace !== "command"} aria-labelledby="situation-heading">
        <div className="section-heading"><h2 id="situation-heading">{t("briefingWorkspace.situation")}</h2></div>
        <div className="sit-entry compact">
          <span className="sit-label">{rich("campaignRouteSmall", { campaignRoutesTitle: campaignRoutes[game.campaignRoute].title }, { small: chunk => <small>{chunk}</small> })}</span>
          <div className="sit-body"><p><strong>{say(game.variant.title)}.</strong> {say(game.variant.briefing)}</p><small>{say(game.variant.modifier)}</small></div>
        </div>
        <SectorBoard game={game} />
        {activeWorkspace === "command" && <SectorSituation game={game} />}
        {activeWorkspace === "command" && <DecisionCarry game={game} />}
        {activeWorkspace === "command" && <SectorOperationalScene game={game} />}
      </section>
    </>
  );
}
