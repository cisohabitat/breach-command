# Educator pack

The pack is a page of the game itself, at `/educators`, linked from the field
guide. It is built from the tables the game reads (`lib/educators.ts` for the
session plan's question sets and what each difficulty teaches,
`plainLanguage` for the vocabulary, `difficulties` for the turn counts), so a
handout never disagrees with the screen. It prints on A4 or Letter.

The review's **Print facilitator sheet** prints one operation for a trainer:
the hidden chain with each stage's ATT&CK technique, the turn-by-turn ledger,
the decisions, what might have changed, and the question set that fits the
outcome. It gives the answer away, which the review says beside the button.

To change a question or a difficulty's description, edit `lib/educators.ts`;
both the page and the sheet follow.
