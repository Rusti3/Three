import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { createTrainSizer } from "./trainSizing";

describe("train sizer", () => {
  it("applies multiplier relative to base scale", () => {
    const model = new THREE.Group();
    model.scale.setScalar(2);

    const sizer = createTrainSizer(model, { minMultiplier: 0.5, maxMultiplier: 3 });
    sizer.setMultiplier(1.5);

    expect(model.scale.x).toBeCloseTo(3, 6);
    expect(model.scale.y).toBeCloseTo(3, 6);
    expect(model.scale.z).toBeCloseTo(3, 6);
    expect(sizer.getMultiplier()).toBeCloseTo(1.5, 6);
  });

  it("clamps multiplier to bounds", () => {
    const model = new THREE.Group();
    model.scale.setScalar(1);

    const sizer = createTrainSizer(model, { minMultiplier: 0.5, maxMultiplier: 2 });
    sizer.setMultiplier(5);
    expect(sizer.getMultiplier()).toBe(2);
    sizer.setMultiplier(0.1);
    expect(sizer.getMultiplier()).toBe(0.5);
  });
});
