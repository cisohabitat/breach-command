import { Activity, Crosshair, Radio, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getAdversaryProfile, getObjectiveRead, sectorSystems, specialists, adversaryObjectives, type Game } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";

export function SectorBoard({ game }: { game: Game }) {
  const sector = sectorSystems[game.scenario];
  const objective = getObjectiveRead(game);
  const specialist = specialists[game.specialist];
  const person = namedSpecialists[game.specialist];
  const transmission = sector.transmissions[Math.min(sector.transmissions.length - 1, Math.floor(game.turns.length / 3))];
  return (
    <section className="sector-board" aria-label="Sector and adversary command picture">
      <div className="sector-card">
        <div className="sector-title"><Activity size={18} /><span><small>{sector.unit}</small><strong>{sector.title}</strong></span><b>{game.sectorHealth}</b></div>
        <Progress value={game.sectorHealth} aria-label={sector.unit} />
        <p>{sector.rule}</p>
      </div>
      <div className="objective-card">
        <div className="sector-title"><Crosshair size={18} /><span><small>ASSESSED ADVERSARY OBJECTIVE · {objective.confidence}</small><strong>{objective.title}</strong></span><b>{game.objectiveProgress}</b></div>
        <Progress value={game.objectiveProgress} aria-label={adversaryObjectives[game.objective].pressure} />
        <p>{objective.detail}</p>
      </div>
      <div className="command-feed">
        <div><Radio size={16} /><span><small>LIVE TRANSMISSION</small><strong>{transmission}</strong></span></div>
        <div><Users size={16} /><span><small>{person.callsign} · {getAdversaryProfile(game).title} · FATIGUE {game.specialistFatigue}/6</small><strong>{person.name}, {specialist.title}: “{person.voice}”</strong></span></div>
      </div>
    </section>
  );
}
