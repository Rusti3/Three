import { describe, expect, it } from "vitest";

import { createIslandData, type IslandParams } from "./islandGenerator";

const params: IslandParams = {
  seed: 4121132,
  n: 64,
  xyScale: 32,
  zScale: 10,
  mountainAmp: 0.58,
  cliffAmp: 0.07,
  namePrefix: "FloatingIsland"
};

function checksum(values: Float32Array) {
  let sum = 0;
  for (let i = 0; i < values.length; i += 97) {
    sum += values[i] * (i + 1);
  }
  return Number(sum.toFixed(6));
}

describe("island generator", () => {
  it("is deterministic for a given seed", () => {
    const a = createIslandData(params);
    const b = createIslandData(params);

    expect(checksum(a.top)).toBe(checksum(b.top));
    expect(checksum(a.bottom)).toBe(checksum(b.bottom));
    expect(Array.from(a.oceanMask)).toEqual(Array.from(b.oceanMask));
  });

  it("changes terrain when seed changes", () => {
    const a = createIslandData(params);
    const b = createIslandData({ ...params, seed: params.seed + 1 });

    expect(checksum(a.top)).not.toBe(checksum(b.top));
  });

  it("produces finite values in expected ranges", () => {
    const data = createIslandData(params);

    let topMin = Infinity;
    let topMax = -Infinity;
    let bottomMin = Infinity;
    let bottomMax = -Infinity;

    for (const v of data.top) {
      expect(Number.isFinite(v)).toBe(true);
      topMin = Math.min(topMin, v);
      topMax = Math.max(topMax, v);
    }
    for (const v of data.bottom) {
      expect(Number.isFinite(v)).toBe(true);
      bottomMin = Math.min(bottomMin, v);
      bottomMax = Math.max(bottomMax, v);
    }

    expect(topMin).toBeGreaterThanOrEqual(0);
    expect(topMax).toBeLessThanOrEqual(1);
    expect(bottomMax).toBeLessThanOrEqual(0);
    expect(bottomMin).toBeLessThan(0);
  });
});
