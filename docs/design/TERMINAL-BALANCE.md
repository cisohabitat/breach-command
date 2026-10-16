# Terminal schedule balance

These figures use the bot policy before it prioritised stated source coverage.
They remain a paired measurement of terminal tuning, not current bot win rates.
See [the government-service audit](AUTHORITY-BALANCE.md) for the policy correction
and current reference figures. The terminal rules described here are unchanged.

The terminal was the hardest standard incident in the 15 October 2026 audit.
Schedule exhaustion, rather than the investigation window, caused most of its
losses. Lower routine schedule erosion from 6 to 5 and the surcharge beginning
at turn four from 2 to 1. Keep tempo weight 2, discovery relief 3, failure cost 2,
map-action budgets, investigation windows and all decision costs intact.

## Paired standard-incident measurement

`pnpm balance` uses 300 seeds per scenario and difficulty, beginning at
`900000 + scenario * 1000`, with campaign tier zero and the default specialist.
Run the parent commit and this change on the same seeds.

| Win rate | Training before → after | Operational before → after | Crisis before → after |
| --- | --- | --- | --- |
| All ten scenarios, 3,000 each difficulty | 76.2% → 77.1% | 68.4% → 69.1% | 50.2% → 51.0% |
| Terminal only, 300 each difficulty | 61.7% → 70.0% | 51.3% → 58.7% | 28.0% → 36.0% |

The other nine standard scenarios have identical outcomes. Terminal schedule
losses fall from 96 / 113 / 144 to 62 / 82 / 82. Some operations instead reach
impact, objective or investigation limits; the relief does not guarantee a win.
Authorised exercises remain separate from wins and losses.

## Strategy sensitivity

An additional paired audit used 1,000 terminal seeds (`903000`–`903999`) per
difficulty and policy. Each policy keeps the normal bot except for the stated
override. All operations terminated within 200 actions.

| Policy | Training before → after | Operational before → after | Crisis before → after |
| --- | --- | --- | --- |
| Default bot | 58.5% → 66.8% | 49.8% → 57.4% | 27.2% → 34.4% |
| Always choose the narrow sector measure | 57.7% → 66.6% | 49.8% → 58.0% | 26.0% → 32.7% |
| Deploy the continuity lead | 68.3% → 67.2% | 59.2% → 57.0% | 35.6% → 35.5% |
| Deploy the OT engineer | 64.2% → 70.1% | 55.6% → 61.0% | 31.6% → 38.4% |

On the original rules, forcing balanced collection returned 49.9 / 42.4 / 22.2%
wins. Observing every evidence decision except notifying at continuity 48 or
lower returned 51.4 / 37.4 / 13.2%; this policy traded schedule losses for impact
losses. Neither explains the original gap as simply collecting too exhaustively
or containing too much.

Candidate audits also tried reducing only the late surcharge, removing it, or
reducing only base erosion. The chosen small reduction preserves the port's
distinct late deadline and improves both default and narrow-measure policies.
The continuity specialist's results demonstrate why lower erosion must not be
assumed to improve every policy: visible thresholds change subsequent choices.

## Verification and limits

A deterministic engine test checks that an early failed procedure leaves one
point of schedule margin, that the equivalent fourth-turn procedure closes it,
that additional tempo still costs two points and that Training retains relief.
The regular simulation suite exercises modes and specialists. The balance
command now prints each scenario and rejects unfinished operations.

The CI smoke baseline uses only 60 seeds per scenario plus 300 campaigns, so
its figures differ from the larger measurement. Both its baseline and the
composed-prose fingerprint are refreshed deliberately: changed outcomes alter
later campaign paths and generated readouts without changing authored prose.

These measurements cover bot policies, principally standard incidents at tier
zero. They do not establish equal difficulty across variants, campaign standing,
or human strategies. The terminal remains challenging, especially on Crisis.
Use the human newcomer protocol in `docs/playtests/PROTOCOL.md` before claiming
that Training meets its first-session goal. Do not flatten the other scenarios
or globally extend investigation windows on the strength of this audit.
