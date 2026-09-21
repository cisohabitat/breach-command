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
} from "lucide-react";
import {
  availableIn,
  getDiscriminatingRead,
  hypotheses,
  procedures,
  type Game,
} from "@/lib/advanced-game";

const icons = [HardDrive, KeyRound, Network, Shield, Mail, Server, Layers, Globe2, Search, Fingerprint, Radio];

export function ProcedureGrid({
  game,
  disabled,
  onChoose,
}: {
  game: Game;
  disabled: boolean;
  onChoose: (id: string) => void;
}) {
  const hypothesis = hypotheses.find(item => item.id === game.hypothesis);
  return (
    <div className="procedure-grid">
      {procedures.map((procedure, index) => {
        const Icon = icons[index];
        const cooldown = availableIn(game, procedure.id);
        const established = game.established.includes(procedure.id);
        const aligned = !!hypothesis?.procedures.includes(procedure.id);
        const read = game.mode === "expert" ? null : getDiscriminatingRead(game, procedure.id);
        return (
          <button
            key={procedure.id}
            data-procedure={procedure.id}
            className={`procedure-card ${established ? "established" : ""} ${cooldown ? "cooling" : ""} ${aligned ? "hypothesis-aligned" : ""}`}
            disabled={disabled || cooldown > 0 || !!game.pendingDecision}
            onClick={() => onChoose(procedure.id)}
            aria-label={`${procedure.title}${established ? ", established, plus 2" : ""}${aligned ? ", supports current hypothesis" : ""}${read && read.spent ? `, spent ${read.spent} times without exposing a stage` : ""}${cooldown ? `, available in ${cooldown} turns` : ""}`}
          >
            <div className="procedure-top">
              <span className="procedure-icon"><Icon size={20} /></span>
              <span className={`procedure-badge ${established ? "bonus" : ""}`}>
                {cooldown ? <><Clock3 size={12} /> {cooldown} turn{cooldown === 1 ? "" : "s"}</> : established ? "+2" : "+0"}
              </span>
            </div>
            <h3>{procedure.title}</h3>
            <p>{procedure.short}</p>
            {aligned && !cooldown && <small className="alignment-label">HYPOTHESIS EVIDENCE</small>}
            {read && read.spent > 0 && !cooldown && <small className="spent-label">SPENT {read.spent}× · NO STAGE FOUND</small>}
            <div className="procedure-bottom">
              <span>{cooldown ? "ON COOLDOWN" : established ? "ESTABLISHED" : "STANDARD"}</span>
              {!cooldown && <ChevronRight size={15} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
