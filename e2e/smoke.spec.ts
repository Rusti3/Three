import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __THREE_DRIVE__?: {
      getIslandCount: () => number;
      getCameraDistance: () => number;
      getRailSegmentCount: () => number;
      isTrainLoaded: () => boolean;
      getTrainPosition: () => { x: number; y: number; z: number };
      getTrainScale: () => number;
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
  const railSegments2 = await page.evaluate(() => window.__THREE_DRIVE__?.getRailSegmentCount() ?? 0);
  expect(railSegments2).toBeGreaterThan(0);

  await expect
    .poll(async () => page.evaluate(() => window.__THREE_DRIVE__?.isTrainLoaded() ?? false), { timeout: 20000 })
    .toBe(true);

  const scale = await page.evaluate(() => window.__THREE_DRIVE__?.getTrainScale() ?? 0);
  expect(scale).toBeGreaterThan(0);

  const trainBefore = await page.evaluate(() => window.__THREE_DRIVE__?.getTrainPosition());
  await page.waitForTimeout(1200);
  const trainAfter = await page.evaluate(() => window.__THREE_DRIVE__?.getTrainPosition());
  expect(trainBefore).toBeTruthy();
  expect(trainAfter).toBeTruthy();
  const delta = Math.hypot(
    (trainAfter?.x ?? 0) - (trainBefore?.x ?? 0),
    (trainAfter?.y ?? 0) - (trainBefore?.y ?? 0),
    (trainAfter?.z ?? 0) - (trainBefore?.z ?? 0)
  );
  expect(delta).toBeGreaterThan(0.05);

  await canvas.click();
  await page.waitForTimeout(350);
  const railSegments3 = await page.evaluate(() => window.__THREE_DRIVE__?.getRailSegmentCount() ?? 0);
  expect(railSegments3).toBeGreaterThan(railSegments2);

  const trainAfterNewIsland = await page.evaluate(() => window.__THREE_DRIVE__?.getTrainPosition());
  expect(trainAfterNewIsland).toBeTruthy();
  const jump = Math.hypot(
    (trainAfterNewIsland?.x ?? 0) - (trainAfter?.x ?? 0),
    (trainAfterNewIsland?.y ?? 0) - (trainAfter?.y ?? 0),
    (trainAfterNewIsland?.z ?? 0) - (trainAfter?.z ?? 0)
  );
  expect(jump).toBeLessThan(25);

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
