import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { createTrainMotion } from "./trainMotion";
import type { TrainPathSegment } from "./trainPath";

function segment(start: [number, number, number], end: [number, number, number]): TrainPathSegment {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  return {
    start: a,
    end: b,
    length: a.distanceTo(b),
    kind: "rail",
    edgeId: "e"
  };
}

describe("train motion", () => {
  it("moves train forward on update", () => {
    const train = new THREE.Group();
    const motion = createTrainMotion(train, [segment([0, 0, 0], [10, 0, 0])], {
      speed: 5,
      yOffset: 0
    });
    motion.update(1);
    expect(train.position.x).toBeGreaterThan(1);
  });

  it("transitions to next segment", () => {
    const train = new THREE.Group();
    const motion = createTrainMotion(
      train,
      [segment([0, 0, 0], [2, 0, 0]), segment([2, 0, 0], [2, 0, 4])],
      { speed: 10, yOffset: 0 }
    );
    motion.update(0.4);
    const state = motion.getState();
    expect(state.segmentIndex).toBe(1);
  });

  it("rotates with pitched segment", () => {
    const train = new THREE.Group();
    const motion = createTrainMotion(train, [segment([0, 0, 0], [5, 3, 0])], {
      speed: 0,
      yOffset: 0
    });
    motion.update(0.1);
    expect(Math.abs(train.rotation.x)).toBeGreaterThan(0.01);
  });
});
