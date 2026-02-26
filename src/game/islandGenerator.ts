import {
  createRng,
  fbm,
  normalize,
  ridged,
  smoothMaskFromSdf,
  smoothUnionSdf,
  smoothstep
} from "./islandNoise";
import type { GeneratedIslandData, IslandParams } from "./islandTypes";

function idx(i: number, j: number, n: number) {
  return i * n + j;
}

function pickCenter(rng: () => number) {
  for (let i = 0; i < 300; i += 1) {
    const cx = -0.55 + rng() * 1.3;
    const cy = -0.55 + rng() * 1.3;
    if (cx * cx + cy * cy < 0.72 ** 2) {
      return { cx, cy };
    }
  }
  return { cx: 0.35, cy: 0.35 };
}

export type { IslandParams } from "./islandTypes";

export function createIslandData(params: IslandParams): GeneratedIslandData {
  const n = Math.max(32, Math.floor(params.n));
  const seed = params.seed | 0;
  const rng = createRng(seed);

  const x = new Float32Array(n * n);
  const y = new Float32Array(n * n);
  const r = new Float32Array(n * n);

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const k = idx(i, j, n);
      const xx = (j / (n - 1)) * 2 - 1;
      const yy = (i / (n - 1)) * 2 - 1;
      x[k] = xx;
      y[k] = yy;
      r[k] = Math.hypot(xx, yy);
    }
  }

  const mainRadius = 0.95;
  const sdfMain = new Float32Array(n * n);
  for (let i = 0; i < sdfMain.length; i += 1) {
    sdfMain[i] = r[i] - mainRadius;
  }
  const mainMask = smoothMaskFromSdf(sdfMain, 0.06);
  const mainFalloff = new Float32Array(n * n);
  for (let i = 0; i < mainFalloff.length; i += 1) {
    mainFalloff[i] = Math.max(0, Math.min(1, 1 - (r[i] / mainRadius) ** 2.6));
  }

  const smallHills = normalize(fbm(n, [9, 9], 4, 2, 0.5, seed + 1));
  const hMain = new Float32Array(n * n);
  for (let i = 0; i < hMain.length; i += 1) {
    hMain[i] = mainMask[i] * mainFalloff[i] * (0.12 + 0.12 * smallHills[i]);
  }

  const center = pickCenter(rng);
  const theta = rng() * Math.PI * 2;
  const ux = Math.cos(theta);
  const uy = Math.sin(theta);
  const vx = -uy;
  const vy = ux;
  const nLobes = 3 + Math.floor(rng() * 4);
  const spacing = 0.12 + rng() * 0.06;
  const blobR = mainRadius * 0.32;
  const offset0 = -0.5 * (nLobes - 1) * spacing;

  const warpA = normalize(fbm(n, [3, 3], 5, 2, 0.55, seed + 100));
  const warpB = normalize(fbm(n, [4, 4], 4, 2, 0.55, seed + 101));
  const xw = new Float32Array(n * n);
  const yw = new Float32Array(n * n);
  for (let i = 0; i < x.length; i += 1) {
    xw[i] = x[i] + (warpA[i] * 2 - 1) * 0.12;
    yw[i] = y[i] + (warpB[i] * 2 - 1) * 0.12;
  }

  const centers: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < nLobes; i += 1) {
    const along = offset0 + i * spacing;
    const side = -0.08 + rng() * 0.16;
    centers.push({
      x: center.cx + along * ux + side * vx,
      y: center.cy + along * uy + side * vy
    });
  }

  const sdfs: Float32Array[] = [];
  for (const c of centers) {
    const s = new Float32Array(n * n);
    const rad = blobR * (0.85 + rng() * 0.25);
    for (let i = 0; i < s.length; i += 1) {
      s[i] = Math.hypot(xw[i] - c.x, yw[i] - c.y) - rad;
    }
    sdfs.push(s);
  }
  const sdfZone = smoothUnionSdf(sdfs, 0.2);
  const boundary = normalize(fbm(n, [2, 2], 6, 2, 0.55, seed + 102));
  for (let i = 0; i < sdfZone.length; i += 1) {
    sdfZone[i] += 0.2 * (boundary[i] * 2 - 1);
  }

  const zoneMaskRaw = smoothMaskFromSdf(sdfZone, 0.06);
  const zoneMask = new Float32Array(n * n);
  const zoneTaper = new Float32Array(n * n);
  for (let i = 0; i < zoneMask.length; i += 1) {
    zoneMask[i] = zoneMaskRaw[i] * mainMask[i];
    const zoneCore = Math.max(0, Math.min(1, -sdfZone[i] / (blobR * 1.25)));
    const zoneFalloff = smoothstep(zoneCore);
    const edgeTaper = smoothstep(Math.max(0, Math.min(1, (mainMask[i] - 0.15) / 0.35)));
    zoneTaper[i] = zoneFalloff * edgeTaper;
  }

  const ridge1 = ridged(n, [3, 3], 6, 2.25, 0.55, seed + 10);
  const ridge2 = ridged(n, [7, 7], 5, 2.1, 0.55, seed + 11);
  const ridge = new Float32Array(n * n);
  for (let i = 0; i < ridge.length; i += 1) {
    ridge[i] = Math.max(0, Math.min(1, 0.7 * ridge1[i] + 0.45 * ridge2[i] ** 1.15));
  }

  const peaks = new Float32Array(n * n);
  for (const c of centers) {
    const pr = 0.14 + rng() * 0.08;
    const amp = 0.45 + rng() * 0.3;
    for (let i = 0; i < peaks.length; i += 1) {
      const d = Math.hypot(x[i] - c.x, y[i] - c.y);
      peaks[i] += amp * Math.exp(-((d / pr) ** 2));
    }
  }
  const peaksN = normalize(peaks);

  const volcano = new Float32Array(n * n);
  if (rng() < 0.5) {
    const c = centers[Math.floor(rng() * centers.length)];
    for (let i = 0; i < volcano.length; i += 1) {
      const dx = (x[i] - c.x) / 0.18;
      const dy = (y[i] - c.y) / 0.18;
      const rv = Math.hypot(dx, dy);
      const crater = Math.exp(-((rv / 0.95) ** 2));
      const hole = Math.exp(-((rv / 0.36) ** 2));
      volcano[i] = 0.45 * crater - 0.7 * hole;
    }
  }

  const hZoneBase = new Float32Array(n * n);
  for (let i = 0; i < hZoneBase.length; i += 1) {
    hZoneBase[i] =
      zoneMask[i] *
      zoneTaper[i] *
      mainFalloff[i] *
      params.mountainAmp *
      (0.55 * ridge[i] ** 1.25 + 0.65 * peaksN[i] ** 1.05 + 0.35 * volcano[i]);
  }

  const gx = new Float32Array(n * n);
  const gy = new Float32Array(n * n);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const k = idx(i, j, n);
      const left = hZoneBase[idx(i, Math.max(0, j - 1), n)];
      const right = hZoneBase[idx(i, Math.min(n - 1, j + 1), n)];
      const down = hZoneBase[idx(Math.max(0, i - 1), j, n)];
      const up = hZoneBase[idx(Math.min(n - 1, i + 1), j, n)];
      gx[k] = (right - left) * 0.5;
      gy[k] = (up - down) * 0.5;
    }
  }
  const slope = new Float32Array(n * n);
  const valid: number[] = [];
  for (let i = 0; i < slope.length; i += 1) {
    slope[i] = Math.hypot(gx[i], gy[i]);
    if (zoneMask[i] > 0.25) {
      valid.push(slope[i]);
    }
  }
  valid.sort((a, b) => a - b);
  const q = (p: number) => valid[Math.floor((valid.length - 1) * p)] ?? 0;
  const sLo = valid.length > 100 ? q(0.4) : 0;
  const sHi = valid.length > 100 ? q(0.92) : Math.max(...slope, 1e-6);
  const slopeN = new Float32Array(n * n);
  for (let i = 0; i < slopeN.length; i += 1) {
    slopeN[i] = Math.max(0, Math.min(1, (slope[i] - sLo) / (sHi - sLo + 1e-6)));
  }

  const rock1 = normalize(fbm(n, [28, 28], 4, 2, 0.5, seed + 200));
  const rock2 = normalize(fbm(n, [44, 44], 3, 2, 0.5, seed + 201));
  const hZone = new Float32Array(n * n);
  for (let i = 0; i < hZone.length; i += 1) {
    const rock = 0.6 * (rock1[i] * 2 - 1) + 0.4 * (rock2[i] * 2 - 1);
    const cliffs = params.cliffAmp * rock * (0.25 + 0.75 * slopeN[i]) * zoneMask[i] * zoneTaper[i];
    hZone[i] = Math.max(0, hZoneBase[i] + cliffs);
  }

  const hTopRaw = new Float32Array(n * n);
  for (let i = 0; i < hTopRaw.length; i += 1) {
    hTopRaw[i] = (hMain[i] + hZone[i]) * mainMask[i];
  }
  const hTop = normalize(hTopRaw);

  const undersideNoise = ridged(n, [4, 4], 5, 2, 0.55, seed + 20);
  const hBottom = new Float32Array(n * n);
  const oceanMask = new Uint8Array(n * n);
  for (let i = 0; i < hBottom.length; i += 1) {
    hBottom[i] = -(
      0.78 * mainFalloff[i] ** 1.9 + 0.38 * undersideNoise[i] * mainMask[i] ** 0.7
    ) * (mainMask[i] > 0.05 ? 1 : 0);
    oceanMask[i] = mainMask[i] < 0.08 ? 1 : 0;
  }

  return {
    n,
    x,
    y,
    top: hTop,
    bottom: hBottom,
    oceanMask,
    xyScale: params.xyScale,
    zScale: params.zScale
  };
}
