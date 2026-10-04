import { useRef } from "react";
import { BarChart3, Contrast, FileDown, FileUp, GraduationCap, Headphones, Keyboard, Maximize2, Vibrate, Volume2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { GameSession } from "@/hooks/use-game-session";

export function SettingsDialog({ session }: { session: GameSession }) {
  const {
    settings, setSettings, soundEnabled, setSoundEnabled, musicEnabled, setMusic,
    hapticsEnabled, setHapticsEnabled, highContrast, setHighContrast, shortcutsEnabled, setShortcutsEnabled, telemetry, clearLocalRecord,
    exportProgress, importProgress, backupInput, setBackupInput, backupMessage, restartTutorial,
  } = session;
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
        <DialogHeader><div className="eyebrow">Game settings</div><DialogTitle>Command interface</DialogTitle><DialogDescription>Adjust feedback, accessibility and display behaviour. Preferences stay on this device.</DialogDescription></DialogHeader>
        <div className="settings-list">
          <label htmlFor="sound-setting"><span><Volume2 size={19} /><b>Sound cues</b><small>Procedural audio for discoveries, warnings and outcomes.</small></span><Switch id="sound-setting" checked={soundEnabled} onCheckedChange={setSoundEnabled} /></label>
          <label htmlFor="music-setting"><span><Headphones size={19} /><b>Adaptive score</b><small>Sector-specific command ambience intensifies as operational pressure rises.</small></span><Switch id="music-setting" checked={musicEnabled} onCheckedChange={setMusic} /></label>
          <label htmlFor="haptic-setting"><span><Vibrate size={19} /><b>Haptic feedback</b><small>Short vibration cues on supported mobile devices.</small></span><Switch id="haptic-setting" checked={hapticsEnabled} onCheckedChange={setHapticsEnabled} /></label>
          <label htmlFor="contrast-setting"><span><Contrast size={19} /><b>High contrast</b><small>Strengthens borders, text and interactive states.</small></span><Switch id="contrast-setting" checked={highContrast} onCheckedChange={setHighContrast} /></label>
          <label htmlFor="shortcut-setting"><span><Keyboard size={19} /><b>Keyboard shortcuts</b><small>F field guide · M mute · G guided reflection. Turn off if you use speech input.</small></span><Switch id="shortcut-setting" checked={shortcutsEnabled} onCheckedChange={setShortcutsEnabled} /></label>
        </div>
        <section className="local-telemetry"><div><BarChart3 size={18} /><span><b>Local balance record</b><small>Stored only on this device. No gameplay data is transmitted.</small></span></div><p><strong>{telemetry.operationsStarted}</strong> starts <strong>{telemetry.operationsFinished}</strong> completed <strong>{telemetry.wins}</strong> wins <strong>{telemetry.losses}</strong> losses <strong>{telemetry.exercises}</strong> exercises <strong>{telemetry.turns}</strong> turns</p><button onClick={clearLocalRecord}>Clear local record</button></section>
        <section className="backup-console"><div><span><b>Portable local backup</b><small>Copy campaign progress and the current non-Ironman operation between devices.</small></span><button onClick={exportProgress}><FileDown size={16} /> Export</button></div><textarea aria-label="Progress backup" value={backupInput} onChange={event => setBackupInput(event.target.value)} placeholder="Export a backup, or paste one here to restore it." /><button className="secondary-button full" onClick={importProgress} disabled={!backupInput.trim()}><FileUp size={16} /> Restore backup</button>{backupMessage && <p aria-live="polite">{backupMessage}</p>}</section>
        <button className="secondary-button full" onClick={restartTutorial}><GraduationCap size={17} /> Restart command tutorial</button>
        <button className="secondary-button full" onClick={() => { const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); Promise.resolve(action).catch(() => {}); }}><Maximize2 size={17} /> Toggle full screen</button>
      </DialogContent>
    </Dialog>
  );
}
