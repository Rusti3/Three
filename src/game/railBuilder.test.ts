import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { buildAlternatingRailSegments, countAlternatingSections } from "./railBuilder";

describe("rail builder", () => {
  it("computes alternating section count from distance", () => {
    expect(countAlternatingSections(100, 10, 6, 10)).toBe(10);
    expect(countAlternatingSections(19, 10, 6, 10)).toBe(0);
  });

  it("places sections in strict 4-3-4-3 alternating pattern", () => {
    const section4 = new THREE.Group();
    section4.name = "section4";
    section4.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 2), new THREE.MeshStandardMaterial()));

    const section3 = new THREE.Group();
    section3.name = "section3";
    section3.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 2), new THREE.MeshStandardMaterial()));

    const start = new THREE.Vector3(0, 10, 0);
    const end = new THREE.Vector3(60, 30, 0);

    const group = buildAlternatingRailSegments(
      {
        section4,
        section3,
        section4Length: 8,
        section3Length: 6
      },
      start,
      end,
      { endOffset: 4 }
    );

    expect(group.children.length).toBeGreaterThan(0);

    for (let i = 0; i < group.children.length; i += 1) {
      const expected = i % 2 === 0 ? "4" : "3";
      expect(group.children[i].userData.sectionType).toBe(expected);
    }
  });
});
