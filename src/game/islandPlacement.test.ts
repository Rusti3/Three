import { describe, expect, it } from "vitest";

import { findSpawnPosition } from "./islandPlacement";

describe("island placement", () => {
  it("places the first island when scene is empty", () => {
    const pos = findSpawnPosition([], 16, 100, 24, 20);
    expect(pos).not.toBeNull();
    expect(Math.hypot(pos!.x, pos!.z)).toBeLessThanOrEqual(100);
  });

  it("does not overlap with existing islands", () => {
    const existing = [
      { x: 0, z: 0, radius: 20 },
      { x: 60, z: 0, radius: 20 }
    ];
    const candidate = findSpawnPosition(existing, 18, 120, 10, 200, () => 0.75);
    expect(candidate).not.toBeNull();

    for (const island of existing) {
      const d = Math.hypot(candidate!.x - island.x, candidate!.z - island.z);
      expect(d).toBeGreaterThan(island.radius + 18 + 10);
    }
  });

  it("returns null when no valid space is available", () => {
    const existing = [{ x: 0, z: 0, radius: 95 }];
    const candidate = findSpawnPosition(existing, 20, 100, 10, 16, () => 0.5);
    expect(candidate).toBeNull();
  });
});
