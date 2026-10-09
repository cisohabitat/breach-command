// A choice's effects as a ruled column, one meter a line, so a player reads the
// cost down the list instead of along a sentence joined by dots. It takes the
// same strings describeMeterChange and describeRollShift write, so the words a
// screen reader hears are unchanged. Spans rather than a list, because it sits
// inside option buttons, which hold phrasing content only.
export function EffectList({ items, className = "" }: { items: (string | null | undefined | false)[]; className?: string }) {
  const lines = items.filter((item): item is string => !!item);
  const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  if (!lines.length) return null;
  return (
    <span className={`effect-list ${className}`}>
      {lines.map((line, index) => {
        const change = line.match(/^(.+?) ([+−]\d+) (better|worse)$/);
        if (change) return <span key={index} className={`effect ${change[3]}`}><span>{change[1]}</span> <b>{change[2]}</b> <em>{change[3]}</em></span>;
        const same = line.match(/^(.+) unchanged$/);
        if (same) return <span key={index} className="effect same"><span>{capital(same[1])}</span> <b>0</b> <em>unchanged</em></span>;
        // The adversary's pace moves a step, not by a number: the step is the value.
        const pace = line.match(/^(adversary pace) (slower|faster)$/);
        if (pace) return <span key={index} className={`effect pace ${pace[2] === "slower" ? "better" : "worse"}`}><span>{capital(pace[1])}</span> <em>{pace[2]}</em></span>;
        const roll = line.match(/^(next roll|this roll) ([+−]\d+)(.*)$/);
        if (roll) return <span key={index} className={`effect ${roll[2].startsWith("+") ? "better" : "worse"}`}><span>{capital(roll[1])}{roll[3]}</span> <b>{roll[2]}</b> <em>{roll[2].startsWith("+") ? "better" : "worse"}</em></span>;
        return <span key={index} className="effect note"><span>{capital(line)}</span></span>;
      })}
    </span>
  );
}
