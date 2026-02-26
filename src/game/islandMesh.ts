import * as THREE from "three";

import type { GeneratedIslandData } from "./islandTypes";

function idx(i: number, j: number, n: number) {
  return i * n + j;
}

function edgeKey(a: number, b: number) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function buildIslandGeometry(data: GeneratedIslandData) {
  const { n, x, y, top, bottom, oceanMask, xyScale, zScale } = data;
  const half = xyScale * 0.5;
  const vertexCount = n * n * 2;
  const positions = new Float32Array(vertexCount * 3);

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const k = idx(i, j, n);
      const base = k * 3;
      positions[base] = x[k] * half;
      positions[base + 1] = top[k] * zScale;
      positions[base + 2] = y[k] * half;

      const kb = k + n * n;
      const baseB = kb * 3;
      positions[baseB] = x[k] * half;
      positions[baseB + 1] = bottom[k] * zScale;
      positions[baseB + 2] = y[k] * half;
    }
  }

  const triangles: number[] = [];
  const edgeUse = new Map<string, number>();
  const edgeVerts = new Map<string, [number, number]>();
  const offset = n * n;

  const addEdge = (a: number, b: number) => {
    const k = edgeKey(a, b);
    edgeUse.set(k, (edgeUse.get(k) ?? 0) + 1);
    if (!edgeVerts.has(k)) {
      edgeVerts.set(k, a < b ? [a, b] : [b, a]);
    }
  };

  const addQuad = (a: number, b: number, c: number, d: number) => {
    triangles.push(a, b, c, a, c, d);
  };

  for (let i = 0; i < n - 1; i += 1) {
    for (let j = 0; j < n - 1; j += 1) {
      const a = idx(i, j, n);
      const b = idx(i, j + 1, n);
      const c = idx(i + 1, j + 1, n);
      const d = idx(i + 1, j, n);

      if (oceanMask[a] || oceanMask[b] || oceanMask[c] || oceanMask[d]) {
        continue;
      }

      addQuad(a, b, c, d);
      addQuad(d + offset, c + offset, b + offset, a + offset);

      addEdge(a, b);
      addEdge(b, c);
      addEdge(c, d);
      addEdge(d, a);
    }
  }

  for (const [key, count] of edgeUse.entries()) {
    if (count !== 1) {
      continue;
    }
    const [u, v] = edgeVerts.get(key)!;
    addQuad(u, v, v + offset, u + offset);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();

  let approxRadius = 0;
  for (let i = 0; i < n * n; i += 1) {
    if (oceanMask[i]) {
      continue;
    }
    approxRadius = Math.max(approxRadius, Math.hypot(positions[i * 3], positions[i * 3 + 2]));
  }

  return { geometry, approxRadius };
}
