// The glossary: what each term of the field means in plain words, and how a
// passage marks the terms it uses. Only the screens that show glossed prose
// read it (the game screen's parts, the field guide, the educator pack), so it
// loads with them and not on the first load.
import { registerContent } from "./i18n/content/registry.ts";

// The interface uses the field's own vocabulary, which is right for the subject
// and wrong for a first-time player reading it cold. Every term here is one a
// playtest reported needing translated.
export const plainLanguage: Record<string, string> = {
  "endpoint": "An individual computer — a laptop, desktop or server — as opposed to the network or an online service.",
  "control plane": "The management layer of a cloud service: the settings, roles and keys that decide what everything else in the account may do.",
  "pivot": "Using one compromised system or account as a stepping stone to reach the next.",
  "C2": "Command and control: the channel an intruder uses to send instructions to compromised systems and receive what they collect.",
  "egress": "Traffic leaving the organisation's network for the internet.",
  "east-west traffic": "Traffic between systems inside the network, rather than in from or out to the internet.",
  "DNS": "The internet's address book, which turns names into network addresses. Its lookups can be abused to smuggle small amounts of data.",
  "established source": "An evidence source your team already knows well: a few start that way and the campaign adds more. It adds +2 to the roll.",
  "inject": "An unplanned event the exercise controller adds part-way through: a disclosure, an outage or a lucky break.",
  "pre-positioning": "Gaining quiet access now in order to act later, often during a crisis, rather than to take anything today.",
  "telemetry": "The records systems produce on their own about what they are doing: logs, alerts and traffic data.",
  "credential": "Anything that proves who you are to a system: a password, a key, a token or a certificate.",
  "service ticket": "A time-limited pass a network's sign-in service hands out so an account can use one particular system.",
  "TXT record": "A free-text entry in the internet's naming system; it can be abused to carry small pieces of data in and out.",
  "logon script": "A small program that runs automatically when someone signs in to a computer.",
  "delegated access": "Permission one account gives another to act on its behalf, such as reading its mailbox.",
  "unsigned payload": "A program or file with no maker's signature, so nothing vouches for where it came from.",
  "MFA": "Multi-factor authentication: a second check at sign-in, such as a phone prompt, on top of the password.",
  "federation": "An arrangement where one organisation's sign-in service is trusted by another's, so one account works across both.",
  "historian": "The database that records an industrial plant's readings over time.",
  "SaaS": "Software as a service: an application the organisation uses over the internet rather than running itself.",
  "webhook": "An address one service calls automatically to tell another that something happened.",
  "snapshot": "A point-in-time copy of a disk or system.",
  "token": "A digital pass a system issues after sign-in, so a person or program need not sign in again for every request.",
  "artefacts": "Traces a program leaves behind on a computer — files, settings and memory — that investigators can examine.",
  "API": "A way for programs to talk to a service directly, without a person clicking through screens.",
  "payload": "The part of an attack or a message that does the actual work, such as the data or code being carried.",
  "workload": "A program or job running in the cloud, usually on its own with no person at the keyboard.",
  "beaconing": "A compromised computer checking in with the intruder at regular intervals for new instructions.",
  "resolver": "The service that answers DNS lookups, turning a name into the address behind it.",
  "process ancestry": "Which program started which: the chain of parent and child programs that led to an action.",
  "privileged tier": "Accounts with powerful administrative access — the ones that can change anything.",
  "trust boundary": "The line between two systems that are allowed to rely on each other. Crossing it is how an intruder spreads.",
  "actor tempo": "How quickly the intruder is moving. It rises when you give them time and falls when you press them.",
  "bounded containment": "Shutting down one specific path rather than the whole service, so less of the business stops.",
  "assurance gate": "The step between stopping the attack and restoring service, where you check the environment is actually clean.",
  "residual risk": "What is still uncertain after you act — the part of the problem the chosen option does not settle.",
  "causal sequence": "One finding is what the next one needed — consecutive stages of the intrusion, or two steps on the same route. Two things on the same system at the same time are not thereby related.",
  "evidence boundary": "How far out you are currently looking. Widening it brings connected systems into the investigation and costs time.",
  "assurance": "Checking the environment is genuinely clean before you put the service back.",
  "exfiltration": "Data being taken out of the organisation.",
  "persistence": "A foothold the intruder can return through after a reboot or a password change.",
  "lateral movement": "Moving from the first system compromised to other systems inside the network.",
  "attribution": "Working out who is behind the activity, from how they behave rather than from a name.",
  "continuity": "Whether the essential service is still running for the people who depend on it.",
  // Added with the glossary test (tests/glossary.test.ts), which finds every
  // acronym and field term in the authored text and requires an entry here.
  "VPN": "A remote-access connection that puts an outside computer onto the organisation's network as if it were inside.",
  "OT": "Operational technology: the computers that run physical equipment such as pumps, valves, cranes and power switching.",
  "OSS": "Operations support systems: the software a telecoms operator uses to set up and manage its customers' services.",
  "phishing": "A message made to look genuine so that someone opens an attachment, follows a link or gives away a password.",
  "password spraying": "Trying a few common passwords against many accounts, slowly, so that no single account locks.",
  "privilege escalation": "Gaining more access than the account or program started with, usually administrator rights.",
  "jump host": "A computer staff are meant to pass through to reach a protected network; whoever controls it can reach what it reaches.",
  "web shell": "A small file placed on a web server that lets an outsider run commands through ordinary web requests.",
  "implant": "Malicious software placed on a computer to give the intruder lasting control of it.",
  "tunnel": "A connection carried inside another, so traffic that would be blocked travels hidden in traffic that is allowed.",
  "proxy": "A computer that passes traffic on for others, so the real source and destination are hidden from each end.",
  "port forward": "Redirecting traffic arriving at one computer on to another, often to reach a network the outsider cannot reach directly.",
  "covert channel": "A way of moving data hidden inside something that looks routine, such as name lookups or web requests.",
  "dead drop": "A public place, such as a web page or post, where the intruder leaves instructions for their software to collect.",
  "service account": "An account used by a program rather than a person, often with wide access and rarely watched.",
  "scheduled task": "A job a computer runs by itself at set times; an intruder uses one to restart their software.",
  "autorun": "A setting that starts a program automatically when the computer starts or someone signs in.",
  "event subscription": "An instruction for a computer to run something whenever a particular event happens.",
  "container image": "The packaged template a cloud workload is started from; alter it and every copy starts altered.",
  "pipeline runner": "The machine that builds and deploys software automatically, using credentials that can reach many systems.",
  "sideloaded": "Installed by hand from outside the approved source, so the usual checks never saw it.",
  "segmentation": "Dividing a network so that a problem in one part cannot easily reach the others.",
  "threat hunt": "Searching for an intruder's behaviour across many sources, rather than waiting for an alert.",
  "forensic": "Careful, recorded examination of a computer's contents to establish what happened and when.",
  "identity assertion": "A signed statement from one system telling another who a user is, which the second trusts instead of checking.",
  "tenant": "One customer's separate space inside a shared cloud or managed service.",
  "foothold": "The first point of lasting access an intruder holds inside the organisation.",
};

// A name lowered for the middle of a sentence, keeping words written in
// capitals or with digits as they are: "C2 & exfiltration", "DNS review".

// The terms in a passage of player-facing text, marked so the interface can
// offer each one's meaning where it is read. Longer terms win over the shorter
// ones inside them ("privileged tier" before a bare match), a term may be plural
// or hyphenated ("control-plane"), and only its first use in a passage is
// marked, so a paragraph does not turn into a row of links.
// A term is found by the words a locale gives it (glossaryTerms, which a
// translation overlays like any content), so the text and its terms are always
// in one language; `term` is the English key, which names the meaning in
// plainLanguage. Boundaries are any letter or digit, not only ASCII ones.
export type GlossaryPart = { text: string; term?: string };
export const glossaryTerms: Record<string, string> = Object.fromEntries(Object.keys(plainLanguage).map(term => [term, term]));
const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[ -]");
let glossaryCache: { words: string; pattern: RegExp; terms: [string, string][] } | null = null;
function glossaryMatcher() {
  const terms = Object.entries(glossaryTerms).sort(([, a], [, b]) => b.length - a.length);
  const words = terms.map(([, shown]) => shown).join("\u0000");
  if (glossaryCache?.words !== words) glossaryCache = { words, terms, pattern: new RegExp(`(?<![\\p{L}\\p{N}])(${terms.map(([, shown]) => escape(shown)).join("|")})s?(?![\\p{L}\\p{N}])`, "giu") };
  return glossaryCache;
}
export function glossaryParts(text: string): GlossaryPart[] {
  const parts: GlossaryPart[] = [];
  const seen = new Set<string>();
  const { pattern, terms } = glossaryMatcher();
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const term = terms.find(([, shown]) => new RegExp(`^${escape(shown)}s?$`, "iu").test(match[0]))?.[0];
    if (!term || seen.has(term)) continue;
    seen.add(term);
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: match[0], term });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

// The words of these tables are a locale's to replace (lib/i18n/content/).
registerContent({ plainLanguage, glossaryTerms });
