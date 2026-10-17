import { catalogue } from "../catalogue.ts";

// The strings of components/game/command-event.tsx (app/page.tsx for page), loaded with it.
export const commandEventMessages = catalogue({
  commandEvent: {
    "commandEvent": "Command event:",
    "paceFaster": "adversary pace one step faster: about {amount} more adversary progress each turn",
    "paceSlower": "adversary pace one step slower: about {amount} less adversary progress each turn",
    "paceAtFastest": "adversary pace unchanged (already at its fastest)",
    "paceAtSlowest": "adversary pace unchanged (already at its slowest)",
  },
});
