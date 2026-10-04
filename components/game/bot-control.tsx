import { Bot, Hand, Pause, Play } from "lucide-react";
import type { GameSession } from "@/hooks/use-game-session";

export function BotControl({ session }: { session: GameSession }) {
  const { botRun, botActive, botPaused, botStatus, ended, toggleBotPause, takeControl } = session;
  if (!botRun) return null;

  const title = ended
    ? "Practice operation complete"
    : botActive
      ? botPaused ? "Bot commander paused" : "Bot commander operating"
      : "Manual control resumed";

  return (
    <section className={`bot-control ${botPaused ? "paused" : ""}`} aria-live="polite" aria-label="Bot commander status">
      <span className="bot-control-icon"><Bot size={21} aria-hidden="true" /></span>
      <div className="bot-control-copy">
        <span className="eyebrow">Practice operation</span>
        <strong>{title}</strong>
        <small>{botStatus} No campaign rewards or balance records are written.</small>
      </div>
      {!ended && <div className="bot-control-actions">
        {botActive && <button onClick={toggleBotPause} aria-label={botPaused ? "Resume Bot Commander" : "Pause Bot Commander"}>
          {botPaused ? <Play size={16} /> : <Pause size={16} />}
          {botPaused ? "Resume" : "Pause"}
        </button>}
        {botActive && <button onClick={takeControl}><Hand size={16} /> Take control</button>}
      </div>}
    </section>
  );
}
