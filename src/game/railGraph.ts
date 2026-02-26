import * as THREE from "three";

export type RailNode = {
  id: string;
  position: THREE.Vector3;
};

export type RailEdge = {
  fromId: string;
  toId: string;
};

function distanceXZ(a: THREE.Vector3, b: THREE.Vector3) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

export function buildMstEdges(nodes: RailNode[]): RailEdge[] {
  if (nodes.length < 2) {
    return [];
  }

  const visited = new Set<number>([0]);
  const edges: RailEdge[] = [];

  while (visited.size < nodes.length) {
    let bestFrom = -1;
    let bestTo = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const from of visited) {
      for (let to = 0; to < nodes.length; to += 1) {
        if (visited.has(to)) {
          continue;
        }
        const d = distanceXZ(nodes[from].position, nodes[to].position);
        if (d < bestDistance) {
          bestDistance = d;
          bestFrom = from;
          bestTo = to;
        }
      }
    }

    if (bestFrom === -1 || bestTo === -1) {
      break;
    }

    visited.add(bestTo);
    edges.push({
      fromId: nodes[bestFrom].id,
      toId: nodes[bestTo].id
    });
  }

  return edges;
}
