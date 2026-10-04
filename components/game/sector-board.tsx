import { Progress } from "@/components/ui/progress";
import { getAttributionRead, getObjectiveRead, getSectorRead, sectorSystems, specialists, type Game } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";

export function SectorBoard({ game }: { game: Game }) {
  const sector = sectorSystems[game.scenario];
  const objective = getObjectiveRead(game);
  const specialist = specialists[game.specialist];
  const person = namedSpecialists[game.specialist];
  const attribution = getAttributionRead(game);
  const read = getSectorRead(game);
  const transmission = sector.transmissions[Math.min(sector.transmissions.length - 1, Math.floor(game.turns.length / 3))];
  return (
    <section className="sector-board" aria-label="Sector and adversary command picture">
      <div className="sector-card">
        <div className="sector-title"><span><small>SECTOR MARGIN</small><strong>{sector.title}</strong></span><b>{game.sectorHealth}</b></div>
        {/* One name for the meter everywhere: a second name in capitals above it read
            as a different meter ("PATIENT SERVICE MARGIN" over "Clinical service margin"). */}
        <Progress value={game.sectorHealth} aria-label={sector.title} />
        <p className={`sector-read ${read.diverged ? "diverged" : ""}`}><strong>{read.headline}.</strong> {read.detail}</p>
        <p>{sector.rule}</p>
      </div>
      <div className="objective-card">
        <div className="sector-title"><span><small>ASSESSED ADVERSARY OBJECTIVE · {objective.confidence}</small><strong>{objective.title}</strong></span><b>{game.objectiveProgress}</b></div>
        <Progress value={game.objectiveProgress} aria-label={`Adversary progress: ${objective.title}`} />
        <p>{objective.detail}</p>
      </div>
      <div className="command-feed">
        <div><span><small>LIVE TRANSMISSION</small><strong>{transmission}</strong></span></div>
        <div><span><small>{person.callsign} · {attribution.confidence === "ATTRIBUTED" ? "ATTRIBUTED" : `${attribution.confidence} ATTRIBUTION`} · FATIGUE {game.specialistFatigue}/6</small><strong>{person.name}, {specialist.title}: “{person.voice}”</strong></span></div>
      </div>
    </section>
  );
}
