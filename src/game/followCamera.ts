import * as THREE from "three";

export type FollowTargetState = {
  position: {
    x: number;
    y: number;
    z: number;
  };
  heading: number;
};

export type FollowCameraOptions = {
  distance: number;
  height: number;
  damping: number;
  lookAhead: number;
  sideOffset: number;
};

export type FollowCameraController = {
  update: (state: FollowTargetState, dt: number) => void;
};

const DEFAULT_OPTIONS: FollowCameraOptions = {
  distance: 7.5,
  height: 3.6,
  damping: 8,
  lookAhead: 8,
  sideOffset: 0
};

function lerpAlpha(damping: number, dt: number) {
  return 1 - Math.exp(-damping * dt);
}

export function createFollowCamera(
  camera: THREE.PerspectiveCamera,
  options: Partial<FollowCameraOptions> = {}
): FollowCameraController {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lookAtTarget = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const currentLookAt = new THREE.Vector3();

  const update = (state: FollowTargetState, dt: number) => {
    const alpha = lerpAlpha(opts.damping, dt);
    const followOffset = new THREE.Vector3(opts.sideOffset, opts.height, -opts.distance);
    followOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.heading);

    desiredPosition.set(state.position.x, state.position.y, state.position.z).add(followOffset);
    camera.position.lerp(desiredPosition, alpha);

    const forward = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
    lookAtTarget
      .set(state.position.x, state.position.y + 1.1, state.position.z)
      .addScaledVector(forward, opts.lookAhead);
    currentLookAt.lerp(lookAtTarget, alpha);
    camera.lookAt(currentLookAt);
  };

  return { update };
}
