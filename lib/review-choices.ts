import { responseOptionsFor, type Game } from "./advanced-game.ts";
import { lit } from "./i18n/message.ts";

// Review-only: prioritise poorly assessed calls, then recorded meter movement.
// Event records have no meter deltas or timestamps; never manufacture either.
export function reviewChoices(game: Game) {
  if (!["won", "lost", "exercise"].includes(game.status)) return [];
  const rows = [
    ...game.decisions.map((row, index) => ({ id: `decision-${index}`, title: row.title, effect: row.effect, reason: row.rationale, quality: row.quality,
      movement: Math.abs(row.impactChange) + Math.abs(row.continuityChange) + Math.abs(row.sectorChange) + Math.abs(row.objectiveChange) })),
    ...game.commandHistory.map((row, index) => ({ id: `command-${index}`, title: row.title, effect: row.effect, reason: null, quality: row.quality, movement: 0 })),
    ...game.setPieceHistory.map((row, index) => ({ id: `sector-${index}`, title: row.title, effect: row.effect, reason: null, quality: row.quality, movement: 0 })),
  ].sort((a, b) => a.quality - b.quality || b.movement - a.movement);
  const profile = responseOptionsFor(game);
  const phases = ["containment", "assurance", "recovery"] as const;
  game.responseChoices.forEach((choice, index) => {
    const option = profile[phases[index]]?.find(item => item.id === choice);
    if (option) rows.push({ id: `response-${index}`, title: lit(option.title), effect: lit(option.description), reason: null, quality: 0, movement: 0 });
  });
  return rows.slice(0, 3).map(({ id, title, effect, reason }) => ({ id, title, effect, reason }));
}
