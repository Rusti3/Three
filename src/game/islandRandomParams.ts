export const RANDOM_PARAM_RANGES = {
  seed: { min: 1, max: 9_999_999 },
  n: { min: 64, max: 280, step: 8 },
  xyScale: { min: 18, max: 52, step: 0.1 },
  zScale: { min: 6, max: 16, step: 0.1 },
  mountainAmp: { min: 0.3, max: 0.9, step: 0.01 },
  cliffAmp: { min: 0.02, max: 0.18, step: 0.01 }
} as const;

type RandomizedParams = {
  seed: number;
  n: number;
  xyScale: number;
  zScale: number;
  mountainAmp: number;
  cliffAmp: number;
};

function randInRange(min: number, max: number, random: () => number) {
  return min + random() * (max - min);
}

function quantize(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function randomIslandParamsFromRanges(random: () => number = Math.random): RandomizedParams {
  const seed = Math.floor(randInRange(RANDOM_PARAM_RANGES.seed.min, RANDOM_PARAM_RANGES.seed.max + 1, random));
  const n = quantize(randInRange(RANDOM_PARAM_RANGES.n.min, RANDOM_PARAM_RANGES.n.max, random), RANDOM_PARAM_RANGES.n.step);
  const xyScale = quantize(
    randInRange(RANDOM_PARAM_RANGES.xyScale.min, RANDOM_PARAM_RANGES.xyScale.max, random),
    RANDOM_PARAM_RANGES.xyScale.step
  );
  const zScale = quantize(
    randInRange(RANDOM_PARAM_RANGES.zScale.min, RANDOM_PARAM_RANGES.zScale.max, random),
    RANDOM_PARAM_RANGES.zScale.step
  );
  const mountainAmp = quantize(
    randInRange(RANDOM_PARAM_RANGES.mountainAmp.min, RANDOM_PARAM_RANGES.mountainAmp.max, random),
    RANDOM_PARAM_RANGES.mountainAmp.step
  );
  const cliffAmp = quantize(
    randInRange(RANDOM_PARAM_RANGES.cliffAmp.min, RANDOM_PARAM_RANGES.cliffAmp.max, random),
    RANDOM_PARAM_RANGES.cliffAmp.step
  );

  return {
    seed,
    n: Math.max(RANDOM_PARAM_RANGES.n.min, Math.min(RANDOM_PARAM_RANGES.n.max, n)),
    xyScale: Number(xyScale.toFixed(1)),
    zScale: Number(zScale.toFixed(1)),
    mountainAmp: Number(mountainAmp.toFixed(2)),
    cliffAmp: Number(cliffAmp.toFixed(2))
  };
}
