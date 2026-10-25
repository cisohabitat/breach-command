import { SpecialistPortrait, StoryArt } from "./story-art";
import { useEffect, useState, type CSSProperties } from "react";
import { SectorIllustration } from "./sector-illustration";
import { Bot, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import dynamic from "next/dynamic";
import { loadGame } from "@/lib/game-loader";
import { difficulties, scenarios, stages, type Difficulty } from "@/lib/scenarios";
import { SPECIALIST_EXHAUSTED_AT, gameModes, namedSpecialists, specialists, type GameMode, type SpecialistId } from "@/lib/command-systems";
import { campaignRank, standingEffects } from "@/lib/campaign";
import { describeWhen } from "@/lib/last-operation";
import { withForm } from "@/lib/i18n/message";
import { useMessages } from "@/hooks/use-messages";
import { hypothesisTrend, ledgerCsv } from "@/lib/ledger";
import { ladderRungs } from "@/lib/campaign";
import type { GameSession } from "@/hooks/use-game-session";
import { briefingScreenMessages } from "@/lib/i18n/en/briefing-screen";
import { register, type MessageKey } from "@/lib/i18n";

register(briefingScreenMessages);

const DiscardDialog = dynamic(() => loadGame().then(m => m.DiscardDialog), { ssr: false });

// What each stage of the chain answers, in the words a newcomer would ask it.
const stageQuestions: readonly MessageKey[] = ["briefingScreen.howTheyGot", "briefingScreen.whereTheyWent", "briefingScreen.howTheyStay", "briefingScreen.whatLeavesAnd"];

export function BriefingScreen({ session }: { session: GameSession }) {
  const { t, rich, say, locale } = useMessages("briefingScreen");
  const {
    campaign, assignmentCampaign, currentAct, currentStory, currentRoute, finalEnding,
    scenarioChoice, setScenarioChoice, activeScenario, previewVariant,
    difficulty, setDifficulty, specialist, setSpecialist, mode, setMode,
    challengeCode, challengeInput, setChallengeInput, challengeMessage, loadChallengeCode, generateSeed,
    guided, setGuided, fastResolve, setFastResolve,
    botEnabled, setBotEnabled,
    savedSession, resume, discardSavedSession, start, lastOperation, playRecommended, ledger, replay,
  } = session;
  const [choosingAnother, setChoosingAnother] = useState(false);
  // Discarding cannot be undone and, past the first turn, costs the campaign a loss.
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const showAssignment = !savedSession || choosingAnother;
  const ResumeHeading = showAssignment ? "h2" : "h1";
  useEffect(() => {
    if (choosingAnother) document.getElementById("assignment-panel")?.focus();
  }, [choosingAnother]);

  return (
    <main className="briefing-screen" id="main-content" aria-busy={session.checkingResume} style={session.checkingResume ? { visibility: "hidden" } : undefined}>
      {savedSession && <section className="resume-card resume-primary" aria-labelledby="saved-operation-title">
        <div>
          <span className="field-label">{t("investigationSaved")}</span>
          <ResumeHeading id="saved-operation-title">{scenarios[savedSession.game.scenario].title}</ResumeHeading>
          <p>{t("resumeProgress", { difficulty: difficulties[savedSession.game.difficulty].title, turns: savedSession.game.turns.length, confirmed: savedSession.game.revealed.length, impact: savedSession.game.impact })}</p>
          <p>{t(savedSession.game.status === "response" ? "resumeResponse" : savedSession.game.pendingDecision ? "resumeEvidence" : savedSession.game.pendingCommand ? "resumeCommand" : savedSession.game.pendingSetPiece ? "resumeSector" : "resumeInvestigation")}</p>
          <button className="primary-button" onClick={() => resume(savedSession)}>{t("resume3", { scenariosTitle: scenarios[savedSession.game.scenario].title })}</button>
        </div>
        <div className="resume-actions">
          <button className="text-action" aria-expanded={showAssignment} aria-controls="assignment-panel" onClick={() => setChoosingAnother(value => !value)}>{t(showAssignment ? "hideOtherSetup" : "startAnother")}</button>
          <button className="text-action" onClick={() => setConfirmDiscard(true)}>{t("discard")}</button>
          <p>{t("beginningNewInvestigation")}</p>
        </div>
        {confirmDiscard && <DiscardDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} turns={savedSession.game.turns.length} onDiscard={discardSavedSession} />}
      </section>}
      {showAssignment && <div className="briefing-main">
        <p className="desk-line">{t("soloTabletop")}</p>
        <h1>{t("youHaveThe")}</h1>
        <p className="tagline">{t("tagline")}</p>
        <p className="intro">{t("anIntruderHas")}</p>
        <ol className="briefing-chain" aria-label={t("theFourStages")}>
          {stages.map((stage, index) => {
            return <li key={stage.name} style={{ "--stage-color": stage.color } as CSSProperties}><span className="chain-index">{String(index + 1)}</span><strong>{stage.short}</strong><small>{t(stageQuestions[index])}</small></li>;
          })}
        </ol>
        {/* On a phone the assignment panel, and the start button inside it, sit two
            screens below the introduction, behind the campaign record. This puts the
            first move on the first screen: resume the saved operation, or start the
            selected assignment. Wider layouts show the panel beside the introduction
            and hide the strip. */}
        {!savedSession && <section className="phone-quick-start" aria-label={t("quickStart")}>
            <button className="primary-button" onClick={() => start()}>{t("start2", { activeScenarioTitle: activeScenario.title })}</button>
          <small>{`${difficulties[difficulty].title}, ${namedSpecialists[specialist].name}`}{t("orChooseThe")}</small>
        </section>}
        {/* Where a returning player left off and what the review suggested, as a
            line of the record with the way to set it up. A save in progress is
            the first move instead, so this waits until there is none. */}
        {lastOperation && !savedSession && (
          <section className="last-operation" aria-label={t("lastOperation")}>
            <span className="field-label">{t("lastOperation3", { describeWhen: say(describeWhen(lastOperation.endedAt, undefined, locale)) })}</span>
            <p>{t("caseAt", { scenario: lastOperation.scenario + 1, scenariosTitle: scenarios[lastOperation.scenario].title, difficultiesTitle: difficulties[lastOperation.difficulty].title, ending: say(withForm(lastOperation.ending, "lower")) })}{lastOperation.outcome === "lost" ? "" : t("scoreOf100", { score: lastOperation.score })}.</p>
            <p><strong>{t("suggestedNext2", { nextTitle: say(lastOperation.next.title) })}</strong> {say(lastOperation.next.reason)}</p>
            {(scenarioChoice !== lastOperation.next.scenario || difficulty !== lastOperation.next.difficulty) && <button className="text-action" onClick={() => playRecommended(lastOperation.next)}>{t("setUpThe")}</button>}
          </section>
        )}
        {/* A finished operation set up for the Bot Commander to play again. */}
        {replay && (
          <section className="last-operation" aria-label={t("replaySetUp")}>
            <span className="field-label">{t("replaySetUp")}</span>
            <p>{t("theBotCommander2", { scenario: replay.scenario + 1, scenariosTitle: scenarios[replay.scenario].title, difficultiesTitle: difficulties[replay.difficulty].title })}</p>
          </section>
        )}
        {/* The personal record: every operation this device played to an end,
            and whether reading the route is improving. */}
        {ledger.length > 0 && (() => {
          const trend = hypothesisTrend(ledger);
          return (
            <section className="last-operation" aria-label={t("yourRecord")}>
              <span className="field-label">{t("yourRecord")}</span>
              <p>{t("operation2Plural", { count: ledger.length })}{t("recordedWonOr", { count: ledger.filter(entry => entry.outcome !== "lost").length })}{t("accuracyOver", { count: trend.recentCount, recent: trend.recent ?? "" })}{trend.before === null ? "" : t("againstOverThe", { before: trend.before })}.</p>
              <button className="text-action" onClick={() => downloadText("breach-command-record.csv", ledgerCsv(ledger, index => scenarios[index].title), "text/csv")}>{t("downloadRecord")}</button>
            </section>
          );
        })()}
        <section className="career-card" aria-label={t("commandCareerProgression")}>
          <div><span className="field-label">{t("yourCommandRecord")}</span><strong>{campaignRank(campaign.xp)}</strong><small>{t("incidentsTrustReadiness", { completed: campaign.completed.length, scenarios: scenarios.length, leadershipTrust: campaign.leadershipTrust, readiness: campaign.readiness })}</small><details className="standing-effects"><summary>{t("whatTrustAnd")}</summary><small>{standingEffects(campaign).map(line => say(line)).join(" ")}</small></details></div>
          <b><small>{t("experience")}</small>{campaign.xp}</b>
          <div className="career-progress"><span style={{ width: `${Math.min(100, campaign.xp / 8)}%` }} /></div>
        </section>
        <section className="campaign-act-card"><StoryArt kind="campaign" name={`act-${currentAct.number}`} /><span className="act-number">{t("act2", { number: currentAct.number })}</span><div><strong>{currentAct.title}</strong><p>{currentAct.detail}</p>{!finalEnding && <p className="act-briefing">{t("director2", { briefing: currentStory.briefing })}</p>}{!finalEnding && currentStory.development && <p className="act-briefing">{t("sinceThen2", { development: currentStory.development })}</p>}<small>{t("unresolvedAccess2", { unresolvedThreads: campaign.unresolvedThreads })}{campaign.unresolvedThreads ? t("eachStartsLater") : ""}</small></div></section>
        <section className="campaign-route-card"><div><span className="field-label">{t("campaignRoute2", { currentRouteTitle: currentRoute.title })}</span><strong>{currentRoute.order}</strong><p>{currentRoute.consequence}</p></div></section>
        {finalEnding && <section className="campaign-ending"><div><span className="field-label">{t("campaignConclusion")}</span><strong>{finalEnding.title}</strong><p>{say(finalEnding.detail)}</p></div><StoryArt kind="campaign" name={`ending-${finalEnding.id}`} /></section>}
      </div>}
      <section className="mission-panel" id="assignment-panel" tabIndex={-1} hidden={!showAssignment} style={showAssignment ? undefined : { display: "none" }}>{showAssignment && <>
        {/* The assignment is a dispatch slip: a form number, then the case as a
            row of form cells, then what it is about. The pitch beside it is a
            note, not a hero. */}
        <div className="eyebrow slip-form">{rich("formBc0012", {  }, { span: chunk => <span className="separator">{chunk}</span> })}</div>
        <dl className="form-row on-desk">
          <div><dt>{t("case2")}</dt><dd>{t("of2", { scenarioChoice: scenarioChoice + 1, scenarios: scenarios.length })}</dd></div>
          <div><dt>{t("sector")}</dt><dd>{activeScenario.sector}</dd></div>
          <div><dt>{t("status")}</dt><dd className={campaign.completed.includes(scenarioChoice) ? "" : "open"}>{campaign.completed.includes(scenarioChoice) ? t("cleared") : t("open")}</dd></div>
        </dl>
        <h2>{activeScenario.title}</h2>
        <SectorIllustration scenarioId={activeScenario.id} />
        <p>{activeScenario.summary}</p>
        {(() => {
          if (!campaign.completed.includes(scenarioChoice)) return <p className="slip-ladder">{t("firstGoal")}</p>;
          // The case's mastery ladder: the rungs climbed and the next one to try.
          const climbed = ladderRungs.filter(rung => (campaign.ladder?.[String(scenarioChoice)] ?? []).includes(rung.id));
          const nextRung = ladderRungs.find(rung => !climbed.includes(rung));
          return <p className="slip-ladder">{t("masteryLadderOf", { climbed: climbed.length, ladderRungs: ladderRungs.length })}{climbed.length ? `: ${climbed.map(rung => lowerFirst(rung.title)).join(", ")}` : ""}.{nextRung ? t("next", { nextRungDetail: lowerFirst(nextRung.detail) }) : t("everyRungClimbed")}</p>;
        })()}
        {previewVariant && <div className="variant-brief"><p className="variant-line"><span className="variant-label">{t("amended")}</span> <strong>{say(previewVariant.title)}.</strong> <small>{say(previewVariant.modifier)}</small></p><p>{say(previewVariant.briefing)}</p></div>}
        <div className="mission-selector" aria-label={t("selectIncident")}>
          {scenarios.map((scenario, index) => <button key={scenario.id} aria-label={campaign.completed.includes(index) ? t("completedMastery", { title: scenario.title, count: campaign.mastery[String(index)] ?? 0 }) : scenario.title} aria-pressed={scenarioChoice === index} className={`${scenarioChoice === index ? "active" : ""} ${campaign.completed.includes(index) ? "completed" : ""}`} onClick={() => setScenarioChoice(index)}><span>{String(index + 1)}</span>{campaign.completed.includes(index) && <small aria-hidden="true">{"|".repeat(campaign.mastery[String(index)] ?? 0)}</small>}</button>)}
        </div>
        <div className="difficulty-picker">
          <span className="field-label">{t("difficulty")}</span>
          <div>{(Object.keys(difficulties) as Difficulty[]).map(id => <button key={id} className={difficulty === id ? "active" : ""} aria-pressed={difficulty === id} onClick={() => setDifficulty(id)}><strong>{difficulties[id].title}</strong><small>{t("turnsRollsNeed2", { maxTurns: difficulties[id].maxTurns, threshold: difficulties[id].threshold })}</small></button>)}</div>
          <p>{difficulties[difficulty].description}</p>
        </div>
        <div className="specialist-picker">
          {/* A ruled list with a radio mark, set as the difficulty is: a boxed
              select with the platform's chevron was the one stock control left
              on the slip. */}
          <div className="specialist-head"><span className="field-label">{t("specialistOnCall")}</span><small id="specialist-fatigue">{(assignmentCampaign.specialistFatigue[specialist] ?? 0) >= SPECIALIST_EXHAUSTED_AT
            ? t("isAtFatigue", { namedSpecialistsName: namedSpecialists[specialist].name, specialistFatigue: assignmentCampaign.specialistFatigue[specialist] })
            : t("fatigueCarriesBetween", { specialistExhaustedAt: SPECIALIST_EXHAUSTED_AT })}</small></div>
          <div className="difficulty-picker specialist-roster">
            <div role="group" aria-label={t("deploySpecialist")} aria-describedby="specialist-fatigue">{(Object.keys(specialists) as SpecialistId[]).map(id => <button key={id} className={specialist === id ? "active" : ""} aria-pressed={specialist === id} onClick={() => setSpecialist(id)}><strong className="specialist-name"><SpecialistPortrait specialist={id} />{namedSpecialists[id].name}</strong><small>{specialists[id].title}{t("fatigueOf6", { specialistFatigue: assignmentCampaign.specialistFatigue[id] ?? 0 })}</small></button>)}</div>
          </div>
          <p><strong>{namedSpecialists[specialist].name} / {namedSpecialists[specialist].callsign}</strong>, {specialists[specialist].title}, {specialists[specialist].role}{t("fatigueOf62", { specialistFatigue: assignmentCampaign.specialistFatigue[specialist] ?? 0 })}{specialists[specialist].ability}{t("rapportWithOf", { namedSpecialistsName: namedSpecialists[specialist].name, specialistBonds: assignmentCampaign.specialistBonds[specialist] ?? 35 })}</p>
        </div>
        <details className="advanced-setup">
          <summary>{rich("advancedOperationSettings2", { gameModesTitle: gameModes[mode].title }, { span: chunk => <span>{chunk}</span> })}</summary>
          <div className="mode-picker">
            <span className="eyebrow">{t("operationMode")}</span>
            <div>{(Object.keys(gameModes) as GameMode[]).map(id => <button key={id} className={mode === id ? "active" : ""} aria-pressed={mode === id} onClick={() => setMode(id)}><strong>{gameModes[id].title}</strong><small>{gameModes[id].description}</small></button>)}</div>
            {/* Whether a mode counts toward the campaign, and whether the campaign
                reaches into it, was nowhere on screen. */}
            <p className="muted small mode-campaign-note">{mode === "campaign"
              ? t("campaignStandingLeadership")
              : <>{t("thisOperationS", { reward: gameModes[mode].reward })}{mode === "daily" ? t("dailyOperationIs") : ""}</>}</p>
          </div>
          <div className="challenge-console">
            <div><span className="eyebrow">{t("scenarioCode")}</span><button onClick={generateSeed}><RefreshCw size={14} />{t("newSeed")}</button></div>
            <code>{challengeCode ?? t("preparingCode")}</code>
            <p className="muted small">{t("aCodeReproduces")}</p>
            <div className="challenge-load"><input aria-label={t("challengeCode")} value={challengeInput} onChange={event => setChallengeInput(event.target.value)} placeholder={t("enterBcChallenge")} /><button onClick={loadChallengeCode}>{t("load")}</button></div>
            {challengeMessage && <p aria-live="polite">{say(challengeMessage)}</p>}
          </div>
          <div className="setup-controls">
            <div className="guided-control">
              <div><label htmlFor="guided-start">{t("guidedReflection")}</label><small>{t("strategicPromptsNever")}</small></div>
              <Switch id="guided-start" checked={guided} onCheckedChange={setGuided} />
            </div>
            <div className="guided-control">
              <div><label htmlFor="fast-start">{t("fastResolution")}</label><small>{t("resolveRoutineActions")}</small></div>
              <Switch id="fast-start" checked={fastResolve} onCheckedChange={setFastResolve} />
            </div>
            <div className="guided-control bot-setup-control">
              <Bot size={19} aria-hidden="true" />
              <div><label htmlFor="bot-start">{t("botCommander")}</label><small>{t("watchLocalRule")}</small></div>
              <Switch id="bot-start" checked={botEnabled} onCheckedChange={setBotEnabled} />
            </div>
          </div>
        </details>
        {/* With an operation saved, the button that stays in view resumes it. On a
            laptop the saved card sat under the sticky Begin button, which replaced
            the save without a word. */}
        {savedSession ? <>
          <button className="primary-button start-button begin-instead" onClick={() => start()}>{t("beginNewInvestigation")}</button>
          <p className="replace-note">{t("beginningNewInvestigation")}</p>
        </> : <button className="primary-button start-button" onClick={() => start()}>{t("beginInvestigation")}</button>}
        <div className="mission-meta"><span>{t("2035MinutesSolo")}</span><span>{t("noRealSystems")}</span></div>
      </>}</section>
      <p className="colophon">{rich("colophon", { version: process.env.NEXT_PUBLIC_APP_VERSION ?? "", build: process.env.NEXT_PUBLIC_BUILD_ID ?? "" }, { b: chunk => <strong>{chunk}</strong>, span: chunk => <span className="nowrap build-version">{chunk}</span> })}</p>
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
