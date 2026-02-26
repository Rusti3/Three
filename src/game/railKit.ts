import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type RailKit = {
  section4: THREE.Group;
  section3: THREE.Group;
  section4Length: number;
  section3Length: number;
};

type Candidate = {
  group: THREE.Group;
  sleeperCount: number;
  length: number;
};

function normalizeSectionToForwardZ(source: THREE.Group) {
  source.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(source);
  const offset = new THREE.Vector3(
    -((bbox.min.x + bbox.max.x) * 0.5),
    -bbox.min.y,
    -bbox.min.z
  );

  const normalized = new THREE.Group();
  for (const child of source.children) {
    const clone = child.clone(true);
    clone.position.add(offset);
    normalized.add(clone);
  }

  normalized.updateMatrixWorld(true);
  const normalizedBox = new THREE.Box3().setFromObject(normalized);
  const length = normalizedBox.max.z - normalizedBox.min.z;
  return {
    section: normalized,
    length: Math.max(0.01, length)
  };
}

function isRailLike(name: string) {
  const low = name.toLowerCase();
  return low.includes("рельс") || low.includes("rail");
}

function isSleeperLike(name: string) {
  const low = name.toLowerCase();
  return low.startsWith("cube");
}

function collectCandidates(root: THREE.Object3D) {
  const all = root.children.filter((c) => c instanceof THREE.Mesh);
  const rails = all.filter((c) => isRailLike(c.name));
  const sleepers = all.filter((c) => isSleeperLike(c.name));

  const candidates: Candidate[] = [];
  for (const rail of rails) {
    const railPos = rail.getWorldPosition(new THREE.Vector3());
    const section = new THREE.Group();
    section.add(rail.clone(true));

    const nearSleepers = sleepers.filter((sleeper) => {
      const p = sleeper.getWorldPosition(new THREE.Vector3());
      return Math.abs(p.x - railPos.x) < 0.8 && Math.abs(p.z - railPos.z) < 4.2;
    });

    for (const sleeper of nearSleepers) {
      section.add(sleeper.clone(true));
    }

    const normalized = normalizeSectionToForwardZ(section);
    candidates.push({
      group: normalized.section,
      sleeperCount: nearSleepers.length,
      length: normalized.length
    });
  }

  return candidates;
}

export function extractRailKitFromRoot(root: THREE.Object3D): RailKit {
  const candidates = collectCandidates(root);
  if (candidates.length < 2) {
    throw new Error("Could not identify both rail sections (4 and 3 sleepers).");
  }

  const sorted = candidates.sort((a, b) => {
    if (b.sleeperCount !== a.sleeperCount) {
      return b.sleeperCount - a.sleeperCount;
    }
    return b.length - a.length;
  });

  const section4Candidate = sorted.find((c) => c.sleeperCount >= 4) ?? sorted[0];
  const section3Candidate =
    sorted.find((c) => c !== section4Candidate && c.sleeperCount === 3) ??
    sorted.find((c) => c !== section4Candidate) ??
    sorted[1];

  return {
    section4: section4Candidate.group,
    section3: section3Candidate.group,
    section4Length: section4Candidate.length,
    section3Length: section3Candidate.length
  };
}

export async function loadRailKit(url: string) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  return extractRailKitFromRoot(gltf.scene);
}
