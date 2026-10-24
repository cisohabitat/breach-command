import { expect, test } from "@playwright/test";
import { correlateEvidence } from "../../lib/advanced-game";
import { msg } from "../../lib/i18n/message";
import { openWithSave, pendingDecisionGame, responsePhaseGame, twoStagesGame } from "./fixtures";

test("final evidence decisions show no unusable future-roll benefits or penalties", async ({ page }) => {
  const response = responsePhaseGame();
  const final = response.decisions.at(-1)!;
  const game = { ...response, status: "playing" as const, pendingDecision: final.stage, decisions: response.decisions.slice(0, -1) };
  await openWithSave(page, game);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const report = page.locator(".report-dialog");
  await expect(report).toBeVisible();
  await expect(report).not.toContainText("Next roll");
  await report.locator("button[data-response]").first().click();
  await expect(report.getByRole("button", { name: "Enter response phase", exact: true })).toBeVisible();
  await expect(report).not.toContainText("Next roll");
  // Earlier decisions still describe their usable modifier.
  await openWithSave(page, pendingDecisionGame());
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(report).toContainText("Next roll");
});

test("response review ranks full points including sector and objective bonuses", async ({ page }) => {
  await openWithSave(page, { ...responsePhaseGame(), objective: "exfiltration" });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  for (let phase = 0; phase < 3; phase++) await page.locator(".response-options > button").nth(2).click();
  await page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/ }).click();
  await page.locator("#debrief-decisions > details > summary").click();
  const assurance = page.locator("#debrief-decisions p").filter({ hasText: /^Assurance:/ });
  await expect(assurance).toContainText("9 of a best 20");
  await expect(assurance).toContainText("Preserve business service evidence would have scored more here.");
});

test("saved record evidence and zero-reward assessments are rendered without invented relief", async ({ page }) => {
  const game = twoStagesGame();
  const empty = { ...game.evidence[0], id: "E3-cloud", turn: 3, supports: null, trace: undefined, title: msg("engine.evidence.emptyTitle", { source: game.evidence[0].source }) };
  let compared = { ...game, evidence: [...game.evidence, empty], impact: 5, objectiveProgress: 11 };
  for (const item of game.evidence) compared = correlateEvidence(compared, [item.id, empty.id], "coincidental");
  expect(compared.impact).toBe(5);
  expect(compared.objectiveProgress).toBe(11);
  await openWithSave(page, compared);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: /^Investigate/ }).click();
  const reference = page.locator(".reference-fold");
  if (!(await reference.evaluate(element => (element as HTMLDetailsElement).open))) await reference.locator(":scope > summary").click();
  const workspace = page.locator(".evidence-workspace");
  await expect(workspace).toContainText("Link not established");
  await expect(workspace.locator(".correlation-effect")).toHaveText([
    "Assessment recorded. The readouts and roll are unchanged.",
    "Assessment recorded. The readouts and roll are unchanged.",
  ]);
  await expect(workspace.locator(".evidence-record").first()).toContainText("Action record F1: initiated by action record EXTERNAL.");
  // The same persisted pair's concrete record link still establishes causation.
  const linked = correlateEvidence(game, [game.evidence[0].id, game.evidence[1].id], "causal");
  expect(linked.correlations[0].effects?.rewarded).toBe(true);
});
