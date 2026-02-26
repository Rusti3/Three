import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { buildTraversalPath, type RailEdgeSegment } from "./trainPath";

function edge(
  id: string,
  fromId: string,
  toId: string,
  fromPoint: [number, number, number],
  toPoint: [number, number, number]
): RailEdgeSegment {
  return {
    id,
    fromId,
    toId,
    fromPoint: new THREE.Vector3(...fromPoint),
    toPoint: new THREE.Vector3(...toPoint)
  };
}

describe("train path", () => {
  it("returns empty path for empty edges", () => {
    expect(buildTraversalPath([])).toEqual([]);
  });

  it("traverses all edges and keeps continuity", () => {
    const edges = [
      edge("ab", "a", "b", [0, 0, 0], [10, 0, 0]),
      edge("bc", "b", "c", [10, 0, 0], [20, 0, 10])
    ];
    const path = buildTraversalPath(edges);
    expect(path.length).toBeGreaterThan(0);

    const railEdgeIds = new Set(path.filter((s) => s.kind === "rail").map((s) => s.edgeId));
    expect(railEdgeIds.has("ab")).toBe(true);
    expect(railEdgeIds.has("bc")).toBe(true);

    for (let i = 1; i < path.length; i += 1) {
      expect(path[i - 1].end.distanceTo(path[i].start)).toBeLessThan(1e-4);
    }
  });
});
