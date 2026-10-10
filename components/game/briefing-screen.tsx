import type { CSSProperties } from "react";
import { Bot, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SPECIALIST_EXHAUSTED_AT, difficulties, gameModes, scenarios, specialists, stages, type Difficulty, type GameMode, type SpecialistId } from "@/lib/advanced-game";
import { campaignRank, standingEffects } from "@/lib/campaign";
import { namedSpecialists } from "@/lib/phase8";
import { describeWhen } from "@/lib/last-operation";
import { useMessages } from "@/hooks/use-messages";
import { hypothesisTrend, ledgerCsv } from "@/lib/ledger";
import { ladderRungs } from "@/lib/campaign";
import type { GameSession } from "@/hooks/use-game-session";
import { briefingScreenMessages } from "@/lib/i18n/en/briefing-screen";
import { register } from "@/lib/i18n";

register(briefingScreenMessages);

// What each stage of the chain answers, in the words a newcomer would ask it.
const stageQuestions = ["How they got in", "Where they went, and as whom", "How they stay", "What leaves, and how"];

export function BriefingScreen({ session }: { session: GameSession }) {
  const { t } = useMessages();
  const {
    campaign, currentAct, currentStory, currentRoute, finalEnding,
    scenarioChoice, setScenarioChoice, activeScenario, previewVariant,
    difficulty, setDifficulty, specialist, setSpecialist, mode, setMode,
    challengeCode, challengeInput, setChallengeInput, challengeMessage, loadChallengeCode, generateSeed,
    guided, setGuided, fastResolve, setFastResolve,
    botEnabled, setBotEnabled,
    savedSession, resume, clearStoredSession, start, lastOperation, playRecommended, ledger, replay,
  } = session;

  return (
    <main className="briefing-screen" id="main-content">
      <div className="briefing-main">
        <p className="desk-line">{t("briefingScreen.incidentDeskSingle")}</p>
        <h1>{t("briefingScreen.youHaveThe")}</h1>
        <p className="intro">{t("briefingScreen.anIntruderHas")}</p>
        <ol className="briefing-chain" aria-label={t("briefingScreen.theFourStages")}>
          {stages.map((stage, index) => {
            return <li key={stage.name} style={{ "--stage-color": stage.color } as CSSProperties}><span className="chain-index">{String(index + 1)}</span><strong>{stage.short}</strong><small>{stageQuestions[index]}</small></li>;
          })}
        </ol>
        {/* On a phone the assignment panel, and the start button inside it, sit two
            screens below the introduction, behind the campaign record. This puts the
            first move on the first screen: resume the saved operation, or start the
            selected assignment. Wider layouts show the panel beside the introduction
            and hide the strip. */}
        <section className="phone-quick-start" aria-label={t("briefingScreen.quickStart")}>
          {savedSession ? (
            <button className="primary-button" onClick={() => resume(savedSession)}>{t("briefingScreen.resume")}{scenarios[savedSession.game.scenario].title}”</button>
          ) : (
            <button className="primary-button" onClick={() => start()}>{t("briefingScreen.start")}{activeScenario.title}”</button>
          )}
          <small>{savedSession ? `Turn ${savedSession.game.turns.length} saved` : `${difficulties[difficulty].title}, ${namedSpecialists[specialist].name}`}{t("briefingScreen.orChooseThe")}</small>
        </section>
        {/* Where a returning player left off and what the review suggested, as a
            line of the record with the way to set it up. A save in progress is
            the first move instead, so this waits until there is none. */}
        {lastOperation && !savedSession && (
          <section className="last-operation" aria-label={t("briefingScreen.lastOperation")}>
            <span className="field-label">{t("briefingScreen.lastOperation2")}{describeWhen(lastOperation.endedAt)}</span>
            <p>{t("briefingScreen.case")}{lastOperation.scenario + 1}, {scenarios[lastOperation.scenario].title}{t("briefingScreen.at")}{difficulties[lastOperation.difficulty].title}: {lastOperation.ending.toLowerCase()}{lastOperation.outcome === "lost" ? "" : `, ${lastOperation.score} of 100`}.</p>
            <p><strong>{t("briefingScreen.suggestedNext")}{lastOperation.next.title}.</strong> {lastOperation.next.reason}</p>
            {(scenarioChoice !== lastOperation.next.scenario || difficulty !== lastOperation.next.difficulty) && <button className="text-action" onClick={() => playRecommended(lastOperation.next)}>{t("briefingScreen.setUpThe")}</button>}
          </section>
        )}
        {/* A finished operation set up for the Bot Commander to play again. */}
        {replay && (
          <section className="last-operation" aria-label={t("briefingScreen.replaySetUp")}>
            <span className="field-label">{t("briefingScreen.replaySetUp")}</span>
            <p>{t("briefingScreen.theBotCommander")}{replay.scenario + 1}, {scenarios[replay.scenario].title}{t("briefingScreen.at")}{difficulties[replay.difficulty].title}{t("briefingScreen.onTheSame")}</p>
          </section>
        )}
        {/* The personal record: every operation this device played to an end,
            and whether reading the route is improving. */}
        {ledger.length > 0 && (() => {
          const trend = hypothesisTrend(ledger);
          return (
            <section className="last-operation" aria-label={t("briefingScreen.yourRecord")}>
              <span className="field-label">{t("briefingScreen.yourRecord")}</span>
              <p>{ledger.length}{t("briefingScreen.operation")}{ledger.length === 1 ? "" : "s"}{t("briefingScreen.recorded")}{ledger.filter(entry => entry.outcome !== "lost").length}{t("briefingScreen.wonOrStood")}{trend.recentCount === 1 ? "operation" : `${trend.recentCount}`}: {trend.recent}{t("briefingScreen.of10")}{trend.before === null ? "" : `, against ${trend.before} over the ten before`}.</p>
              <button className="text-action" onClick={() => downloadText("breach-command-record.csv", ledgerCsv(ledger, index => scenarios[index].title), "text/csv")}>{t("briefingScreen.downloadRecord")}</button>
            </section>
          );
        })()}
        <section className="career-card" aria-label={t("briefingScreen.commandCareerProgression")}>
          <div><span className="field-label">{t("briefingScreen.yourCommandRecord")}</span><strong>{campaignRank(campaign.xp)}</strong><small>{campaign.completed.length}/{scenarios.length}{t("briefingScreen.incidentsTrust")}{campaign.leadershipTrust}{t("briefingScreen.readiness")}{campaign.readiness}</small><details className="standing-effects"><summary>{t("briefingScreen.whatTrustAnd")}</summary><small>{standingEffects(campaign).join(" ")}</small></details></div>
          <b><small>{t("briefingScreen.experience")}</small>{campaign.xp}</b>
          <div className="career-progress"><span style={{ width: `${Math.min(100, campaign.xp / 8)}%` }} /></div>
        </section>
        <section className="campaign-act-card"><span className="act-number">{t("briefingScreen.act")}{currentAct.number}</span><div><strong>{currentAct.title}</strong><p>{currentAct.detail}</p>{!finalEnding && <p className="act-briefing">{t("briefingScreen.director")}{currentStory.briefing}</p>}{!finalEnding && currentStory.development && <p className="act-briefing">{t("briefingScreen.sinceThen")}{currentStory.development}</p>}<small>{campaign.unresolvedThreads}{t("briefingScreen.unresolvedAccess")}{campaign.unresolvedThreads ? " — each starts later operations under more pressure" : ""}</small></div></section>
        <section className="campaign-route-card"><div><span className="field-label">{t("briefingScreen.campaignRoute")}{currentRoute.title}</span><strong>{currentRoute.order}</strong><p>{currentRoute.consequence}</p></div></section>
        {finalEnding && <section className="campaign-ending"><div><span className="field-label">{t("briefingScreen.campaignConclusion")}</span><strong>{finalEnding.title}</strong><p>{finalEnding.detail}</p></div></section>}
      </div>
      <section className="mission-panel">
        {/* The assignment is a dispatch slip: a form number, then the case as a
            row of form cells, then what it is about. The pitch beside it is a
            note, not a hero. */}
        <div className="eyebrow slip-form">{t("briefingScreen.formBc001")}<span className="separator">/</span>{t("briefingScreen.assignment")}</div>
        <dl className="form-row on-desk">
          <div><dt>{t("briefingScreen.case2")}</dt><dd>{scenarioChoice + 1}{t("briefingScreen.of")}{scenarios.length}</dd></div>
          <div><dt>{t("briefingScreen.sector")}</dt><dd>{activeScenario.sector}</dd></div>
          <div><dt>{t("briefingScreen.status")}</dt><dd className={campaign.completed.includes(scenarioChoice) ? "" : "open"}>{campaign.completed.includes(scenarioChoice) ? "Cleared" : "Open"}</dd></div>
        </dl>
        <h2>{activeScenario.title}</h2>
        <p>{activeScenario.summary}</p>
        {(() => {
          // The case's mastery ladder: the rungs climbed and the next one to try.
          const climbed = ladderRungs.filter(rung => (campaign.ladder?.[String(scenarioChoice)] ?? []).includes(rung.id));
          const nextRung = ladderRungs.find(rung => !climbed.includes(rung));
          return <p className="slip-ladder">{t("briefingScreen.masteryLadder")}{climbed.length}{t("briefingScreen.of")}{ladderRungs.length}{climbed.length ? `: ${climbed.map(rung => lowerFirst(rung.title)).join(", ")}` : ""}.{nextRung ? ` Next: ${lowerFirst(nextRung.detail)}` : " Every rung climbed."}</p>;
        })()}
        {previewVariant && <div className="variant-brief"><p className="variant-line"><span className="variant-label">{t("briefingScreen.amended")}</span> <strong>{previewVariant.title}.</strong> <small>{previewVariant.modifier}</small></p><p>{previewVariant.briefing}</p></div>}
        <div className="mission-selector" aria-label={t("briefingScreen.selectIncident")}>
          {scenarios.map((scenario, index) => <button key={scenario.id} aria-label={`${scenario.title}${campaign.completed.includes(index) ? `, completed, ${campaign.mastery[String(index)] ?? 0} mastery star${(campaign.mastery[String(index)] ?? 0) === 1 ? "" : "s"}` : ""}`} aria-pressed={scenarioChoice === index} className={`${scenarioChoice === index ? "active" : ""} ${campaign.completed.includes(index) ? "completed" : ""}`} onClick={() => setScenarioChoice(index)}><span>{String(index + 1)}</span>{campaign.completed.includes(index) && <small aria-hidden="true">{"|".repeat(campaign.mastery[String(index)] ?? 0)}</small>}</button>)}
        </div>
        <div className="difficulty-picker">
          <span className="field-label">{t("briefingScreen.difficulty")}</span>
          <div>{(Object.keys(difficulties) as Difficulty[]).map(id => <button key={id} className={difficulty === id ? "active" : ""} aria-pressed={difficulty === id} onClick={() => setDifficulty(id)}><strong>{difficulties[id].title}</strong><small>{difficulties[id].maxTurns}{t("briefingScreen.turnsRollsNeed")}{difficulties[id].threshold}+</small></button>)}</div>
          <p>{difficulties[difficulty].description}</p>
        </div>
        <div className="specialist-picker">
          {/* A ruled list with a radio mark, set as the difficulty is: a boxed
              select with the platform's chevron was the one stock control left
              on the slip. */}
          <div className="specialist-head"><span className="field-label">{t("briefingScreen.specialistOnCall")}</span><small id="specialist-fatigue">{(campaign.specialistFatigue[specialist] ?? 0) >= SPECIALIST_EXHAUSTED_AT
            ? `${namedSpecialists[specialist].name} is at fatigue ${campaign.specialistFatigue[specialist]} of 6, where the specialist bonus no longer applies. Deploying someone else lets them rest.`
            : `Fatigue carries between campaign operations; a rested specialist recovers faster than one on duty. At ${SPECIALIST_EXHAUSTED_AT} of 6 the specialist's +1 on their own sources no longer applies.`}</small></div>
          <div className="difficulty-picker specialist-roster">
            <div role="group" aria-label={t("briefingScreen.deploySpecialist")} aria-describedby="specialist-fatigue">{(Object.keys(specialists) as SpecialistId[]).map(id => <button key={id} className={specialist === id ? "active" : ""} aria-pressed={specialist === id} onClick={() => setSpecialist(id)}><strong>{namedSpecialists[id].name}</strong><small>{specialists[id].title}{t("briefingScreen.fatigue")}{campaign.specialistFatigue[id] ?? 0}{t("briefingScreen.of6")}</small></button>)}</div>
          </div>
          <p><strong>{namedSpecialists[specialist].name} / {namedSpecialists[specialist].callsign}</strong>, {specialists[specialist].title}, {specialists[specialist].role}{t("briefingScreen.fatigue")}{campaign.specialistFatigue[specialist] ?? 0}{t("briefingScreen.of62")}{specialists[specialist].ability}{t("briefingScreen.rapportWith")}{namedSpecialists[specialist].name} {campaign.specialistBonds[specialist] ?? 35}{t("briefingScreen.of100ItGrows")}</p>
        </div>
        <details className="advanced-setup">
          <summary>{t("briefingScreen.advancedOperationSettings")}<span>{gameModes[mode].title}</span></summary>
          <div className="mode-picker">
            <span className="eyebrow">{t("briefingScreen.operationMode")}</span>
            <div>{(Object.keys(gameModes) as GameMode[]).map(id => <button key={id} className={mode === id ? "active" : ""} aria-pressed={mode === id} onClick={() => setMode(id)}><strong>{gameModes[id].title}</strong><small>{gameModes[id].description}</small></button>)}</div>
            {/* Whether a mode counts toward the campaign, and whether the campaign
                reaches into it, was nowhere on screen. */}
            <p className="muted small mode-campaign-note">{mode === "campaign"
              ? "Campaign standing — leadership trust, readiness, unresolved access and the route — shapes this operation, and its result counts toward the campaign."
              : `This operation's result counts toward the campaign, with ${gameModes[mode].reward}× the experience. Your unlocked capabilities and team carry into it; trust, readiness, unresolved access and the route's modifiers do not.${mode === "daily" ? " Daily operation is today's case, the same for every commander." : ""}`}</p>
          </div>
          <div className="challenge-console">
            <div><span className="eyebrow">{t("briefingScreen.scenarioCode")}</span><button onClick={generateSeed}><RefreshCw size={14} />{t("briefingScreen.newSeed")}</button></div>
            <code>{challengeCode ?? "Preparing code"}</code>
            <p className="muted small">{t("briefingScreen.aCodeReproduces")}</p>
            <div className="challenge-load"><input aria-label={t("briefingScreen.challengeCode")} value={challengeInput} onChange={event => setChallengeInput(event.target.value)} placeholder={t("briefingScreen.enterBcChallenge")} /><button onClick={loadChallengeCode}>{t("briefingScreen.load")}</button></div>
            {challengeMessage && <p aria-live="polite">{challengeMessage}</p>}
          </div>
          <div className="setup-controls">
            <div className="guided-control">
              <div><label htmlFor="guided-start">{t("briefingScreen.guidedReflection")}</label><small>{t("briefingScreen.strategicPromptsNever")}</small></div>
              <Switch id="guided-start" checked={guided} onCheckedChange={setGuided} />
            </div>
            <div className="guided-control">
              <div><label htmlFor="fast-start">{t("briefingScreen.fastResolution")}</label><small>{t("briefingScreen.resolveRoutineActions")}</small></div>
              <Switch id="fast-start" checked={fastResolve} onCheckedChange={setFastResolve} />
            </div>
            <div className="guided-control bot-setup-control">
              <Bot size={19} aria-hidden="true" />
              <div><label htmlFor="bot-start">{t("briefingScreen.botCommander")}</label><small>{t("briefingScreen.watchLocalRule")}</small></div>
              <Switch id="bot-start" checked={botEnabled} onCheckedChange={setBotEnabled} />
            </div>
          </div>
        </details>
        {savedSession && (
          <section className="resume-card">
            <div><span><strong>{t("briefingScreen.investigationSaved")}</strong><small>{scenarios[savedSession.game.scenario].title}{t("briefingScreen.turn")}{savedSession.game.turns.length}{t("briefingScreen.impact")}{savedSession.game.impact}</small></span></div>
            <div className="resume-actions">
              <button onClick={() => resume(savedSession)}>{t("briefingScreen.resume2")}</button>
              <button onClick={clearStoredSession}>{t("briefingScreen.discard")}</button>
            </div>
          </section>
        )}
        {/* With an operation saved, the button that stays in view resumes it. On a
            laptop the saved card sat under the sticky Begin button, which replaced
            the save without a word. */}
        {savedSession ? <>
          <button className="primary-button start-button" onClick={() => resume(savedSession)}>{t("briefingScreen.resume")}{scenarios[savedSession.game.scenario].title}”</button>
          <button className="secondary-button begin-instead" onClick={() => start()}>{t("briefingScreen.beginNewInvestigation")}</button>
          <p className="replace-note">{t("briefingScreen.beginningNewInvestigation")}</p>
        </> : <button className="primary-button start-button" onClick={() => start()}>{t("briefingScreen.beginInvestigation")}</button>}
        <div className="mission-meta"><span>{t("briefingScreen.2035MinutesSolo")}</span><span>{t("briefingScreen.noRealSystems")}</span></div>
      </section>
      <p className="adaptation-note">{t("briefingScreen.anUnofficialSolo")}<a href="https://www.blackhillsinfosec.com/tools/backdoorsandbreaches/" target="_blank" rel="noreferrer">{t("briefingScreen.backdoorsBreaches")}</a>{t("briefingScreen.originalScenariosAnd")}<span className="nowrap build-version">{t("footer.version", { version: process.env.NEXT_PUBLIC_APP_VERSION ?? "", build: process.env.NEXT_PUBLIC_BUILD_ID ?? "" })}</span></p>
    </main>
  );
}

// A text file the player keeps, made on the device.
function downloadText(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
