# Security review — 16 October 2026

Scope: application source, local persistence and portable backups, message
rendering, CSV/share exports, browser headers, service worker, dependencies
and GitHub build/release workflows. Baseline: main `e41b173` (0.9.34).
Remediation releases: 0.9.35–0.9.38. This is a source review with automated regression
checks, not an independent penetration test or a guarantee of security.

## Trust boundaries

The game has no application API, account, authentication, database, remote AI
service or telemetry collector. It runs fictional, local rules. Browser saves
are editable and are not an authoritative score or security boundary. A backup
from another person is untrusted input. React renders text; no runtime
`dangerouslySetInnerHTML`, `innerHTML`, `eval` or dynamic code construction was
found. Outbound ATT&CK links use authored identifiers and safe link relations.
The optional browser incident-state tool is read-only and exposes public game
state, not the unrevealed chain.

## Remediations

| Finding | Change and regression coverage |
| --- | --- |
| Dependency audit: 1 critical, 19 high, 8 moderate and 2 low advisory records | Next.js / eslint-config-next 16.3.8; patched transitive packages and bounded overrides. No known production dependency advisories remain in the audit taken for this review. The critical advisory concerned `next/og` ImageResponse; this app does not define such a route, but the vulnerable package was updated regardless. |
| Service worker deleted other applications' origin caches and searched all caches during offline fallback | Read/delete only the game's namespace and current build; store only published documents/assets. Exclude queries, authorisation, RSC, ranges, redirects and private/no-store responses. Register cache-write lifetime synchronously. VM regression tests and the existing offline browser suite cover isolation and play. Locale query navigations may use the public offline shell without caching the query response. |
| Message guard accepted malformed keys, forms and nested parameters from saves | Validate complete bounded message trees; reject ambiguous shapes, non-finite numeric parameters and excessive nesting. Use own-property catalogue, interpolation and content lookups. Existing full-save fixtures check migrations and wording. |
| Unbounded backup/session JSON and inherited identifiers | Bound input before parsing; iteratively validate depth, collection size and total values; reject prototype-related keys. Validate difficulty, hypothesis, theory, campaign route and turn-plan identifiers before resume. Newer-version detection remains separate to preserve future saves. |
| Malformed nested evidence/correlation/history records and response choices | Validate evidence IDs and confidence, referenced evidence pairs, history entries, turn values and phase-specific response choices. Reject invalid operations before they reach the renderer. The browser import regression verifies the existing operation survives and the readable campaign restores with an explicit omission notice. |
| Recursive text amplification from imported message identifiers | A safely reproduced 431-character payload expanded to 640,000 characters. Reject template syntax in keys/references; render unknown identifiers literally. Cap every recursive result at 16,000 UTF-16 code units, including after case folding, so a parent cannot amplify an unbounded child. Tests cover unknown references, imported fallback, trusted-template repetition, both locales and case folding. |
| Spreadsheet formula injection through imported ledger fields | Prefix formula/control-character starters before CSV escaping; regression tests cover formula markers, leading whitespace and newlines. |
| Missing resource-destination policy and mutable CI action references | Add CSP, retain anti-framing/sniffing protections and remove the framework disclosure header. Pin existing action versions to resolved commit SHAs; ordinary Verify jobs do not retain Git credentials. Require a successful same-repository main push before release. Restore Dependabot patch updates. |

## Dependency update policy

The npm updater's seven-day cooldown matches pnpm's release-age policy.
Earlier Dependabot jobs failed with `ERR_PNPM_NO_MATURE_MATCHING_VERSION` after
selecting releases published inside that window; the cooldown defers candidate
selection while preserving the installer guard. It applies to version updates;
GitHub handles security updates separately. Any urgent exception to the
installer's age policy requires explicit review.

## Reviewed exception: development lint dependency

The unfiltered audit still reports **one high advisory**:
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
`braces` 3.0.3 stack exhaustion on deeply nested glob patterns. No patched
version was published when reviewed. Its sole installed path is
`eslint-config-next > @next/eslint-plugin-next > fast-glob > micromatch > braces`.
It is a development lint tool, absent from production dependency paths. Lint
patterns are repository-controlled; the game does not pass player input to it.
Maintainer/repository input is trusted for this exception. Avoid running lint
on an untrusted checkout with credentials or privileged access.

`pnpm security:audit` accepts only that exact advisory, only on that lint path,
and only while the registry reports no patched version. Any other advisory,
new production path, published fix or registry/report error fails CI. The raw
`pnpm audit` command deliberately continues to report the exception. Remove it
when a compatible upstream fix is published; do not suppress all unfixable
advisories. Package releases still observe the existing seven-day age policy.

## Limits and maintenance

- Static Next bootstrap and current inline component styles require
  `'unsafe-inline'`. CSP limits resource destinations, forms, objects and
  embedding; it does not prevent every script-injection technique. Production
  excludes `'unsafe-eval'`. A strict nonce policy would require a separately
  evaluated rendering/offline design change.
- Cache storage shares an origin security boundary. This change prevents
  accidental cross-cache access; it cannot isolate this app from malicious
  JavaScript already executing on the same origin. Keep deployment origins
  dedicated to trusted applications.
- The review checks tracked source for common credential patterns without
  printing values; no matching credential files or patterns were found.
  Git history, provider account permissions, deployed environment variables
  and hosting configuration are outside that source scan.
- Backups are plain text and local progress has no integrity signature.
  Never put real incident data or credentials into them. Nothing is sent by
  the backup/diagnostic controls without an explicit user export/copy.
- Dependency findings change over time. Run the audit again for every release
  and review Dependabot updates through the complete CI suites.

## Verification

`tests/security.test.ts` covers hostile save structure, nested message shapes,
inherited properties, formula-safe CSV and cache isolation. The production
browser policy check verifies ordinary startup and blocked external
connections. Run these alongside all unit, balance, lint, type, production
build, persistence and offline suites. CI also runs the full Chromium suite
and its existing WebKit/Firefox coverage. Consult the release PR/main checks
for the final run results; a successful build alone does not verify hosting.
