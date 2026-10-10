import { useRef, useState } from "react";
import { FileUp, GraduationCap, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { GameSession } from "@/hooks/use-game-session";
import { describeFirstSession } from "@/lib/telemetry";
import { collectDiagnostics } from "@/lib/diagnostics";
import { useMessages } from "@/hooks/use-messages";
import { settingsDialogMessages } from "@/lib/i18n/en/settings-dialog";
import { register } from "@/lib/i18n";

register(settingsDialogMessages);

export function SettingsDialog({ session }: { session: GameSession }) {
  const {
    settings, setSettings, soundEnabled, setSoundEnabled, musicEnabled, setMusic,
    hapticsEnabled, setHapticsEnabled, highContrast, setHighContrast, shortcutsEnabled, setShortcutsEnabled, telemetry, clearLocalRecord,
    exportProgress, importProgress, backupInput, setBackupInput, backupMessage, restartTutorial,
  } = session;
  // Restoring replaces progress, so it asks once more and says what it replaces (WCAG 3.3.4).
  const [confirmRestore, setConfirmRestore] = useState(false);
  const { t, rich } = useMessages();
  const [diagnostics, setDiagnostics] = useState("");
  const [diagnosticsMessage, setDiagnosticsMessage] = useState("");
  const copyDiagnostics = () => {
    const text = collectDiagnostics();
    setDiagnostics(text);
    if (!navigator.clipboard?.writeText) return setDiagnosticsMessage(t("settings.diagnosticsManual"));
    navigator.clipboard.writeText(text).then(() => setDiagnosticsMessage(t("settings.diagnosticsCopied")), () => setDiagnosticsMessage(t("settings.diagnosticsManual")));
  };
  const content = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={settings} onOpenChange={setSettings}>
      <DialogContent
        ref={content}
        className="game-dialog settings-dialog"
        // The first tabbable control is the sound switch, so the dialog's own
        // autofocus would let Space — the key that scrolls a dialog — turn it off.
        onOpenAutoFocus={event => { event.preventDefault(); content.current?.focus(); }}
      >
        <DialogHeader><DialogTitle>{t("shell.settings")}</DialogTitle><DialogDescription>{t("settingsDialog.adjustFeedbackAccessibility")}</DialogDescription></DialogHeader>
        <div className="settings-list">
          <label htmlFor="sound-setting"><span><b>{t("settingsDialog.soundCues")}</b><small>{t("settingsDialog.proceduralAudioFor")}</small></span><Switch id="sound-setting" checked={soundEnabled} onCheckedChange={setSoundEnabled} /></label>
          <label htmlFor="music-setting"><span><b>{t("settingsDialog.adaptiveScore")}</b><small>{t("settingsDialog.sectorSpecificCommand")}</small></span><Switch id="music-setting" checked={musicEnabled} onCheckedChange={setMusic} /></label>
          <label htmlFor="haptic-setting"><span><b>{t("settingsDialog.hapticFeedback")}</b><small>{t("settingsDialog.shortVibrationCues")}</small></span><Switch id="haptic-setting" checked={hapticsEnabled} onCheckedChange={setHapticsEnabled} /></label>
          <label htmlFor="contrast-setting"><span><b>{t("settingsDialog.highContrast")}</b><small>{t("settingsDialog.strengthensBordersText")}</small></span><Switch id="contrast-setting" checked={highContrast} onCheckedChange={setHighContrast} /></label>
          <label htmlFor="shortcut-setting"><span><b>{t("settingsDialog.keyboardShortcuts")}</b><small>{t("settingsDialog.fOpensThe")}</small></span><Switch id="shortcut-setting" checked={shortcutsEnabled} onCheckedChange={setShortcutsEnabled} /></label>
        </div>
        <section className="local-telemetry"><div><span><b>{t("settingsDialog.localBalanceRecord")}</b><small>{t("settingsDialog.storedOnlyOn")}</small></span></div><p>{rich("settingsDialog.strongStrongStarts", { operationsStarted: telemetry.operationsStarted, operationsFinished: telemetry.operationsFinished, wins: telemetry.wins, losses: telemetry.losses, exercises: telemetry.exercises, turns: telemetry.turns, revisions: telemetry.revisions }, { strong: chunk => <strong>{chunk}</strong> })}</p><ul className="first-session" aria-label={t("settingsDialog.firstOperationOn")}>{describeFirstSession(telemetry).map(line => <li key={line}>{line}</li>)}</ul><button onClick={clearLocalRecord}>{t("settingsDialog.clearLocalRecord")}</button></section>
        <section className="backup-console"><div><span><b>{t("settingsDialog.portableLocalBackup")}</b><small>{t("settingsDialog.copyCampaignProgress")}</small></span><button className="text-action" onClick={exportProgress}>{t("settingsDialog.export")}</button></div><textarea aria-label={t("settingsDialog.progressBackup")} value={backupInput} onChange={event => { setBackupInput(event.target.value); setConfirmRestore(false); }} placeholder={t("settingsDialog.exportBackupOr")} />{confirmRestore
          ? <div className="restore-confirm" role="group" aria-label={t("settingsDialog.confirmRestore")}><p>{t("settingsDialog.restoringReplacesThis")}</p><button className="secondary-button full" onClick={() => { setConfirmRestore(false); importProgress(); }}><FileUp size={16} />{t("settingsDialog.replaceThisDevice")}</button><button className="text-action" onClick={() => setConfirmRestore(false)}>{t("settingsDialog.cancel")}</button></div>
          : <button className="secondary-button full" onClick={() => setConfirmRestore(true)} disabled={!backupInput.trim()}><FileUp size={16} />{t("settingsDialog.restoreBackup")}</button>}{backupMessage && <p aria-live="polite">{backupMessage}</p>}</section>
        {/* For a bug report: the build, the browser and the storage state, shown
            before it is copied, with nothing personal and nothing played. */}
        <section className="backup-console diagnostics-console"><div><span><b>{t("settings.diagnostics")}</b><small>{t("settings.diagnosticsNote")}</small></span><button className="text-action" onClick={copyDiagnostics}>{t("settings.copyDiagnostics")}</button></div>{diagnostics && <textarea readOnly aria-label={t("settings.diagnostics")} value={diagnostics} onFocus={event => event.currentTarget.select()} />}{diagnosticsMessage && <p aria-live="polite">{diagnosticsMessage}</p>}</section>
        <button className="secondary-button full" onClick={restartTutorial}><GraduationCap size={17} />{t("settingsDialog.restartCommandTutorial")}</button>
        <button className="secondary-button full" onClick={() => { const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); Promise.resolve(action).catch(() => {}); }}><Maximize2 size={17} />{t("settingsDialog.toggleFullScreen")}</button>
      </DialogContent>
    </Dialog>
  );
}
