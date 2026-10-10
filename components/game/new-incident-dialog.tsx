import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { GameSession } from "@/hooks/use-game-session";
import { useMessages } from "@/hooks/use-messages";
import { newIncidentDialogMessages } from "@/lib/i18n/en/new-incident-dialog";
import { register } from "@/lib/i18n";

register(newIncidentDialogMessages);

export function NewIncidentDialog({ session }: { session: GameSession }) {
  const { t } = useMessages();
  const { newConfirm, setNewConfirm, resetToBriefing } = session;

  return (
    <AlertDialog open={newConfirm} onOpenChange={setNewConfirm}>
      <AlertDialogContent className="game-dialog">
        <AlertDialogHeader><AlertDialogTitle>{t("newIncidentDialog.leaveThisInvestigation")}</AlertDialogTitle><AlertDialogDescription>{t("newIncidentDialog.yourCurrentCase")}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>{t("newIncidentDialog.keepInvestigating")}</AlertDialogCancel><AlertDialogAction onClick={resetToBriefing}>{t("newIncidentDialog.chooseNewIncident")}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
