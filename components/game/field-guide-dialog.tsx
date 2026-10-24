import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { glossary } from "@/lib/i18n/shared-text";
import type { GameSession } from "@/hooks/use-game-session";
import { useMessages } from "@/hooks/use-messages";
import { fieldGuideDialogMessages } from "@/lib/i18n/en/field-guide-dialog";
import { register } from "@/lib/i18n";

register(fieldGuideDialogMessages);

export function FieldGuideDialog({ session }: { session: GameSession }) {
  const { glossaryTerms, plainLanguage } = glossary();
  const { t, rich } = useMessages("fieldGuideDialog");
  const { rules, setRules } = session;

  return (
    <Dialog open={rules} onOpenChange={setRules}>
      <DialogContent className="game-dialog wide-dialog paper-dialog">
        <DialogHeader><div className="eyebrow">{rich("formBc0022", {  }, { span: chunk => <span className="separator">{chunk}</span>, span2: chunk => <span>{chunk}</span> })}</div><DialogTitle>{t("howAnOperation")}</DialogTitle><DialogDescription>{t("aCompleteSolo")}</DialogDescription></DialogHeader>
        <div className="rules-content">
          <section className="quick-start-guide" aria-label={t("briefingScreen.quickStart")}>
            <div><span>1</span><p>{rich("strongFormA", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p></div>
            <div><span>2</span><p>{rich("strongTestIt", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p></div>
            <div><span>3</span><p>{rich("strongDecideStrong", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p></div>
            <div><span>4</span><p>{rich("strongRespondStrong", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p></div>
          </section>
          <section className="plain-language" aria-label={t("plainLanguage")}>
            <h3>{t("plainLanguage")}</h3>
            <p>{t("theInterfaceUses")}</p>
            <dl>
              {Object.entries(plainLanguage).map(([term, meaning]) => (
                <div key={term}><dt>{glossaryTerms[term]}</dt><dd>{meaning}</dd></div>
              ))}
            </dl>
          </section>
          <div className="rules-grid">
            <section><h3>{t("objective")}</h3><p>{t("revealFourHidden")}</p></section>
            <section><h3>{t("hypothesesEvidence")}</h3><p>{t("recordOneExplanation")}</p></section>
            <section><h3>{t("adaptiveAdversary")}</h3><p>{t("theActorEscalates")}</p></section>
            <section><h3>{t("contextualDecisions")}</h3><p>{t("eachDiscoveryOffers")}</p></section>
            <section><h3>{t("consequences")}</h3><p>{t("evidenceDecisionsDescribe")}</p></section>
            <section><h3>{t("scoreRecovery")}</h3><p>{t("the100PointReview")}</p></section>
            <section><h3>{t("savedSessions")}</h3><p>{t("yourCurrentInvestigation")}</p></section>
            <section><h3>{t("briefingScreen.fastResolution")}</h3><p>{t("afterTurnOne")}</p></section>
            <section><h3>{t("commandEvents")}</h3><p>{t("operationalInterruptionsTest")}</p></section>
            <section><h3>{t("campaignProgression")}</h3><p>{t("completedIncidentsBest")}</p></section>
            <section><h3>{t("sectorCondition")}</h3><p>{t("everySectorHas")}</p></section>
            <section><h3>{t("teamDeployment")}</h3><p>{t("selectOneSpecialist")}</p></section>
            <section><h3>{t("scopeIntensity")}</h3><p>{t("focusedChecksAre")}</p></section>
            <section><h3>{t("advancedModes")}</h3><p>{t("dailyWeeklyIronman")}</p></section>
            <section><h3>{t("infrastructureActions")}</h3><p>{t("selectingNodeChanges")}</p></section>
            <section><h3>{t("evidenceCorrelation")}</h3><p>{t("successfulProceduresPreserve")}</p></section>
            <section><h3>{t("sectorSetPieces")}</h3><p>{t("eachIncidentHas")}</p></section>
            <section><h3>{t("campaignActs")}</h3><p>{t("tenIncidentsForm")}</p></section>
            <section><h3>{t("evidenceWorkspace.caseTheory")}</h3><p>{t("declareWhatThe")}</p></section>
            <section><h3>{t("campaignDirector")}</h3><p>{t("yourCommandPosture")}</p></section>
            <section><h3>{t("mitreAttCk")}</h3><p>{t("everyTechniqueIn")}</p></section>
            <section><h3>{t("runningItWith")}</h3><p>{rich("theAEducator", {  }, { a: chunk => <a href="/educators" target="_blank" rel="noopener">{chunk}</a> })}</p></section>
            <section><h3>{t("portableBackup")}</h3><p>{t("settingsCanExport")}</p></section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
