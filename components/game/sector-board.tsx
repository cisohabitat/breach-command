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
      <div className="sit-entry">
        <span className="sit-label">Attribution<small>Confidence: {attribution.confidence === "ATTRIBUTED" ? "attributed" : attribution.confidence.toLowerCase()}</small></span>
        <div className="sit-body"><p><strong>{attribution.title}.</strong> {attribution.detail}</p></div>
      </div>
      <div className="sit-entry">
        {/* One name for the meter everywhere: a second name in capitals above it read
            as a different meter ("PATIENT SERVICE MARGIN" over "Clinical service margin"). */}
        <span className="sit-label">Sector margin</span>
        <div className="sit-body">
          <p><strong>{sector.title}</strong></p>
          <Progress value={game.sectorHealth} aria-label={sector.title} />
          <p className={`sector-read ${read.diverged ? "diverged" : ""}`}><strong>{read.headline}.</strong> {read.detail}</p>
          <p className="sit-note">{sector.rule}</p>
        </div>
        <b className="sit-figure">{game.sectorHealth}</b>
      </div>
      <div className="sit-entry adversary">
        <span className="sit-label">Adversary objective<small>Confidence: {objective.confidence.toLowerCase()}</small></span>
        <div className="sit-body">
          <p><strong>{objective.title}</strong></p>
          <Progress value={game.objectiveProgress} aria-label={`Adversary progress: ${objective.title}`} />
          <p className="sit-note">{objective.detail}</p>
        </div>
        <b className="sit-figure">{game.objectiveProgress}</b>
      </div>
      <div className="sit-entry">
        <span className="sit-label">Live transmission</span>
        <div className="sit-body"><p>{transmission}</p></div>
      </div>
      <div className="sit-entry">
        <span className="sit-label">Specialist<small><span className="sit-data">{person.callsign}</span>, fatigue {game.specialistFatigue} of 6</small></span>
        <div className="sit-body"><p>{person.name}, {specialist.title}: “{person.voice}”</p></div>
      </div>
    </>
  );
}
