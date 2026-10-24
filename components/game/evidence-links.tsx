import { getEvidenceLinks, type Game } from "@/lib/advanced-game";
import { useMessages } from "@/hooks/use-messages";
import { register } from "@/lib/i18n";
import { evidenceLinksMessages } from "@/lib/i18n/en/evidence-links";
import { EvidenceAxes } from "./evidence-assessment";

register(evidenceLinksMessages);

// A selected pair is only a question. Never inspect supports, stage, route or
// the hidden chain to draw a connection the player has not yet tested.
export function EvidenceLinks({ game, selected }: { game: Game; selected: string[] }) {
  const { t, say } = useMessages("evidenceLinks");
  const links = getEvidenceLinks(game, selected);
  return <section className="evidence-links" aria-label={t("title")}>
    <h3>{t("title")}</h3>
    <p>{t("explanation")}</p>
    {!links.length ? <p>{t("selectPair")}</p> : <ul>{links.map(link => {
      const [first, second] = link.ids.map(id => game.evidence.find(item => item.id === id));
      if (!first || !second) return null;
      return <li key={link.ids.join("/")} data-relationship={link.status}>
        <div className="evidence-link-row">
          <span className="evidence-link-node"><small>{t("turn", { turn: first.turn })} · {say(first.source)}</small><strong>{say(first.title)}</strong><EvidenceAxes game={game} item={first} standalone /></span>
          <span className="evidence-link-connector"><span>{t(link.status === "supported" ? "supported" : link.status === "unrelated" ? game.comparisonVersion === 2 ? "notEstablished" : "unrelated" : link.status === "disputed" ? "disputed" : "untested")}</span></span>
          <span className="evidence-link-node"><small>{t("turn", { turn: second.turn })} · {say(second.source)}</small><strong>{say(second.title)}</strong><EvidenceAxes game={game} item={second} standalone /></span>
        </div>
        <p>{link.finding ? say(link.finding) : t("noInference")}</p>
      </li>;
    })}</ul>}
  </section>;
}
