import { Dices } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GameSession } from "@/hooks/use-game-session";
import { useMessages } from "@/hooks/use-messages";
import { rollDialogMessages } from "@/lib/i18n/en/roll-dialog";
import { register } from "@/lib/i18n";

register(rollDialogMessages);

export function RollDialog({ session }: { session: GameSession }) {
  const { t } = useMessages();
  const { rolling, die } = session;

  return (
    <Dialog open={rolling} onOpenChange={() => {}}>
      <DialogContent className="roll-dialog" showCloseButton={false} onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()}>
        <DialogHeader><DialogTitle>{t("rollDialog.runningProcedure")}</DialogTitle><DialogDescription>{t("rollDialog.theIncidentCaptain")}</DialogDescription></DialogHeader>
        <div className="die rolling"><Dices size={32} /><strong>{die}</strong><span>D20</span></div>
      </DialogContent>
    </Dialog>
  );
}
