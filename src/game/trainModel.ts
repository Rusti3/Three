import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { fitModelToWorld } from "./modelFit";

// Increase/decrease this value to tune the train's world size.
export const TRAIN_TARGET_LONGEST_SIDE = 1000;

export function getTrainModelUrl() {
  return new URL("../../the_polar_express_locomotive.glb", import.meta.url).href;
}

export function applyTrainDefaults(model: THREE.Object3D) {
  fitModelToWorld(model, {
    targetLongestSide: TRAIN_TARGET_LONGEST_SIDE,
    groundY: 0
  });
}

export async function loadTrainModel(url = getTrainModelUrl(), loader = new GLTFLoader()) {
  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;
  applyTrainDefaults(model);
  return { model, animations: gltf.animations };
}
