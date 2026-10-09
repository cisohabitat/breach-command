// The English catalogue: the source of truth for every string routed through
// lib/i18n. A key names where the string is used; a value may hold {name}
// placeholders, and a plural is an object of Intl plural categories.
export const en = {
  "shell.skip": "Skip to main content",
  "shell.home": "Breach Command home",
  "shell.desk": "Incident desk",
  "shell.fieldGuide": "Field guide",
  "shell.settings": "Settings",
  "shell.settingsLabel": "Game settings",
  "shell.newIncident": "New incident",
  "shell.dismissStorage": "Dismiss storage notice",
  "tabs.command": "Command",
  "tabs.investigate": "Investigate",
  "tabs.briefing": "Briefing",
  "tabs.decisionWaiting": "Decision waiting",
  "tabs.stages": "{found} of 4 stages",
  "tabs.turns": { one: "{count} turn", other: "{count} turns" },
  "window.remaining": "of {limit} turns remaining",
  "window.label": "Investigation window remaining",
  "ending.openReview": "Open after-action review",
  "ending.reviewRecord": "Review the record",
  "ending.reviewDrill": "Review the drill",
  "ending.copy": "Copy result",
  "ending.saveImage": "Save image",
  "ending.copied": "Result copied.",
  "ending.copiedWithCode": "Result and challenge code copied.",
  "ending.drawing": "Drawing the result…",
  "ending.imageSaved": "Result image saved.",
  "ending.imageFailed": "This browser could not draw the image. Copy result works instead.",
  "ending.resultLabel": "Result to copy",
} as const;

export type Catalogue = typeof en;
export type MessageKey = keyof Catalogue;
