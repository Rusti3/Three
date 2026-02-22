import { expect, test } from "@playwright/test";

type SerializableState = {
  position: { x: number; y: number; z: number };
  heading: number;
  speed: number;
};

declare global {
  interface Window {
    __THREE_DRIVE__?: {
      getCarState: () => SerializableState;
      isCarModelLoaded: () => boolean;
    };
  }
}

test("renders scene canvas and responds to keyboard input", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("canvas[data-testid='scene-canvas']");
  await expect(canvas).toBeVisible();

  await canvas.click();
  const beforeMove = await page.evaluate(() => window.__THREE_DRIVE__?.getCarState());

  await expect
    .poll(async () => page.evaluate(() => window.__THREE_DRIVE__?.isCarModelLoaded() ?? false))
    .toBe(true);

  await page.keyboard.down("w");
  await page.waitForTimeout(600);
  await page.keyboard.up("w");

  const afterMove = await page.evaluate(() => window.__THREE_DRIVE__?.getCarState());
  expect(afterMove).toBeTruthy();
  expect(beforeMove).toBeTruthy();

  const movedDistance = Math.hypot(
    (afterMove?.position.x ?? 0) - (beforeMove?.position.x ?? 0),
    (afterMove?.position.z ?? 0) - (beforeMove?.position.z ?? 0)
  );
  expect(movedDistance).toBeGreaterThan(0.1);

  const headingBeforeTurn = afterMove?.heading ?? 0;
  await page.keyboard.down("a");
  await page.waitForTimeout(500);
  await page.keyboard.up("a");

  const afterTurn = await page.evaluate(() => window.__THREE_DRIVE__?.getCarState());
  expect(Math.abs((afterTurn?.heading ?? 0) - headingBeforeTurn)).toBeGreaterThan(0.02);
});
