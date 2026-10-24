import { useMessages } from "@/hooks/use-messages";
import type { CSSProperties } from "react";
import { effectListMessages } from "@/lib/i18n/en/effect-list";
import { register } from "@/lib/i18n";
import { signed, type Effect } from "@/lib/advanced-game";

register(effectListMessages);

// A choice's effects as a ruled column, one meter a line, so a player reads the
// cost down the list instead of along a sentence joined by dots. The engine
// gives each line as data (meterEffect, rollEffect), and this lays it out and
// words it from the catalogue, so a translation needs no pattern of English.
// A plain string is a note, shown as it is. Spans rather than a list, because
// it sits inside option buttons, which hold phrasing content only.
export function EffectList({ items, className = "", compare = false, compactLabels }: { items: (Effect | string | null | undefined | false)[]; className?: string; compare?: boolean; compactLabels?: string[] }) {
  const { t } = useMessages("effectList");
  const lines = items.filter((item): item is Effect | string => !!item);
  const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  if (!lines.length) return null;
  const word = (good: boolean) => t(compare ? good ? "effectList.benefit" : "effectList.cost" : good ? "effectList.better" : "effectList.worse");
  if (compactLabels?.length === lines.length && lines.every(line => typeof line !== "string" && ["change", "same", "roll"].includes(line.kind))) return <span className={`effect-list compact ${className}`} style={{ "--effect-count": lines.length } as CSSProperties}>
    {lines.map((line, index) => {
      if (typeof line === "string" || !(line.kind === "change" || line.kind === "same" || line.kind === "roll")) return null;
      const amount = line.kind === "same" ? 0 : line.amount;
      const good = line.kind === "change" ? line.good : amount > 0;
      return <span className={`effect ${amount ? good ? "better" : "worse" : "same"}`} key={index}>
        <span aria-hidden="true" className="compact-effect-label">{compactLabels[index]}</span>
        <b aria-hidden="true">{amount ? signed(amount) : 0}</b>
        <em aria-hidden="true">{line.kind === "roll" && line.cap ? t("compactCap", { cap: line.cap }) : amount ? word(good) : t("compactSame")}</em>
        <span className="sr-only"><EffectList items={[line]} compare={compare} /></span>
      </span>;
    })}
  </span>;
  return (
    <span className={`effect-list ${className}`}>
      {lines.map((line, index) => {
        if (typeof line === "string") return <span key={index} className="effect note"><span>{capital(line)}</span></span>;
        switch (line.kind) {
          case "change": return <span key={index} className={`effect ${line.good ? "better" : "worse"}`}><span>{line.label}</span> <b>{signed(line.amount)}</b> <em>{word(line.good)}</em></span>;
          case "same": return <span key={index} className="effect same"><span>{capital(line.label)}</span> <b>0</b> <em>{t("unchanged")}</em></span>;
          // The adversary's pace moves a step, not by a number: the step is the value.
          case "pace": return <span key={index} className={`effect pace ${line.faster ? "worse" : "better"}`}><span>{t("adversaryPace")}</span> <em>{t(line.faster ? "effectList.faster" : "effectList.slower")}{compare && ` · ${word(!line.faster)}`}</em></span>;
          case "note": return <span key={index} className="effect note"><span>{capital(line.text)}</span></span>;
          case "roll": {
            const which = t(line.which === "next" ? "effectList.nextRoll" : "effectList.thisRoll");
            if (!line.amount && line.cap) return <span key={index} className="effect note"><span>{t("rollUnchangedCapped", { roll: which, cap: line.cap })}</span></span>;
            if (!line.amount) return <span key={index} className="effect same"><span>{which}</span> <b>0</b> <em>{t("unchanged")}</em></span>;
            return <span key={index} className={`effect ${line.amount > 0 ? "better" : "worse"}`}><span>{which}{line.cap ? t("rollsCarry", { cap: line.cap }) : ""}{line.carried ? t("withCarried") : ""}</span> <b>{signed(line.amount)}</b> <em>{word(line.amount > 0)}</em></span>;
          }
        }
      })}
    </span>
  );
}
