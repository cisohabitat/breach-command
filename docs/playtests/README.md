# Run a newcomer round

Status: ready to run; no human results have been collected in this pack.

Use five people who have never seen the game and have no security or IT
administration background. Include at least two phone users and two laptop
users. The remaining session can use either. A bot or AI review cannot replace
these sessions. The person arranging the round supplies the participants and
an observer; this pack does not recruit or contact anyone.

1. Verify the intended tested build is actually deployed at
   https://breach-command.vercel.app. Record the build shown in Settings'
   diagnostics; do not infer deployment from a merged pull request.
2. Copy [the results template](TEMPLATE.md) to a dated round file only when
   sessions are being recorded. Keep anonymous tester numbers and blank cells
   until observed. Arrange a practitioner to mark understanding answers.
3. Use a fresh browser profile for each tester. Follow [the protocol](PROTOCOL.md)
   exactly, leaving game and audio defaults alone unless the tester changes
   them. Record the scenario, difficulty and mode they actually play.
4. Read the opening script, start the timer and observe without coaching.
   Record questions, pauses, misreadings and the actual ending. A loss can
   still be a completed operation; abandonment is different.
5. Ask the original three understanding questions and change request first.
   Then ask the supplemental signal, confidence and voice questions. This keeps
   existing first-session scores comparable and avoids teaching the labels
   before the unassisted session.
6. Compare observer times with the local first-operation record in Settings.
   Save genuine observations and rank findings by severity and how many testers
   encountered them. Do not convert bot win rates into human results.

The supplemental checks look for these specific problems:

- Treating strong signal as proof of the entire causal explanation.
- Treating strong confidence in an empty finding as proof that no incident exists.
- Treating exhaustive collection as independent corroboration.
- Missing the evidence comparison or misreading its supported/disputed state.
- Captain commentary interrupting reading, arriving after it is useful, or
  failing to play. Distinguish automatic speech from Listen and urgent warnings.

Use the protocol's existing first-session targets across two rounds. Report
supplemental questions separately, including how many people were asked and
whether they encountered the feature naturally. Five sessions are a pilot,
not evidence that every scenario or difficulty is balanced. Compare scenarios
with a separate controlled round after the first-session problems are understood.

Keep the [signal and confidence model](../design/SIGNAL-CONFIDENCE.md) and
[terminal simulation review](../design/TERMINAL-BALANCE.md) available to the
observer. Do not show their answer rubrics during the unassisted session.
