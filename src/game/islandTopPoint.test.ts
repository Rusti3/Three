import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { getIslandTopPoint } from "./islandTopPoint";

describe("island top point", () => {
  it("returns highest world-space vertex", () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), new THREE.MeshStandardMaterial());
    mesh.position.set(10, 5, -2);
    mesh.updateMatrixWorld(true);

    const top = getIslandTopPoint(mesh);
    expect(top.y).toBeCloseTo(7, 3);
  });

  it("tracks mesh transform when finding top", () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial());
    mesh.position.set(0, 3, 0);
    mesh.rotation.z = Math.PI / 4;
    mesh.updateMatrixWorld(true);

    const top = getIslandTopPoint(mesh);
    expect(top.y).toBeGreaterThan(3.9);
  });
});
