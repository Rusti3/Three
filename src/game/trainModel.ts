import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type TrainLoadResult = {
  object: THREE.Group;
  bbox: THREE.Box3;
};

function centerAndGround(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;
  group.updateMatrixWorld(true);
}

function alignForwardAxis(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  // Most train assets are authored with X as forward; rotate to Z-forward for path motion.
  if (Math.abs(size.x) > Math.abs(size.z)) {
    group.rotation.y = -Math.PI / 2;
    group.updateMatrixWorld(true);
  }
}

export async function loadTrainModel(url: string): Promise<TrainLoadResult> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  const root = new THREE.Group();
  root.name = "TrainRoot";
  root.add(gltf.scene);

  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  alignForwardAxis(root);
  centerAndGround(root);
  const bbox = new THREE.Box3().setFromObject(root);

  return { object: root, bbox };
}
