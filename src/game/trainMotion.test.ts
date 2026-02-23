import { describe, expect, it } from "vitest";

import { createTrainMotion } from "./trainMotion";

describe("train motion", () => {
  it("moves forward along the Z axis", () => {
    const motion = createTrainMotion({
      startZ: 0,
      endZ: 100,
      speed: 8,
      x: 2,
      y: 1
    });

    motion.update(1);
    const state = motion.getState();

    expect(state.position.x).toBeCloseTo(2);
    expect(state.position.y).toBeCloseTo(1);
    expect(state.position.z).toBeCloseTo(8);
    expect(state.loopCount).toBe(0);
  });

  it("wraps to start and increments loop counter", () => {
    const motion = createTrainMotion({
      startZ: 0,
      endZ: 10,
      speed: 8
    });

    motion.update(2);
    const state = motion.getState();

    expect(state.position.z).toBeCloseTo(6);
    expect(state.loopCount).toBe(1);
  });

  it("does not update state for non-positive dt", () => {
    const motion = createTrainMotion({
      startZ: 0,
      endZ: 50,
      speed: 4
    });

    const before = motion.getState();
    motion.update(0);
    motion.update(-1);
    const after = motion.getState();

    expect(after).toEqual(before);
  });
});
