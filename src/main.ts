import * as THREE from "three";

import "./style.css";
import { createFollowCamera } from "./game/followCamera";
import { loadRailModel } from "./game/railModel";
import { createTrainAnimator } from "./game/trainAnimation";
import { loadTrainModel } from "./game/trainModel";
import { createTrainMotion, type TrainState } from "./game/trainMotion";
import { createTrainSizer, type TrainSizer } from "./game/trainSizing";

declare global {
  interface Window {
    __THREE_DRIVE__?: {
      getTrainState: () => TrainState;
      isTrainLoaded: () => boolean;
      isRailLoaded: () => boolean;
      getCameraZoom: () => number;
    };
  }
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root element");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9db8d6);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.dataset.testid = "scene-canvas";
app.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe7efff, 0x445e53, 0.85));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(40, 80, -10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 260;
sun.shadow.camera.left = -130;
sun.shadow.camera.right = 130;
sun.shadow.camera.top = 130;
sun.shadow.camera.bottom = -130;
scene.add(sun);

const terrain = new THREE.Mesh(
  new THREE.PlaneGeometry(1200, 1200, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x2f5d43, roughness: 0.95, metalness: 0.02 })
);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

const railRoot = new THREE.Group();
const trainRoot = new THREE.Group();
scene.add(railRoot);
scene.add(trainRoot);

let railLoaded = false;
let trainLoaded = false;
let trainAnimator: ReturnType<typeof createTrainAnimator> | null = null;
let trainSizer: TrainSizer | null = null;

const scaleInput = document.querySelector<HTMLInputElement>("#train-scale");
const scaleValue = document.querySelector<HTMLSpanElement>("#train-scale-value");
let pendingScaleMultiplier = scaleInput ? Number(scaleInput.value) : 1;

function setTrainScaleMultiplier(value: number) {
  pendingScaleMultiplier = value;
  if (scaleValue) {
    scaleValue.textContent = `${value.toFixed(2)}x`;
  }
  trainSizer?.setMultiplier(value);
}

if (scaleInput) {
  scaleInput.addEventListener("input", () => {
    setTrainScaleMultiplier(Number(scaleInput.value));
  });
  setTrainScaleMultiplier(pendingScaleMultiplier);
}

const trainMotion = createTrainMotion({
  startZ: -80,
  endZ: 80,
  speed: 14,
  x: 0,
  y: 0,
  heading: 0
});

const followCamera = createFollowCamera(camera, {
  distance: 4,
  height: 11,
  damping: 5.2,
  lookAhead: 8,
  sideOffset: 26,
  initialZoom: 1,
  minZoom: 0.55,
  maxZoom: 20000
});

function boxIsValid(box: THREE.Box3) {
  return Number.isFinite(box.min.x) && Number.isFinite(box.max.x);
}

function alignTrainToRail() {
  if (!railLoaded || !trainLoaded) {
    return;
  }

  const railBox = new THREE.Box3().setFromObject(railRoot);
  const trainBox = new THREE.Box3().setFromObject(trainRoot);

  if (!boxIsValid(railBox) || !boxIsValid(trainBox)) {
    return;
  }

  const railLength = railBox.max.z - railBox.min.z;
  if (railLength > 2) {
    const padding = Math.max(2, railLength * 0.04);
    const startZ = railBox.min.z + padding;
    const endZ = railBox.max.z - padding;
    trainMotion.setBounds(startZ, endZ);
  }

  const trainY = railBox.max.y - trainBox.min.y;
  trainMotion.setBasePosition(0, trainY);

  const state = trainMotion.getState();
  trainRoot.position.set(state.position.x, state.position.y, state.position.z);
}

void loadRailModel()
  .then((rail) => {
    railRoot.add(rail);
    railLoaded = true;
    alignTrainToRail();
  })
  .catch((error) => {
    console.error("Failed to load railway.glb", error);
  });

void loadTrainModel()
  .then(({ model, animations }) => {
    trainRoot.add(model);
    trainAnimator = createTrainAnimator(model, animations);
    trainSizer = createTrainSizer(model, {
      minMultiplier: scaleInput ? Number(scaleInput.min) : 0.2,
      maxMultiplier: scaleInput ? Number(scaleInput.max) : 5
    });
    trainSizer.setMultiplier(pendingScaleMultiplier);
    trainLoaded = true;
    alignTrainToRail();
  })
  .catch((error) => {
    console.error("Failed to load the_polar_express_locomotive.glb", error);
  });

window.__THREE_DRIVE__ = {
  getTrainState: () => trainMotion.getState(),
  isTrainLoaded: () => trainLoaded,
  isRailLoaded: () => railLoaded,
  getCameraZoom: () => followCamera.getZoom()
};

renderer.domElement.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    // Scroll up zooms in (smaller zoom), scroll down zooms out.
    followCamera.zoomBy(event.deltaY * 0.03);
  },
  { passive: false }
);

const clock = new THREE.Clock();

function renderFrame() {
  requestAnimationFrame(renderFrame);

  const dt = Math.min(clock.getDelta(), 1 / 30);
  const state = trainMotion.update(dt);

  trainRoot.position.set(state.position.x, state.position.y, state.position.z);
  trainRoot.rotation.y = state.heading;

  trainAnimator?.update(dt, state.speed);
  followCamera.update(state, dt);
  renderer.render(scene, camera);
}

renderFrame();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});
