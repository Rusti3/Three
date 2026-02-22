import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { applyCarModelDefaults, getCarModelUrl } from "./carModel";

describe("car model helpers", () => {
  it("returns url that points to sample.glb", () => {
    const url = getCarModelUrl();
    expect(url).toContain("sample.glb");
  });

  it("applies default transform and shadows recursively", () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    root.add(mesh);

    applyCarModelDefaults(root);

    expect(root.scale.x).toBeCloseTo(14);
    expect(root.scale.y).toBeCloseTo(14);
    expect(root.scale.z).toBeCloseTo(14);
    expect(root.position.y).toBeCloseTo(0.02);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });
});
