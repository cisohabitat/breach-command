// What the game screen and every dialog share: the engine's catalogue and the
// glossary. Loaded once, through ./shared-text.ts, never imported by a
// component: a module imported by several lazily loaded parts is copied into
// each of their scripts.
import "./engine-messages.ts";
import * as glossary from "../glossary.ts";

export { glossary };
