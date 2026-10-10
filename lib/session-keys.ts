// Where the operation in progress is saved, apart from the session's migration
// (lib/session.ts), so the assignment screen can tell whether there is a save
// without loading the engine to read it.
export const SESSION_KEY = "breach-command.session";
// Where a save this build cannot read is moved before anything replaces it, so a
// newer build's operation outlives an older bundle served offline. A build that
// can read it moves it back and offers it for resume.
export const PARKED_SESSION_KEY = "breach-command.session.parked";
