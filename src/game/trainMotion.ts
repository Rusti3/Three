import * as THREE from "three";

import type { TrainPathSegment } from "./trainPath";

export type TrainMotionState = {
  segmentIndex: number;
  distanceOnSegment: number;
  position: THREE.Vector3;
  ready: boolean;
};

export type TrainMotionController = {
  update: (dt: number) => void;
  setSegments: (segments: TrainPathSegment[]) => void;
  setSpeed: (speed: number) => void;
  getState: () => TrainMotionState;
};

type TrainMotionOptions = {
  speed: number;
  yOffset: number;
};

const DEFAULT_OPTIONS: TrainMotionOptions = {
  speed: 7,
  yOffset: 0.05
};

const FORWARD = new THREE.Vector3(0, 0, 1);

export function createTrainMotion(
  object: THREE.Object3D,
  initialSegments: TrainPathSegment[],
  options: Partial<TrainMotionOptions> = {}
): TrainMotionController {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const tangent = new THREE.Vector3();
  const tempPos = new THREE.Vector3();
  const tempQuat = new THREE.Quaternion();

  let segments = initialSegments.slice();
  let segmentIndex = 0;
  let distanceOnSegment = 0;
  let speed = opts.speed;

  const place = () => {
    if (segments.length === 0) {
      return;
    }
    const segment = segments[segmentIndex];
    if (segment.length <= 1e-6) {
      return;
    }
    const t = Math.max(0, Math.min(1, distanceOnSegment / segment.length));
    tempPos.copy(segment.start).lerp(segment.end, t);
    tangent.copy(segment.end).sub(segment.start);
    if (tangent.lengthSq() > 1e-8) {
      tangent.normalize();
      tempQuat.setFromUnitVectors(FORWARD, tangent);
      object.quaternion.copy(tempQuat);
    }
    tempPos.y += opts.yOffset;
    object.position.copy(tempPos);
  };

  const advanceSegment = () => {
    if (segments.length === 0) {
      return;
    }
    segmentIndex = (segmentIndex + 1) % segments.length;
    distanceOnSegment = 0;
  };

  const update = (dt: number) => {
    if (segments.length === 0 || dt <= 0 || speed <= 0) {
      place();
      return;
    }

    let remainingMove = speed * dt;
    while (remainingMove > 0 && segments.length > 0) {
      const current = segments[segmentIndex];
      if (current.length <= 1e-6) {
        advanceSegment();
        continue;
      }

      const left = current.length - distanceOnSegment;
      if (remainingMove < left) {
        distanceOnSegment += remainingMove;
        remainingMove = 0;
      } else {
        remainingMove -= left;
        advanceSegment();
      }
    }
    place();
  };

  const setSegments = (nextSegments: TrainPathSegment[]) => {
    segments = nextSegments.slice();
    segmentIndex = 0;
    distanceOnSegment = 0;
    place();
  };

  const setSpeed = (nextSpeed: number) => {
    speed = Math.max(0, nextSpeed);
  };

  const getState = () => ({
    segmentIndex,
    distanceOnSegment,
    position: object.position.clone(),
    ready: segments.length > 0
  });

  place();

  return {
    update,
    setSegments,
    setSpeed,
    getState
  };
}
