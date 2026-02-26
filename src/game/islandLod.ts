function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function quantize8(value: number) {
  return Math.round(value / 8) * 8;
}

export function chooseAdaptiveResolution(baseN: number, islandCount: number) {
  const safeBase = clamp(Math.floor(baseN), 64, 280);

  let factor = 1;
  if (islandCount >= 24) {
    factor = 0.55;
  } else if (islandCount >= 16) {
    factor = 0.7;
  } else if (islandCount >= 8) {
    factor = 0.85;
  }

  const adapted = quantize8(safeBase * factor);
  return clamp(adapted, 64, safeBase);
}
