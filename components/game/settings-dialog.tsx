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
import { CaptainVoiceTest } from "./captain-voice-lazy";

register(settingsDialogMessages);

export function SettingsDialog({ session }: { session: GameSession }) {
  const {
    settings, setSettings, soundEnabled, setSoundEnabled, musicEnabled, setMusic, voiceEnabled, setVoiceEnabled,
    hapticsEnabled, setHapticsEnabled, highContrast, setHighContrast, shortcutsEnabled, setShortcutsEnabled, telemetry, clearLocalRecord,
    exportProgress, importProgress, backupInput, setBackupInput, backupMessage, restartTutorial,
    fastResolve, setFastResolve, reflectionEnabled, setReflectionEnabled,
  } = session;
  // Restoring replaces progress, so it asks once more and says what it replaces (WCAG 3.3.4).
  const [confirmRestore, setConfirmRestore] = useState(false);
  const { t, rich, say, locale } = useMessages("settingsDialog");
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
        <DialogHeader><DialogTitle>{t("shell.settings")}</DialogTitle><DialogDescription>{t("adjustFeedbackAccessibility")}</DialogDescription></DialogHeader>
        <div className="settings-list">
          <label htmlFor="sound-setting"><span><b>{t("soundCues")}</b><small>{t("proceduralAudioFor")}</small></span><Switch id="sound-setting" checked={soundEnabled} onCheckedChange={setSoundEnabled} /></label>
          <label htmlFor="music-setting"><span><b>{t("adaptiveScore")}</b><small>{t("sectorSpecificCommand")}</small></span><Switch id="music-setting" checked={musicEnabled} onCheckedChange={setMusic} /></label>
          <label htmlFor="voice-setting"><span><b>{t("captainVoice")}</b><small>{t("voicePilot")}</small></span><Switch id="voice-setting" checked={voiceEnabled} onCheckedChange={setVoiceEnabled} /></label>
          {settings && voiceEnabled && <CaptainVoiceTest />}
          <label htmlFor="haptic-setting"><span><b>{t("hapticFeedback")}</b><small>{t("shortVibrationCues")}</small></span><Switch id="haptic-setting" checked={hapticsEnabled} onCheckedChange={setHapticsEnabled} /></label>
          <label htmlFor="contrast-setting"><span><b>{t("highContrast")}</b><small>{t("strengthensBordersText")}</small></span><Switch id="contrast-setting" checked={highContrast} onCheckedChange={setHighContrast} /></label>
          <label htmlFor="shortcut-setting"><span><b>{t("keyboardShortcuts")}</b><small>{t("fOpensThe")}</small></span><Switch id="shortcut-setting" checked={shortcutsEnabled} onCheckedChange={setShortcutsEnabled} /></label>
          <label htmlFor="resolution-setting"><span><b>{t("fastResolution")}</b><small>{t("routineInline")}</small></span><Switch id="resolution-setting" checked={fastResolve} onCheckedChange={setFastResolve} /></label>
          <label htmlFor="reflection-setting"><span><b>{t("confidenceReflection")}</b><small>{t("reflectionOptional")}</small></span><Switch id="reflection-setting" checked={reflectionEnabled} onCheckedChange={setReflectionEnabled} /></label>
        </div>
        <a className="secondary-button full" href={`/practice?locale=${locale}`} target="_blank" rel="noopener noreferrer">{t("practiceDesk")}</a>
        <section className="local-telemetry"><div><span><b>{t("localBalanceRecord")}</b><small>{t("storedOnlyOn")}</small></span></div><p>{rich("strongStrongStarts", { operationsStarted: telemetry.operationsStarted, operationsFinished: telemetry.operationsFinished, wins: telemetry.wins, losses: telemetry.losses, exercises: telemetry.exercises, turns: telemetry.turns, revisions: telemetry.revisions }, { strong: chunk => <strong>{chunk}</strong> })}</p><ul className="first-session" aria-label={t("firstOperationOn")}>{describeFirstSession(telemetry).map((line, index) => <li key={index}>{say(line)}</li>)}</ul><button onClick={clearLocalRecord}>{t("clearLocalRecord")}</button></section>
        <section className="backup-console"><div><span><b>{t("portableLocalBackup")}</b><small>{t("copyCampaignProgress")}</small></span><button className="text-action" onClick={exportProgress}>{t("export")}</button></div><textarea aria-label={t("progressBackup")} value={backupInput} onChange={event => { setBackupInput(event.target.value); setConfirmRestore(false); }} placeholder={t("exportBackupOr")} />{confirmRestore
          ? <div className="restore-confirm" role="group" aria-label={t("confirmRestore")}><p>{t("restoringReplacesThis")}</p><button className="secondary-button full" onClick={() => { setConfirmRestore(false); importProgress(); }}><FileUp size={16} />{t("replaceThisDevice")}</button><button className="text-action" onClick={() => setConfirmRestore(false)}>{t("cancel")}</button></div>
          : <button className="secondary-button full" onClick={() => setConfirmRestore(true)} disabled={!backupInput.trim()}><FileUp size={16} />{t("restoreBackup")}</button>}{backupMessage && <p aria-live="polite">{say(backupMessage)}</p>}</section>
        {/* For a bug report: the build, the browser and the storage state, shown
            before it is copied, with nothing personal and nothing played. */}
        <section className="backup-console diagnostics-console"><div><span><b>{t("settings.diagnostics")}</b><small>{t("settings.diagnosticsNote")}</small></span><button className="text-action" onClick={copyDiagnostics}>{t("settings.copyDiagnostics")}</button></div>{diagnostics && <textarea readOnly aria-label={t("settings.diagnostics")} value={diagnostics} onFocus={event => event.currentTarget.select()} />}{diagnosticsMessage && <p aria-live="polite">{diagnosticsMessage}</p>}</section>
        <button className="secondary-button full" onClick={restartTutorial}><GraduationCap size={17} />{t("restartCommandTutorial")}</button>
        <button className="secondary-button full" onClick={() => { const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); Promise.resolve(action).catch(() => {}); }}><Maximize2 size={17} />{t("toggleFullScreen")}</button>
      </DialogContent>
    </Dialog>
  );
}
