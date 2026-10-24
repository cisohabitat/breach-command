# Art brief: the next sets

A brief for an agent (or an illustrator) adding artwork to Breach Command.
It covers four sets of new images and one change to how the existing ones
are served. Each set says what to draw, the files to produce, where they go
in the code, and how to prove nothing else moved. Read `AGENTS.md` first,
then `docs/design/ART-DIRECTION.md`, then look at every file in
`public/art/`: the new work has to sit beside it as one set.

Nothing here changes the rules, the scores or the words of the game. The
images are decorative: the text beside each one carries the meaning, every
image has empty alt text, and a missing image leaves an empty space, never
a broken game.

## The house style

Match the existing images in `public/art/`. In short:

- **Medium:** charcoal ink line and hatching on warm bone paper, like an
  etching or a careful pen drawing. Monochrome: charcoal, greys and the
  bone of the paper. The ending scenes allow subdued natural light (a
  window, a lamp) and nothing brighter.
- **No hue that means something.** The game's colours are state: warning
  amber, danger coral, adversary plum and the four stage colours. None of
  them may appear in an image, even as a small accent.
- **No writing.** No letters, numbers, logos, screen text, signage or
  labels anywhere in a picture, including on monitors, folders and paper.
  Screens show abstract shapes or nothing; paper shows ruled lines or blank.
- **Fictional and generic.** No real organisation, product, brand, logo,
  place, landmark or person. No recognisable device models.
- **No answers.** A picture must never show or hint at an attack technique,
  a tool, or which route the intruder took. It shows a setting or an
  object, never what happened there.
- **No faces on adversaries.** The intruders are never people in pictures.
- **Composition:** one clear subject, plenty of quiet paper, no busy edges.
  The images are often shown cropped (see each set), so keep the subject
  near the middle.

## Files

- Format: WebP, quality about 80, sRGB, no transparency unless stated.
- Produce each image at the size given, plus a half-size copy for phones
  where the set says so (named `<name>-480.webp`). Downscale from a larger
  original; do not upscale.
- Keep each file within the budget given. Full-resolution originals do not
  go in the repository.
- Names are lower-case, the ids given below, exactly.

## Set 1: evidence still lifes (8 images)

Historical brief: this set was delivered and later replaced by the twelve
finding miniatures in `public/art/findings/`. The unused still-life files were
removed in 0.10.6; the source/sector mapping remains in `lib/art.ts`. The
production report uses the miniature sizes in their README.

When a check confirms a stage, the Captain's Report shows a small still life
of the kind of source that found it, beside the finding (`.discovery` in
`components/game/captain-report-dialog.tsx`). Four exist (`email`,
`identity`, `maintenance`, `telemetry` in `public/art/evidence/`), so most
checks fall back to "telemetry". Add one for each remaining check, so the
picture matches the check the player ran.

Size 480 × 320, under 45 KB each, shown at 88 × 64 (56 × 48 on phones), so
the subject must read when small.

| File | The check (`procedures` in `lib/game.ts`) | Draw |
| --- | --- | --- |
| `network.webp` | Network analysis | A network switch with patch cables, seen close, one cable traced off frame |
| `firewall.webp` | Firewall review | A rack-mounted appliance and a printed rule list with blank ruled lines, a pen across it |
| `dns.webp` | DNS review | A card index drawer, cards standing up, one pulled half out |
| `server.webp` | Server inspection | An open server chassis on a bench, a torch beside it |
| `cloud.webp` | Cloud audit | A laptop on a desk at night, the screen an abstract grid of tiles, no text |
| `forensic.webp` | Forensic triage | A drive in an evidence bag with a blank tag, a write blocker and a cable |
| `intel.webp` | Intelligence correlation | Two folders open side by side, photographs and blank notes, a thread pinned between them |
| `hunt.webp` | Targeted threat hunt | A desk lamp over a single printed page with a magnifier on it, everything else in shadow |

Wiring: replace the inline choice in `captain-report-dialog.tsx` (the
`report.procedure === "email" ? ...` expression) with a function in
`components/game/story-art.tsx`, `evidenceArtFor(procedure: string,
scenario: number)`, that returns the procedure's own picture when one
exists. As now, `server` and `endpoint` checks in a sector where
`runsOperationalTechnology(scenario)` is true show `maintenance`;
otherwise `endpoint` keeps `telemetry`, and so does a sector's own action
(the ids in `sectorProcedures`, `lib/game.ts`). Never choose by the
technique revealed: only by the check that was run and the sector.

## Set 2: adversary emblems (8 images)

The after-action review names the adversary profile the player faced and
its habit (the "Adversary intent" block in
`components/game/debrief-dialog.tsx`), in text only. Give each profile an
emblem: a calling card, never a face or a figure.

Size 256 × 256, under 15 KB each, shown at about 48 × 48 beside the
profile's name. The emblem is drawn in the same ink on bone and must read
at that size: one object, bold shapes, little hatching.

| File | Profile (`adversaryProfiles`, `lib/engine/content.ts`) | Its habit | Draw |
| --- | --- | --- | --- |
| `ghost.webp` | Glass Viper | Avoids examined sources; favours identity and cloud | A coiled serpent drawn as if in clear glass, seen through |
| `raider.webp` | Red Quarry | Pushes fast when the response hesitates | A miner's pick driven into a stone block (ink only, no red) |
| `broker.webp` | Black Relay | Hides in supplier and shared-service trust | A relay baton passed between two gloved hands, cut off at the wrists |
| `ledger.webp` | Cipher Ledger | Approval paths and transactions | A closed ledger with a combination dial on its cover |
| `sentinel.webp` | Silent Meridian | Maps dependencies, waits | A surveyor's theodolite on a tripod, alone |
| `lantern.webp` | Grey Lantern | Settles where nobody watches | A shuttered lantern, a thin line of light at the shutter |
| `choir.webp` | Hollow Choir | Spreads activity so each finding looks unrelated | A row of empty choir stalls, one hymn board blank |
| `ember.webp` | Ember Shift | Moves when the service is strained | A banked fire, a single ember glowing grey-white |

Files go in `public/art/adversaries/`. Wiring: add `"adversaries"` to the
`kind` of `StoryArt` (or a small `AdversaryEmblem` component beside
`SpecialistPortrait`), and show it in the debrief's adversary block keyed by
`game.adversaryProfile`. Its CSS goes in `components/game/game.css`.

## Set 3: campaign conclusions (4 images)

When all ten cases are cleared, the assignment screen shows the campaign's
conclusion (`.campaign-ending` in `components/game/briefing-screen.tsx`), in
text only, the one story beat without art. The acts and the single-
operation endings already have scenes.

Size 960 × 480 with a 480 × 240 phone copy, under 110 KB (35 KB for the
copy), shown full width, cropped to 180 px high (120 px on phones).

| File | Conclusion (`campaignEndings`, `lib/campaign.ts`) | Draw |
| --- | --- | --- |
| `resilience.webp` | Collective resilience | A long table after a meeting, many chairs pushed back, morning light, cups left behind |
| `foothold.webp` | The quiet foothold | An empty corridor at night, every door closed, one door ajar with darkness behind it |
| `fractured.webp` | Operational victory, fractured trust | Two desks back to back across a gap, a crack in the floor running between them |
| `stability.webp` | Guarded stability | A window at dusk, blinds half drawn, a filing cabinet locked, a plant on the sill |

Files go in `public/art/campaign/` beside the acts, named `ending-<id>.webp`
(for example `ending-resilience.webp`). Wiring: `campaignEnding()` in
`lib/campaign.ts` returns `{ title, detail }`; add the ending's `id` to what
it returns, and show `<StoryArt kind="campaign" name={`ending-${id}`} />` in
the `.campaign-ending` section. Its CSS goes in `app/globals.css`, because
the assignment screen shows it.

## Set 4: phone copies of the existing scenes (no new drawing)

Every image is served at full size, even where a phone shows a 120 px
strip: the ten sector scenes are about 1.4 MB together, and a 480 px copy
of each is about 0.33 MB. Make a half-size copy of every sector, act and
ending scene (`<name>-480.webp`) from the existing file, and serve it with
`srcset` and `sizes` on the `<img>` in `components/game/sector-illustration.tsx`
and `components/game/story-art.tsx`, so a phone fetches the small one.

While an image loads, its frame shows the background of
`.sector-illustration` (`var(--lime)`, the bone accent), a bright block on
the dark desk. Use the desk's own dark tone instead, and fade the image in
over `--motion-short` once loaded (none under reduced motion).

## Set 5, optional: the sector scene on the share image

The result image players save (`lib/share-image.ts`, drawn on a canvas) is
text only. Drawing the operation's sector scene into it, muted behind or
beside the result, would make a shared result recognisable. The card must
still never name a technique (`tests/replay.test.ts` and
`tests/e2e/share.spec.ts` check this), and the drawing must wait for the
image to load or skip it if it fails.

## Rules for the code

- Plain `<img>` elements with `width`, `height`, `alt=""`, `loading="lazy"`
  and `decoding="async"`, as `story-art.tsx` does now. Not `next/image`: it
  adds script the game's budget has no room for, and does nothing here
  because the images are served as they are.
- CSS for anything the assignment screen shows goes in `app/globals.css`;
  for the game's own screens and dialogs, in `components/game/game.css`.
  One declaration per line, in the files' existing format, and
  `node scripts/css-consolidate.ts <sheet>` must report nothing to merge.
- The service worker keeps each image once it has been seen; do not add
  images to its precache.
- No image may carry state or meaning the text does not also give.

## Checks before it ships

Run, and keep green:

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`.
- `pnpm build`, then the browser suites against it:
  `PLAYWRIGHT_BASE_URL=http://localhost:3200 pnpm exec playwright test`
  with `pnpm start -p 3200` running. The performance spec holds the script
  and style budgets and the layout shift; the first-paint spec fails if a
  rule in the game's sheet reaches the assignment screen.
- Visual baselines change on purpose here. Run the **Record visual
  baselines** workflow on the branch, review every changed image, and bring
  in only the ones the art changed
  (`git checkout origin/ci/visual-baselines -- <paths>`). See
  `docs/RELEASING.md`.
- Look at each new image in place at 320, 390, 820 and 1280 px wide.

Then follow the release convention in `docs/RELEASING.md`: raise the
version in `package.json`, add a `CHANGELOG.md` entry, add a dated section
to `docs/design/ART-DIRECTION.md` describing the set, and update the
artwork paragraph at the end of `AGENTS.md`.
