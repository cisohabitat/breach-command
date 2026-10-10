import { Bot, Hand, Pause, Play } from "lucide-react";
import type { GameSession } from "@/hooks/use-game-session";
import { useMessages } from "@/hooks/use-messages";
import { botControlMessages } from "@/lib/i18n/en/bot-control";
import { register } from "@/lib/i18n";

register(botControlMessages);

export function BotControl({ session }: { session: GameSession }) {
  const { t } = useMessages();
  const { botRun, botActive, botPaused, botStatus, ended, toggleBotPause, takeControl } = session;
  if (!botRun) return null;

  const title = ended
    ? t("botControl.practiceOperationComplete")
    : botActive
      ? botPaused ? t("botControl.botCommanderPaused") : t("botControl.botCommanderOperating")
      : t("botControl.manualControlResumed");

  return (
    <section className={`bot-control ${botPaused ? "paused" : ""}`} aria-live="polite" aria-label={t("botControl.botCommanderStatus")}>
      <span className="bot-control-icon"><Bot size={21} aria-hidden="true" /></span>
      <div className="bot-control-copy">
        <span className="eyebrow">{t("botControl.practiceOperation")}</span>
        <strong>{title}</strong>
        <small>{t("botControl.noCampaignRewards2", { botStatus })}</small>
      </div>
      {!ended && <div className="bot-control-actions">
        {botActive && <button onClick={toggleBotPause} aria-label={botPaused ? t("botControl.resumeBotCommander") : t("botControl.pauseBotCommander")}>
          {botPaused ? <Play size={16} /> : <Pause size={16} />}
          {botPaused ? t("botControl.resume") : t("botControl.pause")}
        </button>}
        {botActive && <button onClick={takeControl}><Hand size={16} />{t("botControl.takeControl")}</button>}
      </div>}
    </section>
  );
}
