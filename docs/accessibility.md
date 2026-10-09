# Accessibility: WCAG 2.2 AA

Every Level A and AA success criterion of WCAG 2.2, with its status and how
it is met. Four statuses, and none is claimed past its evidence:

- **Met**: a test or a built feature shows it, named in the row.
- **Met by design, to confirm**: built to meet it, not yet confirmed by the
  human audit Phase 7 of [the roadmap](ROADMAP.md) calls for.
- **Not applicable**: the game has nothing the criterion covers.
- **Open**: not yet shown.

The tests named are `tests/e2e/accessibility.spec.ts` (axe at six widths and
over every overlay and the surfaces a fresh page never reaches),
`tests/e2e/wcag.spec.ts` (target size, focus not obscured, the hidden
objective), `tests/e2e/keyboard.spec.ts`, `tests/e2e/responsive-game.spec.ts`
and `tests/e2e/locale.spec.ts`.

Status, 9 October 2026. The human audit has not happened: no screen-reader
user (VoiceOver on iOS, NVDA on Windows) or keyboard-only player has played a
full operation. Their findings are the next work list.

| Criterion | Level | Status | How |
| --- | --- | --- | --- |
| 1.1.1 Non-text Content | A | Met | Icons carry an accessible name or sit beside their words; decorative icons are hidden. axe. |
| 1.2.1–1.2.5 Time-based media | A, AA | Not applicable | No audio or video content. Sound cues are feedback with a text equivalent in the live regions. |
| 1.3.1 Info and Relationships | A | Met | Headings, lists, definition lists, tables on the facilitator sheet, grouped radio-like choices with `aria-pressed`. axe. |
| 1.3.2 Meaningful Sequence | A | Met | DOM order is reading order; the Investigate column stacks reading, actions, reference in that order at every width. |
| 1.3.3 Sensory Characteristics | A | Met | Instructions name controls by their words, never by position or colour. |
| 1.3.4 Orientation | AA | Met | No orientation lock; the sweep covers iPad portrait and landscape. |
| 1.3.5 Identify Input Purpose | AA | Not applicable | No field asks for personal information. |
| 1.4.1 Use of Color | A | Met | Every state is stated in words as well as colour (meter status, a meter's change, the selected plan, a stage). |
| 1.4.2 Audio Control | A | Met | Sound and music each have an off switch in Settings, reachable from every screen; audio starts only after the player begins an operation. |
| 1.4.3 Contrast (Minimum) | AA | Met | axe, including the review's folds and locked milestones once found dimmed below contrast. |
| 1.4.4 Resize Text | AA | Met by design, to confirm | Type is set in rem and the layout reflows; a 200 per cent zoom pass belongs to the human audit. |
| 1.4.5 Images of Text | AA | Met | No images of text; the result image is a download, its content also given as text by Copy result. |
| 1.4.10 Reflow | AA | Met | No horizontal scroll at 320 px (`responsive-game.spec.ts`), also with strings a third longer (`locale.spec.ts`). |
| 1.4.11 Non-text Contrast | AA | Met by design, to confirm | Focus rings, meter bars and switch tracks are drawn against the desk at 3:1; axe checks only part of this. |
| 1.4.12 Text Spacing | AA | Met by design, to confirm | No fixed heights on text containers; an injected-spacing check is not yet automated. |
| 1.4.13 Content on Hover or Focus | AA | Met | No hover-only content; glossary meanings open on activation and stay until closed. |
| 2.1.1 Keyboard | A | Met | Every action has a control; `keyboard.spec.ts` plays through focus moves and shortcuts. |
| 2.1.2 No Keyboard Trap | A | Met | Dialogs trap focus by design and close with Escape. |
| 2.1.4 Character Key Shortcuts | A | Met | Single-key shortcuts can be turned off in Settings and never fire from a field (`keyboard.spec.ts`). |
| 2.2.1 Timing Adjustable | A | Met | Play is turn-based with no time limit; the Bot Commander's run can be paused and handed back. |
| 2.2.2 Pause, Stop, Hide | A | Met | Nothing moves for more than five seconds: the map's active stage pulsed forever and now pulses for four, and the die's roll lasts as long as the roll. Reduced motion removes both. |
| 2.3.1 Three Flashes | A | Met | Nothing flashes. |
| 2.4.1 Bypass Blocks | A | Met | Skip link to the main content. |
| 2.4.2 Page Titled | A | Met | The game and the educator pack each set a title. |
| 2.4.3 Focus Order | A | Met | Focus moves to a replaced panel's heading (`useRecoverFocus`) and to a dialog's own sheet; `keyboard.spec.ts`. |
| 2.4.4 Link Purpose (In Context) | A | Met | Links say where they go; ATT&CK links name the technique ID in their sentence. |
| 2.4.5 Multiple Ways | AA | Not applicable | A single-page game; the educator pack is reached from the field guide. |
| 2.4.6 Headings and Labels | AA | Met | Every section and fold names what it holds. |
| 2.4.7 Focus Visible | AA | Met by design, to confirm | A visible focus style on every control; the human audit confirms it reads on paper and desk. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Met | `wcag.spec.ts` tabs through the assignment, Investigate, the report and the review at 390 and 1280 px. It found focus wrapping to a dialog's first control off screen (the focus trap moves focus without scrolling), now revealed on Tab, and a report option under the pinned "more responses" strip, now kept clear by scroll padding. |
| 2.5.1 Pointer Gestures | A | Met | Every action is a single tap. |
| 2.5.2 Pointer Cancellation | A | Met | Controls act on release (native buttons). |
| 2.5.3 Label in Name | A | Met | Accessible names start with the visible label. axe. |
| 2.5.4 Motion Actuation | A | Not applicable | Nothing responds to device motion. |
| 2.5.7 Dragging Movements | AA | Not applicable | Nothing is dragged; no drag or pointer-move handler exists outside vendored primitives. |
| 2.5.8 Target Size (Minimum) | AA | Met | `wcag.spec.ts`: every target is 24 by 24 px, inline in a sentence, or spaced as the criterion allows. Thumb targets are 40 to 44 px (`responsive-game.spec.ts`). |
| 3.1.1 Language of Page | A | Met | `lang="en"` on the document. |
| 3.1.2 Language of Parts | AA | Met | No passage in another language. |
| 3.2.1 On Focus | A | Met | Focus changes nothing; dialogs that would change state on focus move initial focus to their sheet. |
| 3.2.2 On Input | A | Met | Choosing a reading or a plan changes only that choice; nothing submits on input. |
| 3.2.3 Consistent Navigation | AA | Met | The topbar and the workspace tabs keep their order everywhere. |
| 3.2.4 Consistent Identification | AA | Met | One name per thing, enforced by AGENTS.md (the readouts' names, "Adversary pace"). |
| 3.2.6 Consistent Help | A | Met | The field guide sits in the same place in the topbar on every screen. |
| 3.3.1 Error Identification | A | Met | A bad challenge code or backup is named in words beside the field. |
| 3.3.2 Labels or Instructions | A | Met | Fields have labels; the challenge field says what it takes. |
| 3.3.3 Error Suggestion | AA | Met | An outdated code is named as outdated, a mistyped one says to check each character. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Met | Beginning a new operation over a saved one asks first; restoring a backup now asks once more and says it replaces this device's progress. |
| 3.3.7 Redundant Entry | A | Met | Nothing asks for the same information twice; a challenge code is copied, not retyped. |
| 3.3.8 Accessible Authentication (Minimum) | AA | Not applicable | No sign-in. |
| 4.1.2 Name, Role, Value | A | Met | Native controls, `aria-pressed` on toggles, switches with names. axe. |
| 4.1.3 Status Messages | AA | Met | Polite and assertive live regions announce each turn in the readouts' names, the result of a choice and storage notices; nothing announced names the hidden objective (`wcag.spec.ts`). Announcements are built in `hooks/use-game-session.ts` and are not yet in the message catalogue. |
