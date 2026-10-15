# Newcomer playtest protocol

The first-session bar in `docs/ROADMAP.md` is measured with people, not with
the Bot Commander and not with AI reviewers. This is the script every round
follows, so rounds can be compared.

## Who qualifies

- No security background: has never worked in, studied or trained for
  security operations, incident response or IT administration.
- Has not seen Breach Command, its screenshots or this repository.
- Comfortable using a phone or a laptop; no other gaming experience needed.

Five testers a round. At least two play on a phone and two on a laptop.
Record the device, browser and screen size for each.

## Before the session

1. Open the production build on a fresh profile or a private window, so the
   device holds no campaign, settings or first-session record.
   Record the build shown in diagnostics and whether it matches the intended
   tested release; a merge alone does not verify the deployed build.
2. Settings: leave everything at its default. Do not switch on fast
   resolution, guided reflection or high contrast unless the tester asks.
3. Start a timer when the tester first sees the assignment screen.

## What the tester is told

Read this, and nothing else:

> This is a game about investigating a cyber incident. Play one operation
> from start to finish. Think aloud if you can: say what you are looking at
> and why you choose what you choose. I will not help, but I will take notes.
> If you are completely stuck for two minutes, say so and I will note it.

Do not explain the rules, the vocabulary or the interface. Do not point.
If the tester asks a question, answer "What do you think it means?" and note
the question word for word.

## What the observer records

During play, in the results template (`TEMPLATE.md`):

- Time to first procedure (from the assignment screen to the first roll).
- Time to the first revision of a reading, if any.
- Whether the operation finished, and how (won, lost and to what, exercise).
- Total time.
- Every question the tester asked, word for word.
- Every place the tester was stuck for more than thirty seconds, with what
  was on screen.
- Anything the tester misread aloud (for example, reading a later-stage find
  as proof of their reading).
- Whether signal and confidence were encountered, and how the tester used
  them. Record a feature they never reached as not observed, not a failure.
- Voice events that helped or interrupted reading: the caption, what was
  happening, whether playback was automatic or requested with Listen, and
  whether the tester used Skip or mute. Note inaudible or blocked playback.
  These observations judge pacing; use automated tests for millisecond timing.

After the operation ends, from Settings, copy the local record's first
operation lines into the template. They should agree with the observer's
times to within a few seconds; a disagreement is itself a finding.

## The three questions

Ask these after the operation, in this order, and write down the answers
word for word:

1. "In your own words, what is a working hypothesis in this game?"
2. "When you ran a check and it found nothing, what did that tell you?"
3. "What ended the operation?" (or, if it was won, "What did you do that
   worked?")

Then: "If you could change one thing, what would it be?"

## Supplemental signal, confidence and voice questions

Ask these only after the three original questions and the change request.
Keep their answers and marks separate from the original understanding score,
so earlier rounds remain comparable. Do not explain the labels first.

1. "What did signal and confidence each tell you?"
2. Show the labels "Strong signal / Weak confidence" and "Weak signal /
   Strong confidence". For each: "What would you conclude from this finding,
   and what would you do next?"
3. "What, if anything, could strengthen a finding's confidence?"
4. "When did the Captain help you, interrupt you, or arrive too late?"

Mark question 1 accepted when signal refers to a finding establishing an attack
stage and confidence refers to support for its causal interpretation. Mark
question 2 accepted when both readings preserve that distinction: a confirmed
stage can have a weak interpretation, and a well-supported empty finding does
not confirm a stage or clear the whole incident. Mark question 3 accepted when
the answer gives either supported comparison across different sources or
exhaustive collection within that source's coverage; exhaustive collection is
not independent corroboration. A failed roll provides neither kind of finding.
Do not require exact vocabulary. See `docs/design/SIGNAL-CONFIDENCE.md`.

Record whether the tester encountered the feature naturally before these
prompts. A post-session label exercise cannot stand in for finding and using
the feature during play. Voice comments have no correctness grade; distinguish
routine commentary, urgent warnings and explicit Listen, whose timing differs.

## Scoring a round

A practitioner (someone who has run incident response) marks each answer
to the three questions as accepted or not accepted. An answer is accepted
when it names the idea, in any words:

1. A reading is a guess about how the intruder got through this stage, which
   the player tests and revises.
2. A check that completes and finds nothing rules out what that source could
   have seen; a failed roll rules out nothing.
3. Names the actual ending (the meter, the window, or the response), or for
   a win names testing the reading or revising it.

The round's figures:

- Completion: testers who finished the operation, out of five.
- Understanding: testers with all three answers accepted, out of five.
- Median time to first procedure, phone and laptop separately.
- Supplemental understanding: accepted / asked for each of the three signal
  and confidence questions, with natural exposure reported separately.
- Voice: testers with observed playback, testers reporting an interruption,
  and testers with no observed playback. Include the event notes; five testers
  do not establish a population rate or a timing regression.

The first-session bar is met when two consecutive rounds total 7 of 10 on
completion and 8 of 10 on understanding, with median time to first
procedure under four minutes on a phone.

## After the round

1. Save the filled template as `docs/playtests/YYYY-MM-DD-round-N.md`.
   Use anonymous tester numbers. Leave the template blank until people have
   played; bot or agent runs never count as human observations.
2. List the fixes it calls for, ranked by how many testers hit each.
3. Fix, deploy, and run the next round with five new testers. A tester never
   plays twice: the second time they are no longer a newcomer.

## Returning-player variant

For Phase 5's return measures: a tester who has played at least three
operations returns after a week, on the same device, and is asked to "carry
on". Record what they notice first, whether they find what changed, and how
many operations they play before stopping.
