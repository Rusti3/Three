import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { findWheelObjects, updateWheelRotation } from "./trainAnimation";

describe("train animation helpers", () => {
  it("finds wheel meshes by name", () => {
    const root = new THREE.Group();
    const wheelA = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    wheelA.name = "wheel_front_left";
    const wheelB = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    wheelB.name = "WHEEL_rear_right";
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    body.name = "body_main";

    root.add(wheelA);
    root.add(wheelB);
    root.add(body);

    const wheels = findWheelObjects(root);
    expect(wheels).toHaveLength(2);
    expect(wheels).toContain(wheelA);
    expect(wheels).toContain(wheelB);
  });

  it("rotates wheels based on speed and delta time", () => {
    const wheel = new THREE.Object3D();
    wheel.rotation.x = 0;

    updateWheelRotation([wheel], 10, 0.5, 1);
    expect(wheel.rotation.x).toBeCloseTo(-5, 4);
  });
});
