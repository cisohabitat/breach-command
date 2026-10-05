import { Progress } from "@/components/ui/progress";
import { getAttributionRead, getObjectiveRead, getSectorRead, sectorSystems, specialists, type Game } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";

// Entries in Command's situation log: the label in the margin, what it says in
// the body, and the figure, if it has one, in the right-hand column with the
// others. Six blocks of kicker, bold title and grey paragraph read as a
// dashboard of stat cards.
export function SectorBoard({ game }: { game: Game }) {
  const sector = sectorSystems[game.scenario];
  const objective = getObjectiveRead(game);
  const specialist = specialists[game.specialist];
  const person = namedSpecialists[game.specialist];
  const attribution = getAttributionRead(game);
  const read = getSectorRead(game);
  const transmission = sector.transmissions[Math.min(sector.transmissions.length - 1, Math.floor(game.turns.length / 3))];
  return (
    <>
      <div className="log-entry">
        <span className="log-label">Attribution<small>Confidence: {attribution.confidence === "ATTRIBUTED" ? "attributed" : attribution.confidence.toLowerCase()}</small></span>
        <div className="log-body"><p><strong>{attribution.title}.</strong> {attribution.detail}</p></div>
      </div>
      <div className="log-entry">
        {/* One name for the meter everywhere: a second name in capitals above it read
            as a different meter ("PATIENT SERVICE MARGIN" over "Clinical service margin"). */}
        <span className="log-label">Sector margin</span>
        <div className="log-body">
          <p><strong>{sector.title}</strong></p>
          <Progress value={game.sectorHealth} aria-label={sector.title} />
          <p className={`sector-read ${read.diverged ? "diverged" : ""}`}><strong>{read.headline}.</strong> {read.detail}</p>
          <p className="log-note">{sector.rule}</p>
        </div>
        <b className="log-figure">{game.sectorHealth}</b>
      </div>
      <div className="log-entry adversary">
        <span className="log-label">Adversary objective<small>Confidence: {objective.confidence.toLowerCase()}</small></span>
        <div className="log-body">
          <p><strong>{objective.title}</strong></p>
          <Progress value={game.objectiveProgress} aria-label={`Adversary progress: ${objective.title}`} />
          <p className="log-note">{objective.detail}</p>
        </div>
        <b className="log-figure">{game.objectiveProgress}</b>
      </div>
      <div className="log-entry">
        <span className="log-label">Live transmission</span>
        <div className="log-body"><p>{transmission}</p></div>
      </div>
      <div className="log-entry">
        <span className="log-label">Specialist<small><span className="log-data">{person.callsign}</span>, fatigue {game.specialistFatigue} of 6</small></span>
        <div className="log-body"><p>{person.name}, {specialist.title}: “{person.voice}”</p></div>
      </div>
    </>
  );
}
