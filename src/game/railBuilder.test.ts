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
  it("places start, repeated main, and end segments along a line", () => {
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
  });

  it("accounts for start/end heights without pitch rotation", () => {
    const kit: RailPieces = {
      start: makeSection(3),
      main: makeSection(5),
      startLength: 3,
      mainLength: 5,
      endLength: 3
    };

    const start = new THREE.Vector3(0, 8, 0);
    const end = new THREE.Vector3(40, 24, 0);
    const group = buildRailBetween(kit, start, end, { minOffset: 0 });

    expect(group.children.length).toBeGreaterThanOrEqual(3);
    const startY = group.children[0].position.y;
    const endY = group.children[group.children.length - 1].position.y;
    expect(endY).toBeGreaterThan(startY);
    expect(Math.abs(group.children[0].rotation.x)).toBeLessThan(1e-6);
    expect(Math.abs(group.children[0].rotation.z)).toBeLessThan(1e-6);
  });

  it("rotates rails only on Y axis toward the destination", () => {
    const kit: RailPieces = {
      start: makeSection(3),
      main: makeSection(5),
      startLength: 3,
      mainLength: 5,
      endLength: 3
    };

    const start = new THREE.Vector3(0, 10, 0);
    const end = new THREE.Vector3(20, 14, 20);
    const group = buildRailBetween(kit, start, end, { minOffset: 0 });

    expect(group.children.length).toBeGreaterThanOrEqual(3);
    expect(Math.abs(group.rotation.y)).toBeLessThan(1e-6);

    for (const piece of group.children) {
      expect(Math.abs(piece.rotation.y)).toBeGreaterThan(0.1);
      expect(Math.abs(piece.rotation.x)).toBeLessThan(1e-6);
      expect(Math.abs(piece.rotation.z)).toBeLessThan(1e-6);
    }
  });
});
