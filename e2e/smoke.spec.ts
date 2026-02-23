import { expect, test } from "@playwright/test";

type TrainState = {
  position: { x: number; y: number; z: number };
  speed: number;
  loopCount: number;
  heading: number;
};

declare global {
  interface Window {
    __THREE_DRIVE__?: {
      getTrainState: () => TrainState;
      isTrainLoaded: () => boolean;
      isRailLoaded: () => boolean;
    };
  }
}

test("renders scene and train moves forward on rails automatically", async ({ page }) => {
  await page.goto("/");

  const canvas = page.locator("canvas[data-testid='scene-canvas']");
  await expect(canvas).toBeVisible();

  await expect
    .poll(async () => page.evaluate(() => window.__THREE_DRIVE__?.isRailLoaded() ?? false), { timeout: 60000 })
    .toBe(true);
  await expect
    .poll(async () => page.evaluate(() => window.__THREE_DRIVE__?.isTrainLoaded() ?? false), { timeout: 60000 })
    .toBe(true);

  const before = await page.evaluate(() => window.__THREE_DRIVE__?.getTrainState());
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => window.__THREE_DRIVE__?.getTrainState());

  expect(before).toBeTruthy();
  expect(after).toBeTruthy();
  expect((after?.position.z ?? 0) - (before?.position.z ?? 0)).toBeGreaterThan(0.1);
  expect(after?.speed ?? 0).toBeGreaterThan(0);
});
