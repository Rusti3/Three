import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { applyTrainDefaults, getTrainModelUrl } from "./trainModel";

describe("train model helpers", () => {
  it("returns url that points to the train GLB", () => {
    const url = getTrainModelUrl();
    expect(url).toContain("the_polar_express_locomotive.glb");
  });

  it("applies model defaults and enables shadows", () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial());
    root.add(mesh);

    applyTrainDefaults(root);

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());

    expect(size.length()).toBeGreaterThan(0);
    expect(Math.abs(box.min.y)).toBeLessThan(0.001);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });
});
