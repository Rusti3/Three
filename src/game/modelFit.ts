import * as THREE from "three";

export type FitModelOptions = {
  targetLongestSide: number;
  groundY?: number;
  offsetY?: number;
  rotationY?: number;
  centerX?: boolean;
  centerZ?: boolean;
};

const TMP_BOX = new THREE.Box3();
const TMP_SIZE = new THREE.Vector3();
const TMP_CENTER = new THREE.Vector3();

function hasFiniteBox(box: THREE.Box3) {
  return Number.isFinite(box.min.x) && Number.isFinite(box.max.x);
}

export function enableShadows(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

export function fitModelToWorld(root: THREE.Object3D, options: FitModelOptions) {
  const {
    targetLongestSide,
    groundY = 0,
    offsetY = 0,
    rotationY = 0,
    centerX = true,
    centerZ = true
  } = options;

  root.rotation.y = rotationY;

  TMP_BOX.setFromObject(root);
  if (!hasFiniteBox(TMP_BOX)) {
    enableShadows(root);
    return;
  }

  TMP_BOX.getSize(TMP_SIZE);
  const longestSide = Math.max(TMP_SIZE.x, TMP_SIZE.y, TMP_SIZE.z, 0.0001);
  root.scale.setScalar(targetLongestSide / longestSide);

  TMP_BOX.setFromObject(root);
  TMP_BOX.getCenter(TMP_CENTER);

  if (centerX) {
    root.position.x -= TMP_CENTER.x;
  }
  if (centerZ) {
    root.position.z -= TMP_CENTER.z;
  }

  TMP_BOX.setFromObject(root);
  root.position.y += groundY - TMP_BOX.min.y + offsetY;

  enableShadows(root);
}
