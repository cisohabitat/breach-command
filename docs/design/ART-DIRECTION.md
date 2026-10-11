# Art direction

This records the decisions the game's look rests on, so the designer Phase 3
of [the roadmap](../ROADMAP.md) calls for starts from what is decided and why,
rather than from the screens. Every entry is open to that designer. A decision
they change is changed here first, with the reason, and then in `AGENTS.md`'s
visual paragraph.

Status, 9 October 2026: drafted from the record by an agent. Nothing here has
yet been decided by a human designer.

## Decided, with the reason

| Question | Current answer | Why |
| --- | --- | --- |
| Ground | A dark desk, with paper for documents | Paper everywhere was tried; two cold reviews read cream, ink and a condensed face as generated-page house style, and the documents were lost against a page of the same paper. |
| Accent | One, bone (`--lime`, `#ede2c9`) | A replacement must match its luminance or the accent's text falls below AA. |
| Hue | Warning amber, danger coral, adversary plum, four stage colours, nothing else | Colour carries state; a hue used for decoration reads as state. |
| Sectors | Differ by name, scene and copy, never by hue | Ten accent colours read as a theme picker. |
| Faces | IBM Plex Sans Condensed (self-hosted) for titles and figures; the system face for prose | Every wrap and fold measurement was taken against the system face. |
| Panels | Flat: rules and hairlines, corners of 2 to 4 px, no glow, gradient or grid | Cards in cards, glows and grids were each named as template tells. |
| Icons | Only where they carry information: warnings, topbar links, close and copy, a link's arrow | An icon on every heading was the strongest remaining tell. The topbar keeps icons with words beside them, and hides the words below 431 px. |

## Type system

Two faces, three weights, one scale (`--type-*`, a 1.25 ratio from 16 px).

| Style | Face and weight | Used for |
| --- | --- | --- |
| Title | Form face, 500 or 600, 20 px and up | Screen, document, section and fold titles |
| Figure | Form face, 500, tabular | Rolls, counts, meters, case and turn numbers |
| Label | System face, 600, 12.8 px or 10.24 px | Field labels, kickers, a table's captions |
| Body | System face, 400, 16 px or 12.8 px, 600 for a stressed word | Prose, options, the record |

Nothing renders heavier than 600: the browser's bold on `strong` and `b` was a
third weight in each face, and the 700 face is no longer shipped.
`tests/e2e/type-styles.spec.ts` counts every distinct face, size and weight on
the assignment, Investigate and the review (15, 17 and 18 today, from 16, 20
and 21) and fails if a screen gains one. Still the designer's call: whether
titles take one weight (500 and 600 both appear at 20 px), and whether labels
at 500 and 600 become one.

## Motion vocabulary

Defined once in `:root` and used by every animation:

| Token | Value | Moves |
| --- | --- | --- |
| `--ease-arrive` | `cubic-bezier(.16,1,.3,1)` | Something arriving: a report, a result, an option |
| `--ease-settle` | `cubic-bezier(.33,0,.2,1)` | Something settling: a loss, a meter bar |
| `--motion-instant` | 0.18 s | Hover and press |
| `--motion-short` | 0.25 s | An option or phase appearing |
| `--motion-base` | 0.36 s | A document or result arriving, a stage confirmed |
| `--motion-long` | 0.68 s | A lost operation settling |
| `--motion-readout` | 0.9 s | A meter crossing into a band |
| `--motion-float` | 1.15 s | A meter's change floating off |

Under reduced motion every movement is removed and every state stays: a
crossing is still outlined, a change still stated in words.

## Sound palette

Procedural, in `lib/feedback.ts`, through one context and one limiter. One
voice per event class:

| Cue | Event |
| --- | --- |
| `open` | An operation begins |
| `success` | A check completed and found no stage |
| `find` | A check confirmed a stage |
| `failure` | A check failed on the roll, or a comparison was called wrong |
| `warning` | The situation escalates, or a decision costs the most |
| `decision` | A choice is recorded |
| `complete` | An operation won |
| `lost` | An operation lost |

The adaptive score under play follows tension and the sector. Sound is on by
default, and silence is one switch away in Settings; nothing in the game
depends on hearing a cue.

## Open for the designer

- Whether the paper documents need an edge or a shadow to read as objects on
  the desk.
- The sector artefact the roadmap asks for: one recognisable thing a player can
  name with the text hidden (a letterhead strip, a form variant, a line
  drawing of the scene), without giving sectors a hue.
- The landing page's pitch column: a sample redacted chain, a sample case
  file, or the slip alone.
- The title and label weights above.
- Whether a commissioned sound palette replaces the procedural one.

## Sector illustrations, 11 October 2026

The user requested original illustrations for all ten sectors after reviewing
the game. The set uses charcoal ink and warm bone paper, with settings rather
than attack clues. Each illustration appears as a compact crop on the assignment
and at its full ratio inside the mission brief's folded operation context. The
first-move instructions and command button keep their existing positions.

Assets are precompressed 960 × 640 WebP files in `public/art/sectors`, named
after scenario IDs. They are decorative (`alt=""`): the adjacent title, sector
and briefing provide all meaningful information. Full-resolution generated
originals are retained separately in the workspace's `sector-illustrations`
folder. All ten web assets are cached for offline sector selection.

## Characters and story artwork, 11 October 2026

The user requested all four proposed additions: six fictional specialist
portraits, four generic evidence-source still lifes, three campaign-act scenes,
and three operation-ending scenes. Portraits accompany names in the roster and
mission brief. Campaign scenes sit beside each act's narrative. Source artifacts
appear only with a revealed finding, chosen by the actual procedure and sector,
never by a hidden technique. Their blank records are decorative, not evidence.
Ending scenes follow the outcome and review button: recovery for a win, an
unfinished desk for a loss, and training materials for an exercise.

Each image has empty alt text because neighbouring game text carries the meaning.
WebP files are local, lazy loaded, and optionally precached for offline use.
Portraits share the charcoal-and-bone style; ending scenes include subdued natural
light to distinguish time of day, without using the game's warning colours.
