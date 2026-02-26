import { describe, expect, it } from "vitest";

import { createIslandData } from "./islandGenerator";
import { buildIslandGeometry } from "./islandMesh";

describe("island mesh", () => {
  it("builds indexed geometry with vertices and faces", () => {
    const data = createIslandData({
      seed: 4121132,
      n: 48,
      xyScale: 32,
      zScale: 10,
      mountainAmp: 0.58,
      cliffAmp: 0.07,
      namePrefix: "FloatingIsland"
    });

    const { geometry } = buildIslandGeometry(data);
    const pos = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");

    expect(pos.count).toBeGreaterThan(0);
    expect(normal.count).toBe(pos.count);
    expect(geometry.index).toBeTruthy();
    expect(geometry.index!.count).toBeGreaterThan(0);
  });
});
