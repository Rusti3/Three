import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { applyTrainDefaults, getTrainModelUrl, TRAIN_TARGET_LONGEST_SIDE } from "./trainModel";

describe("train model helpers", () => {
  it("returns url that points to the train GLB", () => {
    const url = getTrainModelUrl();
    expect(url).toContain("699c27994f79ee2ab165166d.glb");
  });

  it("applies model defaults and enables shadows", () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial());
    root.add(mesh);

    applyTrainDefaults(root);

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z);

    expect(size.length()).toBeGreaterThan(0);
    expect(longest).toBeCloseTo(TRAIN_TARGET_LONGEST_SIDE, 4);
    expect(Math.abs(box.min.y)).toBeLessThan(0.001);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });
});
