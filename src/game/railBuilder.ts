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

function pointAtDistance3D(from: THREE.Vector3, dir3D: THREE.Vector3, distance: number) {
  return from.clone().addScaledVector(dir3D, distance);
}

export function buildRailBetween(
  pieces: RailPieces,
  start: THREE.Vector3,
  end: THREE.Vector3,
  options: RailBuildOptions
) {
  const group = new THREE.Group();
  const delta = end.clone().sub(start);
  const totalDistance = delta.length();
  if (totalDistance <= 1e-6) {
    return group;
  }

  const dir3D = delta.normalize();
  const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir3D);

  const offsets = Math.max(options.minOffset, 0);
  const pathBeginS = offsets;
  const pathEndS = totalDistance - offsets;
  if (pathEndS <= pathBeginS) {
    return group;
  }

  const startCenterS = pathBeginS + pieces.startLength * 0.5;
  const startEndS = pathBeginS + pieces.startLength;
  const endCenterS = pathEndS - pieces.endLength * 0.5;
  const endBeginS = pathEndS - pieces.endLength;

  if (endBeginS <= startEndS) {
    return group;
  }

  const addPiece = (source: THREE.Group, centerS: number, type: "start" | "main" | "end") => {
    const piece = source.clone(true);
    piece.position.copy(pointAtDistance3D(start, dir3D, centerS));
    piece.quaternion.copy(orientation);
    piece.userData.sectionType = type;
    applyShadows(piece);
    group.add(piece);
  };

  addPiece(pieces.start, startCenterS, "start");

  const middleLength = Math.max(0, endBeginS - startEndS);
  const clampedMainLength = Math.max(0.01, pieces.mainLength);
  const mainCount = middleLength > 1e-6 ? Math.max(1, Math.ceil(middleLength / clampedMainLength)) : 0;
  const mainStep = mainCount > 0 ? middleLength / mainCount : 0;
  for (let i = 0; i < mainCount; i += 1) {
    const centerS = startEndS + mainStep * (i + 0.5);
    addPiece(pieces.main, centerS, "main");
  }

  addPiece(pieces.start, endCenterS, "end");

  return group;
}
