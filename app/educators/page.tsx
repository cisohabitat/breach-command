import type { Metadata } from "next";
import Link from "next/link";
import { difficulties, plainLanguage } from "@/lib/advanced-game";
import { debriefQuestionSets, difficultyTeaches } from "@/lib/educators";

export const metadata: Metadata = {
  title: "Educator pack | Breach Command",
  description: "How to run Breach Command with a group: a session plan, what each difficulty teaches, the vocabulary in plain words and three sets of debrief questions.",
};

// The educator pack, built from the same tables the game reads, so the
// vocabulary and the difficulties a trainer hands out are the ones on screen.
export default function EducatorPack() {
  return (
    <main className="educator-pack" id="main-content">
      <p className="educator-form">Form BC-400 / Educator pack</p>
      <h1>Running Breach Command with a group</h1>
      <p>Breach Command is a single-player incident-response exercise. A group plays it best in pairs or threes at one screen, with the trainer watching rather than steering, and the review on the big screen afterwards. Everything in it is fictional: it connects to nothing and needs no account.</p>

      <h2>A session, about ninety minutes</h2>
      <ol>
        <li><strong>Before.</strong> Play the case yourself once at the difficulty the group will use, and print the facilitator sheet from your own review. Choose Training for a group new to incident response, Operational for one that has played before.</li>
        <li><strong>Brief, ten minutes.</strong> Explain the loop and nothing else: each turn, say which of four routes you think the intruder used for this stage, test it with one check, and change your mind when the board says the reading is weakening. Do not explain the techniques.</li>
        <li><strong>Play, thirty to forty minutes.</strong> One operation per group. Give each group a reader, who reads the clue and the board aloud, and a recorder, who writes down every reading and why it changed. Answer questions about the interface, never about the case.</li>
        <li><strong>Review, ten minutes.</strong> Each group opens its after-action review and reads its four plain sentences and the turn-by-turn ledger.</li>
        <li><strong>Debrief, twenty to thirty minutes.</strong> Use one of the question sets below, chosen by how the groups did. The facilitator sheet has the whole chain, each stage’s MITRE ATT&amp;CK technique, and the set that fits its outcome.</li>
      </ol>

      <h2>What each difficulty teaches</h2>
      <dl>
        {(Object.keys(difficultyTeaches) as (keyof typeof difficultyTeaches)[]).map(id => (
          <div key={id}><dt>{difficulties[id].title}, {difficulties[id].maxTurns} turns, rolls need {difficulties[id].threshold}+</dt><dd>{difficultyTeaches[id]}</dd></div>
        ))}
      </dl>

      <h2>Debrief questions</h2>
      {debriefQuestionSets.map(set => (
        <section key={set.id}>
          <h3>{set.title}</h3>
          <p>{set.purpose}</p>
          <ol>{set.questions.map(question => <li key={question}>{question}</li>)}</ol>
        </section>
      ))}

      <h2>The vocabulary in plain words</h2>
      <p>The game explains each of these where it is first read. They are listed here for a handout.</p>
      <dl className="educator-glossary">
        {Object.entries(plainLanguage).sort(([a], [b]) => a.localeCompare(b)).map(([term, meaning]) => <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}
      </dl>

      <h2>What it is and is not</h2>
      <p>Every scenario, technique and character is original and fictional. Each technique maps to its nearest MITRE ATT&amp;CK technique, so a finding can be filed where a practitioner would file it, but the game does not claim to reproduce any real intrusion. It is an unofficial adaptation inspired by Backdoors &amp; Breaches and is not endorsed by its creators.</p>
      <p><Link href="/">Back to the incident desk</Link></p>
    </main>
  );
}
