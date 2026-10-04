// A choice's effects as a ruled column, one meter a line, so a player reads the
// cost down the list instead of along a sentence joined by dots. It takes the
// same strings describeMeterChange and describeRollShift write, so the words a
// screen reader hears are unchanged. Spans rather than a list, because it sits
// inside option buttons, which hold phrasing content only.
export function EffectList({ items, className = "" }: { items: (string | null | undefined | false)[]; className?: string }) {
  const lines = items.filter((item): item is string => !!item);
  if (!lines.length) return null;
  return (
    <span className={`effect-list ${className}`}>
      {lines.map((line, index) => {
        const change = line.match(/^(.+?) ([+−]\d+) (better|worse)$/);
        if (change) return <span key={index} className={`effect ${change[3]}`}><span>{change[1]}</span> <b>{change[2]}</b> <em>{change[3]}</em></span>;
        const same = line.match(/^(.+) unchanged$/);
        if (same) return <span key={index} className="effect same"><span>{same[1]}</span> <b>0</b> <em>unchanged</em></span>;
        const roll = line.match(/^next roll ([+−]\d+)(.*)$/);
        if (roll) return <span key={index} className={`effect ${roll[1].startsWith("+") ? "better" : "worse"}`}><span>Next roll{roll[2]}</span> <b>{roll[1]}</b> <em>{roll[1].startsWith("+") ? "better" : "worse"}</em></span>;
        return <span key={index} className="effect note"><span>{line.charAt(0).toUpperCase() + line.slice(1)}</span></span>;
      })}
    </span>
  );
}
