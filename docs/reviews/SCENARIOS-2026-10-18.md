# Scenario correctness review, 18 October 2026

This is a source-based code and content audit of the ten existing cases for
0.9.61. It is not an independent practitioner sign-off or a human playtest.

## Coverage

Read together: each briefing, timeline, scope, constraint and lead; all 160
technique placements (96 unique techniques); evidence, routes and detect
sources; ten maps and sector actions; seventy variants; thirty sector
decisions; ninety response options; objectives, dynamics and sector rules.
Traced their use in starting state, collection, source bonuses and response
resolution. The game uses four simplified investigative stages, not the full
ATT&CK tactic sequence. Movement can include discovery and credential access;
the final stage also includes staging and integrity effects, not only proof
of data leaving. A technique's primary reference describes its observed
behavior, not every tactic implied by its position in the game.

| Case | Findings and disposition |
| --- | --- |
| The quiet intrusion | Identity, endpoint and cloud scope fits the pool. Print-service evidence now states exploitation, rather than treating a running service as proof of exploitation. Backup diversion and payroll decisions remain explicit availability tradeoffs. |
| After the night shift | Name cloud collaboration in scope for application consent and cloud evidence. The downtime action now names the sign-in, message and logon records it checks. The device exception describes an unaffected operational dependency; read-only records do not impose an unimplemented collection delay. |
| Beyond the gateway | Distinguish read-only collection from operations-approved support containment. A dead-drop resolver supplies the next command-server address. Normal plant readings do not prove support access has been removed. Controllers and safety systems remain outside the investigated chain. |
| A terminal under watch | Cargo-record collection uses the server source, matching its estate. Terminal operating-system evidence names the planning application rather than implying access to excluded crane controllers. Crane update choices are operational coordination, not controller investigation. |
| An identity out of place | Cloud export now specifies another account on the same service; encrypted C2 exfiltration names the shared command channel. Revoking workload keys pauses dependent automation. General provider assurance cannot replace validating the affected roles and keys. |
| A trusted connection | Correct the resolver's mapping from resource development to traffic redirection. Certificate rotation involves a suspected stolen private key, and overlap leaves that key usable. Public certificates are not secrets. Cross-tenant evidence remains limited to the operator's own platform and partner reports. |
| Authority under pressure | Name shared cloud hosting and storage in scope. Citizen credential misuse maps to Valid Accounts, not credential stuffing without evidence of password attempts. Repository exfiltration names a code-hosting destination. |
| Signals in the core | A CDN channel alone does not establish domain fronting. Routing rollback requires operational validation and emergency-route testing; it cannot guarantee emergency-call safety. Management scope remains separate from live customer traffic content. |
| Pressure boundary | A historian query outside support access hours does not imply an unstaffed water plant. Dosing rollback requires validation against current conditions. Manual and independent readings support treatment safety without certifying cyber eradication. |
| The clearing window | Remove the claim that failed procedures become more expensive close to settlement: their extra integrity cost is fixed. Preserve dual-control, reconciliation and time-window tradeoffs. The seventy variant descriptions now state actual starting effects. |

## Technical reference corrections

Six mappings changed after comparing the findings with the official
[Enterprise ATT&CK STIX corpus](https://github.com/mitre-attack/attack-stix-data/tree/master/enterprise-attack),
retrieved 18 October 2026. The extracted active catalogue used by tests records
the full downloaded source's SHA-256 and the 68 referenced active IDs.

| Technique | Before | After and reason |
| --- | --- | --- |
| Help-desk reset abuse | T1656 | [T1684.001](https://attack.mitre.org/techniques/T1684/001/): the corpus revokes the old Impersonation ID in favor of this sub-technique. |
| Sideloaded browser extension | T1176 | [T1176.001](https://attack.mitre.org/techniques/T1176/001/): use the specific browser-extension sub-technique. |
| Citizen portal credential reuse | T1110.004 | [T1078](https://attack.mitre.org/techniques/T1078/): the evidence establishes misuse of a valid account, not credential stuffing. |
| Backbone dependency persistence | T1584.002 | [T1557](https://attack.mitre.org/techniques/T1557/): persistent malicious resolver configuration redirects victims; it is not acquisition of external DNS infrastructure. |
| Content delivery covert channel | T1090.004 | [T1071.001](https://attack.mitre.org/techniques/T1071/001/): the evidence describes web communication without the distinct front and destination domains needed to establish domain fronting. |
| Mailbox export channel | T1071.003 | [T1048](https://attack.mitre.org/techniques/T1048/): email exfiltration is established, not a command channel carried over mail protocols. Encryption is not specified, so retain the parent. |

Clarified evidence supporting retained mappings: print-service exploitation
(T1210), injected code used to reach another system (T1055), exfiltration over
an existing command channel (T1041), cloud transfer to another account on the
same service (T1537), a public resolver returning a command-server address
(T1102.001), and export to a code repository (T1567.001). Parent mappings for
generic jobs, hooks, account changes, staging and data manipulation remain
deliberately broad. Enterprise references describe the support estate; they
do not assert exploitation of a process controller.

The certificate distinction follows
[NIST's certificate-management guidance](https://www.nccoe.nist.gov/publication/1800-16/VolB/index.html).
Operational language follows the need to test contingency plans and retain
safety-critical functions described in
[CISA's critical-infrastructure guidance](https://www.cisa.gov/news-events/alerts/2022/01/11/understanding-and-mitigating-russian-state-sponsored-cyber-threats-us-critical-infrastructure).
These are principles behind fictional choices, not site-specific operating procedures.

## Automated verification and limits

New regression coverage exercises every technique placement through every
detect source actually offered in its sector, including the recorded finding
and immutable input state. It checks all seventy variants at all three
difficulties in standalone and low-readiness campaign settings, including
readout clamping, and all 27 response combinations in every sector. Existing
tests check route coverage and purity, exclusive techniques, map topology,
decision costs, score-label consistency and information boundaries.

The only mechanical correction is the cargo node's cloud-to-server collection
bonus. Variant numbers, attack pools, scores, response costs, random draws and
save schema are unchanged. The 9,000-operation run gives 95.9% / 89.0% / 73.7%
wins at Training / Operational / Crisis, versus 95.9% / 88.9% / 73.7% before.
The 600-per-difficulty smoke run changes only Crisis wins (72.5% to 72.7%) and
mean score (67.6 to 67.7); it remains within the existing three-point gate.
The balance baseline records that explained correction. The composed-English
review compared 420,163 before/after outputs: 1,198 changed, comprising the
documented wording and the cargo node's one-point source bonus. The reviewed
hash is recorded in `scripts/prose-expected.json`.

Automated tests prove implemented behavior, not that every
fictional observation could be established from one raw log in a real estate.
The game's findings summarize collection plus incident context; the source
and map focus must not be read as a forensic attribution of the technique's
location. Operational margins and response confidence are game abstractions.

The independent review described in
[the practitioner brief](PRACTITIONER-REVIEW-BRIEF.md) remains a separate step;
this audit must not be recorded as that sign-off.

Local release checks pass: 159 unit tests, security audit with its existing
documented development-only exception, balance gate, lint, TypeScript,
production build and whitespace check. The scenario suite makes 498
technique/source collections. All 27 distinct responsive, localization and
performance browser checks pass; the first concurrent localization layout
run hit the existing 30-second timeout and passed in isolation, without
changing the timeout or assertions. The historical version-18 save remains
untouched: only the replay's expected new variant description is explicitly
updated; its original sentences still survive migration exactly.

Measured script sizes are 659,909 bytes initially, 1,176,860 bytes warmed on
assignment and 1,187,734 bytes in an operation. Total CSS remains 221,936
bytes. The existing performance budgets are unchanged.

Official screenshot recording
[39134008926](https://github.com/cisohabitat/breach-command/actions/runs/39134008926)
passed. Reviewed all fifteen changed images and accepted six campaign pages
at 320, 390 and 820 pixels: the more precise variant modifiers add one or two
lines without clipping controls or the footer. Retained nine old references
whose changes were only build-label mask widths or raster noise.
