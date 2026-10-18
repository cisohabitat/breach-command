# Art direction

D20 tray (18 October 2026, preview approved): a regular twenty-face bone die
throws and bounces within a recessed charcoal tray, with fixed studio shading
and a soft contact shadow. The front face agrees with the separate readable
result at settlement. Motion is decorative choreography, never a physical
randomizer; preserve the existing roll/reveal timings and reduced-motion path.

Unavailable controls (18 October 2026, user approved): keep names, descriptions,
costs and reasons at readable contrast. Mute decorative icons and use dashed
rules instead of reducing the opacity of an entire button or text-bearing
child. Keep cooldown words and the remaining duration visible together on
phones. Preserve native disabled states, source order and all availability
rules; selected or recorded facts retain their existing labels and markers.

Infrastructure and workspace polish (18 October 2026, user approved): use
distinct circle, eye, shield-off and checked-circle icons beside explicit
unassessed, monitored, isolated and restored labels. Collection counts have
their own line; a collection location does not prove compromise. Technique
count does not confirm trust relationships. Give each connection endpoint its
own line, with blocked/unassessed words and markers. Keep blocked text at full
contrast. Reuse section title/metadata hierarchy across the three workspaces
and plus/minus markers on reference folds. At landscape widths above 650 px
and heights up to 700 px, reduce empty spacing without concealing content.

Dice and report polish (17 October 2026, user approved): use a faceted d20
illustration in bone ink instead of a rounded dice box. Its decorative shell
tumbles for the approved 1,400 ms; the upright number remains readable and the
actual result stays still for 900 ms. Reduced motion uses a static pending die
and a static result. Roll and report surfaces fade without zoom; prepare the
report during the roll and let its focus trap own the handoff. The procedure
just used receives a two-second neutral inset outline on returning from its
report, with a static outline under reduced motion. This marks the past action,
never a preferred next action. Compact, distinct source illustrations accompany
confirmed findings, keeping the existing frame sizes and full written record.

Fullscreen title (17 October 2026, user approved): use the supplied portrait or landscape poster to cover the dynamic viewport, accepting edge cropping rather than letterboxing. Keep the entry button and release/build metadata anchored inside safe areas. Preserve the approved desktop and iPad crops. The approved tall-phone refinement uses a dedicated taller adaptation at ratios up to 3:5, with extra sky and terrace to keep the complete logo visible.

State colour (15 October 2026, user approved): keep the charcoal-and-bone
foundation, adding muted blue for selected evidence and untested connections,
teal for supported comparisons and strong confidence, and amber for weak
confidence or disputed links. Signal strength stays neutral: a strong signal
does not establish confidence. Connection words and solid/dashed/dotted strokes
remain. Stable continuity is teal, degraded continuity amber, and at-risk
continuity coral, using the existing labelled thresholds. Paper documents use
dark blue, teal and amber inks rather than desk pastels. These state uses extend
the earlier hue rule. Decorative art and sector accents remain unchanged.

Linked evidence and source reviews (15 October 2026): use ruled
connections with explicit supported, disputed, untested or no-causal-link words.
Solid, dashed and dotted strokes supplement those words; no status relies on
colour. Stack connections vertically on phones and keep the full comparison
explanation readable. Existing specialist portraits accompany source reviews
at 36 px with complete name and role text. They imply expertise, never a new
game bonus. Keep the Captain for command narration and reuse the original art.

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
| Hue | Selection blue, supported teal, warning amber, danger coral, adversary plum and four stage colours | User-approved evidence states extend the palette; colour supplements labels and never suggests a hidden answer. |
| Sectors | Differ by name, scene and copy, never by hue | Ten accent colours read as a theme picker. |
| Faces | IBM Plex Sans Condensed (self-hosted) for titles and figures; the system face for prose | Every wrap and fold measurement was taken against the system face. |
| Panels | Flat: rules and hairlines, corners of 2 to 4 px, no glow, gradient or grid | Cards in cards, glows and grids were each named as template tells. |
| Icons | Functional Lucide controls, plus original charcoal-and-bone artwork for procedures, evidence sources and specialist roles | The user requested all three art sets on 15 October 2026. Compact object silhouettes support recognition beside complete text labels; they do not decorate every heading or use state colours. |

Captain reports lead with the result and stage facts. The response index is a
list of underlined entries on the form, naming every option and navigating to
its full costs without committing a choice. Keep the existing lettered response
rows and the footer that exposes off-screen choices. Roll, plan and turn-effect
detail uses a native disclosure; each new report starts closed. The finding,
current reading assessment, signal/confidence labels, causal-limit warning,
decision pressure and exact option costs remain visible. Keep voice captions
and Listen beside the finding rather than inside a fold. In reports only, the
long confidence basis opens on request; findings elsewhere retain their full
assessment text. Failed checks say that nothing was ruled out and show ready
sources from the public reading coverage, with no source guidance in Expert.

Progressive learning keeps the same form language: the current stage question
heads the reading, and evidence responses retain their letter, short tradeoff
and exact costs. Native disclosure markers remain visible. Each longer rationale is a sibling disclosure, so
reading it never records a choice. A resolved response leads its report with
actual meter directions and exact changes. Training introduces the optional
theory form and comparison controls when the record makes them useful; the
reference material remains available. See [the roadmap](INFORMATION-LOAD.md).

## Type system

Two faces and three weights, with a 16 px body and a 1.25 heading scale.
Captions use 14 px and metadata 12 px rather than continuing the scale below
body size: essential supporting text and mobile pressure labels were too small.

| Style | Face and weight | Used for |
| --- | --- | --- |
| Title | Form face, 500 or 600, 20 px and up | Screen, document, section and fold titles |
| Figure | Form face, 500, tabular | Rolls, counts, meters, case and turn numbers |
| Label | System face, 600, 14 px or 12 px | Field labels, kickers, a table's captions |
| Body | System face, 400, 16 px; 14 px for supporting copy, 600 for a stressed word | Prose, options, the record |

Neutral text uses shared heading (`--text-heading`), body (`--text-body`) and
secondary (`--text-soft`) roles instead of subtly different grays on each panel.
Paper documents and the attack-chain sheet override them with dark inks.
State colours keep their existing meanings; do not colour ordinary prose as
a warning or assessment. Keep both CSS bundles consistent so idle loading
never changes the assignment screen's appearance.

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

The Captain speaks across all ten cases, with an opening grounded in each
published briefing. Its 51 recordings also cover findings, unsuccessful checks,
low-confidence leads, new reports, service pressure and stabilisation,
containment, assurance, recovery and three closing assessments.
Speech and captions use the same catalogue text.
Each beat speaks once per operation, with Listen and Skip voice controls. It is
on by default and independent of sound cues and music; M silences all three.
Explicit saved Off settings remain off. Bundled neural male British English
recordings replace device speech: a calm, measured Captain at 0.94 speed, with
consistent volume and no radio distortion. No live TTS service is needed.
An unavailable recording
leaves the complete text. Speech takes the mix while it plays, quieting both
music and cues, and stops on dismissal, mute, navigation or a hidden tab.
The male voice and measured delivery were approved during the first-case pilot.
Each distinct update speaks once automatically; repeat checks can be replayed
with Listen. Cues depend on public evidence and outcomes, never hidden answers.
Newly recorded evidence choices receive a short tradeoff acknowledgement, once
per decision rather than once per cue type. Response captions reflect only the
chosen option's published residual risk; they keep Listen while the next choice
is pending. Recovery and loss retain closing commentary. Historical choices do
not replay on resume. The 65 recordings preserve the approved voice and delivery.
Routine narration waits for 1.5 seconds without pointer, keyboard or wheel input,
leaves a gap after another line, and waits while an evidence or response decision
is pending. Listen remains available during those decisions. A public pressure
threshold crossing takes precedence over finding milestones and speaks after
300 ms, as does a loss; these urgent lines may interrupt routine speech.
Dismissal, Skip, mute and hiding the tab cancel queued speech too. A queued line
is only marked heard when playback is attempted.
Opening a finished operation's review adds three spoken segments: its actual
grade or loss cause, one supported strength, and a coaching point tied to the
record. The sequence uses one media element, keeps the mix quiet throughout,
and cancels in full on skip, mute, closing the review or hiding the tab.
The complete transcript stays readable; replay repeats the whole debrief.
It speaks once automatically per operation and is omitted from printed reports.

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
folder. Each is cached for offline play once it has been shown.

## Investigation hierarchy, 17 October 2026

Lead with the current task, then the available analytical actions, then reference
material. A quiet margin rule identifies the task prompt; a filled bone action
is reserved for the already-available theory/comparison step. Procedure names
are stronger than descriptions and related status labels share a wrapping line.
Do not rank procedures by hidden state or remove source costs and caveats.

Keep field-kit procedure, evidence and specialist miniatures at 28 px. Report
evidence pictures keep their authored 3:2 proportions; portrait frames remain
square and use the common decorative-image load/failure handling. A confirmed
report finding leads the response index with a distinct heading. Preserve the
index's first-screen visibility, every response and its exact effects, supporting
disclosures and the keyboard-safe report footer. Existing semantic state colours
and high-contrast overrides still apply.

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
WebP files are local and lazy loaded. The service worker keeps each one once it has been seen, rather than fetching 2.4 MB of them on a first visit.
Portraits share the charcoal-and-bone style; ending scenes include subdued natural
light to distinguish time of day, without using the game's warning colours.

## Source, adversary and conclusion artwork, 12 October 2026

The requested `ART-BRIEF.md` adds eight evidence-source still lifes, eight
object-only adversary emblems and four campaign conclusions. All use charcoal
linework on warm bone, with blank records and no state colours, brands or
attack clues. Evidence art follows the procedure and sector alone; server and
endpoint checks in operational-technology sectors retain the maintenance scene.
Adversary emblems appear only in the after-action review, beside intent whose
meaning is already stated in text. Campaign conclusions retain their complete
text before a cropped scene, 180 px high or 120 px on phones.

Every sector, act and ending scene has a 480 px WebP copy. Responsive image
attributes select the appropriate local asset without an image service. Frames
reserve their space on the dark desk; an image fades in over `--motion-short`
after loading, with no transition under reduced motion. Cached images that
arrived before hydration are also shown. A failed image remains an empty frame.
Artwork continues to be cached only after it is seen, never precached.

The optional result-card scene is included: its case id comes from the same
share card as the counts, and the sector setting is drawn at ten per cent
opacity behind the header. Loading has a deadline; an unavailable scene leaves
the complete original text form. No hidden technique reaches the image.
Generated originals remain outside the repository in `generated_images`;
only downscaled, budgeted WebP assets are committed.

## Field-kit icon art, 15 October 2026

The user requested procedure icons, evidence-source miniatures and specialist
emblems together. One original transparent atlas holds 12 procedure symbols
(the eleven shared sources and a paired-ledger reconciliation for sector checks),
six specialist-role emblems, and six neutral source objects. It follows the
existing charcoal-and-bone etching style. The larger portraits and evidence
illustrations remain, with compact emblems alongside the specialist names.

The procedure list and its action sheet share the same symbol. Source miniatures
use the completed finding's collection-source id, including a generic record
for partner disclosures; they never read the hidden technique. Art is decorative
and its adjacent labels remain complete. CSS reserves each frame, so failed
downloads leave the text and controls usable. The local WebP atlas is fetched
once when needed, cached by the existing service worker, and hidden in print.

## Evidence clarity, 18 October 2026

The user approved clearer attack-chain states, evidence comparisons and review
hierarchy. The first unconfirmed stage carries an arrow, “Investigating now”,
an outline and `aria-current="step"`; confirmed stages carry checks and other
unknown stages carry a neutral dash. These marks read confirmed findings only.
No current-stage mark remains after investigation ends. Keep stage hues and the
charcoal/bone palette; labels and shapes must work without colour.

Comparison endpoints show collection source, finding and separate signal and
confidence axes. The connector retains its tested or untested status and stroke
pattern; collection order never supplies causal direction. The after-action
review brings a compact milestone timeline ahead of detailed scoring, with the
finding's response and a disclosure of its recorded effects. The full check log remains folded with
its readings, plans and exact changes. Records without timestamps stay in the
decisions section; no chronology is invented. These are presentation changes,
with no balance or save-schema change.
