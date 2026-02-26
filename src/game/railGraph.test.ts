import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { buildMstEdges, type RailNode } from "./railGraph";

function isConnected(nodes: RailNode[], edges: Array<{ fromId: string; toId: string }>) {
  if (nodes.length <= 1) {
    return true;
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const stack = [nodes[0].id];

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) {
      continue;
    }
    visited.add(id);
    for (const e of edges) {
      if (e.fromId === id && !visited.has(e.toId) && byId.has(e.toId)) {
        stack.push(e.toId);
      } else if (e.toId === id && !visited.has(e.fromId) && byId.has(e.fromId)) {
        stack.push(e.fromId);
      }
    }
  }

  return visited.size === nodes.length;
}

describe("rail graph mst", () => {
  it("returns no edges for 0/1 nodes", () => {
    expect(buildMstEdges([])).toEqual([]);
    expect(
      buildMstEdges([
        {
          id: "a",
          position: new THREE.Vector3(0, 0, 0)
        }
      ])
    ).toEqual([]);
  });

  it("returns N-1 edges and keeps graph connected", () => {
    const nodes: RailNode[] = [
      { id: "a", position: new THREE.Vector3(0, 0, 0) },
      { id: "b", position: new THREE.Vector3(20, 0, 0) },
      { id: "c", position: new THREE.Vector3(40, 0, 10) },
      { id: "d", position: new THREE.Vector3(-15, 0, 5) },
      { id: "e", position: new THREE.Vector3(5, 0, 30) }
    ];

    const edges = buildMstEdges(nodes);
    expect(edges).toHaveLength(nodes.length - 1);
    expect(isConnected(nodes, edges)).toBe(true);
  });
});
