import type { Game } from "@/lib/engine/types";
import CarryDetails from "./decision-carry-details";
import { useMessages } from "@/hooks/use-messages";
import { register } from "@/lib/i18n";
import { decisionCarryMessages } from "@/lib/i18n/en/decision-carry";
register(decisionCarryMessages);
// No invented chronology or quality hints: event records have no timestamps.
export function DecisionCarry({ game }: { game: Game }) {
  const { t } = useMessages();
  if (!game.decisions.length && !game.commandHistory.length && !game.setPieceHistory.length) return null;
  return <details className="decision-primer decision-carry"><summary>{t("decisionCarry.title")}</summary><CarryDetails game={game} /></details>;
}
