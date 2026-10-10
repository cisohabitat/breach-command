import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { plainLanguage } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { useMessages } from "@/hooks/use-messages";
import { fieldGuideDialogMessages } from "@/lib/i18n/en/field-guide-dialog";
import { register } from "@/lib/i18n";

register(fieldGuideDialogMessages);

export function FieldGuideDialog({ session }: { session: GameSession }) {
  const { t, rich } = useMessages();
  const { rules, setRules } = session;

  return (
    <Dialog open={rules} onOpenChange={setRules}>
      <DialogContent className="game-dialog wide-dialog paper-dialog">
        <DialogHeader><div className="eyebrow">{rich("fieldGuideDialog.formBc0022", {  }, { span: chunk => <span className="separator">{chunk}</span>, span2: chunk => <span>{chunk}</span> })}</div><DialogTitle>{t("fieldGuideDialog.howAnOperation")}</DialogTitle><DialogDescription>{t("fieldGuideDialog.aCompleteSolo")}</DialogDescription></DialogHeader>
        <div className="rules-content">
          <section className="quick-start-guide" aria-label={t("briefingScreen.quickStart")}>
            <div><span>1</span><p>{rich("fieldGuideDialog.strongFormA", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p></div>
            <div><span>2</span><p>{rich("fieldGuideDialog.strongTestIt", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p></div>
            <div><span>3</span><p>{rich("fieldGuideDialog.strongDecideStrong", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p></div>
            <div><span>4</span><p>{rich("fieldGuideDialog.strongRespondStrong", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p></div>
          </section>
          <section className="plain-language" aria-label={t("fieldGuideDialog.plainLanguage")}>
            <h3>{t("fieldGuideDialog.plainLanguage")}</h3>
            <p>{t("fieldGuideDialog.theInterfaceUses")}</p>
            <dl>
              {Object.entries(plainLanguage).map(([term, meaning]) => (
                <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>
              ))}
            </dl>
          </section>
          <div className="rules-grid">
            <section><h3>{t("fieldGuideDialog.objective")}</h3><p>{t("fieldGuideDialog.revealFourHidden")}</p></section>
            <section><h3>{t("fieldGuideDialog.hypothesesEvidence")}</h3><p>{t("fieldGuideDialog.recordOneExplanation")}</p></section>
            <section><h3>{t("fieldGuideDialog.adaptiveAdversary")}</h3><p>{t("fieldGuideDialog.theActorEscalates")}</p></section>
            <section><h3>{t("fieldGuideDialog.contextualDecisions")}</h3><p>{t("fieldGuideDialog.eachDiscoveryOffers")}</p></section>
            <section><h3>{t("fieldGuideDialog.consequences")}</h3><p>{t("fieldGuideDialog.evidenceDecisionsDescribe")}</p></section>
            <section><h3>{t("fieldGuideDialog.scoreRecovery")}</h3><p>{t("fieldGuideDialog.the100PointReview")}</p></section>
            <section><h3>{t("fieldGuideDialog.savedSessions")}</h3><p>{t("fieldGuideDialog.yourCurrentInvestigation")}</p></section>
            <section><h3>{t("briefingScreen.fastResolution")}</h3><p>{t("fieldGuideDialog.afterTurnOne")}</p></section>
            <section><h3>{t("fieldGuideDialog.commandEvents")}</h3><p>{t("fieldGuideDialog.operationalInterruptionsTest")}</p></section>
            <section><h3>{t("fieldGuideDialog.campaignProgression")}</h3><p>{t("fieldGuideDialog.completedIncidentsBest")}</p></section>
            <section><h3>{t("fieldGuideDialog.sectorCondition")}</h3><p>{t("fieldGuideDialog.everySectorHas")}</p></section>
            <section><h3>{t("fieldGuideDialog.teamDeployment")}</h3><p>{t("fieldGuideDialog.selectOneSpecialist")}</p></section>
            <section><h3>{t("fieldGuideDialog.scopeIntensity")}</h3><p>{t("fieldGuideDialog.focusedChecksAre")}</p></section>
            <section><h3>{t("fieldGuideDialog.advancedModes")}</h3><p>{t("fieldGuideDialog.dailyWeeklyIronman")}</p></section>
            <section><h3>{t("fieldGuideDialog.infrastructureActions")}</h3><p>{t("fieldGuideDialog.selectingNodeChanges")}</p></section>
            <section><h3>{t("fieldGuideDialog.evidenceCorrelation")}</h3><p>{t("fieldGuideDialog.successfulProceduresPreserve")}</p></section>
            <section><h3>{t("fieldGuideDialog.sectorSetPieces")}</h3><p>{t("fieldGuideDialog.eachIncidentHas")}</p></section>
            <section><h3>{t("fieldGuideDialog.campaignActs")}</h3><p>{t("fieldGuideDialog.tenIncidentsForm")}</p></section>
            <section><h3>{t("evidenceWorkspace.caseTheory")}</h3><p>{t("fieldGuideDialog.declareWhatThe")}</p></section>
            <section><h3>{t("fieldGuideDialog.campaignDirector")}</h3><p>{t("fieldGuideDialog.yourCommandPosture")}</p></section>
            <section><h3>{t("fieldGuideDialog.mitreAttCk")}</h3><p>{t("fieldGuideDialog.everyTechniqueIn")}</p></section>
            <section><h3>{t("fieldGuideDialog.runningItWith")}</h3><p>{rich("fieldGuideDialog.theAEducator", {  }, { a: chunk => <a href="/educators" target="_blank" rel="noopener">{chunk}</a> })}</p></section>
            <section><h3>{t("fieldGuideDialog.portableBackup")}</h3><p>{t("fieldGuideDialog.settingsCanExport")}</p></section>
          </div>
          <section className="attribution"><h3>{t("fieldGuideDialog.aboutThisAdaptation")}</h3><p>{t("fieldGuideDialog.inspiredByBackdoors")}</p><a href="https://www.blackhillsinfosec.com/wp-content/uploads/2024/03/BnB_VisualGuide_v2_03052024.pdf" target="_blank" rel="noreferrer">{t("fieldGuideDialog.readTheOfficial")}<ArrowRight size={14} /></a></section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
