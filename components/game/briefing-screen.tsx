import type { CSSProperties } from "react";
import { ArrowRight, Bot, Clock3, Dices, GitBranch, LockKeyhole, RefreshCw, Settings2, Star, Trophy } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { stageIcons } from "@/components/game/stage-icons";
import { difficulties, gameModes, scenarios, specialists, stages, type Difficulty, type GameMode, type SpecialistId } from "@/lib/advanced-game";
import { campaignRank } from "@/lib/campaign";
import { namedSpecialists } from "@/lib/phase8";
import type { GameSession } from "@/hooks/use-game-session";

export function BriefingScreen({ session }: { session: GameSession }) {
  const {
    campaign, currentAct, currentRoute, finalEnding,
    scenarioChoice, setScenarioChoice, activeScenario, ScenarioIcon, previewVariant,
    difficulty, setDifficulty, specialist, setSpecialist, mode, setMode,
    challengeCode, challengeInput, setChallengeInput, challengeMessage, loadChallengeCode, generateSeed,
    guided, setGuided, fastResolve, setFastResolve,
    botEnabled, setBotEnabled,
    savedSession, resume, clearStoredSession, start,
  } = session;

  return (
    <main className="briefing-screen" id="main-content">
      <div className="briefing-main">
        <div className="eyebrow"><span className="status-beacon" /> INCIDENT RESPONSE SIMULATION</div>
        <h1>Find the breach.<br /><span>Outthink the adversary.</span></h1>
        <p className="intro">You lead the investigation. The computer adapts the hidden attack chain, escalates sector-specific consequences and reacts to intervention.</p>
        <div className="briefing-chain" aria-label="Four attack stages">
          {stages.map((stage, index) => {
            const Icon = stageIcons[index];
            return <div key={stage.name} style={{ "--stage-color": stage.color } as CSSProperties}><Icon size={22} /><span>{stage.short}</span><small>0{index + 1}</small></div>;
          })}
        </div>
        <div className="first-move"><Dices size={20} /><p>Form a hypothesis, test evidence, command the response.</p></div>
        {/* On a phone the assignment panel, and the start button inside it, sit two
            screens below the introduction, behind the campaign record. This puts the
            first move on the first screen: resume the saved operation, or start the
            selected assignment. Wider layouts show the panel beside the introduction
            and hide the strip. */}
        <section className="phone-quick-start" aria-label="Quick start">
          {savedSession ? (
            <button className="primary-button" onClick={() => resume(savedSession)}>Resume {scenarios[savedSession.game.scenario].title} <ArrowRight size={18} /></button>
          ) : (
            <button className="primary-button" onClick={() => start()}>Start {activeScenario.title} <ArrowRight size={18} /></button>
          )}
          <small>{savedSession ? `Turn ${savedSession.game.turns.length} saved` : `${difficulties[difficulty].title} · ${namedSpecialists[specialist].name}`} · or choose the assignment below</small>
        </section>
        <section className="career-card" aria-label="Command career progression">
          <div><span className="eyebrow">COMMAND CAREER</span><strong>{campaignRank(campaign.xp)}</strong><small>{campaign.completed.length}/{scenarios.length} incidents · trust {campaign.leadershipTrust} · readiness {campaign.readiness}</small></div>
          <b>{campaign.xp}<small> XP</small></b>
          <div className="career-progress"><span style={{ width: `${Math.min(100, campaign.xp / 8)}%` }} /></div>
        </section>
        <section className="campaign-act-card"><span className="act-number">ACT {currentAct.number}</span><div><strong>{currentAct.title}</strong><p>{currentAct.detail}</p><small>{campaign.unresolvedThreads} unresolved campaign thread{campaign.unresolvedThreads === 1 ? "" : "s"}</small></div></section>
        <section className="campaign-route-card"><GitBranch size={19} /><div><span className="eyebrow">CAMPAIGN DIRECTOR · {currentRoute.title.toUpperCase()}</span><strong>{currentRoute.order}</strong><p>{currentRoute.consequence}</p></div></section>
        {finalEnding && <section className="campaign-ending"><Trophy size={20} /><div><span className="eyebrow">CAMPAIGN CONCLUSION</span><strong>{finalEnding.title}</strong><p>{finalEnding.detail}</p></div></section>}
      </div>
      <section className="mission-panel">
        <div className="panel-top"><span className="eyebrow">YOUR NEXT ASSIGNMENT</span><span className="mono muted">{String(scenarioChoice + 1).padStart(2, "0")} / {String(scenarios.length).padStart(2, "0")}</span></div>
        <div className="mission-symbol"><ScenarioIcon size={33} strokeWidth={1.4} /><span>{activeScenario.sector}</span></div>
        <h2>{activeScenario.title}</h2>
        <p>{activeScenario.summary}</p>
        {previewVariant && <div className="variant-brief"><span className="eyebrow">AUTHORED VARIANT</span><strong>{previewVariant.title}</strong><p>{previewVariant.briefing}</p><small>{previewVariant.modifier}</small></div>}
        <div className="mission-selector" aria-label="Select incident">
          {scenarios.map((scenario, index) => <button key={scenario.id} aria-label={`${scenario.title}${campaign.completed.includes(index) ? `, completed, ${campaign.mastery[String(index)] ?? 0} mastery stars` : ""}`} aria-pressed={scenarioChoice === index} className={`${scenarioChoice === index ? "active" : ""} ${campaign.completed.includes(index) ? "completed" : ""}`} onClick={() => setScenarioChoice(index)}><span>{String(index + 1).padStart(2, "0")}</span>{campaign.completed.includes(index) && <small>{Array.from({ length: campaign.mastery[String(index)] ?? 0 }).map((_, star) => <Star key={star} size={8} fill="currentColor" />)}</small>}</button>)}
        </div>
        <div className="difficulty-picker">
          <span className="eyebrow">DIFFICULTY</span>
          <div>{(Object.keys(difficulties) as Difficulty[]).map(id => <button key={id} className={difficulty === id ? "active" : ""} aria-pressed={difficulty === id} onClick={() => setDifficulty(id)}><strong>{difficulties[id].title}</strong><small>{difficulties[id].maxTurns} turns · {difficulties[id].threshold}+</small></button>)}</div>
          <p>{difficulties[difficulty].description}</p>
        </div>
        <div className="specialist-picker">
          <label htmlFor="specialist"><span className="eyebrow">DEPLOY SPECIALIST</span><small id="specialist-fatigue">Fatigue carries between campaign operations.</small></label>
          <select id="specialist" aria-label="Deploy specialist" aria-describedby="specialist-fatigue" value={specialist} onChange={event => setSpecialist(event.target.value as SpecialistId)}>
            {(Object.keys(specialists) as SpecialistId[]).map(id => <option key={id} value={id}>{namedSpecialists[id].name} · {specialists[id].title} · fatigue {campaign.specialistFatigue[id] ?? 0}/6</option>)}
          </select>
          <p><strong>{namedSpecialists[specialist].name} / {namedSpecialists[specialist].callsign}</strong> · {specialists[specialist].role}. {specialists[specialist].ability} Cohesion {campaign.specialistBonds[specialist] ?? 35}/100.</p>
        </div>
        <details className="advanced-setup">
          <summary><Settings2 size={16} /> Advanced operation settings <span>{gameModes[mode].title}</span></summary>
          <div className="mode-picker">
            <span className="eyebrow">OPERATION MODE</span>
            <div>{(Object.keys(gameModes) as GameMode[]).map(id => <button key={id} className={mode === id ? "active" : ""} aria-pressed={mode === id} onClick={() => setMode(id)}><strong>{gameModes[id].title}</strong><small>{gameModes[id].description}</small></button>)}</div>
          </div>
          <div className="challenge-console">
            <div><span className="eyebrow">SCENARIO CODE</span><button onClick={generateSeed}><RefreshCw size={14} /> New seed</button></div>
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
            <div><Clock3 size={19} /><span><strong>Investigation saved</strong><small>{scenarios[savedSession.game.scenario].title} · Turn {savedSession.game.turns.length} · {savedSession.game.impact} impact</small></span></div>
            <div className="resume-actions">
              <button onClick={() => resume(savedSession)}>Resume</button>
              <button onClick={clearStoredSession}>Discard</button>
            </div>
          </section>
        )}
        <button className="primary-button start-button" onClick={() => start()}>Begin investigation <ArrowRight size={19} /></button>
        <div className="mission-meta"><span><Clock3 size={14} /> 20–35 minutes solo</span><span><LockKeyhole size={14} /> No real systems</span></div>
      </section>
      <p className="adaptation-note">An unofficial solo adaptation inspired by <a href="https://www.blackhillsinfosec.com/tools/backdoorsandbreaches/" target="_blank" rel="noreferrer">Backdoors &amp; Breaches</a>. Original scenarios and card text. Rule-based computer facilitator.</p>
    </main>
  );
}
