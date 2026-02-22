/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";

import { createKeyboardControls } from "./controls";

function keyDown(key: string) {
  window.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

function keyUp(key: string) {
  window.dispatchEvent(new KeyboardEvent("keyup", { key }));
}

afterEach(() => {
  keyUp("w");
  keyUp("a");
  keyUp("s");
  keyUp("d");
  keyUp("r");
  keyUp("ArrowUp");
  keyUp("ArrowDown");
  keyUp("ArrowLeft");
  keyUp("ArrowRight");
});

describe("keyboard controls", () => {
  it("maps keydown and keyup to throttle and steer", () => {
    const controls = createKeyboardControls(window);
    keyDown("w");
    keyDown("a");
    expect(controls.throttle).toBe(1);
    expect(controls.steer).toBe(-1);

    keyUp("w");
    keyUp("a");
    expect(controls.throttle).toBe(0);
    expect(controls.steer).toBe(0);
  });

  it("supports combined inputs", () => {
    const controls = createKeyboardControls(window);
    keyDown("w");
    keyDown("d");
    expect(controls.throttle).toBe(1);
    expect(controls.steer).toBe(1);
  });

  it("toggles reset key state", () => {
    const controls = createKeyboardControls(window);
    keyDown("r");
    expect(controls.reset).toBe(true);
    keyUp("r");
    expect(controls.reset).toBe(false);
  });
});
