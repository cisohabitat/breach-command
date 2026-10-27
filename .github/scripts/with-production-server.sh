#!/usr/bin/env bash
# Serves the production build on port 3000, waits for it to answer, then runs
# the given command against it. The browser suites test what Vercel serves.
# A server that never answers fails here, with its log, rather than as a
# suite of unreachable-page errors.
set -euo pipefail
pnpm start -p 3000 > next-start.log 2>&1 &
for attempt in $(seq 1 60); do
  if curl -sf http://localhost:3000 > /dev/null; then
    exec "$@"
  fi
  sleep 1
done
echo "The production server did not answer on port 3000 within 60 seconds." >&2
cat next-start.log >&2
exit 1
