# Authority under pressure: source-coverage audit

The 16 October 2026 audit keeps every scenario rule intact. The apparent
government-service difficulty spike came largely from the reference bot's
procedure ranking, which rewarded familiar sources even when the public cards
said they could not test its reading at this stage.

## Paired measurements

`pnpm balance` uses 300 fixed seeds per scenario and difficulty at campaign tier
zero. The same rules and seeds were used with the old and corrected bot.

| Bot win rate | Training before → after | Operational before → after | Crisis before → after |
| --- | --- | --- | --- |
| All ten standard incidents, 3,000 each difficulty | 77.1% → 95.9% | 69.1% → 88.9% | 51.0% → 73.7% |
| Government service, 300 each difficulty | 62.3% → 96.7% | 62.3% → 89.7% | 46.0% → 81.7% |

A larger government-service check used seeds `906000`–`906999`, 1,000 operations
per difficulty and policy. Six policies on each bot made 36,000 operations.
The default policy before correction used DNS 1,369 times in Training and never
confirmed a stage with it: none of this scenario's techniques are visible to
DNS. Investigation-window losses were 327, against 37 business-impact losses
and no sector-capacity losses. Reducing sector erosion would address the wrong
constraint.

| Policy | Training before → after | Operational before → after | Crisis before → after |
| --- | --- | --- | --- |
| Default collection and specialist | 60.6% → 97.1% | 60.0% → 90.5% | 45.3% → 80.7% |
| Always balanced collection | 55.2% → 94.2% | 48.8% → 86.9% | 34.4% → 77.3% |
| Always exhaustive collection | 74.3% → 97.8% | 69.1% → 93.2% | 55.4% → 85.1% |
| Always the narrow sector measure | 60.7% → 97.0% | 59.8% → 90.1% | 44.8% → 80.5% |
| Communications specialist | 63.4% → 96.6% | 64.8% → 90.9% | 49.6% → 81.9% |
| Identity specialist | 69.7% → 96.2% | 65.1% → 90.6% | 45.0% → 79.3% |

Each alternate policy changes only the named choice; the remaining decisions
follow the bot. All measured operations terminated within 200 actions. The
corrected default Training policy made only five DNS checks, as broad fallback
collection, and its losses fell to nine window closures and eight impact losses.
Exercise conclusions are separate from wins and losses.

## Policy correction

Before ranking familiarity, focus, fatigue and prior use, restrict the available
procedures to those for which `sourceSeesReading` is true. This is the same
public check used to label a player's cards. It reads the scenario's published
technique pool, the declared reading and completed checks, not the hidden chain.
If no such source is available, retain the original broad-collection ranking
so cooldowns do not leave the practice bot without a move.

The change affects the optional practice bot and simulation reference policy.
It changes no investigation window, roll modifier, source coverage, stage pool,
adversary behaviour, sector pressure, score, saved schema or player-facing rule.
Higher bot win rates reflect better source selection, not reduced difficulty.

## Regression protection and baselines

The regression makes a blind source familiar, checks that available coverage
wins, rewrites the hidden entry while requiring the same public choice, and
checks that broad collection still runs when relevant sources are cooling.
Existing complete-operation simulations check termination across modes.

The legacy version-18 save is untouched. Its language-compatibility replay now
uses a separate action transcript recorded from the old bot before the change,
verified against the original procedure/roll/find sequence. Every existing turn
and sentence assertion remains, plus an ending-status assertion. Migration must
still preserve the original saved English. Changing today's practice policy
must not require it to repeat historical collection mistakes.

The balance smoke baseline and composed-prose fingerprint are deliberately
refreshed: the stronger policy takes different paths through simulated
operations and campaigns. No authored message text changed. Historical figures
in the terminal audit remain labelled with their old policy.

These are bot measurements, principally standard incidents at tier zero. They
do not establish human win rates, equal variant difficulty or that every player
strategy is viable. Record human results separately; no human outcomes or
understanding scores are inferred from these simulations.
