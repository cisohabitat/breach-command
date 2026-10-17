import { useDieMotion } from "@/hooks/use-die-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GameSession } from "@/hooks/use-game-session";
import { useMessages } from "@/hooks/use-messages";
import { rollDialogMessages } from "@/lib/i18n/en/roll-dialog";
import { register } from "@/lib/i18n";

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
          <div ref={shell} className="die-shell" aria-hidden="true">
            <svg viewBox="0 0 200 200" width="160" height="160" display="block" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M100 6 181 52V148L100 194 19 148V52Z" fill="#ede2c90a" />
              <path d="M100 44 48 135H152Z" fill="#ede2c916" />
              <path d="M100 6V44L19 52M100 44 181 52 152 135 181 148M152 135 100 194 48 135 19 148M48 135 19 52" opacity=".65" />
            </svg>
          </div>
          <strong>{die ?? "—"}</strong><span>D20</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
