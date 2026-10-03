import {
  ChevronRight,
  Clock3,
  Fingerprint,
  Globe2,
  HardDrive,
  KeyRound,
  Layers,
  Mail,
  Network,
  Radio,
  Search,
  Server,
  Shield,
  Landmark,
} from "lucide-react";
import {
  availableIn,
  getDiscriminatingRead,
  hypothesisSources,
  proceduresFor,
  type Game,
  OWN_SOURCE_BONUS,
} from "@/lib/advanced-game";

// The last icon belongs to the sector procedure, which is always listed last.
const icons = [HardDrive, KeyRound, Network, Shield, Mail, Server, Layers, Globe2, Search, Fingerprint, Radio, Landmark];

export function ProcedureGrid({
  game,
  disabled,
  onChoose,
}: {
  game: Game;
  disabled: boolean;
  onChoose: (id: string) => void;
}) {
  const routeSources = game.hypothesis ? hypothesisSources(game, game.hypothesis) : [];
  return (
    <div className="procedure-grid">
      {proceduresFor(game).map((procedure, index) => {
        const Icon = icons[index];
        const cooldown = availableIn(game, procedure.id);
        const established = game.established.includes(procedure.id);
        const aligned = routeSources.includes(procedure.id);
        const read = game.mode === "expert" ? null : getDiscriminatingRead(game, procedure.id);
        return (
          <button
            key={procedure.id}
            data-procedure={procedure.id}
            className={`procedure-card ${established ? "established" : ""} ${cooldown ? "cooling" : ""} ${aligned ? "hypothesis-aligned" : ""}`}
            disabled={disabled || cooldown > 0 || !!game.pendingDecision}
            onClick={() => onChoose(procedure.id)}
            aria-label={`${procedure.title}${established ? ", established, plus 2" : ""}${aligned ? ", supports current hypothesis" : ""}${read && read.spent ? `, checked ${read.spent} times with no stage found` : read && read.inconclusive ? `, ${read.inconclusive} attempts failed without a result` : ""}${cooldown ? `, available in ${cooldown} turns` : ""}`}
          >
            <div className="procedure-top">
              <span className="procedure-icon"><Icon size={20} /></span>
              {/* The badge carries the cooldown only. The established bonus is stated
                  once, in the footer; a "+2" badge said it a second time. */}
              {cooldown > 0 && <span className="procedure-badge"><Clock3 size={12} /> {cooldown} turn{cooldown === 1 ? "" : "s"}</span>}
            </div>
            <h3>{procedure.title}</h3>
            <p>{procedure.short}</p>
            {aligned && !cooldown && <small className="alignment-label">Own source <span className="nowrap">· +{OWN_SOURCE_BONUS}</span></small>}
            {read && !cooldown && read.spent > 0 && <small className="spent-label">CHECKED {read.spent}× · NO STAGE FOUND</small>}
            {read && !cooldown && !read.spent && read.inconclusive > 0 && <small className="spent-label inconclusive">{read.inconclusive} ATTEMPT{read.inconclusive === 1 ? "" : "S"} FAILED · INCONCLUSIVE</small>}
            <div className="procedure-bottom">
              <span>{cooldown ? "ON COOLDOWN" : established ? "ESTABLISHED · +2" : "STANDARD"}</span>
              {!cooldown && <ChevronRight size={15} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
