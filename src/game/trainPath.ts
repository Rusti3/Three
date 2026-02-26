import * as THREE from "three";

export type RailEdgeSegment = {
  id: string;
  fromId: string;
  toId: string;
  fromPoint: THREE.Vector3;
  toPoint: THREE.Vector3;
};

export type TrainPathSegment = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  length: number;
  kind: "rail" | "connector";
  edgeId: string | null;
};

type DirectedEdge = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  edgeId: string;
};

function makeSegment(
  start: THREE.Vector3,
  end: THREE.Vector3,
  kind: "rail" | "connector",
  edgeId: string | null
) {
  const length = start.distanceTo(end);
  if (length <= 1e-5) {
    return null;
  }
  return {
    start: start.clone(),
    end: end.clone(),
    length,
    kind,
    edgeId
  } satisfies TrainPathSegment;
}

function selectStartNode(edges: RailEdgeSegment[]) {
  const degree = new Map<string, number>();
  for (const edge of edges) {
    degree.set(edge.fromId, (degree.get(edge.fromId) ?? 0) + 1);
    degree.set(edge.toId, (degree.get(edge.toId) ?? 0) + 1);
  }
  for (const [nodeId, deg] of degree.entries()) {
    if (deg === 1) {
      return nodeId;
    }
  }
  return edges[0].fromId;
}

function directedFromNode(edge: RailEdgeSegment, nodeId: string): DirectedEdge {
  if (edge.fromId === nodeId) {
    return {
      start: edge.fromPoint.clone(),
      end: edge.toPoint.clone(),
      edgeId: edge.id
    };
  }
  return {
    start: edge.toPoint.clone(),
    end: edge.fromPoint.clone(),
    edgeId: edge.id
  };
}

export function buildTraversalPath(edges: RailEdgeSegment[]): TrainPathSegment[] {
  if (edges.length === 0) {
    return [];
  }

  const adjacency = new Map<string, number[]>();
  for (let i = 0; i < edges.length; i += 1) {
    const edge = edges[i];
    const fromList = adjacency.get(edge.fromId) ?? [];
    fromList.push(i);
    adjacency.set(edge.fromId, fromList);
    const toList = adjacency.get(edge.toId) ?? [];
    toList.push(i);
    adjacency.set(edge.toId, toList);
  }

  const ordered: DirectedEdge[] = [];
  const visited = new Set<string>();

  const walk = (nodeId: string) => {
    const list = adjacency.get(nodeId) ?? [];
    for (const edgeIndex of list) {
      const edge = edges[edgeIndex];
      if (visited.has(edge.id)) {
        continue;
      }
      visited.add(edge.id);
      const forward = directedFromNode(edge, nodeId);
      ordered.push(forward);
      const nextNode = edge.fromId === nodeId ? edge.toId : edge.fromId;
      walk(nextNode);
      ordered.push({
        start: forward.end.clone(),
        end: forward.start.clone(),
        edgeId: edge.id
      });
    }
  };

  walk(selectStartNode(edges));

  const result: TrainPathSegment[] = [];
  let prevEnd: THREE.Vector3 | null = null;
  let firstStart: THREE.Vector3 | null = null;

  for (const directed of ordered) {
    if (!firstStart) {
      firstStart = directed.start.clone();
    }
    if (prevEnd) {
      const connector = makeSegment(prevEnd, directed.start, "connector", null);
      if (connector) {
        result.push(connector);
      }
    }
    const rail = makeSegment(directed.start, directed.end, "rail", directed.edgeId);
    if (rail) {
      result.push(rail);
      prevEnd = rail.end;
    }
  }

  if (prevEnd && firstStart) {
    const loopConnector = makeSegment(prevEnd, firstStart, "connector", null);
    if (loopConnector) {
      result.push(loopConnector);
    }
  }

  return result;
}
