# Releasing and rolling back

Production is the Vercel project `breach-command`, deployed from `main`. A
push to `main` is a release, so it goes out only through this procedure.

## A release

1. Work on a branch. Run the checks AGENTS.md requires (`pnpm test`,
   `pnpm balance:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`,
   `git diff --check`) and the browser suites against the build.
2. If the change is visual on purpose, run the **Record visual baselines**
   workflow on the branch, review every changed image, and bring them into
   the branch (`git checkout origin/ci/visual-baselines --
   tests/e2e/visual.spec.ts-snapshots`).
3. If the change moves balance on purpose, measure it at 3,000 per
   difficulty (`pnpm balance`), explain it in AGENTS.md, and record the
   smoke figures (`node scripts/balance-check.ts --record`).
4. Raise `version` in `package.json` and add its entry to `CHANGELOG.md`.
5. Merge to `main`. **Verify** runs every check and every browser suite;
   the pull request's Vercel preview is where a person looks at the pixels.
6. When Verify passes on `main`, the **Release** workflow tags the commit
   `v<version>` and publishes the changelog entry as a GitHub release. A
   version already tagged is not tagged again.
7. Confirm the deploy: the footer of the production page shows the new
   version and the commit's short hash, and Settings, Copy diagnostics shows
   the same build with the service worker controlling.

The service worker's cache is named for the version and build the page
registers it with, so each deploy installs a fresh cache and deletes the old
one on activation; nothing is bumped by hand.

## A rollback

1. Revert on `main`: `git revert <commit>` (or a range), never a force-push,
   so the history keeps both the change and its undoing. Raise the patch
   version and say in `CHANGELOG.md` what was reverted and why.
2. Push. Verify runs; the Release workflow tags the revert.
3. Confirm the deploy as in step 7 above. A player who had the bad build
   gets the reverted one on their next visit: the reverted build registers
   its worker under a new cache name, which replaces the old cache.
4. Saves are safe in both directions. A save written by the bad build at a
   newer session version is parked by the reverted build, not deleted, and
   offered again by any later build that can read it (`lib/session.ts`,
   `PARKED_SESSION_KEY`). A reverted build never downgrades a campaign.
5. If Vercel itself needs to go back before the revert has built, promote
   the previous production deployment in the Vercel dashboard, then revert
   on `main` all the same, so the repository and production agree.

## Dependencies

Dependabot proposes Next.js, React and Playwright updates once a month,
grouped (`.github/dependabot.yml`). The browser suites in all three engines
are the gate: an update merges when Verify passes and the visual baselines
hold, and the changelog says what moved.
