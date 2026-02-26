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

function pointAtDistanceXZ(from: THREE.Vector3, dirXZ: THREE.Vector3, distance: number, y: number) {
  return new THREE.Vector3(from.x + dirXZ.x * distance, y, from.z + dirXZ.z * distance);
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
  const dirXZ = flatEnd.clone().sub(flatStart);
  const totalDistanceXZ = dirXZ.length();
  if (totalDistanceXZ <= 1e-6) {
    return group;
  }

  dirXZ.normalize();
  const line3d = end.clone().sub(start);
  const line3dLength = line3d.length();
  if (line3dLength <= 1e-6) {
    return group;
  }
  const direction3d = line3d.clone().normalize();
  const orientation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    direction3d
  );

  // Convert section lengths to XZ distances to keep joints consistent on a slope.
  const xzScale = totalDistanceXZ / line3dLength;
  const startLengthXZ = pieces.startLength * xzScale;
  const mainLengthXZ = pieces.mainLength * xzScale;
  const endLengthXZ = pieces.endLength * xzScale;

  const offsets = Math.max(options.minOffset, 0);
  const startBeginS = offsets;
  const startCenterS = startBeginS + startLengthXZ * 0.5;
  const startEndS = startBeginS + startLengthXZ;
  const endEndS = totalDistanceXZ - offsets;
  const endCenterS = endEndS - endLengthXZ * 0.5;
  const endBeginS = endEndS - endLengthXZ;

  if (endBeginS <= startEndS) {
    return group;
  }

  const yAtS = (s: number) => {
    const t = Math.max(0, Math.min(1, s / totalDistanceXZ));
    return start.y + (end.y - start.y) * t;
  };

  // add start piece
  const startPiece = pieces.start.clone(true);
  startPiece.quaternion.copy(orientation);
  startPiece.position.copy(pointAtDistanceXZ(start, dirXZ, startCenterS, yAtS(startCenterS)));
  startPiece.userData.sectionType = "start";
  applyShadows(startPiece);
  group.add(startPiece);

  const middleLength = Math.max(0, endBeginS - startEndS);
  const mainCount = Math.floor(middleLength / mainLengthXZ);
  for (let i = 0; i < mainCount; i += 1) {
    const centerS = startEndS + mainLengthXZ * (i + 0.5);
    const position = pointAtDistanceXZ(start, dirXZ, centerS, yAtS(centerS));
    const mainPiece = pieces.main.clone(true);
    mainPiece.position.copy(position);
    mainPiece.quaternion.copy(orientation);
    mainPiece.userData.sectionType = "main";
    applyShadows(mainPiece);
    group.add(mainPiece);
  }

  const endPiece = pieces.start.clone(true);
  endPiece.quaternion.copy(orientation);
  endPiece.position.copy(pointAtDistanceXZ(start, dirXZ, endCenterS, yAtS(endCenterS)));
  endPiece.userData.sectionType = "end";
  applyShadows(endPiece);
  group.add(endPiece);

  return group;
}
