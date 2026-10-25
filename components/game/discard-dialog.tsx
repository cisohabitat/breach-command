import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMessages } from "@/hooks/use-messages";
import { discardDialogMessages } from "@/lib/i18n/en/discard-dialog";
import { register } from "@/lib/i18n";

register(discardDialogMessages);

// Discarding a saved operation cannot be undone and, past its first turn, is
// recorded as a loss. It loads with the game bundle, not the assignment screen.
export function DiscardDialog({ open, onOpenChange, turns, onDiscard }: { open: boolean; onOpenChange: (open: boolean) => void; turns: number; onDiscard: () => void }) {
  const { t } = useMessages("discardDialog");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="game-dialog">
        <AlertDialogHeader><AlertDialogTitle>{t("discardTitle")}</AlertDialogTitle><AlertDialogDescription>{turns ? t("discardStarted") : t("discardUnstarted")}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>{t("keepSaved")}</AlertDialogCancel><AlertDialogAction onClick={onDiscard}>{t("confirmDiscard")}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
