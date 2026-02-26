import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { createRailPiecesForScenes } from "./railKit";

describe("rail kit loader", () => {
  it("computes lengths from provided groups", () => {
    const startScene = new THREE.Group();
    startScene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 3)));
    const mainScene = new THREE.Group();
    mainScene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 5)));

    const kit = createRailPiecesForScenes(startScene, mainScene);
    expect(kit.startLength).toBeGreaterThan(0);
    expect(kit.mainLength).toBeGreaterThan(0);
    expect(kit.endLength).toBe(kit.startLength);
  });
});
