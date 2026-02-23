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
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
};

export type FollowCameraController = {
  update: (state: FollowTargetState, dt: number) => void;
  zoomBy: (delta: number) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
};

const DEFAULT_OPTIONS: FollowCameraOptions = {
  distance: 7.5,
  height: 3.6,
  damping: 8,
  lookAhead: 8,
  sideOffset: 0,
  initialZoom: 1,
  minZoom: 0.4,
  maxZoom: 5.5
};

function lerpAlpha(damping: number, dt: number) {
  return 1 - Math.exp(-damping * dt);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createFollowCamera(
  camera: THREE.PerspectiveCamera,
  options: Partial<FollowCameraOptions> = {}
): FollowCameraController {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lookAtTarget = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const currentLookAt = new THREE.Vector3();
  let zoom = clamp(opts.initialZoom, opts.minZoom, opts.maxZoom);

  const update = (state: FollowTargetState, dt: number) => {
    const alpha = lerpAlpha(opts.damping, dt);
    const followOffset = new THREE.Vector3(
      opts.sideOffset * zoom,
      opts.height * zoom,
      -opts.distance * zoom
    );
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

  const setZoom = (value: number) => {
    zoom = clamp(value, opts.minZoom, opts.maxZoom);
  };

  const zoomBy = (delta: number) => {
    setZoom(zoom + delta);
  };

  const getZoom = () => zoom;

  return {
    update,
    zoomBy,
    setZoom,
    getZoom
  };
}
