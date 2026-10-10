// Every table of authored content, for the extraction script and the tests:
// importing the modules that hold them registers them (registry.ts). Add a
// table to its module's registerContent() call when it holds text a player
// reads; tests/content-overlay.test.ts names a table this file does not reach.
import "../../game.ts";
import "../../engine/content.ts";
import "../../phase8.ts";
import "../../phase9.ts";
import "../../command-systems.ts";
import "../../campaign.ts";
import "../../educators.ts";
import "../../glossary.ts";
export { contentTables } from "./registry.ts";
