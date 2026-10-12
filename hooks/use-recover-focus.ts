"use client";

import { useEffect, type RefObject } from "react";

// When a blocking panel replaces the control the player just used, the browser
// drops focus to the page body and a keyboard user starts again from the top.
// Bring focus to the panel's heading instead — only when focus was actually
// lost, so a player who has moved somewhere else is never pulled back.
// For an overlay's close: the control that opened it is usually gone by then, so
// focus would fall to the page. When something is waiting for the player — a
// command event, a sector decision, the response or the ending, each marked
// `data-awaiting-heading` — focus goes there instead, and it is brought into view
// because it may have appeared behind the overlay.
// Back on Investigate the next turn starts from the reading and the cards, so
// that is where the page lands, the same place each turn. It once came back
// anywhere from the meters to half-way down the grid. Only the scroll moves.
export function landOnInvestigation(moveFocus = false) {
  const dashboard = document.querySelector<HTMLElement>(".investigation-dashboard");
  if (!dashboard) return false;
  requestAnimationFrame(() => {
    // The workspace tabs stay pinned at the top of the screen, so the landing
    // clears them rather than tucking the reading's heading underneath.
    const tabs = document.querySelector<HTMLElement>(".workspace-tabs");
    const pinned = tabs && getComputedStyle(tabs).position === "sticky" ? tabs.getBoundingClientRect().height : 0;
    // Sixteen pixels leaves the tabs pinned and the compact readouts under them
    // resting in the gap and the panels' top padding.
    const top = dashboard.getBoundingClientRect().top + window.scrollY - pinned - 16;
    window.scrollTo({ top, behavior: "auto" });
    // From a button that sends the player back, focus goes with them to the
    // actions region rather than staying on a control three screens below.
    if (moveFocus) document.querySelector<HTMLElement>(".investigation-actions")?.focus({ preventScroll: true });
  });
  return true;
}

// Where focus goes when the control that held it is gone: into the dialog
// that is open, to whatever is waiting for the player, to the investigation's
// actions, to the next order on Command, or to the operation's title. A
// keyboard-only playthrough found it falling to the page five ways: closing
// the mission brief, recording a hypothesis, closing a report with nothing to
// decide, and choosing a sector decision or a command event.
export function recoverFocus() {
  const dialog = document.querySelector<HTMLElement>("[role=dialog][data-state=open]");
  if (dialog) {
    dialog.focus();
    return;
  }
  const awaiting = document.querySelector<HTMLElement>("[data-awaiting-heading]");
  if (awaiting) {
    awaiting.focus();
    awaiting.scrollIntoView({ block: "center" });
    return;
  }
  if (landOnInvestigation(true)) return;
  const next = document.querySelector<HTMLElement>(".sit-order .sit-link");
  if (next) {
    next.focus();
    return;
  }
  document.querySelector<HTMLElement>(".game-screen h1")?.focus();
}

export function returnFocusToAwaiting(event: Event) {
  event.preventDefault();
  requestAnimationFrame(recoverFocus);
}

// Focus is lost when the control that held it leaves the page or is disabled
// under it. A click on empty space also blurs, but leaves the control in
// place, so the player's own move is never overridden.
export function useFocusSafetyNet() {
  useEffect(() => {
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget) return;
      const lost = event.target as HTMLElement;
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active && active !== document.body) return;
        const gone = !lost.isConnected || (lost as HTMLButtonElement).disabled || lost.getClientRects().length === 0;
        if (gone) recoverFocus();
      });
    };
    document.addEventListener("focusout", onFocusOut);
    return () => document.removeEventListener("focusout", onFocusOut);
  }, []);
}

export function useRecoverFocus(target: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const active = document.activeElement;
    if (active && active !== document.body) return;
    // Behind an open dialog the heading waits: closing the dialog brings focus
    // here. Taking it now left focus outside the dialog while it was open.
    if (document.querySelector("[role=dialog][data-state=open]")) return;
    target.current?.focus();
  }, [target, key]);
}
