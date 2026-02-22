import * as THREE from "three";

import "./style.css";
import { createPlaceholderCar } from "./game/carPlaceholder";
import { createKeyboardControls } from "./game/controls";
import { createFollowCamera } from "./game/followCamera";
import { createVehicle, type VehicleState } from "./game/vehicle";

declare global {
  interface Window {
    __THREE_DRIVE__?: {
      getCarState: () => VehicleState;
    };
  }
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root element");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x80b0df);
scene.fog = new THREE.Fog(0x80b0df, 45, 180);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.dataset.testid = "scene-canvas";
app.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd7e9ff, 0x2f3a4c, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 1.05);
sun.position.set(18, 28, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 120;
sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;
sun.shadow.camera.bottom = -45;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(260, 260, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x1f5132, roughness: 0.95, metalness: 0.05 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(220, 48, 0xffffff, 0xffffff);
grid.material.transparent = true;
grid.material.opacity = 0.15;
scene.add(grid);

const carRoot = new THREE.Group();
carRoot.add(createPlaceholderCar());
scene.add(carRoot);

const controls = createKeyboardControls(window);
const vehicle = createVehicle({
  position: { x: 0, y: 0.06, z: 0 },
  heading: 0,
  speed: 0
});
const followCamera = createFollowCamera(camera, {
  distance: 9,
  height: 4.1,
  damping: 7.5,
  lookAhead: 9.5
});

window.__THREE_DRIVE__ = {
  getCarState: () => vehicle.getState()
};

const clock = new THREE.Clock();

function renderFrame() {
  requestAnimationFrame(renderFrame);

  const dt = Math.min(clock.getDelta(), 1 / 30);
  const state = vehicle.update(dt, controls);

  carRoot.position.set(state.position.x, state.position.y, state.position.z);
  carRoot.rotation.y = state.heading;

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
