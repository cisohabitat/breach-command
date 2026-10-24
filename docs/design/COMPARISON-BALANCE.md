# Comparison-record audit, 24 October 2026

The game review reproduced a free-action exploit: two correctly assessed
empty-finding pairs reduced impact from 5 to 0 and actor progress from 11 to 0
without spending a turn. New operations grant relief only for an explicit
initiating-record link between independent sources, with at least one finding
not already rewarded. Correctly withholding a causal claim pays nothing.
Unsupported claims retain their existing penalties. Sector erosion, windows,
d20 draws, response scores and collection costs remain unchanged.

## Paired simulations

Both versions used the fixed seeds, tier-zero command and all ten standard
incidents from `scripts/balance.ts`. The reference Bot's investigation uses
public evidence; command, sector and response choices still use internal
quality/score metadata. These figures are assisted simulations, not human
completion rates or a public-only benchmark. The current Bot selects useful
explicit record links; the previous Bot compared stage/route patterns and
also received relief for no-link pairs. Policy and reward rules both change.

| Win rate | Training | Operational | Crisis |
| --- | --- | --- | --- |
| Before, 3,000 operations per difficulty | 94.9% | 88.1% | 72.1% |
| After, 3,000 operations per difficulty | 94.1% | 86.4% | 69.2% |
| Before, 30,000 operations per difficulty | 95.5% | 88.6% | 71.7% |
| After, 30,000 operations per difficulty | 94.7% | 86.7% | 69.0% |

All simulated operations terminate. Default-run mean scores move from
83.8 / 77.7 / 67.9 to 83.1 / 76.7 / 66.8. The larger sample confirms the
modest aggregate decrease, strongest at Crisis. Per-sector differences are
reported by the command; no pressure retuning conceals the removed relief.
The deliberate smoke baseline refresh retains the three-point tolerance.
Its 600-per-difficulty wins are 93.2% / 83.8% / 66.7%, scores
82.0 / 75.3 / 66.0; act repetition is 0% for commands, injects and crises.

## Compatibility and verification

Session 21 preserves new public provenance, the comparison-model marker and
actual clamped comparison deltas. BC11 separates the changed rules from BC10;
the setup and d20 draw algorithm is unchanged. Older saved operations retain
their original rules and wording; the complete v18 historical replay still
requires its original actions, rolls, ending and sentences.

The composed-prose corpus changes from 405,778 to 402,994 outputs as comparison
and Bot paths change. The state-reader calls move from 6,815 to 6,767, while
campaign-ending reviews move from 249 to 252. Reviewed differences include
changed Bot intents, end-state meters, score rows and counterfactuals from
those paths. The old historical wording regression remains independent of
today's Bot policy. New deterministic tests separately cover causal proof,
empty-pair farming, reward novelty at the cap, source independence, validation,
save round trips and response-score consistency. Browser regressions cover
record text, exact zero-effect feedback, final-decision previews and debrief
ranking across the three engines.

Typed component message prefixes reduce repeated identifiers in five panels
to accommodate these features within unchanged script budgets. Their expanded
keys, shared full keys, locale outputs and rich-text tags remain audited;
saved message identifiers are unchanged.
