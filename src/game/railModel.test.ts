import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { applyRailDefaults, getRailModelUrl } from "./railModel";

describe("rail model helpers", () => {
  it("returns url that points to the rail GLB", () => {
    const url = getRailModelUrl();
    expect(url).toContain("railway.glb");
  });

  it("applies rail defaults and enables shadows", () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 100), new THREE.MeshStandardMaterial());
    root.add(mesh);

    applyRailDefaults(root);

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());

    expect(size.length()).toBeGreaterThan(0);
    expect(Math.abs(box.min.y)).toBeLessThan(0.001);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });
});
