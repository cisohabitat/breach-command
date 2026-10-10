import { Fragment, useId, useState } from "react";
import { glossary } from "@/lib/i18n/shared-text";

// A passage of field text with its vocabulary explained where it is read. A
// glossary term is a quiet underlined control; choosing it opens the meaning in
// place, in brackets after the word, and choosing it again closes it. The field
// guide holds the same glossary, but a newcomer reading a clue does not leave it
// to look a word up. Never place this inside another control: the terms are
// buttons, so it belongs in prose only.
export function Glossed({ text }: { text: string }) {
  const { glossaryParts, plainLanguage } = glossary();
  const [open, setOpen] = useState<string | null>(null);
  const id = useId();
  return (
    <>
      {glossaryParts(text).map((part, index) => {
        if (!part.term) return <Fragment key={index}>{part.text}</Fragment>;
        const term = part.term;
        const expanded = open === term;
        return (
          <Fragment key={index}>
            <button
              type="button"
              className="gloss-term"
              aria-expanded={expanded}
              aria-controls={expanded ? `${id}-${index}` : undefined}
              onClick={() => setOpen(expanded ? null : term)}
            >{part.text}</button>
            {expanded && <span id={`${id}-${index}`} className="gloss-meaning"> ({plainLanguage[term]})</span>}
          </Fragment>
        );
      })}
    </>
  );
}
