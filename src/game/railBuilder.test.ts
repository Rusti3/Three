import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { buildRailBetween, RailPieces } from "./railBuilder";

function makeSection(length: number) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, length), new THREE.MeshStandardMaterial());
  group.add(mesh);
  return group;
}

describe("rail builder", () => {
  it("places start, repeated main, and end segments in expected order", () => {
    const kit: RailPieces = {
      start: makeSection(3),
      main: makeSection(5),
      startLength: 3,
      mainLength: 5,
      endLength: 3
    };

    const start = new THREE.Vector3(0, 10, 0);
    const end = new THREE.Vector3(30, 10, 0);

    const group = buildRailBetween(kit, start, end, { minOffset: 0 });

    expect(group.children.length).toBeGreaterThan(2);
    expect(group.children[0].uuid).not.toBe(group.children[1].uuid);
    expect(group.children[0].userData.sectionType).toBe("start");
    expect(group.children[group.children.length - 1].userData.sectionType).toBe("end");
    for (let i = 1; i < group.children.length - 1; i += 1) {
      expect(group.children[i].userData.sectionType).toBe("main");
    }
  });

  it("keeps every segment on one 3D straight line and same direction", () => {
    const kit: RailPieces = {
      start: makeSection(3),
      main: makeSection(5),
      startLength: 3,
      mainLength: 5,
      endLength: 3
    };

    const start = new THREE.Vector3(2, 8, -4);
    const end = new THREE.Vector3(28, 24, 15);
    const group = buildRailBetween(kit, start, end, { minOffset: 0 });
    const direction = end.clone().sub(start).normalize();
    const expectedQ = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      direction
    );

    expect(group.children.length).toBeGreaterThanOrEqual(3);
    for (const piece of group.children) {
      const rel = piece.position.clone().sub(start);
      const distanceToLine = rel.clone().cross(direction).length();
      expect(distanceToLine).toBeLessThan(1e-4);
      expect(piece.quaternion.angleTo(expectedQ)).toBeLessThan(1e-4);
    }
  });

  it("uses compact filling so neighbors do not leave gaps", () => {
    const kit: RailPieces = {
      start: makeSection(3),
      main: makeSection(5),
      startLength: 3,
      mainLength: 5,
      endLength: 3
    };

    const start = new THREE.Vector3(0, 10, 0);
    const end = new THREE.Vector3(34, 10, 0);
    const group = buildRailBetween(kit, start, end, { minOffset: 0 });
    const direction = end.clone().sub(start).normalize();
    const items = group.children.map((piece) => {
      const s = piece.position.clone().sub(start).dot(direction);
      const type = String(piece.userData.sectionType);
      const length = type === "main" ? kit.mainLength : kit.startLength;
      return { s, length };
    });

    items.sort((a, b) => a.s - b.s);
    for (let i = 0; i < items.length - 1; i += 1) {
      const spacing = items[i + 1].s - items[i].s;
      const maxNoGapSpacing = items[i].length * 0.5 + items[i + 1].length * 0.5 + 1e-6;
      expect(spacing).toBeLessThanOrEqual(maxNoGapSpacing);
    }
  });

  it("returns empty group when edge is too short for start and end anchors", () => {
    const kit: RailPieces = {
      start: makeSection(3),
      main: makeSection(5),
      startLength: 3,
      mainLength: 5,
      endLength: 3
    };
    const group = buildRailBetween(kit, new THREE.Vector3(0, 0, 0), new THREE.Vector3(5, 0, 0), {
      minOffset: 0
    });
    expect(group.children.length).toBe(0);
  });
});
