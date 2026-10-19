import type { Game } from "@/lib/engine/types";
import { meterEffect } from "@/lib/engine/rules";
import { EffectList } from "./effect-list";
import { useMessages } from "@/hooks/use-messages";
import { register } from "@/lib/i18n";
import { decisionCarryDetailsMessages } from "@/lib/i18n/en/decision-carry-details";
register(decisionCarryDetailsMessages);

export default function CarryDetails({ game }: { game: Game }) {
  const { t, say } = useMessages();
  const decision = game.decisions.at(-1);
  const rows = [game.commandHistory.at(-1), game.setPieceHistory.at(-1)].filter(row => !!row);
  return <><p>{t("decisionCarryDetails.boundary")}</p>
    {decision && <div><strong>{say(decision.title)}</strong><p>{say(decision.effect)}</p><EffectList items={([["impact", decision.impactChange], ["continuity", decision.continuityChange], ["sector", decision.sectorChange], ["objective", decision.objectiveChange]] as const).map(([meter, change]) => meterEffect(game, meter, change))} /></div>}
    {rows.map((row, index) => <div key={index}><strong>{say(row.title)}</strong><p>{say(row.effect)}</p></div>)}
  </>;
}
