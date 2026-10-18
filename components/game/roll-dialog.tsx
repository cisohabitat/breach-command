import { useDieMotion } from "@/hooks/use-die-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GameSession } from "@/hooks/use-game-session";
import { useMessages } from "@/hooks/use-messages";
import { rollDialogMessages } from "@/lib/i18n/en/roll-dialog";
import { register } from "@/lib/i18n";
import { d20Faces } from "@/lib/d20-geometry";

register(rollDialogMessages);

export function RollDialog({ session }: { session: GameSession }) {
  const { t } = useMessages();
  const { rolling, die, dieSettled } = session;
  const shell = useDieMotion(rolling, dieSettled);

  return (
    <Dialog open={rolling} onOpenChange={() => {}}>
      <DialogContent className="roll-dialog" fadeOnly showCloseButton={false} onCloseAutoFocus={event => { if (session.report) event.preventDefault(); }} onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()}>
        <DialogHeader><DialogTitle>{t("rollDialog.runningProcedure")}</DialogTitle><DialogDescription>{t("rollDialog.theIncidentCaptain")}</DialogDescription></DialogHeader>
        <div className={dieSettled ? "die" : "die rolling"}>
          <div className="dice-tray" aria-hidden="true">
            <div className="dice-shadow" />
            <div ref={shell} className="die-shell" aria-hidden="true">
              {d20Faces.map(face => <div key={face.id} className="die-face" style={{ transform: face.transform, background: face.shade }}><span>{((face.id + (dieSettled ? die ?? 20 : 20) - 1) % 20) + 1}</span></div>)}
            </div>
          </div>
          <div className="die-readout"><span>D20</span><strong>{die ?? "—"}</strong></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
