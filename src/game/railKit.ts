import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type RailPieces = {
  start: THREE.Group;
  main: THREE.Group;
  startLength: number;
  mainLength: number;
  endLength: number;
};

function normalizeSection(source: THREE.Group) {
  source.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(source);
  const offset = new THREE.Vector3(
    -((bbox.min.x + bbox.max.x) * 0.5),
    -bbox.min.y,
    -bbox.min.z
  );
  const normalized = new THREE.Group();
  source.children.forEach((child) => normalized.add(child.clone(true)));
  normalized.position.copy(offset);
  normalized.updateMatrixWorld(true);
  const normBox = new THREE.Box3().setFromObject(normalized);
  return { group: normalized, length: Math.max(0.01, normBox.max.z - normBox.min.z) };
}

async function loadScene(url: string) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  const group = new THREE.Group();
  group.add(gltf.scene.clone(true));
  return group;
}

export function createRailPiecesForScenes(startScene: THREE.Object3D, mainScene: THREE.Object3D): RailPieces {
  const normalizedStart = normalizeSection(startScene.clone() as THREE.Group);
  const normalizedMain = normalizeSection(mainScene.clone() as THREE.Group);
  return {
    start: normalizedStart.group,
    main: normalizedMain.group,
    startLength: normalizedStart.length,
    mainLength: normalizedMain.length,
    endLength: normalizedStart.length
  };
}

export async function loadRailPieces(startUrl: string, mainUrl: string): Promise<RailPieces> {
  const [startScene, mainScene] = await Promise.all([loadScene(startUrl), loadScene(mainUrl)]);
  return createRailPiecesForScenes(startScene, mainScene);
}
