import { getOperationalLabel, sectorSystems, signed, type Game } from "@/lib/advanced-game";
import { useMessages } from "@/hooks/use-messages";
import { register } from "@/lib/i18n";
import { turnCalculationMessages } from "@/lib/i18n/en/turn-calculation";

register(turnCalculationMessages);

const labels = {
  turn: "turnCalculation.turn", plan: "turnCalculation.plan", discovery: "turnCalculation.discovery",
  incident: "turnCalculation.incident", specialist: "turnCalculation.specialist", limits: "turnCalculation.limits",
} as const;

export function TurnCalculation({ game, turn }: { game: Game; turn: Game["turns"][number] }) {
  const { t } = useMessages("turnCalculation");
  const movement = turn.movement;
  if (!movement) return null;
  const meters = [
    ["impact", t("impact")], ["continuity", getOperationalLabel(game)],
    ["sector", sectorSystems[game.scenario].unit], ["objective", t("objective")],
  ] as const;
  return <details className="decision-primer turn-calculation">
    <summary>{t("title")}</summary>
    <div className="meter-calculations">{meters.map(([key, label]) => <section key={key}>
      <h4>{label}: {movement.before[key]} → {movement.after[key]}</h4>
      <dl>
        <div><dt>{t("before")}</dt><dd>{movement.before[key]}</dd></div>
        {movement.parts.filter(part => part.changes[key] !== 0).map(part => <div key={part.kind}><dt>{t(labels[part.kind])}</dt><dd>{signed(part.changes[key])}</dd></div>)}
        <div><dt>{t("after")}</dt><dd>{movement.after[key]}</dd></div>
      </dl>
    </section>)}</div>
  </details>;
}
