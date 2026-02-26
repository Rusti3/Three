import * as THREE from "three";

export type AlternatingRailKit = {
  section4: THREE.Object3D;
  section3: THREE.Object3D;
  section4Length: number;
  section3Length: number;
};

export type RailBuildOptions = {
  endOffset: number;
};

function distanceXZ(a: THREE.Vector3, b: THREE.Vector3) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function applyShadowFlags(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

export function countAlternatingSections(
  distance: number,
  section4Length: number,
  section3Length: number,
  endOffset: number
) {
  const usable = Math.max(0, distance - endOffset * 2);
  let cursor = 0;
  let count = 0;
  let useFour = true;

  while (true) {
    const len = useFour ? section4Length : section3Length;
    if (cursor + len > usable + 1e-6) {
      break;
    }
    cursor += len;
    count += 1;
    useFour = !useFour;
  }

  return count;
}

export function buildAlternatingRailSegments(
  kit: AlternatingRailKit,
  start: THREE.Vector3,
  end: THREE.Vector3,
  options: RailBuildOptions
) {
  const group = new THREE.Group();
  const flatStart = new THREE.Vector3(start.x, 0, start.z);
  const flatEnd = new THREE.Vector3(end.x, 0, end.z);
  const distance = distanceXZ(flatStart, flatEnd);
  if (distance <= 1e-6) {
    return group;
  }

  const sectionCount = countAlternatingSections(
    distance,
    kit.section4Length,
    kit.section3Length,
    options.endOffset
  );
  if (sectionCount === 0) {
    return group;
  }

  const dir = flatEnd.sub(flatStart).normalize();
  const yaw = Math.atan2(dir.x, dir.z);
  const y = (start.y + end.y) * 0.5;
  let cursor = options.endOffset;
  let useFour = true;

  for (let i = 0; i < sectionCount; i += 1) {
    const section = (useFour ? kit.section4 : kit.section3).clone(true);
    section.userData.sectionType = useFour ? "4" : "3";
    section.position
      .copy(new THREE.Vector3(start.x, y, start.z))
      .add(new THREE.Vector3(dir.x, 0, dir.z).multiplyScalar(cursor));
    section.rotation.y = yaw;
    applyShadowFlags(section);
    group.add(section);

    cursor += useFour ? kit.section4Length : kit.section3Length;
    useFour = !useFour;
  }

  return group;
}
