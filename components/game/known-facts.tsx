import { getKnownFacts, type Game } from "@/lib/advanced-game";
import { useMessages } from "@/hooks/use-messages";
import { knownFactsMessages } from "@/lib/i18n/en/known-facts";
import { register } from "@/lib/i18n";

register(knownFactsMessages);

export function KnownFacts({ game }: { game: Game }) {
  const { t } = useMessages();
  const facts = getKnownFacts(game);
  return (
    <details className="known-facts" open={!facts.confirmed.length}>
      <summary>{t("knownFacts.whatWeAlready")}<span>{t("knownFacts.observation2Plural", { count: facts.observations.length })}{t("knownFacts.of4Stages", { confirmed: facts.confirmed.length })}</span>
      </summary>
      <p className="known-timeline">{facts.timeline}</p>
      <ul className="known-observations">{facts.observations.map(item => <li key={item}>{item}</li>)}</ul>
      {!!facts.confirmed.length && (
        <ul className="known-confirmed">{facts.confirmed.map(item => <li key={item}><b>{t("endState.confirmed")}</b> {item}</li>)}</ul>
      )}
      {facts.unverified && <p className="known-unverified"><b>{t("knownFacts.unverified")}</b> {facts.unverified}</p>}
    </details>
  );
}
