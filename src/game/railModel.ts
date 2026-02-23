import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { fitModelToWorld } from "./modelFit";

const RAIL_TARGET_LONGEST_SIDE = 320;

export function getRailModelUrl() {
  return new URL("../../railway.glb", import.meta.url).href;
}

export function applyRailDefaults(model: THREE.Object3D) {
  fitModelToWorld(model, {
    targetLongestSide: RAIL_TARGET_LONGEST_SIDE,
    groundY: 0
  });
}

export async function loadRailModel(url = getRailModelUrl(), loader = new GLTFLoader()) {
  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;
  applyRailDefaults(model);
  return model;
}
