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
