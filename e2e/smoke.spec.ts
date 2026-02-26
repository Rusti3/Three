import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __THREE_DRIVE__?: {
      getIslandCount: () => number;
      getCameraDistance: () => number;
      getRailSegmentCount: () => number;
    };
  }
}

test("renders island scene, creates islands on click and supports camera zoom", async ({ page }) => {
  await page.goto("/");

  const canvas = page.locator("canvas[data-testid='scene-canvas']");
  await expect(canvas).toBeVisible();

  const beforeCount = await page.evaluate(() => window.__THREE_DRIVE__?.getIslandCount() ?? 0);
  await canvas.click();
  await page.waitForTimeout(200);
  const afterCount = await page.evaluate(() => window.__THREE_DRIVE__?.getIslandCount() ?? 0);
  expect(afterCount).toBeGreaterThan(beforeCount);

  await canvas.click();
  await page.waitForTimeout(300);
  const railSegments = await page.evaluate(() => window.__THREE_DRIVE__?.getRailSegmentCount() ?? 0);
  expect(railSegments).toBeGreaterThan(0);

  await canvas.hover();
  const distBefore = await page.evaluate(() => window.__THREE_DRIVE__?.getCameraDistance() ?? 0);
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(150);
  const distAfterOut = await page.evaluate(() => window.__THREE_DRIVE__?.getCameraDistance() ?? 0);
  expect(distAfterOut).toBeGreaterThan(distBefore);

  await page.mouse.wheel(0, -1000);
  await page.waitForTimeout(150);
  const distAfterIn = await page.evaluate(() => window.__THREE_DRIVE__?.getCameraDistance() ?? 0);
  expect(distAfterIn).toBeLessThanOrEqual(distAfterOut);
});
