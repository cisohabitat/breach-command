import { Progress } from "@/components/ui/progress";
import { getAttributionRead, getObjectiveRead, getSectorRead, sectorSystems, specialists, type Game } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";
import { useMessages } from "@/hooks/use-messages";
import { sectorBoardMessages } from "@/lib/i18n/en/sector-board";
import { register } from "@/lib/i18n";

register(sectorBoardMessages);

// Entries in Command's situation log: the label in the margin, what it says in
// the body, and the figure, if it has one, in the right-hand column with the
// others. Six blocks of kicker, bold title and grey paragraph read as a
// dashboard of stat cards.
export function SectorBoard({ game }: { game: Game }) {
  const { t } = useMessages();
  const sector = sectorSystems[game.scenario];
  const objective = getObjectiveRead(game);
  const specialist = specialists[game.specialist];
  const person = namedSpecialists[game.specialist];
  const attribution = getAttributionRead(game);
  const read = getSectorRead(game);
  const transmission = sector.transmissions[Math.min(sector.transmissions.length - 1, Math.floor(game.turns.length / 3))];
  return (
    <>
      <div className="sit-entry compact">
        <span className="sit-label">{t("missionBriefingDialog.attribution")}<small>{t("sectorBoard.confidence")}{attribution.confidence === "ATTRIBUTED" ? "attributed" : attribution.confidence.toLowerCase()}</small></span>
        <div className="sit-body"><p><strong>{attribution.title}.</strong> {attribution.detail}</p></div>
      </div>
      <div className="sit-entry">
        {/* One name for the meter everywhere: a second name in capitals above it read
            as a different meter ("PATIENT SERVICE MARGIN" over "Clinical service margin"). */}
        <span className="sit-label">{t("sectorBoard.sectorMargin")}</span>
        <div className="sit-body">
          <p><strong>{sector.title}</strong></p>
          <Progress value={game.sectorHealth} aria-label={sector.title} />
          {/* The headline stays in view; why the two meters differ and what moves
              the margin are one tap down, open by default when they diverge. A
              paragraph under every entry read as an interface explaining itself. */}
          <p className={`sector-read ${read.diverged ? "diverged" : ""}`}><strong>{read.headline}.</strong></p>
          <details className="sit-more" open={read.diverged}><summary>{t("sectorBoard.whyAndWhat")}</summary><p className="sit-note">{read.detail}</p><p className="sit-note">{sector.rule}</p></details>
        </div>
        <b className="sit-figure">{game.sectorHealth}</b>
      </div>
      <div className="sit-entry adversary">
        <span className="sit-label">{t("sectorBoard.adversaryObjective")}<small>{t("sectorBoard.confidence2", { confidence: objective.confidence.toLowerCase() })}</small></span>
        <div className="sit-body">
          <p><strong>{objective.title}</strong></p>
          <Progress value={game.objectiveProgress} aria-label={t("sectorBoard.adversaryProgress", { objectiveTitle: objective.title })} />
          <p className="sit-note">{objective.detail}</p>
        </div>
        <b className="sit-figure">{game.objectiveProgress}</b>
      </div>
      <div className="sit-entry compact">
        <span className="sit-label">{t("sectorBoard.liveTransmission")}</span>
        <div className="sit-body"><p>{transmission}</p></div>
      </div>
      <div className="sit-entry compact">
        <span className="sit-label">{t("sectorBoard.specialist")}<small><span className="sit-data">{person.callsign}</span>{t("sectorBoard.fatigueOf6", { specialistFatigue: game.specialistFatigue })}</small></span>
        <div className="sit-body"><p>{person.name}, {specialist.title}: “{person.voice}”</p></div>
      </div>
    </>
  );
}
