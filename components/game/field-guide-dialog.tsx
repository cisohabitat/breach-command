import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { plainLanguage } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";

export function FieldGuideDialog({ session }: { session: GameSession }) {
  const { rules, setRules } = session;

  return (
    <Dialog open={rules} onOpenChange={setRules}>
      <DialogContent className="game-dialog wide-dialog paper-dialog">
        <DialogHeader><div className="eyebrow">Form BC-002 <span className="separator">/</span> <span>Field guide</span></div><DialogTitle>How an operation runs</DialogTitle><DialogDescription>A complete solo incident-response exercise with hidden information and operational consequences.</DialogDescription></DialogHeader>
        <div className="rules-content">
          <section className="quick-start-guide" aria-label="Quick start">
            <div><span>1</span><p><strong>Form a hypothesis</strong>Open Investigate and choose the access path that best explains the intelligence.</p></div>
            <div><span>2</span><p><strong>Test it</strong>Run a procedure marked “Own source”: one your reading predicts. Every procedure uses one turn and rolls a twenty-sided die; the roll plus its modifier must reach 10 at Training, 11 at Operational or 12 at Crisis.</p></div>
            <div><span>3</span><p><strong>Decide</strong>When a stage is confirmed, choose a command response: observe, act, attribute, contain or notify.</p></div>
            <div><span>4</span><p><strong>Respond</strong>Reveal all four stages, then contain, assure and recover the service.</p></div>
          </section>
          <section className="plain-language" aria-label="Plain language">
            <h3>Plain language</h3>
            <p>The interface uses the vocabulary a response team would use. Here is what each term means in ordinary words.</p>
            <dl>
              {Object.entries(plainLanguage).map(([term, meaning]) => (
                <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>
              ))}
            </dl>
          </section>
          <div className="rules-grid">
            <section><h3>Objective</h3><p>Reveal four hidden attack stages before the turn limit or impact reaches 100. Then complete containment, assurance and recovery decisions.</p></section>
            <section><h3>Hypotheses &amp; evidence</h3><p>Record one explanation per turn. Testing it with one of its own evidence sources adds +1, whether or not it turns out to be right; an established source — one your team already knows well, a few at the start and more as the campaign goes on — adds +2. A completed check that finds nothing rules out every technique its source could have seen, and the reading’s standing shows what is left. Being right is rewarded by what you find and by the hypothesis score afterwards.</p></section>
            <section><h3>Adaptive adversary</h3><p>The actor escalates according to its behaviour profile and can move to a route less exposed by your recent procedures after intervention.</p></section>
            <section><h3>Contextual decisions</h3><p>Each discovery offers five command verbs. Observation and attribution build evidence and analytical depth. Act presses the actor and forces adaptation. Contain protects the sector margin. Notify protects continuity but exposes your read and costs tempo. The right choice depends on impact, adversary tempo, sector condition and continuity.</p></section>
            <section><h3>Consequences</h3><p>Evidence decisions describe what each choice trades in words, and the report states what it did once chosen; command events, sector decisions, map actions and response options state their exact effects beforehand. Bonuses waiting for your next roll — from a monitored node, an inject, a decision or a correct comparison — add together, up to +3 at most and −2 at least. How well a choice fitted the moment is judged in the review. A roll of 20 or 1 on the die, or a run of failed rolls, can trigger an inject: an unplanned event that helps or hinders. An inject can reveal that part of the activity was an authorised exercise; with two or more stages confirmed, the operation stands down there, no response phase is run, and the case counts as cleared in the campaign.</p></section>
            <section><h3>Score &amp; recovery</h3><p>The 100-point review covers investigation speed, impact, continuity, decision quality, response quality and hypothesis accuracy.</p></section>
            <section><h3>Saved sessions</h3><p>Your current investigation is saved on this device. Refresh safely and resume from the assignment screen.</p></section>
            <section><h3>Fast resolution</h3><p>After turn one, fast mode skips confirmation and dice animation for routine actions. Discoveries and major events still receive full reports.</p></section>
            <section><h3>Command events</h3><p>Operational interruptions test scoping, leadership communication and specialist allocation. These choices affect pressure, continuity and adversary tempo.</p></section>
            <section><h3>Campaign progression</h3><p>Completed incidents, best scores and command experience remain on this device. Progress unlocks professional capability milestones.</p></section>
            <section><h3>Sector condition</h3><p>Every sector has a distinct operating constraint and condition meter. The operation fails if the essential-service margin is exhausted.</p></section>
            <section><h3>Team deployment</h3><p>Select one specialist before deployment. Matching evidence earns a bonus, while repeated use creates fatigue that carries into campaign operations.</p></section>
            <section><h3>Scope &amp; intensity</h3><p>Focused checks are efficient. Enterprise scope searches wider at a time cost. Exhaustive work is stronger but increases pressure and cooldown.</p></section>
            <section><h3>Advanced modes</h3><p>Daily, Weekly, Ironman, Escalation and Expert modes alter seeds, pressure, saves, coaching and rewards. Expert disables guidance entirely, guided reflection gives strategic prompts without the answer, and only Training difficulty adds one clue: what was observed at the next unconfirmed stage, never the source that would expose it.</p></section>
            <section><h3>Infrastructure actions</h3><p>Selecting a node changes investigation focus without spending a turn. Monitoring or isolation is optional, immediate and consumes one of a limited number of map actions — usually three, fewer under Crisis or Expert and one more for senior commands. Their full costs, including sector margin and actor progress, are shown before selection.</p></section>
            <section><h3>Evidence correlation</h3><p>Successful procedures preserve findings. Test pairs carefully: a shared timestamp is not necessarily a causal relationship.</p></section>
            <section><h3>Sector set pieces</h3><p>Each incident has two operational crises of its own, one met by each half of its incident variants, that change impact, continuity, sector condition and adversary progress.</p></section>
            <section><h3>Campaign acts</h3><p>Ten incidents form three acts. Trust, readiness, unresolved access, team fatigue and command doctrine shape later operations and the final conclusion.</p></section>
            <section><h3>Case theory</h3><p>Declare what the actor is trying to achieve. A correct theory strengthens valid evidence correlations, but the hidden objective is never revealed early.</p></section>
            <section><h3>Campaign director</h3><p>Your command posture selects a route that changes later starting conditions. Every scenario also has a deterministic authored operational variant.</p></section>
            <section><h3>MITRE ATT&amp;CK</h3><p>Every technique in the game maps to its nearest MITRE ATT&amp;CK technique. The review names it for each stage, with a link, once the operation is over; nothing during play does, because the name would give the stage away.</p></section>
            <section><h3>Running it with a group</h3><p>The <a href="/educators" target="_blank" rel="noopener">educator pack</a> (it opens beside the game) says how to run a session in a training room, what each difficulty teaches, the vocabulary in plain words, and three sets of debrief questions. The review prints a facilitator sheet with the hidden chain for the debrief.</p></section>
            <section><h3>Portable backup</h3><p>Settings can export campaign progress and a non-Ironman session as text for restoration on another device.</p></section>
          </div>
          <section className="attribution"><h3>About this adaptation</h3><p>Inspired by Backdoors &amp; Breaches, created by Black Hills Information Security and Active Countermeasures. This unofficial adaptation is not affiliated with or endorsed by the creators. It uses original wording, fictional settings and a rule-based facilitator. It does not reproduce the commercial deck, official artwork or expansion content.</p><a href="https://www.blackhillsinfosec.com/wp-content/uploads/2024/03/BnB_VisualGuide_v2_03052024.pdf" target="_blank" rel="noreferrer">Read the official classic rules <ArrowRight size={14} /></a></section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
