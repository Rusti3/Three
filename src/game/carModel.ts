import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const DEFAULT_MODEL_SCALE = 0.7;
const DEFAULT_MODEL_Y_OFFSET = 0.02;

export function getCarModelUrl() {
  return new URL("../../sample.glb", import.meta.url).href;
}

export function applyCarModelDefaults(model: THREE.Object3D) {
  model.scale.setScalar(DEFAULT_MODEL_SCALE);
  model.position.set(0, DEFAULT_MODEL_Y_OFFSET, 0);

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

export async function loadCarModel(url = getCarModelUrl(), loader = new GLTFLoader()) {
  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;
  applyCarModelDefaults(model);
  return model;
}
