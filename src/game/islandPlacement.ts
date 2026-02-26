import type { PlacedIsland } from "./islandTypes";

export function findSpawnPosition(
  existing: PlacedIsland[],
  candidateRadius: number,
  worldRadius: number,
  padding: number,
  maxAttempts: number,
  random: () => number = Math.random
) {
  const minR = candidateRadius;
  const maxR = Math.max(minR, worldRadius - candidateRadius - padding);

  for (let i = 0; i < maxAttempts; i += 1) {
    const angle = random() * Math.PI * 2;
    const radial = minR + Math.sqrt(random()) * Math.max(0, maxR - minR);
    const x = Math.cos(angle) * radial;
    const z = Math.sin(angle) * radial;

    let overlaps = false;
    for (const island of existing) {
      const d = Math.hypot(x - island.x, z - island.z);
      if (d <= island.radius + candidateRadius + padding) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) {
      return { x, z };
    }
  }

  return null;
}
