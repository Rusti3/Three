import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import "./style.css";
import { createIslandData, type IslandParams } from "./game/islandGenerator";
import { chooseAdaptiveResolution } from "./game/islandLod";
import { buildIslandGeometry } from "./game/islandMesh";
import { findSpawnPosition } from "./game/islandPlacement";
import { randomIslandParamsFromRanges } from "./game/islandRandomParams";
import { buildRailBetween, type RailPieces } from "./game/railBuilder";
import { buildMstEdges, type RailNode } from "./game/railGraph";
import { loadRailPieces } from "./game/railKit";
import { createTrainMotion, type TrainMotionController } from "./game/trainMotion";
import { loadTrainModel } from "./game/trainModel";
import { buildTraversalPath, type RailEdgeSegment } from "./game/trainPath";
import type { PlacedIsland } from "./game/islandTypes";

declare global {
  interface Window {
    __THREE_DRIVE__?: {
      getIslandCount: () => number;
      getCameraDistance: () => number;
      getRailSegmentCount: () => number;
      isTrainLoaded: () => boolean;
      getTrainPosition: () => { x: number; y: number; z: number };
      getTrainScale: () => number;
    };
  }
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root element");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8c9f0);
scene.fog = new THREE.Fog(0xa8c9f0, 180, 1200);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 90, 190);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.dataset.testid = "scene-canvas";
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 8;
controls.maxDistance = 800;
controls.target.set(0, 40, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xf0f7ff, 0x3f5660, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(120, 180, 90);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 420;
sun.shadow.camera.left = -220;
sun.shadow.camera.right = 220;
sun.shadow.camera.top = 220;
sun.shadow.camera.bottom = -220;
scene.add(sun);

const starsGeometry = new THREE.BufferGeometry();
const starCount = 2000;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const radius = 400 + Math.random() * 800;
  const theta = Math.random() * Math.PI * 2;
  const y = -120 + Math.random() * 700;
  starPos[i * 3] = Math.cos(theta) * radius;
  starPos[i * 3 + 1] = y;
  starPos[i * 3 + 2] = Math.sin(theta) * radius;
}
starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(
  starsGeometry,
  new THREE.PointsMaterial({ size: 1.2, color: 0xffffff, transparent: true, opacity: 0.6 })
);
scene.add(stars);
const railsRoot = new THREE.Group();
scene.add(railsRoot);
const trainRoot = new THREE.Group();
scene.add(trainRoot);

const seedInput = document.querySelector<HTMLInputElement>("#seed-input");
const nInput = document.querySelector<HTMLInputElement>("#n-input");
const xyScaleInput = document.querySelector<HTMLInputElement>("#xy-scale-input");
const zScaleInput = document.querySelector<HTMLInputElement>("#z-scale-input");
const mountainAmpInput = document.querySelector<HTMLInputElement>("#mountain-amp-input");
const cliffAmpInput = document.querySelector<HTMLInputElement>("#cliff-amp-input");
const statusEl = document.querySelector<HTMLDivElement>("#status");
const islandCountEl = document.querySelector<HTMLSpanElement>("#island-count");

const WORLD_RADIUS = 420;
const PADDING = 12;
const MAX_ATTEMPTS = 200;
const ISLAND_MIN_Y = 24;
const ISLAND_MAX_Y = 130;

const islandShell = new THREE.MeshStandardMaterial({
  color: 0x62886e,
  roughness: 0.92,
  metalness: 0.04,
  side: THREE.DoubleSide,
  transparent: false,
  opacity: 1
});

const islands: PlacedIsland[] = [];
const railNodes: Array<RailNode & { radius: number; mesh: THREE.Mesh }> = [];
let railPieces: RailPieces | null = null;
let railSegmentCount = 0;
const railHeightRaycaster = new THREE.Raycaster();
const downDirection = new THREE.Vector3(0, -1, 0);
const railEdgeSegments: RailEdgeSegment[] = [];
let trainMotion: TrainMotionController | null = null;
let trainLoaded = false;
const trainScale = 1;

function readNumber(input: HTMLInputElement | null, fallback: number) {
  if (!input) {
    return fallback;
  }
  const parsed = Number(input.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readParams(): IslandParams {
  return {
    seed: Math.floor(readNumber(seedInput, 4121132)),
    n: Math.floor(clamp(readNumber(nInput, 160), 64, 280)),
    xyScale: clamp(readNumber(xyScaleInput, 32), 8, 96),
    zScale: clamp(readNumber(zScaleInput, 10), 2, 40),
    mountainAmp: clamp(readNumber(mountainAmpInput, 0.58), 0.05, 1.2),
    cliffAmp: clamp(readNumber(cliffAmpInput, 0.07), 0, 0.6),
    namePrefix: "FloatingIsland"
  };
}

function setInputValue(input: HTMLInputElement | null, value: number) {
  if (!input) {
    return;
  }
  input.value = String(value);
}

function randomizeInputsForNextIsland() {
  const p = randomIslandParamsFromRanges();
  setInputValue(seedInput, p.seed);
  setInputValue(nInput, p.n);
  setInputValue(xyScaleInput, p.xyScale);
  setInputValue(zScaleInput, p.zScale);
  setInputValue(mountainAmpInput, p.mountainAmp);
  setInputValue(cliffAmpInput, p.cliffAmp);
}

function setStatus(text: string) {
  if (statusEl) {
    statusEl.textContent = text;
  }
}

function updateIslandCount() {
  if (islandCountEl) {
    islandCountEl.textContent = String(islands.length);
  }
}

function createIslandMaterials(seed: number) {
  const hue = ((seed % 360) + 360) % 360;
  const top = islandShell.clone();
  top.color = new THREE.Color(`hsl(${hue}, 24%, 42%)`);
  return top;
}

function clearRails() {
  railsRoot.clear();
  railSegmentCount = 0;
  railEdgeSegments.length = 0;
}

function getIslandSurfaceY(node: RailNode & { radius: number; mesh: THREE.Mesh }, x: number, z: number) {
  const rayOriginY = node.position.y + 220;
  railHeightRaycaster.set(new THREE.Vector3(x, rayOriginY, z), downDirection);
  const hits = railHeightRaycaster.intersectObject(node.mesh, false);
  if (hits.length > 0) {
    return hits[0].point.y + 0.04;
  }
  const box = new THREE.Box3().setFromObject(node.mesh);
  return box.max.y + 0.04;
}

function rebuildRails() {
  clearRails();
  if (!railPieces || railNodes.length < 2) {
    trainMotion?.setSegments([]);
    return;
  }

  const byId = new Map(railNodes.map((n) => [n.id, n]));
  const edges = buildMstEdges(railNodes);

  for (const edge of edges) {
    const a = byId.get(edge.fromId);
    const b = byId.get(edge.toId);
    if (!a || !b) {
      continue;
    }

    const distance = Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);
    const dir = new THREE.Vector3().subVectors(b.position, a.position);
    if (distance <= 1e-3) {
      continue;
    }
    const normalized = dir.clone().normalize();
    const startOffset = Math.min(distance * 0.3, Math.max(1, a.radius * 0.4));
    const endOffset = Math.min(distance * 0.3, Math.max(1, b.radius * 0.4));
    const startPoint = a.position.clone().add(normalized.clone().multiplyScalar(startOffset));
    const endPoint = b.position.clone().sub(normalized.clone().multiplyScalar(endOffset));

    startPoint.y = getIslandSurfaceY(a, startPoint.x, startPoint.z);
    endPoint.y = getIslandSurfaceY(b, endPoint.x, endPoint.z);

    const group = buildRailBetween(railPieces, startPoint, endPoint, { minOffset: 0.2 });

    railSegmentCount += group.children.length;
    railsRoot.add(group);
    railEdgeSegments.push({
      id: `${edge.fromId}-${edge.toId}`,
      fromId: edge.fromId,
      toId: edge.toId,
      fromPoint: startPoint.clone(),
      toPoint: endPoint.clone()
    });
  }

  trainMotion?.setSegments(buildTraversalPath(railEdgeSegments));
}

function spawnIsland() {
  randomizeInputsForNextIsland();
  const params = readParams();
  const adaptiveN = chooseAdaptiveResolution(params.n, islands.length);
  const effectiveParams = { ...params, n: adaptiveN };
  const data = createIslandData(effectiveParams);
  const { geometry, approxRadius } = buildIslandGeometry(data);
  const pos = findSpawnPosition(islands, approxRadius, WORLD_RADIUS, PADDING, MAX_ATTEMPTS);
  if (!pos) {
    geometry.dispose();
    setStatus("No free space left for a non-overlapping island.");
    return;
  }

  const material = createIslandMaterials(params.seed + islands.length * 17);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = `${params.namePrefix}_${islands.length + 1}`;

  const y = ISLAND_MIN_Y + Math.random() * (ISLAND_MAX_Y - ISLAND_MIN_Y);
  mesh.position.set(pos.x, y, pos.z);
  scene.add(mesh);

  islands.push({ x: pos.x, z: pos.z, radius: approxRadius });
  const islandId = `${params.namePrefix}_${islands.length}`;
  railNodes.push({
    id: islandId,
    position: mesh.position.clone(),
    radius: approxRadius,
    mesh
  });
  rebuildRails();
  updateIslandCount();
  const lodInfo = adaptiveN !== params.n ? `, adaptiveN=${adaptiveN}` : "";
  setStatus(
    `${mesh.name} spawned (N=${params.n}${lodInfo}, seed=${params.seed}). Rails: ${railSegmentCount} segments.`
  );
}

window.__THREE_DRIVE__ = {
  getIslandCount: () => islands.length,
  getCameraDistance: () => camera.position.distanceTo(controls.target),
  getRailSegmentCount: () => railSegmentCount,
  isTrainLoaded: () => trainLoaded,
  getTrainPosition: () => ({
    x: trainRoot.position.x,
    y: trainRoot.position.y,
    z: trainRoot.position.z
  }),
  getTrainScale: () => trainScale
};

const RAIL_START_URL = new URL("../\u0420\u0415\u041b\u042c\u0421\u044b\u043a\u043e\u043d\u0435\u0447\u043d\u044b\u0435.glb", import.meta.url).href;
const RAIL_MAIN_URL = new URL("../\u0420\u0415\u041b\u042c\u0421\u044b\u043e\u0441\u043d\u043e\u0432\u043d\u044b\u0435.glb", import.meta.url).href;
const TRAIN_MODEL_URL = new URL("../train/source/train.glb", import.meta.url).href;

void loadRailPieces(RAIL_START_URL, RAIL_MAIN_URL)
  .then((pieces) => {
    railPieces = pieces;
    rebuildRails();
    setStatus("Rail kit loaded (start+main). Click canvas to spawn islands and auto-build rails.");
  })
  .catch((error) => {
    console.error("Failed to load rail kit", error);
    setStatus("Rail model failed to load. Islands still work, rails disabled.");
  });

void loadTrainModel(TRAIN_MODEL_URL)
  .then(({ object }) => {
    trainRoot.add(object);
    trainLoaded = true;
    trainMotion = createTrainMotion(trainRoot, buildTraversalPath(railEdgeSegments), {
      speed: 8,
      yOffset: 0.04
    });
  })
  .catch((error) => {
    console.error("Failed to load train model", error);
  });

renderer.domElement.addEventListener("pointerdown", () => {
  spawnIsland();
});

const clock = new THREE.Clock();

function renderFrame() {
  requestAnimationFrame(renderFrame);

  const dt = Math.min(clock.getDelta(), 1 / 30);
  controls.update();
  trainMotion?.update(dt);
  renderer.render(scene, camera);
}

updateIslandCount();
setStatus("Click empty canvas space to spawn a floating island.");
renderFrame();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});
