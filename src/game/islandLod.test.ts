import { describe, expect, it } from "vitest";

import { chooseAdaptiveResolution } from "./islandLod";

describe("island LOD", () => {
  it("keeps base N for low island count", () => {
    expect(chooseAdaptiveResolution(160, 0)).toBe(160);
    expect(chooseAdaptiveResolution(160, 6)).toBe(160);
  });

  it("reduces N as island count grows", () => {
    expect(chooseAdaptiveResolution(160, 8)).toBeLessThan(160);
    expect(chooseAdaptiveResolution(160, 16)).toBeLessThan(chooseAdaptiveResolution(160, 8));
    expect(chooseAdaptiveResolution(160, 24)).toBeLessThan(chooseAdaptiveResolution(160, 16));
  });

  it("never goes below 64 and never exceeds base N", () => {
    expect(chooseAdaptiveResolution(96, 100)).toBeGreaterThanOrEqual(64);
    expect(chooseAdaptiveResolution(96, 100)).toBeLessThanOrEqual(96);
  });
});
