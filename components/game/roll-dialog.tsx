import { Dices } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GameSession } from "@/hooks/use-game-session";

export function RollDialog({ session }: { session: GameSession }) {
  const { rolling, die } = session;

  return (
    <Dialog open={rolling} onOpenChange={() => {}}>
      <DialogContent className="roll-dialog" showCloseButton={false} onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()}>
        <DialogHeader><DialogTitle>Running procedure</DialogTitle><DialogDescription>The Incident Captain is resolving evidence and pressure.</DialogDescription></DialogHeader>
        <div className="die rolling"><Dices size={32} /><strong>{die}</strong><span>D20</span></div>
      </DialogContent>
    </Dialog>
  );
}
