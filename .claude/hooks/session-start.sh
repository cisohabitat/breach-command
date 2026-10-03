#!/bin/bash
# Prepares a Claude Code cloud session so the checks in AGENTS.md run as written:
# pnpm test, lint, typecheck, build and the Playwright suites.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# The lockfile is authoritative; never rewrite it from a session.
pnpm install --frozen-lockfile

# The container ships a Chromium under /opt/pw-browsers and must not download
# another. When it is not the build the pinned Playwright expects, point the
# suites at the one that is there.
expected="$(node -e 'console.log(require("@playwright/test").chromium.executablePath())' 2>/dev/null || true)"
if [ -n "$expected" ] && [ ! -x "$expected" ]; then
  installed="$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome 2>/dev/null | sort -V | tail -1 || true)"
  if [ -n "$installed" ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo "export PLAYWRIGHT_CHROMIUM_EXECUTABLE=\"$installed\"" >> "$CLAUDE_ENV_FILE"
    echo "Playwright expects $expected; using $installed." >&2
  fi
fi
