import * as THREE from "three";

export type TrainAnimator = {
  update: (dt: number, speed: number) => void;
};

const WHEEL_NAME_PATTERN = /(wheel|wheels|tire|tyre)/i;
const DEFAULT_WHEEL_RADIUS = 1;

export function findWheelObjects(root: THREE.Object3D) {
  const wheels: THREE.Object3D[] = [];
  root.traverse((child) => {
    if (child.name && WHEEL_NAME_PATTERN.test(child.name)) {
      wheels.push(child);
    }
  });
  return wheels;
}

export function updateWheelRotation(
  wheels: THREE.Object3D[],
  speed: number,
  dt: number,
  radius = DEFAULT_WHEEL_RADIUS
) {
  if (wheels.length === 0 || dt <= 0 || radius <= 0) {
    return;
  }

  const delta = (speed * dt) / radius;
  for (const wheel of wheels) {
    wheel.rotation.x -= delta;
  }
}

export function createTrainAnimator(model: THREE.Object3D, animations: THREE.AnimationClip[] = []): TrainAnimator {
  if (animations.length > 0) {
    const mixer = new THREE.AnimationMixer(model);
    for (const clip of animations) {
      mixer.clipAction(clip).play();
    }

    return {
      update: (dt: number) => {
        if (dt > 0) {
          mixer.update(dt);
        }
      }
    };
  }

  const wheels = findWheelObjects(model);
  return {
    update: (dt: number, speed: number) => {
      updateWheelRotation(wheels, speed, dt);
    }
  };
}
