import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { GameSession } from "@/hooks/use-game-session";

export function NewIncidentDialog({ session }: { session: GameSession }) {
  const { newConfirm, setNewConfirm, resetToBriefing } = session;

  return (
    <AlertDialog open={newConfirm} onOpenChange={setNewConfirm}>
      <AlertDialogContent className="game-dialog">
        <AlertDialogHeader><AlertDialogTitle>Leave this investigation?</AlertDialogTitle><AlertDialogDescription>Your current case, turn history and saved session will be cleared.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Keep investigating</AlertDialogCancel><AlertDialogAction onClick={resetToBriefing}>Choose a new incident</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
