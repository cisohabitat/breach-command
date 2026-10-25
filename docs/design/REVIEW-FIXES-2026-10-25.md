# Game review remediation, 25 October 2026

A game review played the build and drove the engine and the save layer
directly. Each finding below was reproduced before it was changed, and each
has a regression in `tests/review-fixes.test.ts` or
`tests/e2e/review-fixes.spec.ts`.

## Progress and fairness

- **Replayed codes paid every time.** A Daily, Weekly or challenge-code
  operation draws its chain and dice from its seed, so after one run a player
  could replay the code to a sure win and collect experience, a cleared case
  and three ladder rungs on every pass (0 → 172 → 344 → 516 XP). The campaign
  now remembers each reproducible operation it has recorded as
  `scenario:seed` (`CampaignState.rehearsed`, the last 200). A replay changes
  nothing and the review says so. The difficulty, mode and specialist do not
  change the chain, so they are not part of the key.
- **Leaving cost nothing.** Only a finished operation was recorded, so a
  player one turn from defeat pressed New incident (or closed an Ironman tab)
  and kept trust, readiness, the streak and their threads, and met the case
  again with a fresh chain. Leaving an operation after its first turn — New
  incident, Start another incident over a save, or Discard — is now recorded
  as a loss to standing (`recordCampaignWithdrawal`: trust −8, readiness −3,
  streak reset, one more unresolved access; no experience, case unchanged).
  Before the first turn nothing hidden has been seen and leaving is free. The
  confirmations say which applies. Ironman keeps no save, so an Ironman
  operation past its first turn leaves `breach-command.ironman-open` until it
  ends; a marker found on the next visit is recorded the same way and
  announced. Two tabs playing Ironman at once can therefore record a
  withdrawal for an operation still in play in the other tab; that case was
  judged rarer than the exploit it closes.
- **A reload re-rolled the die.** The roll resolved at 1,400 ms but the
  operation was saved only when the reveal ended 900 ms later. An unseeded
  campaign turn reloaded in that window drew a new d20. The resolved turn is
  now written, and a result that ended the operation recorded, before the die
  shows its face.
- **Discard was one click.** It now asks, and states whether the campaign
  records a loss.

## Saves and backups

- Restored decision, command-event and sector-decision qualities are held to
  the 0–5 grade the review averages; 1e6 scored 500,037 into the campaign and
  a non-number made the score NaN, which stored the campaign's experience as
  `null` (0 on reload) and left a campaign its own Restore refused. A command
  or sector record must name a known event and choice. The investigation
  window is held within a turn of the difficulty's and map actions to 0–4.
  `recordCampaignResult` also bounds the score it is given.
- The campaign drops duplicate and out-of-range cleared cases. Eleven copies
  of case 0 read as a finished campaign after one operation.
- Recording a result reads the campaign and the personal record from storage
  rather than from the copy read when the tab opened, and other tabs' changes
  to the campaign, record and save slot are followed through `storage` events.
  Two tabs that each finished an operation erased one tab's win. Resume checks
  the save is still the one on the card.
- Parking a newer build's save never replaces a different save already
  parked; the operation in hand is played from memory instead.
- Resume continues on the operation's own last collection plan instead of
  whatever plan the previous operation used.

## Rules (rules version 2)

New operations carry `rulesVersion: 2` (session version 23, challenge codes
`BC13`). Older saves and the version 18 replay keep their rules.

- **Failure protection follows the hidden route.** A failed roll on one of the
  declared reading's own sources added no adversary tempo and no extra
  progress whatever the route, although the code's comment said it depended
  on the hidden route. Declaring whichever reading listed the chosen source
  before every roll earned it on every failure. It now applies when the
  reading matches the route under test, and still reads exactly as an
  ordinary failure.
- **An unprompted revision forfeits the +1.** The +1 is shown before the roll,
  so it stays the declared reading's. A reading changed after a roll that
  failed — no check completed and no stage was confirmed, so nothing new
  prompted it — earns no +1 on the next roll, and the preview says why. A
  revision after a completed check or a confirmed stage is free.
- **A command event owed on a turn that found a stage waits for its decision**
  instead of being skipped for the operation.
- **Service above full lowers starting impact.** Continuity starts at 100 and
  was clamped, so 24 variant bonuses, Common Ground's route perk, readiness 60
  and the tier-three reserve did nothing unless a penalty came first. What
  would rise above full now comes off starting impact. The variant notes are
  composed from each variant's numbers (`variantModifier`) instead of seventy
  authored copies, name the readouts as the screen does ("Service integrity",
  "Adversary progress") and state the rule; saves that refer to an authored
  note read the composed one. Quarter-end pressure, which reduces tolerance
  for disruption, now lowers service.

| Win-rate gain from re-declaring before each roll (Bot Commander, same seeds) | Operational | Crisis |
| --- | --- | --- |
| Before, 3,000 per difficulty | +1.5 | +2.0 |
| Protection on the hidden route only, 1,000 per difficulty | +1.3 | +1.6 |
| Both changes, 1,000 per difficulty | +0.3 | +0.5 |

The remaining difference is within noise, and the swapping commander's
hypothesis score is lower.

## Sector decisions

In all thirty sector decisions the decisive measure had the best net effect
on the four readouts, and in 28 its review quality tied or beat the narrow
measure's; "always take the first" was the answer and the Bot Commander took
it 2,993 times in 2,993. The decisive measure now pays for its larger cuts to
impact and adversary progress with service: its continuity cost rose so that
the decisive and narrow measures trade at the same net effect, and the narrow
measure's review quality matches the decisive one's. `tests/content.test.ts`
holds both. The Bot Commander weighs impact and adversary progress double
once they press (40 or more) and takes the narrow measure on an even trade;
over 1,500 seeded operations it took the decisive measure 413 times and the
narrow one 1,082.

## Balance

`scripts/balance.ts`, 3,000 operations per difficulty, same seeds:

| | Training | Operational | Crisis |
| --- | --- | --- | --- |
| Wins before | 94.1% | 86.4% | 69.2% |
| Wins after | 93.7% | 86.1% | 66.3% |
| Mean score before | 82.7 | 76.0 | 65.1 |
| Mean score after | 82.6 | 75.8 | 63.8 |

Crisis is about three points harder, mostly because failure protection is no
longer granted on the wrong route. Sector-crisis repetition across 3,000
campaigns is 0.8% of operations (0.9% before); the 300-campaign smoke figure
moved from 0 to 1.7 repeats per hundred campaigns, five campaigns, and is
recorded as such. These are assisted bot figures, not human completion rates.
