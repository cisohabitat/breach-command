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
import { register, type MessageKey } from "@/lib/i18n";

register(briefingScreenMessages);

// What each stage of the chain answers, in the words a newcomer would ask it.
const stageQuestions: readonly MessageKey[] = ["briefingScreen.howTheyGot", "briefingScreen.whereTheyWent", "briefingScreen.howTheyStay", "briefingScreen.whatLeavesAnd"];

export function BriefingScreen({ session }: { session: GameSession }) {
  const { t, rich } = useMessages();
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
            return <li key={stage.name} style={{ "--stage-color": stage.color } as CSSProperties}><span className="chain-index">{String(index + 1)}</span><strong>{stage.short}</strong><small>{t(stageQuestions[index])}</small></li>;
          })}
        </ol>
        {/* On a phone the assignment panel, and the start button inside it, sit two
            screens below the introduction, behind the campaign record. This puts the
            first move on the first screen: resume the saved operation, or start the
            selected assignment. Wider layouts show the panel beside the introduction
            and hide the strip. */}
        <section className="phone-quick-start" aria-label={t("briefingScreen.quickStart")}>
          {savedSession ? (
            <button className="primary-button" onClick={() => resume(savedSession)}>{t("briefingScreen.resume3", { scenariosTitle: scenarios[savedSession.game.scenario].title })}</button>
          ) : (
            <button className="primary-button" onClick={() => start()}>{t("briefingScreen.start2", { activeScenarioTitle: activeScenario.title })}</button>
          )}
          <small>{savedSession ? t("briefingScreen.turnSaved", { turns: savedSession.game.turns.length }) : `${difficulties[difficulty].title}, ${namedSpecialists[specialist].name}`}{t("briefingScreen.orChooseThe")}</small>
        </section>
        {/* Where a returning player left off and what the review suggested, as a
            line of the record with the way to set it up. A save in progress is
            the first move instead, so this waits until there is none. */}
        {lastOperation && !savedSession && (
          <section className="last-operation" aria-label={t("briefingScreen.lastOperation")}>
            <span className="field-label">{t("briefingScreen.lastOperation3", { describeWhen: describeWhen(lastOperation.endedAt) })}</span>
            <p>{t("briefingScreen.caseAt", { scenario: lastOperation.scenario + 1, scenariosTitle: scenarios[lastOperation.scenario].title, difficultiesTitle: difficulties[lastOperation.difficulty].title, ending: lastOperation.ending.toLowerCase() })}{lastOperation.outcome === "lost" ? "" : `, ${lastOperation.score} of 100`}.</p>
            <p><strong>{t("briefingScreen.suggestedNext2", { nextTitle: lastOperation.next.title })}</strong> {lastOperation.next.reason}</p>
            {(scenarioChoice !== lastOperation.next.scenario || difficulty !== lastOperation.next.difficulty) && <button className="text-action" onClick={() => playRecommended(lastOperation.next)}>{t("briefingScreen.setUpThe")}</button>}
          </section>
        )}
        {/* A finished operation set up for the Bot Commander to play again. */}
        {replay && (
          <section className="last-operation" aria-label={t("briefingScreen.replaySetUp")}>
            <span className="field-label">{t("briefingScreen.replaySetUp")}</span>
            <p>{t("briefingScreen.theBotCommander2", { scenario: replay.scenario + 1, scenariosTitle: scenarios[replay.scenario].title, difficultiesTitle: difficulties[replay.difficulty].title })}</p>
          </section>
        )}
        {/* The personal record: every operation this device played to an end,
            and whether reading the route is improving. */}
        {ledger.length > 0 && (() => {
          const trend = hypothesisTrend(ledger);
          return (
            <section className="last-operation" aria-label={t("briefingScreen.yourRecord")}>
              <span className="field-label">{t("briefingScreen.yourRecord")}</span>
              <p>{t("briefingScreen.operation2Plural", { count: ledger.length })}{t("briefingScreen.recordedWonOr", { count: ledger.filter(entry => entry.outcome !== "lost").length })}{trend.recentCount === 1 ? "operation" : `${trend.recentCount}`}: {trend.recent}{t("briefingScreen.of10")}{trend.before === null ? "" : t("briefingScreen.againstOverThe", { before: trend.before })}.</p>
              <button className="text-action" onClick={() => downloadText("breach-command-record.csv", ledgerCsv(ledger, index => scenarios[index].title), "text/csv")}>{t("briefingScreen.downloadRecord")}</button>
            </section>
          );
        })()}
        <section className="career-card" aria-label={t("briefingScreen.commandCareerProgression")}>
          <div><span className="field-label">{t("briefingScreen.yourCommandRecord")}</span><strong>{campaignRank(campaign.xp)}</strong><small>{t("briefingScreen.incidentsTrustReadiness", { completed: campaign.completed.length, scenarios: scenarios.length, leadershipTrust: campaign.leadershipTrust, readiness: campaign.readiness })}</small><details className="standing-effects"><summary>{t("briefingScreen.whatTrustAnd")}</summary><small>{standingEffects(campaign).join(" ")}</small></details></div>
          <b><small>{t("briefingScreen.experience")}</small>{campaign.xp}</b>
          <div className="career-progress"><span style={{ width: `${Math.min(100, campaign.xp / 8)}%` }} /></div>
        </section>
        <section className="campaign-act-card"><span className="act-number">{t("briefingScreen.act2", { number: currentAct.number })}</span><div><strong>{currentAct.title}</strong><p>{currentAct.detail}</p>{!finalEnding && <p className="act-briefing">{t("briefingScreen.director2", { briefing: currentStory.briefing })}</p>}{!finalEnding && currentStory.development && <p className="act-briefing">{t("briefingScreen.sinceThen2", { development: currentStory.development })}</p>}<small>{t("briefingScreen.unresolvedAccess2", { unresolvedThreads: campaign.unresolvedThreads })}{campaign.unresolvedThreads ? t("briefingScreen.eachStartsLater") : ""}</small></div></section>
        <section className="campaign-route-card"><div><span className="field-label">{t("briefingScreen.campaignRoute2", { currentRouteTitle: currentRoute.title })}</span><strong>{currentRoute.order}</strong><p>{currentRoute.consequence}</p></div></section>
        {finalEnding && <section className="campaign-ending"><div><span className="field-label">{t("briefingScreen.campaignConclusion")}</span><strong>{finalEnding.title}</strong><p>{finalEnding.detail}</p></div></section>}
      </div>
      <section className="mission-panel">
        {/* The assignment is a dispatch slip: a form number, then the case as a
            row of form cells, then what it is about. The pitch beside it is a
            note, not a hero. */}
        <div className="eyebrow slip-form">{rich("briefingScreen.formBc0012", {  }, { span: chunk => <span className="separator">{chunk}</span> })}</div>
        <dl className="form-row on-desk">
          <div><dt>{t("briefingScreen.case2")}</dt><dd>{t("briefingScreen.of2", { scenarioChoice: scenarioChoice + 1, scenarios: scenarios.length })}</dd></div>
          <div><dt>{t("briefingScreen.sector")}</dt><dd>{activeScenario.sector}</dd></div>
          <div><dt>{t("briefingScreen.status")}</dt><dd className={campaign.completed.includes(scenarioChoice) ? "" : "open"}>{campaign.completed.includes(scenarioChoice) ? t("briefingScreen.cleared") : t("briefingScreen.open")}</dd></div>
        </dl>
        <h2>{activeScenario.title}</h2>
        <p>{activeScenario.summary}</p>
        {(() => {
          // The case's mastery ladder: the rungs climbed and the next one to try.
          const climbed = ladderRungs.filter(rung => (campaign.ladder?.[String(scenarioChoice)] ?? []).includes(rung.id));
          const nextRung = ladderRungs.find(rung => !climbed.includes(rung));
          return <p className="slip-ladder">{t("briefingScreen.masteryLadderOf", { climbed: climbed.length, ladderRungs: ladderRungs.length })}{climbed.length ? `: ${climbed.map(rung => lowerFirst(rung.title)).join(", ")}` : ""}.{nextRung ? t("briefingScreen.next", { nextRungDetail: lowerFirst(nextRung.detail) }) : t("briefingScreen.everyRungClimbed")}</p>;
        })()}
        {previewVariant && <div className="variant-brief"><p className="variant-line"><span className="variant-label">{t("briefingScreen.amended")}</span> <strong>{previewVariant.title}.</strong> <small>{previewVariant.modifier}</small></p><p>{previewVariant.briefing}</p></div>}
        <div className="mission-selector" aria-label={t("briefingScreen.selectIncident")}>
          {scenarios.map((scenario, index) => <button key={scenario.id} aria-label={campaign.completed.includes(index) ? t("briefingScreen.completedMastery", { title: scenario.title, count: campaign.mastery[String(index)] ?? 0 }) : scenario.title} aria-pressed={scenarioChoice === index} className={`${scenarioChoice === index ? "active" : ""} ${campaign.completed.includes(index) ? "completed" : ""}`} onClick={() => setScenarioChoice(index)}><span>{String(index + 1)}</span>{campaign.completed.includes(index) && <small aria-hidden="true">{"|".repeat(campaign.mastery[String(index)] ?? 0)}</small>}</button>)}
        </div>
        <div className="difficulty-picker">
          <span className="field-label">{t("briefingScreen.difficulty")}</span>
          <div>{(Object.keys(difficulties) as Difficulty[]).map(id => <button key={id} className={difficulty === id ? "active" : ""} aria-pressed={difficulty === id} onClick={() => setDifficulty(id)}><strong>{difficulties[id].title}</strong><small>{t("briefingScreen.turnsRollsNeed2", { maxTurns: difficulties[id].maxTurns, threshold: difficulties[id].threshold })}</small></button>)}</div>
          <p>{difficulties[difficulty].description}</p>
        </div>
        <div className="specialist-picker">
          {/* A ruled list with a radio mark, set as the difficulty is: a boxed
              select with the platform's chevron was the one stock control left
              on the slip. */}
          <div className="specialist-head"><span className="field-label">{t("briefingScreen.specialistOnCall")}</span><small id="specialist-fatigue">{(campaign.specialistFatigue[specialist] ?? 0) >= SPECIALIST_EXHAUSTED_AT
            ? t("briefingScreen.isAtFatigue", { namedSpecialistsName: namedSpecialists[specialist].name, specialistFatigue: campaign.specialistFatigue[specialist] })
            : t("briefingScreen.fatigueCarriesBetween", { specialistExhaustedAt: SPECIALIST_EXHAUSTED_AT })}</small></div>
          <div className="difficulty-picker specialist-roster">
            <div role="group" aria-label={t("briefingScreen.deploySpecialist")} aria-describedby="specialist-fatigue">{(Object.keys(specialists) as SpecialistId[]).map(id => <button key={id} className={specialist === id ? "active" : ""} aria-pressed={specialist === id} onClick={() => setSpecialist(id)}><strong>{namedSpecialists[id].name}</strong><small>{specialists[id].title}{t("briefingScreen.fatigueOf6", { specialistFatigue: campaign.specialistFatigue[id] ?? 0 })}</small></button>)}</div>
          </div>
          <p><strong>{namedSpecialists[specialist].name} / {namedSpecialists[specialist].callsign}</strong>, {specialists[specialist].title}, {specialists[specialist].role}{t("briefingScreen.fatigueOf62", { specialistFatigue: campaign.specialistFatigue[specialist] ?? 0 })}{specialists[specialist].ability}{t("briefingScreen.rapportWithOf", { namedSpecialistsName: namedSpecialists[specialist].name, specialistBonds: campaign.specialistBonds[specialist] ?? 35 })}</p>
        </div>
        <details className="advanced-setup">
          <summary>{rich("briefingScreen.advancedOperationSettings2", { gameModesTitle: gameModes[mode].title }, { span: chunk => <span>{chunk}</span> })}</summary>
          <div className="mode-picker">
            <span className="eyebrow">{t("briefingScreen.operationMode")}</span>
            <div>{(Object.keys(gameModes) as GameMode[]).map(id => <button key={id} className={mode === id ? "active" : ""} aria-pressed={mode === id} onClick={() => setMode(id)}><strong>{gameModes[id].title}</strong><small>{gameModes[id].description}</small></button>)}</div>
            {/* Whether a mode counts toward the campaign, and whether the campaign
                reaches into it, was nowhere on screen. */}
            <p className="muted small mode-campaign-note">{mode === "campaign"
              ? t("briefingScreen.campaignStandingLeadership")
              : <>{t("briefingScreen.thisOperationS", { reward: gameModes[mode].reward })}{mode === "daily" ? t("briefingScreen.dailyOperationIs") : ""}</>}</p>
          </div>
          <div className="challenge-console">
            <div><span className="eyebrow">{t("briefingScreen.scenarioCode")}</span><button onClick={generateSeed}><RefreshCw size={14} />{t("briefingScreen.newSeed")}</button></div>
            <code>{challengeCode ?? t("briefingScreen.preparingCode")}</code>
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
            <div><span><strong>{t("briefingScreen.investigationSaved")}</strong><small>{t("briefingScreen.turnImpact", { scenariosTitle: scenarios[savedSession.game.scenario].title, turns: savedSession.game.turns.length, impact: savedSession.game.impact })}</small></span></div>
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
          <button className="primary-button start-button" onClick={() => resume(savedSession)}>{t("briefingScreen.resume3", { scenariosTitle: scenarios[savedSession.game.scenario].title })}</button>
          <button className="secondary-button begin-instead" onClick={() => start()}>{t("briefingScreen.beginNewInvestigation")}</button>
          <p className="replace-note">{t("briefingScreen.beginningNewInvestigation")}</p>
        </> : <button className="primary-button start-button" onClick={() => start()}>{t("briefingScreen.beginInvestigation")}</button>}
        <div className="mission-meta"><span>{t("briefingScreen.2035MinutesSolo")}</span><span>{t("briefingScreen.noRealSystems")}</span></div>
      </section>
      <p className="adaptation-note">{rich("briefingScreen.anUnofficialSolo2", { version: process.env.NEXT_PUBLIC_APP_VERSION ?? "", build: process.env.NEXT_PUBLIC_BUILD_ID ?? "" }, { a: chunk => <a href="https://www.blackhillsinfosec.com/tools/backdoorsandbreaches/" target="_blank" rel="noreferrer">{chunk}</a>, span: chunk => <span className="nowrap build-version">{chunk}</span> })}</p>
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
