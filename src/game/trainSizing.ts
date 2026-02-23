import * as THREE from "three";

export type TrainSizerOptions = {
  minMultiplier?: number;
  maxMultiplier?: number;
};

export type TrainSizer = {
  setMultiplier: (value: number) => void;
  getMultiplier: () => number;
  getBaseScale: () => number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createTrainSizer(model: THREE.Object3D, options: TrainSizerOptions = {}): TrainSizer {
  const minMultiplier = options.minMultiplier ?? 0.2;
  const maxMultiplier = options.maxMultiplier ?? 5;
  const baseScale = model.scale.x || 1;
  let multiplier = 1;

  const setMultiplier = (value: number) => {
    multiplier = clamp(value, minMultiplier, maxMultiplier);
    model.scale.setScalar(baseScale * multiplier);
  };

  const getMultiplier = () => multiplier;
  const getBaseScale = () => baseScale;

  return {
    setMultiplier,
    getMultiplier,
    getBaseScale
  };
}
