"use client";

import Link from "next/link";
import { BookOpen, RotateCcw, Settings2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMessages, textFor } from "@/hooks/use-messages";
import { BriefingScreen } from "@/components/game/briefing-screen";
import { FaultBoundary } from "@/components/game/fault-boundary";
import { useGameSession } from "@/hooks/use-game-session";
import { pageMessages } from "@/lib/i18n/en/page";
import { register } from "@/lib/i18n";

register(pageMessages);

// The assignment screen is all a first visit needs. The game screen and every
// dialog load on demand, so the script parsed before the page answers is the
// slip, the engine and the framework rather than the whole game. Each is
// warmed once the browser is idle, which makes its first opening immediate and
// puts its script in the offline cache, since the service worker keeps every
// same-origin script it sees.
const parts = {
  game: () => import("@/components/game/game-screen"),
  actionSheet: () => import("@/components/game/action-sheet"),
  roll: () => import("@/components/game/roll-dialog"),
  brief: () => import("@/components/game/mission-briefing-dialog"),
  report: () => import("@/components/game/captain-report-dialog"),
  guide: () => import("@/components/game/field-guide-dialog"),
  debrief: () => import("@/components/game/debrief-dialog"),
  settings: () => import("@/components/game/settings-dialog"),
  newIncident: () => import("@/components/game/new-incident-dialog"),
};
// While the game screen's script arrives the page keeps a main landmark and says
// what it is doing, rather than showing nothing between the click and the case.
const GameScreen = dynamic(() => parts.game().then(m => m.GameScreen), {
  ssr: false,
  loading: () => <main className="game-screen game-loading" id="main-content" aria-busy="true"><h1>{textFor("page.openingTheOperation")}</h1></main>,
});
const ActionSheet = dynamic(() => parts.actionSheet().then(m => m.ActionSheet), { ssr: false });
const RollDialog = dynamic(() => parts.roll().then(m => m.RollDialog), { ssr: false });
const MissionBriefingDialog = dynamic(() => parts.brief().then(m => m.MissionBriefingDialog), { ssr: false });
const CaptainReportDialog = dynamic(() => parts.report().then(m => m.CaptainReportDialog), { ssr: false });
const FieldGuideDialog = dynamic(() => parts.guide().then(m => m.FieldGuideDialog), { ssr: false });
const DebriefDialog = dynamic(() => parts.debrief().then(m => m.DebriefDialog), { ssr: false });
const SettingsDialog = dynamic(() => parts.settings().then(m => m.SettingsDialog), { ssr: false });
const NewIncidentDialog = dynamic(() => parts.newIncident().then(m => m.NewIncidentDialog), { ssr: false });

// Mounted from the first time it opens and kept after, so a dialog closes with
// its own focus return and exit rather than vanishing with the component.
function useOpened(open: boolean) {
  const [opened, setOpened] = useState(open);
  // Set during render, as React allows for state derived from a prop: an effect
  // would mount the dialog a render late.
  if (open && !opened) setOpened(true);
  return opened || open;
}

export default function Home() {
  const session = useGameSession();
  const { t } = useMessages();
  const { game, ended, highContrast, announcement, criticalAnnouncement, storageNotice, rolling, setRules, setSettings, setNewConfirm, setStorageNotice, resetToBriefing } = session;
  const show = {
    actionSheet: useOpened(!!session.selected),
    roll: useOpened(rolling),
    brief: useOpened(session.missionBriefing),
    report: useOpened(!!session.report),
    guide: useOpened(session.rules),
    debrief: useOpened(session.debrief),
    settings: useOpened(session.settings),
    newIncident: useOpened(session.newConfirm),
  };
  useEffect(() => {
    const warm = () => Object.values(parts).forEach(load => load().catch(() => {}));
    const idle = (window as Window & { requestIdleCallback?: (callback: () => void) => number }).requestIdleCallback;
    if (idle) idle(warm);
    else window.setTimeout(warm, 1500);
  }, []);

  // A dialog's focus trap moves focus without scrolling when Tab wraps from its
  // last control to its first, which left the focused control off screen in a
  // long report or review (WCAG 2.4.11). Scrolling to the nearest edge does
  // nothing when it is already in view, and scroll padding keeps it clear of a
  // pinned foot.
  // Only focus that follows Tab is revealed: a dialog's own initial focus keeps
  // its opening scroll, or the review opened part-way down its first page.
  useEffect(() => {
    let tabbedAt = 0;
    const key = (event: KeyboardEvent) => { if (event.key === "Tab") tabbedAt = Date.now(); };
    const reveal = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (Date.now() - tabbedAt < 400 && target?.closest?.("[role=dialog]")) target.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    document.addEventListener("keydown", key, true);
    document.addEventListener("focusin", reveal);
    return () => {
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("focusin", reveal);
    };
  }, []);

  return (
    <div className={`app-shell ${highContrast ? "high-contrast" : ""}`}>
      <a className="skip-link" href="#main-content">{t("shell.skip")}</a>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">{criticalAnnouncement}</div>
      {storageNotice && (
        <div className="storage-notice" role="status">
          {/* Each notice says what happened to which data in its own words; a fixed
              heading claimed an unreadable save and a reset campaign for all of them. */}
          <strong>{t("page.savedData")}</strong>
          <span>{storageNotice}</span>
          <button onClick={() => setStorageNotice("")} aria-label={t("shell.dismissStorage")}><X size={16} /></button>
        </div>
      )}
      <header className="topbar">
        <Link href="/" className="brand" aria-label={t("shell.home")}>
          <span className="brand-name">{t("gameScreen.breachCommand")}</span><span className="brand-light">{t("shell.desk")}</span>
        </Link>
        <div className="top-actions">
          <button className="quiet-button" onClick={() => setRules(true)} aria-label={t("shell.fieldGuide")}><BookOpen size={17} /><span>{t("shell.fieldGuide")}</span></button>
          <button className="quiet-button" onClick={() => setSettings(true)} aria-label={t("shell.settingsLabel")}><Settings2 size={17} /><span>{t("shell.settings")}</span></button>
          {game && <button className="quiet-button" disabled={rolling} onClick={() => ended ? resetToBriefing() : setNewConfirm(true)} aria-label={t("shell.newIncident")}><RotateCcw size={16} /><span>{t("shell.newIncident")}</span></button>}
        </div>
      </header>

      <FaultBoundary name="game screen">{!game ? <BriefingScreen session={session} /> : <GameScreen session={session} />}</FaultBoundary>

      {show.actionSheet && <FaultBoundary name="action sheet" onReset={() => session.setSelected(null)}><ActionSheet session={session} /></FaultBoundary>}
      {show.roll && <FaultBoundary name="roll"><RollDialog session={session} /></FaultBoundary>}
      {show.brief && <FaultBoundary name="mission brief" onReset={() => session.setMissionBriefing(false)}><MissionBriefingDialog session={session} /></FaultBoundary>}
      {show.report && <FaultBoundary name="Captain's Report"><CaptainReportDialog session={session} /></FaultBoundary>}
      {show.guide && <FaultBoundary name="field guide" onReset={() => setRules(false)}><FieldGuideDialog session={session} /></FaultBoundary>}
      {show.debrief && <FaultBoundary name="after-action review" onReset={() => session.setDebrief(false)}><DebriefDialog session={session} /></FaultBoundary>}
      {show.settings && <FaultBoundary name="settings" onReset={() => setSettings(false)}><SettingsDialog session={session} /></FaultBoundary>}
      {show.newIncident && <FaultBoundary name="new incident confirmation" onReset={() => setNewConfirm(false)}><NewIncidentDialog session={session} /></FaultBoundary>}
    </div>
  );
}
