import * as THREE from "three";

type TrainFitOptions = {
  widthFactor: number;
  lengthFactor: number;
  minScale: number;
  maxScale: number;
};

export type TrainFitResult = {
  scale: number;
  trainWidth: number;
  trainLength: number;
  railWidth: number;
  railLength: number;
};

const DEFAULT_OPTIONS: TrainFitOptions = {
  widthFactor: 0.78,
  lengthFactor: 0.92,
  minScale: 1e-6,
  maxScale: 100
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function horizontalSize(box: THREE.Box3) {
  const size = box.getSize(new THREE.Vector3());
  const width = Math.min(Math.abs(size.x), Math.abs(size.z));
  const length = Math.max(Math.abs(size.x), Math.abs(size.z));
  return { width: Math.max(width, 1e-6), length: Math.max(length, 1e-6) };
}

export function fitTrainToRails(
  trainRoot: THREE.Object3D,
  rails: { start: THREE.Object3D; main: THREE.Object3D },
  options: Partial<TrainFitOptions> = {}
): TrainFitResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  trainRoot.scale.setScalar(1);
  trainRoot.updateMatrixWorld(true);

  const trainBox = new THREE.Box3().setFromObject(trainRoot);
  const trainSize = horizontalSize(trainBox);

  const railMainBox = new THREE.Box3().setFromObject(rails.main);
  const railStartBox = new THREE.Box3().setFromObject(rails.start);
  railMainBox.union(railStartBox);
  const railSize = horizontalSize(railMainBox);

  const targetWidth = railSize.width * opts.widthFactor;
  const targetLength = railSize.length * opts.lengthFactor;
  const byWidth = targetWidth / trainSize.width;
  const byLength = targetLength / trainSize.length;
  const scale = clamp(Math.min(byWidth, byLength), opts.minScale, opts.maxScale);

  trainRoot.scale.setScalar(scale);
  trainRoot.updateMatrixWorld(true);

  return {
    scale,
    trainWidth: trainSize.width,
    trainLength: trainSize.length,
    railWidth: railSize.width,
    railLength: railSize.length
  };
}
