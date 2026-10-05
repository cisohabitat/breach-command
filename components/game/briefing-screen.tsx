import type { CSSProperties } from "react";
import { Bot, RefreshCw, Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SPECIALIST_EXHAUSTED_AT, difficulties, gameModes, scenarios, specialists, stages, type Difficulty, type GameMode, type SpecialistId } from "@/lib/advanced-game";
import { campaignRank, standingEffects } from "@/lib/campaign";
import { namedSpecialists } from "@/lib/phase8";
import type { GameSession } from "@/hooks/use-game-session";

// What each stage of the chain answers, in the words a newcomer would ask it.
const stageQuestions = ["How they got in", "Where they went, and as whom", "How they stay", "What leaves, and how"];

export function BriefingScreen({ session }: { session: GameSession }) {
  const {
    campaign, currentAct, currentRoute, finalEnding,
    scenarioChoice, setScenarioChoice, activeScenario, previewVariant,
    difficulty, setDifficulty, specialist, setSpecialist, mode, setMode,
    challengeCode, challengeInput, setChallengeInput, challengeMessage, loadChallengeCode, generateSeed,
    guided, setGuided, fastResolve, setFastResolve,
    botEnabled, setBotEnabled,
    savedSession, resume, clearStoredSession, start,
  } = session;

  return (
    <main className="briefing-screen" id="main-content">
      <div className="briefing-main">
        <p className="desk-line">Incident desk, single-player exercise</p>
        <h1>You have the incident.</h1>
        <p className="intro">An intruder has worked through four stages somewhere in the organisation. Each turn you state what you think happened, test it against one evidence source and decide what to do with what you find. Once the whole chain is known, you lead the response.</p>
        <ol className="briefing-chain" aria-label="The four stages you are looking for">
          {stages.map((stage, index) => {
            return <li key={stage.name} style={{ "--stage-color": stage.color } as CSSProperties}><span className="chain-index">{String(index + 1).padStart(2, "0")}</span><strong>{stage.short}</strong><small>{stageQuestions[index]}</small></li>;
          })}
        </ol>
        {/* On a phone the assignment panel, and the start button inside it, sit two
            screens below the introduction, behind the campaign record. This puts the
            first move on the first screen: resume the saved operation, or start the
            selected assignment. Wider layouts show the panel beside the introduction
            and hide the strip. */}
        <section className="phone-quick-start" aria-label="Quick start">
          {savedSession ? (
            <button className="primary-button" onClick={() => resume(savedSession)}>Resume “{scenarios[savedSession.game.scenario].title}”</button>
          ) : (
            <button className="primary-button" onClick={() => start()}>Start “{activeScenario.title}”</button>
          )}
          <small>{savedSession ? `Turn ${savedSession.game.turns.length} saved` : `${difficulties[difficulty].title}, ${namedSpecialists[specialist].name}`}, or choose the assignment below</small>
        </section>
        <section className="career-card" aria-label="Command career progression">
          <div><span className="field-label">Your command record</span><strong>{campaignRank(campaign.xp)}</strong><small>{campaign.completed.length}/{scenarios.length} incidents, trust {campaign.leadershipTrust}, readiness {campaign.readiness}</small><small className="standing-effects">{standingEffects(campaign).join(" ")}</small></div>
          <b><small>Experience </small>{campaign.xp}</b>
          <div className="career-progress"><span style={{ width: `${Math.min(100, campaign.xp / 8)}%` }} /></div>
        </section>
        <section className="campaign-act-card"><span className="act-number">ACT {currentAct.number}</span><div><strong>{currentAct.title}</strong><p>{currentAct.detail}</p><small>{campaign.unresolvedThreads} unresolved access{campaign.unresolvedThreads ? " — each starts later operations under more pressure" : ""}</small></div></section>
        <section className="campaign-route-card"><div><span className="field-label">Campaign route: {currentRoute.title}</span><strong>{currentRoute.order}</strong><p>{currentRoute.consequence}</p></div></section>
        {finalEnding && <section className="campaign-ending"><div><span className="field-label">Campaign conclusion</span><strong>{finalEnding.title}</strong><p>{finalEnding.detail}</p></div></section>}
      </div>
      <section className="mission-panel">
        <div className="panel-top"><span className="case-number">Case {String(scenarioChoice + 1).padStart(2, "0")} of {String(scenarios.length).padStart(2, "0")}</span><span className={`case-stamp ${campaign.completed.includes(scenarioChoice) ? "cleared" : ""}`}>{campaign.completed.includes(scenarioChoice) ? "Cleared" : "Open"}</span></div>
        <div className="mission-symbol"><span>{activeScenario.sector}</span></div>
        <h2>{activeScenario.title}</h2>
        <p>{activeScenario.summary}</p>
        {previewVariant && <div className="variant-brief"><span className="case-stamp amended">Amended</span><strong>{previewVariant.title}</strong><p>{previewVariant.briefing}</p><small>{previewVariant.modifier}</small></div>}
        <div className="mission-selector" aria-label="Select incident">
          {scenarios.map((scenario, index) => <button key={scenario.id} aria-label={`${scenario.title}${campaign.completed.includes(index) ? `, completed, ${campaign.mastery[String(index)] ?? 0} mastery star${(campaign.mastery[String(index)] ?? 0) === 1 ? "" : "s"}` : ""}`} aria-pressed={scenarioChoice === index} className={`${scenarioChoice === index ? "active" : ""} ${campaign.completed.includes(index) ? "completed" : ""}`} onClick={() => setScenarioChoice(index)}><span>{String(index + 1).padStart(2, "0")}</span>{campaign.completed.includes(index) && <small aria-hidden="true">{"|".repeat(campaign.mastery[String(index)] ?? 0)}</small>}</button>)}
        </div>
        <div className="difficulty-picker">
          <span className="field-label">Difficulty</span>
          <div>{(Object.keys(difficulties) as Difficulty[]).map(id => <button key={id} className={difficulty === id ? "active" : ""} aria-pressed={difficulty === id} onClick={() => setDifficulty(id)}><strong>{difficulties[id].title}</strong><small>{difficulties[id].maxTurns} turns, rolls need {difficulties[id].threshold}+</small></button>)}</div>
          <p>{difficulties[difficulty].description}</p>
        </div>
        <div className="specialist-picker">
          <label htmlFor="specialist"><span className="field-label">Specialist on call</span><small id="specialist-fatigue">{(campaign.specialistFatigue[specialist] ?? 0) >= SPECIALIST_EXHAUSTED_AT
            ? `${namedSpecialists[specialist].name} is at fatigue ${campaign.specialistFatigue[specialist]} of 6, where the specialist bonus no longer applies. Deploying someone else lets them rest.`
            : `Fatigue carries between campaign operations; a rested specialist recovers faster than one on duty. At ${SPECIALIST_EXHAUSTED_AT} of 6 the specialist's +1 on their own sources no longer applies.`}</small></label>
          <select id="specialist" aria-label="Deploy specialist" aria-describedby="specialist-fatigue" value={specialist} onChange={event => setSpecialist(event.target.value as SpecialistId)}>
            {(Object.keys(specialists) as SpecialistId[]).map(id => <option key={id} value={id}>{namedSpecialists[id].name}, {specialists[id].title.toLowerCase()}, fatigue {campaign.specialistFatigue[id] ?? 0}/6</option>)}
          </select>
          <p><strong>{namedSpecialists[specialist].name} / {namedSpecialists[specialist].callsign}</strong>, {specialists[specialist].title}, {specialists[specialist].role}, fatigue {campaign.specialistFatigue[specialist] ?? 0} of 6. {specialists[specialist].ability} Rapport with {namedSpecialists[specialist].name} {campaign.specialistBonds[specialist] ?? 35}/100: it grows with each operation together, and the team&apos;s average shapes how the campaign ends.</p>
        </div>
        <details className="advanced-setup">
          <summary><Settings2 size={16} /> Advanced operation settings <span>{gameModes[mode].title}</span></summary>
          <div className="mode-picker">
            <span className="eyebrow">Operation mode</span>
            <div>{(Object.keys(gameModes) as GameMode[]).map(id => <button key={id} className={mode === id ? "active" : ""} aria-pressed={mode === id} onClick={() => setMode(id)}><strong>{gameModes[id].title}</strong><small>{gameModes[id].description}</small></button>)}</div>
            {/* Whether a mode counts toward the campaign, and whether the campaign
                reaches into it, was nowhere on screen. */}
            <p className="muted small mode-campaign-note">{mode === "campaign"
              ? "Campaign standing — leadership trust, readiness, unresolved access and the route — shapes this operation, and its result counts toward the campaign."
              : `This operation's result counts toward the campaign, with ${gameModes[mode].reward}× the experience. Your unlocked capabilities and team carry into it; trust, readiness, unresolved access and the route's modifiers do not.${mode === "daily" ? " Daily operation is today's case, the same for every commander." : ""}`}</p>
          </div>
          <div className="challenge-console">
            <div><span className="eyebrow">Scenario code</span><button onClick={generateSeed}><RefreshCw size={14} /> New seed</button></div>
            <code>{challengeCode ?? "Preparing code"}</code>
            <p className="muted small">A code reproduces the incident, its variant and its dice. Daily operation plays today’s code; an ordinary campaign operation draws a fresh incident unless you load a code or generate a seed, which applies to the next operation you begin. Campaign standing is not part of a code, so two commands at different seniority will see different modifiers from the same code.</p>
            <div className="challenge-load"><input aria-label="Challenge code" value={challengeInput} onChange={event => setChallengeInput(event.target.value)} placeholder="Enter a BC challenge code" /><button onClick={loadChallengeCode}>Load</button></div>
            {challengeMessage && <p aria-live="polite">{challengeMessage}</p>}
          </div>
          <div className="setup-controls">
            <div className="guided-control">
              <div><label htmlFor="guided-start">Guided reflection</label><small>Strategic prompts, never the correct card.</small></div>
              <Switch id="guided-start" checked={guided} onCheckedChange={setGuided} />
            </div>
            <div className="guided-control">
              <div><label htmlFor="fast-start">Fast resolution</label><small>Resolve routine actions inline after the tutorial.</small></div>
              <Switch id="fast-start" checked={fastResolve} onCheckedChange={setFastResolve} />
            </div>
            <div className="guided-control bot-setup-control">
              <Bot size={19} aria-hidden="true" />
              <div><label htmlFor="bot-start">Bot commander</label><small>Watch a local rule-based operator play. Practice runs do not save or award campaign progress.</small></div>
              <Switch id="bot-start" checked={botEnabled} onCheckedChange={setBotEnabled} />
            </div>
          </div>
        </details>
        {savedSession && (
          <section className="resume-card">
            <div><span><strong>Investigation saved</strong><small>{scenarios[savedSession.game.scenario].title}, turn {savedSession.game.turns.length}, impact {savedSession.game.impact}</small></span></div>
            <div className="resume-actions">
              <button onClick={() => resume(savedSession)}>Resume</button>
              <button onClick={clearStoredSession}>Discard</button>
            </div>
          </section>
        )}
        {/* With an operation saved, the button that stays in view resumes it. On a
            laptop the saved card sat under the sticky Begin button, which replaced
            the save without a word. */}
        {savedSession ? <>
          <button className="primary-button start-button" onClick={() => resume(savedSession)}>Resume “{scenarios[savedSession.game.scenario].title}”</button>
          <button className="secondary-button begin-instead" onClick={() => start()}>Begin a new investigation instead</button>
          <p className="replace-note">Beginning a new investigation replaces the saved one.</p>
        </> : <button className="primary-button start-button" onClick={() => start()}>Begin investigation</button>}
        <div className="mission-meta"><span>20–35 minutes solo</span><span>No real systems</span></div>
      </section>
      <p className="adaptation-note">An unofficial solo adaptation inspired by <a href="https://www.blackhillsinfosec.com/tools/backdoorsandbreaches/" target="_blank" rel="noreferrer">Backdoors &amp; Breaches</a>. Original scenarios and card text. Rule-based computer facilitator.</p>
    </main>
  );
}
