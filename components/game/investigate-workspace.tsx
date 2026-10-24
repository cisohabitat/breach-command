import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowDown, ArrowRight, X } from "lucide-react";
import { EvidenceWorkspace } from "@/components/game/evidence-workspace";
import { HypothesisBoard } from "@/components/game/hypothesis-board";
import { InfrastructureConsole } from "@/components/game/infrastructure-console";
import { KnownFacts } from "@/components/game/known-facts";
import { ProcedureGrid } from "@/components/game/procedure-grid";
import { SpecialistTransmission } from "@/components/game/living-incident";
import { OWN_SOURCE_BONUS, cooldownWindow, getCoachPrompt, getKnownFacts, getMapHint, procedureIntensities, procedureScopes, readyForTheory, readyToCorrelate, type Game, type HypothesisId } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { Glossed } from "@/components/game/glossed";
import { useMessages } from "@/hooks/use-messages";
import { investigateWorkspaceMessages } from "@/lib/i18n/en/investigate-workspace";
import { register } from "@/lib/i18n";
import { CaptainVoice } from "./captain-voice-lazy";

register(investigateWorkspaceMessages);

// Whether the layout is a phone's. The server renders the wide layout, with the
// reference column open, and a phone folds it once it has hydrated.
const PHONE = "(max-width: 650px)";
const subscribePhone = (onChange: () => void) => {
  const query = window.matchMedia(PHONE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export function InvestigateWorkspace({ session }: { session: GameSession }) {
  const { t, rich, say } = useMessages("investigateWorkspace");
  const {
    game, guided, guidance, trainingPrompt, rolling, fastResolve, actionScope, actionIntensity,
    inlineReport, setInlineReport, pendingUndo, undo,
    focusInfrastructure, mapAction, chooseHypothesis, correlate, chooseCaseTheory, run, setSelected, setActiveWorkspace,
  } = session;

  // On a phone the reference column — what is known, the map, the specialist and
  // the evidence workspace — is most of the page's height, and it sat between a
  // player and nothing they needed every turn. It folds there behind a summary
  // that carries what it holds; wider layouts show it beside the actions.
  const phone = useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE).matches, () => false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [location, setLocation] = useState<{ node: string; finding: Game["evidence"][number] } | null>(null);
  useEffect(() => {
    if (!location) return;
    const timer = window.setTimeout(() => setLocation(null), 5000);
    return () => window.clearTimeout(timer);
  }, [location]);

  // Declaring a reading collapses the four premises to a bar, and the browser
  // kept the page where the tapped card had been: on a phone the procedures
  // heading ended above the screen and the first cards under the tabs. The page
  // moves so the heading sits just below the tabs, unless it is already in view.
  const declare = (id: HypothesisId) => {
    chooseHypothesis(id);
    // From 901px the procedures sit beside the reading in a panel of their own.
    if (window.matchMedia("(min-width: 901px)").matches) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const section = document.querySelector<HTMLElement>(".procedure-section");
      if (!section) return;
      const tabs = document.querySelector(".workspace-tabs")?.getBoundingClientRect().bottom ?? 0;
      const top = section.getBoundingClientRect().top;
      if (top >= tabs && top < window.innerHeight / 2) return;
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: window.scrollY + top - tabs - 8, behavior: still ? "auto" : "smooth" });
    }));
  };

  if (!game) return null;

  // The evidence workspace and the infrastructure map sit in the reference
  // column, where no playtest found them unprompted. The guided Training opening
  // folds it on every width; a note that asks for one of
  // them takes the player there: it opens what is folded and moves focus to it.
  const jumpTo = (selector: string, focusSelector = selector) => {
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) return;
    const findings = target.querySelector<HTMLDetailsElement>("details.evidence-detail");
    if (findings) findings.open = true;
    const theory = target.querySelector<HTMLDetailsElement>("details.theory-guide");
    if (theory && readyForTheory(game)) theory.open = true;
    setReferenceOpen(true);
    // The fold opens on the next render, so the scroll waits a frame for it.
    requestAnimationFrame(() => {
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: focusSelector === selector ? "start" : "center" });
      document.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
    });
  };
  const evidenceReady = readyForTheory(game) || readyToCorrelate(game);
  const opening = guidance === "training" && game.turns.length < 2 && !evidenceReady;
  const referenceFolded = phone || opening;
  // The sector decision comes after the second turn; it is named until the next procedure.
  const sectorRecorded = game.turns.length === 2 && !game.pendingSetPiece ? game.setPieceHistory.at(-1) ?? null : null;
  // Beyond Training there is no clue, and the prompt once sent the player to
  // Command to read what they were reasoning from. The latest observation is
  // already on the record, so it is quoted where the reading is chosen.
  const latestObservation = game.difficulty !== "training" ? getKnownFacts(game).observations.at(-1) ?? null : null;
  const evidenceButton = evidenceReady && <button className="compare-findings next-action" onClick={() => jumpTo(".evidence-workspace")}>{readyForTheory(game) ? t("recordACase") : t("compareFindings")} <ArrowDown size={14} /></button>;
  // The map is offered as an aside to the ordinary next step, never in place of
  // it, and not alongside a note that is already sending the player elsewhere.
  const mapHint = !opening && !evidenceReady ? getMapHint(game) : null;
  const mapAside = mapHint && <small className="prompt-aside">{say(mapHint)}<button className="compare-findings" onClick={() => jumpTo(".infrastructure-console")}>{t("openTheMap")}<ArrowDown size={14} /></button></small>;

  // After the opening lesson, keep the next action, clue and usable sources
  // visible; disclose the longer explanation when the player wants it.
  const foldWhy = trainingPrompt?.step !== "declare";
  const trainingNote = trainingPrompt && (
    <div className={`guide-nudge training-prompt step-${trainingPrompt.step}`}>
            <span>
        <strong>{say(trainingPrompt.title)}{/[?.!]$/.test(say(trainingPrompt.title)) ? "" : "."}</strong>{foldWhy
          ? <> <details className="prompt-why"><summary>{t("why")}</summary>{say(trainingPrompt.detail)}</details></>
          : <> {t("readingDefinition")}</>}
        {trainingPrompt.clue && <b className="prompt-clue">{t("whatTheTeam")}<Glossed text={trainingPrompt.clue} /></b>}
        {!!trainingPrompt.sources.length && <b className="prompt-sources">{trainingPrompt.sources.map(source => source.title).join(", ")}</b>}
        {(trainingPrompt.step === "theory" || trainingPrompt.step === "correlate") && evidenceButton}
        {trainingPrompt.step === "test" && mapAside}
      </span>
    </div>
  );

  return (
    <div className="investigation-dashboard">
      {/* The reading leads, because every procedure is gated on it. The actions come
          next and the reference material after, so the grid a player touches every
          turn is not six screens below the fold on a phone. */}
      <div className="investigation-lead">
        {/* Until a reading is declared, the prompt and its clue are what the choice
            is made from, so they sit above the four readings rather than below
            them; once one is declared they move back beside the procedures. */}
        {!game.hypothesis && !game.pendingCommand && !game.pendingSetPiece && trainingNote}
        {/* Beyond Training the first reading was chosen with nothing above the four
            premises to base it on; the latest observation is what there is. */}
        {!game.hypothesis && !trainingNote && latestObservation && !game.pendingCommand && !game.pendingSetPiece && (
          <div className="guide-nudge"><span><strong>{t("chooseTheReading")}</strong><b className="prompt-clue">{t("latestFromThe")}<Glossed text={latestObservation} /></b></span></div>
        )}
        {!game.pendingCommand && !game.pendingSetPiece && <HypothesisBoard game={game} onChoose={declare} />}
        {/* The board and the procedures step aside while a decision waits, and the
            column was left empty with only a tab badge saying why. */}
        {(game.pendingCommand || game.pendingSetPiece) && (
          <div className="guide-nudge decision-waiting" role="status"><span><strong>A {game.pendingSetPiece ? t("sectorDecision") : t("commandEvent")}{t("isWaitingOn")}</strong>{t("resolveItThere")}<button className="compare-findings" onClick={() => setActiveWorkspace("command")}>{t("goToCommand")}<ArrowRight size={14} /></button></span></div>
        )}
      </div>
      <details className={`investigation-context reference-fold${opening ? " opening-reference" : ""}`} open={!referenceFolded || referenceOpen} onToggle={event => referenceFolded && setReferenceOpen(event.currentTarget.open)}>
        <summary>{t("mapEvidenceAnd")}<span>{t("mapActionPlural", { count: game.mapActionsRemaining })}, {game.evidence.length ? t("ofFindingsConfirmed", { count: game.evidence.filter(item => item.supports).length, evidence: game.evidence.length }) : t("noFindingsYet")}{t("compared2", { correlations: game.correlations.length })}</span></summary>
        {!game.pendingCommand && !game.pendingSetPiece && <KnownFacts game={game} />}
        <InfrastructureConsole game={game} highlightedNode={location && game.evidence.includes(location.finding) ? location.node : null} blocked={!!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onFocus={focusInfrastructure} onAction={mapAction} />
        <SpecialistTransmission game={game} />
        <EvidenceWorkspace game={game} onLocate={(node, finding) => {
          setLocation({ node, finding });
          jumpTo(`#infrastructure-node-${node}`, ".infrastructure-console");
        }} onCorrelate={correlate} onTheory={chooseCaseTheory} voiceEnabled={session.voiceEnabled && !session.botRun && !session.settings && !session.rules && !session.newConfirm && !session.report && !session.selected && !session.rolling && !session.missionBriefing && !session.debrief && !session.tutorial} voiceHistory={session.voiceHistory} />
      </details>
      <div className="investigation-actions" role="region" aria-label={t("investigationActions")} tabIndex={0}>
        {inlineReport && (
          <section className={`inline-result ${inlineReport.success ? "success" : "failure"}`} aria-live="polite">
            <div>
              <span className="eyebrow">{t("turnQuickResult", { number: inlineReport.number })}</span>
              <strong>{inlineReport.success ? t("procedureSucceeded") : t("procedureUnsuccessful")}{t("total2", { total: inlineReport.total })}</strong>
              <p>{say(inlineReport.narrative)}</p>
            </div>
            <button onClick={() => setInlineReport(null)} aria-label={t("dismissQuickResult")}><X size={18} /></button>
          </section>
        )}
        {pendingUndo && (
          <section className="undo-strip" role="status">
            <div><span className="eyebrow">{t("lastAction")}</span><strong>{say(pendingUndo.label)}</strong></div>
            <button onClick={undo}>{t("undo")}</button>
          </section>
        )}
        {!game.pendingCommand && !game.pendingSetPiece && (
          <section className="procedure-section">
            <div className="section-heading">
              <div><h2>{t("investigationProcedures")}</h2>{/* The rule is read once; after the first turn the cards' countdowns carry it,
                  and on a laptop its four lines held the first card below the panel's edge. */}{game.turns.length === 0 && <p>{t("oneActionPer")}{cooldownWindow(game) === 3 ? t("twoTurns") : t("threeTurns")}{t("itsCardCounts")}</p>}</div>
              <span className="established-key">{t("planScope", { procedureScopesTitle: procedureScopes[actionScope].title.toLowerCase(), procedureIntensitiesTitle: procedureIntensities[actionIntensity].title.toLowerCase() })}</span>
            </div>
            {/* A sector decision sends the player straight back here; without a line
                saying it was recorded, a playtest compared the meters to find out.
                It is a line under the heading, not a ruled strip above it, which
                set the two columns' headings sixty pixels apart. */}
            {sectorRecorded && <p className="recorded-line" role="status">{rich("sectorDecisionRecorded2", { sectorRecordedTitle: say(sectorRecorded.title) }, { strong: chunk => <strong>{chunk}</strong> })}</p>}
            {/* One next step above the cards, not three: until a reading exists, the
                hint that unlocks them; then the Training prompt where there is one,
                or the Captain's prompt. Stacked, they put the first card below the
                fold on a desktop. */}
            {!game.hypothesis
              ? !trainingNote && <div className="guide-nudge hypothesis-gate" role="status"><span>{rich("strongRecordA", {  }, { strong: chunk => <strong>{chunk}</strong> })}{game.difficulty === "training" ? t("whatTheTeam2") : t("whatYouKnow")}{t("itsOwnSources2", { ownSourceBonus: OWN_SOURCE_BONUS })}</span></div>
              : trainingNote
                ? trainingNote
                : guidance !== "off" && <div className="guide-nudge"><span><strong>{t("captainPrompt")}</strong> {say(getCoachPrompt(game, guided))}{latestObservation && <b className="prompt-clue">{t("latestFromThe")}<Glossed text={latestObservation} /></b>}{evidenceButton}{mapAside}</span></div>}
            <ProcedureGrid game={game} disabled={rolling || !game.hypothesis} reportOpen={!!session.report} receipt={session.procedureReceipt} onChoose={id => fastResolve && game.turns.length > 0 ? run(id) : setSelected(id)} />
          </section>
        )}
        {!!game.decisions.length && session.voiceDecision.current === game.decisions.length && !session.botRun && <CaptainVoice cue={{ game, beat: "decision" }} enabled={session.voiceEnabled && !session.report && !session.settings && !session.rules && !session.debrief && !session.newConfirm && !game.pendingCommand && !game.pendingSetPiece} history={session.voiceHistory} />}
      </div>
    </div>
  );
}
