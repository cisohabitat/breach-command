# Saved-session corpus

One saved operation from each `SESSION_VERSION` since 10, each written by the
code of its own era: the last commit at that version played the same opening
(Healthcare, Operational, two turns, a revision between them) with its own
engine and serialised it with its own `serialiseSession`. `tests/saves.test.ts`
asserts that every one still migrates, keeps its turns and plays on to an
ending in today's engine.

When `SESSION_VERSION` moves, add the save the outgoing version writes before
the change lands: check out the last commit at that version, run the opening in
`tests/saves.test.ts`'s header comment against it, and save the output here as
`session-vN.json`. A migration bug is otherwise found by a player.

`../full/full-v18.json` is a whole operation, not an opening: the Bot
Commander's campaign operation on the telecoms case from seed 1, with injects,
an adaptation, map actions, comparisons, a command event and a crisis, saved
by version 18 with the setup that reproduces it. `tests/full-save.test.ts`
plays the same seed with today's engine and requires every sentence it stores
to read as version 18's did, and the old save to migrate and read as it did.
It was made when version 19 moved what the engine writes into messages; make
another the same way when the stored text changes shape again.
