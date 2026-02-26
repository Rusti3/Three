import { describe, expect, it } from "vitest";

import { randomIslandParamsFromRanges, RANDOM_PARAM_RANGES } from "./islandRandomParams";

describe("island random params", () => {
  it("produces values inside configured ranges", () => {
    for (let i = 0; i < 200; i += 1) {
      const p = randomIslandParamsFromRanges();

      expect(p.seed).toBeGreaterThanOrEqual(RANDOM_PARAM_RANGES.seed.min);
      expect(p.seed).toBeLessThanOrEqual(RANDOM_PARAM_RANGES.seed.max);

      expect(p.n).toBeGreaterThanOrEqual(RANDOM_PARAM_RANGES.n.min);
      expect(p.n).toBeLessThanOrEqual(RANDOM_PARAM_RANGES.n.max);
      expect(p.n % RANDOM_PARAM_RANGES.n.step).toBe(0);

      expect(p.xyScale).toBeGreaterThanOrEqual(RANDOM_PARAM_RANGES.xyScale.min);
      expect(p.xyScale).toBeLessThanOrEqual(RANDOM_PARAM_RANGES.xyScale.max);

      expect(p.zScale).toBeGreaterThanOrEqual(RANDOM_PARAM_RANGES.zScale.min);
      expect(p.zScale).toBeLessThanOrEqual(RANDOM_PARAM_RANGES.zScale.max);

      expect(p.mountainAmp).toBeGreaterThanOrEqual(RANDOM_PARAM_RANGES.mountainAmp.min);
      expect(p.mountainAmp).toBeLessThanOrEqual(RANDOM_PARAM_RANGES.mountainAmp.max);

      expect(p.cliffAmp).toBeGreaterThanOrEqual(RANDOM_PARAM_RANGES.cliffAmp.min);
      expect(p.cliffAmp).toBeLessThanOrEqual(RANDOM_PARAM_RANGES.cliffAmp.max);
    }
  });
});
