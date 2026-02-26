import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { fitTrainToRails } from "./trainFit";

describe("train fit", () => {
  it("scales train down to rail proportions", () => {
    const train = new THREE.Group();
    train.add(new THREE.Mesh(new THREE.BoxGeometry(20, 5, 60), new THREE.MeshStandardMaterial()));

    const railsStart = new THREE.Group();
    railsStart.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 3), new THREE.MeshStandardMaterial()));
    const railsMain = new THREE.Group();
    railsMain.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial()));

    const fit = fitTrainToRails(train, { start: railsStart, main: railsMain });
    expect(fit.scale).toBeGreaterThan(0);
    expect(fit.scale).toBeLessThan(1);
  });
});
