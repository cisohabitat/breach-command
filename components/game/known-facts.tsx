import { getKnownFacts, type Game } from "@/lib/advanced-game";

export function KnownFacts({ game }: { game: Game }) {
  const facts = getKnownFacts(game);
  return (
    <details className="known-facts" open={!facts.confirmed.length}>
      <summary>
                What we already know
        <span>{facts.observations.length} observation{facts.observations.length === 1 ? "" : "s"} · {facts.confirmed.length} of 4 stages confirmed</span>
      </summary>
      <p className="known-timeline">{facts.timeline}</p>
      <ul className="known-observations">{facts.observations.map(item => <li key={item}>{item}</li>)}</ul>
      {!!facts.confirmed.length && (
        <ul className="known-confirmed">{facts.confirmed.map(item => <li key={item}><b>CONFIRMED</b> {item}</li>)}</ul>
      )}
      {facts.unverified && <p className="known-unverified"><b>UNVERIFIED</b> {facts.unverified}</p>}
    </details>
  );
}
