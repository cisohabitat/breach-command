import { expect, test } from "@playwright/test";

test("production policy permits play and blocks external connections", async ({ page }) => {
  const response = await page.goto("/play", { waitUntil: "networkidle" });
  const headers = response!.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("connect-src 'self'");
  expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();
  await page.evaluate(() => {
    (window as unknown as { policyViolations: string[] }).policyViolations = [];
    document.addEventListener("securitypolicyviolation", event => {
      (window as unknown as { policyViolations: string[] }).policyViolations.push(event.effectiveDirective);
    });
  });
  await page.getByRole("button", { name: /Begin investigation/i }).click();
  await page.getByRole("button", { name: /Assume command/i }).click();
  await expect(page.locator(".situation-log.lead-log")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { policyViolations: string[] }).policyViolations)).toEqual([]);
  expect(await page.evaluate(() => fetch("https://example.invalid/security-check").then(() => true, () => false))).toBe(false);
  await expect.poll(() => page.evaluate(() => (window as unknown as { policyViolations: string[] }).policyViolations)).toContain("connect-src");
});
