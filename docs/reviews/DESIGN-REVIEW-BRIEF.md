# Design review brief

Phase 0 and Phase 3 of `docs/ROADMAP.md` rest on a review by a human
designer. Thirteen rounds of review by AI agents found real bugs and real
template patterns, then plateaued: each reviewer named whichever base style
was in place as the giveaway, and the grade moved between C+ and B−
whatever changed. This brief is what to hand a designer instead.

## Who

A product or game designer who has shipped interface work, has not seen the
project, and has no stake in it. One session of about ninety minutes.

## What they look at

On their own devices, not screenshots: a phone (ideally an iPhone, which no
automated test covers yet) and a laptop.

1. The assignment screen, cold.
2. One Training operation played to the end, any outcome.
3. The Captain's Report, the mission brief, the field guide and the review.
4. Settings.

## The questions

1. Would you say this was designed by someone with a point of view? Where
   does it hold together, and where does it fall apart?
2. What would you change first, second and third?
3. The play screens are a dark desk and the documents a player opens are
   paper. Does that read as intended? Would you keep it?
4. The ten sectors (healthcare, energy, clearing house and so on) differ
   only in their words. Should they look different, and how?
5. Is the type working? (One condensed face for titles and figures, the
   system face for prose.)
6. Is there anything that looks like it came from a template or a component
   library?
7. Anything else: sound, motion, the meters, the landing page.

## What is fixed and what is theirs to decide

Fixed by the product, not open to the review: the game's rules and content,
its accessibility (contrast, focus, target sizes, reduced motion, screen
reader support), its phone layout's height budget (the procedures must stay
on the first screen once a reading is declared), and the absence of any
backend or account.

Theirs to decide, recorded in `AGENTS.md` as current choices rather than
rules: the dark desk and paper split, the bone accent, the condensed face,
sectors never differing by hue, the icon policy, the landing page's pitch
column, the readouts' presentation.

## What comes back

A written list in their words, saved as `docs/reviews/YYYY-MM-DD-design.md`,
with the three ranked changes and their answers to the seven questions.
Phase 3 starts from that list.
