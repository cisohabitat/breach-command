"use client";

import Link from "next/link";
import { BookOpen, RotateCcw, Settings2, Shield, Terminal, X } from "lucide-react";
import { ActionSheet } from "@/components/game/action-sheet";
import { BriefingScreen } from "@/components/game/briefing-screen";
import { CaptainReportDialog } from "@/components/game/captain-report-dialog";
import { DebriefDialog } from "@/components/game/debrief-dialog";
import { FieldGuideDialog } from "@/components/game/field-guide-dialog";
import { GameScreen } from "@/components/game/game-screen";
import { MissionBriefingDialog } from "@/components/game/mission-briefing-dialog";
import { NewIncidentDialog } from "@/components/game/new-incident-dialog";
import { RollDialog } from "@/components/game/roll-dialog";
import { SettingsDialog } from "@/components/game/settings-dialog";
import { useGameSession } from "@/hooks/use-game-session";

export default function Home() {
  const session = useGameSession();
  const { game, ended, highContrast, announcement, criticalAnnouncement, storageNotice, rolling, setRules, setSettings, setNewConfirm, setStorageNotice, resetToBriefing } = session;

  return (
    <div className={`app-shell ${highContrast ? "high-contrast" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">{criticalAnnouncement}</div>
      {storageNotice && (
        <div className="storage-notice" role="status">
          {/* Each notice says what happened to which data in its own words; a fixed
              heading claimed an unreadable save and a reset campaign for all of them. */}
          <strong>Saved data</strong>
          <span>{storageNotice}</span>
          <button onClick={() => setStorageNotice("")} aria-label="Dismiss storage notice"><X size={16} /></button>
        </div>
      )}
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Breach Command home">
          <span className="brand-mark"><Shield size={24} /></span>
          <span>BREACH<span className="brand-light">COMMAND</span></span>
        </Link>
        <div className="top-actions">
          <span className="solo-label"><Terminal size={14} /> SINGLE PLAYER</span>
          <button className="quiet-button" onClick={() => setRules(true)} aria-label="Field guide"><BookOpen size={17} /><span>Field guide</span></button>
          <button className="quiet-button" onClick={() => setSettings(true)} aria-label="Game settings"><Settings2 size={17} /><span>Settings</span></button>
          {game && <button className="quiet-button" disabled={rolling} onClick={() => ended ? resetToBriefing() : setNewConfirm(true)} aria-label="New incident"><RotateCcw size={16} /><span>New incident</span></button>}
        </div>
      </header>

      {!game ? <BriefingScreen session={session} /> : <GameScreen session={session} />}

      <ActionSheet session={session} />
      <RollDialog session={session} />
      <MissionBriefingDialog session={session} />
      <CaptainReportDialog session={session} />
      <FieldGuideDialog session={session} />
      <DebriefDialog session={session} />
      <SettingsDialog session={session} />
      <NewIncidentDialog session={session} />
    </div>
  );
}
