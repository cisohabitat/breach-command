// Imported by every component that shows a message the engine wrote, so the
// engine's catalogue loads with the first of them and not before.
import { engineMessages } from "./en/engine.ts";
import { register } from "./index.ts";

register(engineMessages);
