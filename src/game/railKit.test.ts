import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { extractRailKitFromRoot } from "./railKit";

function makeSleeper(name: string, x: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.3), new THREE.MeshStandardMaterial());
  mesh.name = name;
  mesh.position.set(x, 0, z);
  return mesh;
}

function makeRail(name: string, x: number, z: number, zLength: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, zLength), new THREE.MeshStandardMaterial());
  mesh.name = name;
  mesh.position.set(x, 0.1, z);
  return mesh;
}

describe("rail kit extraction", () => {
  it("extracts 4-sleeper and 3-sleeper sections", () => {
    const root = new THREE.Group();

    root.add(makeRail("РЕЛЬСА 2", 0, 0, 3.2));
    root.add(makeSleeper("Cube", 0, 0));
    root.add(makeSleeper("Cube.001", 0, -1.1));
    root.add(makeSleeper("Cube.002", 0, -2.2));
    root.add(makeSleeper("Cube.003", 0, -3.3));

    root.add(makeRail("РЕЛЬСА 2.001", 8, 0, 2.9));
    root.add(makeSleeper("Cube.004", 8, 0));
    root.add(makeSleeper("Cube.005", 8, -1.2));
    root.add(makeSleeper("Cube.006", 8, -2.4));

    const kit = extractRailKitFromRoot(root);
    expect(kit.section4Length).toBeGreaterThan(kit.section3Length);
    expect(kit.section4.children.length).toBeGreaterThanOrEqual(5);
    expect(kit.section3.children.length).toBeGreaterThanOrEqual(4);
  });
});
