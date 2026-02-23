import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { createFollowCamera } from "./followCamera";

describe("follow camera", () => {
  it("supports side offset for side-view camera", () => {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const follow = createFollowCamera(camera, {
      distance: 0,
      height: 0,
      lookAhead: 0,
      damping: 100,
      sideOffset: 10
    });

    follow.update(
      {
        position: { x: 0, y: 0, z: 0 },
        heading: 0
      },
      1
    );

    expect(camera.position.x).toBeCloseTo(10, 2);
    expect(camera.position.z).toBeCloseTo(0, 2);
  });

  it("rotates side offset with heading", () => {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const follow = createFollowCamera(camera, {
      distance: 0,
      height: 0,
      lookAhead: 0,
      damping: 100,
      sideOffset: 10
    });

    follow.update(
      {
        position: { x: 0, y: 0, z: 0 },
        heading: Math.PI / 2
      },
      1
    );

    expect(camera.position.x).toBeCloseTo(0, 2);
    expect(camera.position.z).toBeCloseTo(-10, 2);
  });

  it("supports zoom in and zoom out", () => {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const follow = createFollowCamera(camera, {
      distance: 5,
      height: 0,
      lookAhead: 0,
      damping: 100,
      sideOffset: 10,
      minZoom: 0.5,
      maxZoom: 2
    });

    follow.update(
      {
        position: { x: 0, y: 0, z: 0 },
        heading: 0
      },
      1
    );
    expect(camera.position.x).toBeCloseTo(10, 2);
    expect(camera.position.z).toBeCloseTo(-5, 2);

    follow.zoomBy(0.5);
    follow.update(
      {
        position: { x: 0, y: 0, z: 0 },
        heading: 0
      },
      1
    );
    expect(follow.getZoom()).toBeCloseTo(1.5, 2);
    expect(camera.position.x).toBeCloseTo(15, 2);
    expect(camera.position.z).toBeCloseTo(-7.5, 2);

    follow.zoomBy(-2);
    follow.update(
      {
        position: { x: 0, y: 0, z: 0 },
        heading: 0
      },
      1
    );
    expect(follow.getZoom()).toBeCloseTo(0.5, 2);
    expect(camera.position.x).toBeCloseTo(5, 2);
    expect(camera.position.z).toBeCloseTo(-2.5, 2);
  });
});
