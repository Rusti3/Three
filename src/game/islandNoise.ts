type Rng = () => number;

export function createRng(seed: number): Rng {
  let state = (seed >>> 0) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

export function normalize(values: Float32Array) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of values) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  const span = Math.max(1e-6, max - min);
  const out = new Float32Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    out[i] = (values[i] - min) / span;
  }
  return out;
}

export function valueNoise2d(n: number, gy: number, gx: number, rng: Rng) {
  const latticeW = gx + 1;
  const lattice = new Float32Array((gy + 1) * latticeW);
  for (let i = 0; i < lattice.length; i += 1) {
    lattice[i] = rng();
  }

  const yi = new Uint16Array(n);
  const yf = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const y = (i / n) * gy;
    const yCell = Math.floor(y);
    yi[i] = yCell;
    yf[i] = y - yCell;
  }

  const xi = new Uint16Array(n);
  const xf = new Float32Array(n);
  for (let j = 0; j < n; j += 1) {
    const x = (j / n) * gx;
    const xCell = Math.floor(x);
    xi[j] = xCell;
    xf[j] = x - xCell;
  }

  const out = new Float32Array(n * n);
  for (let i = 0; i < n; i += 1) {
    const yCell = yi[i];
    const sy = smoothstep(yf[i]);
    for (let j = 0; j < n; j += 1) {
      const xCell = xi[j];
      const sx = smoothstep(xf[j]);

      const v00 = lattice[yCell * latticeW + xCell];
      const v10 = lattice[(yCell + 1) * latticeW + xCell];
      const v01 = lattice[yCell * latticeW + (xCell + 1)];
      const v11 = lattice[(yCell + 1) * latticeW + (xCell + 1)];

      const vx0 = v00 * (1 - sx) + v01 * sx;
      const vx1 = v10 * (1 - sx) + v11 * sx;
      out[i * n + j] = vx0 * (1 - sy) + vx1 * sy;
    }
  }
  return out;
}

export function fbm(
  n: number,
  baseGrid: [number, number],
  octaves: number,
  lacunarity: number,
  gain: number,
  seed: number
) {
  const rng = createRng(seed);
  const total = new Float32Array(n * n);
  let amp = 1;
  let freq = 1;
  let ampSum = 0;

  for (let o = 0; o < octaves; o += 1) {
    const gy = Math.max(1, Math.floor(baseGrid[0] * freq));
    const gx = Math.max(1, Math.floor(baseGrid[1] * freq));
    const noise = valueNoise2d(n, gy, gx, rng);
    for (let i = 0; i < total.length; i += 1) {
      total[i] += noise[i] * amp;
    }
    ampSum += amp;
    amp *= gain;
    freq *= lacunarity;
  }

  const inv = 1 / Math.max(1e-6, ampSum);
  for (let i = 0; i < total.length; i += 1) {
    total[i] *= inv;
  }
  return total;
}

export function ridged(
  n: number,
  baseGrid: [number, number],
  octaves: number,
  lacunarity: number,
  gain: number,
  seed: number
) {
  const f = fbm(n, baseGrid, octaves, lacunarity, gain, seed);
  const out = new Float32Array(f.length);
  for (let i = 0; i < f.length; i += 1) {
    const r = 1 - Math.abs(2 * f[i] - 1);
    out[i] = Math.max(0, Math.min(1, r ** 1.7));
  }
  return out;
}

export function smoothMaskFromSdf(sdf: Float32Array, edge: number) {
  const out = new Float32Array(sdf.length);
  for (let i = 0; i < sdf.length; i += 1) {
    const t = Math.max(0, Math.min(1, (-sdf[i] + edge) / (2 * edge)));
    out[i] = smoothstep(t);
  }
  return out;
}

export function smoothUnionSdf(sdfs: Float32Array[], k: number) {
  const out = sdfs[0].slice();
  for (let s = 1; s < sdfs.length; s += 1) {
    const b = sdfs[s];
    for (let i = 0; i < out.length; i += 1) {
      const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b[i] - out[i])) / k));
      out[i] = b[i] * (1 - h) + out[i] * h - k * h * (1 - h);
    }
  }
  return out;
}
