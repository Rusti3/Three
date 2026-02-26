import * as THREE from "three";

export type RailPieces = {
  start: THREE.Group;
  main: THREE.Group;
  startLength: number;
  mainLength: number;
  endLength: number;
};

export type RailBuildOptions = {
  minOffset: number;
};

function normalizeSection(section: THREE.Group) {
  section.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(section);
  const offset = new THREE.Vector3(
    -((bbox.min.x + bbox.max.x) * 0.5),
    -bbox.min.y,
    -bbox.min.z
  );

  const normalized = new THREE.Group();
  section.traverse((child) => {
    if (child === section) {
      return;
    }
    normalized.add(child.clone(true));
  });
  normalized.position.copy(offset);
  normalized.updateMatrixWorld(true);
  const normBox = new THREE.Box3().setFromObject(normalized);
  const length = Math.max(0.01, normBox.max.z - normBox.min.z);
  return { section: normalized, length };
}

function applyShadows(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

function distanceXZ(a: THREE.Vector3, b: THREE.Vector3) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function buildRailBetween(
  pieces: RailPieces,
  start: THREE.Vector3,
  end: THREE.Vector3,
  options: RailBuildOptions
) {
  const group = new THREE.Group();
  const flatStart = new THREE.Vector3(start.x, 0, start.z);
  const flatEnd = new THREE.Vector3(end.x, 0, end.z);
  const dir = flatEnd.clone().sub(flatStart);
  const totalDistance = dir.length();
  if (totalDistance <= 1e-6) {
    return group;
  }

  dir.normalize();
  const yaw = Math.atan2(dir.x, dir.z);
  const y = (start.y + end.y) * 0.5;
  const offsets = Math.max(options.minOffset, 0);
  const startCenter = start.clone().add(dir.clone().multiplyScalar(pieces.startLength * 0.5 + offsets));
  const endCenter = end.clone().sub(dir.clone().multiplyScalar(pieces.endLength * 0.5 + offsets));
  const usable = Math.max(0, startCenter.distanceTo(endCenter));

  // add start piece
  const startPiece = pieces.start.clone(true);
  startPiece.rotation.y = yaw;
  startPiece.position.copy(startCenter);
  startPiece.position.y = y;
  applyShadows(startPiece);
  group.add(startPiece);

  const mainCount = Math.floor(usable / pieces.mainLength);
  for (let i = 0; i < mainCount; i += 1) {
    const offsetScalar = pieces.startLength * 0.5 + pieces.mainLength * (i + 0.5) + offsets;
    const position = start.clone().add(dir.clone().multiplyScalar(offsetScalar));
    const mainPiece = pieces.main.clone(true);
    mainPiece.position.copy(position);
    mainPiece.position.y = y;
    mainPiece.rotation.y = yaw;
    applyShadows(mainPiece);
    group.add(mainPiece);
  }

  const endPiece = pieces.start.clone(true);
  endPiece.rotation.y = yaw;
  endPiece.position.copy(endCenter);
  endPiece.position.y = y;
  applyShadows(endPiece);
  group.add(endPiece);

  return group;
}
