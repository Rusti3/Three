# Floating Islands (Three.js)

Interactive Three.js scene where floating islands are generated procedurally.

## Run

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test:unit
npm run test:e2e
```

## Controls

- Click canvas: spawn a new floating island in a random free position.
- Mouse drag: orbit camera.
- Mouse wheel: zoom in/out.
- Right mouse drag: pan camera.
- On each click, all island generation parameters are randomized in safe ranges.

## Parameters Per Island

The right panel values are applied to the **next spawned island**:

- `SEED`
- `N`
- `XY_SCALE`
- `Z_SCALE`
- `MOUNTAIN_AMP`
- `CLIFF_AMP`

Default values:

- `SEED = 4121132`
- `N = 160`
- `XY_SCALE = 32.0`
- `Z_SCALE = 10.0`
- `MOUNTAIN_AMP = 0.58`
- `CLIFF_AMP = 0.07`

## Version Summary

### v0.4.2 (2026-02-26)

What was done:
- Updated rail placement to account for actual island surface heights at rail connection points.
- Added vertical raycast sampling on island meshes for both ends of each rail edge.
- Changed rail builder from flat average-Y placement to slope-aware placement along the full edge.
- Added unit test to verify start/end rail pieces follow different heights when islands are at different elevations.

Why these functions were added:
- To ensure rails visually sit on island surfaces and preserve height differences between islands.

What changed for the user:
- Rail lines no longer float at one averaged altitude.
- Each connection now starts at the first island surface height and ends at the second island surface height.

### v0.4.3 (2026-02-26)

What was done:
- Added rail piece tilt based on start/end height difference, not only per-piece Y offset.
- Switched segment orientation to full 3D direction alignment (yaw + pitch).
- Adjusted XZ spacing by slope factor so section joints stay coherent on inclined lines.
- Extended railBuilder unit test to assert non-zero pitch when endpoints have different heights.

Why these functions were added:
- To remove visible “stair-step” artifacts and make each rail edge behave as a continuous inclined line.

What changed for the user:
- Rails now visually incline between islands with a single controlled angle.
- Connections look smoother and less segmented on vertical differences.

### v0.4.1 (2026-02-26)

What was done:
- Swapped the rail kit to `РЕЛЬСыконечные.glb` for start/end anchors and `РЕЛЬСЫосновные.glb` for the path.
- Each MST edge now begins with the anchor piece, fills the gap with repeated path pieces, and ends with the anchor again.
- Cloned every segment so the straight-line layout stays consistent regardless of island positions.
- Updated the rail modules/tests to reflect the new asset arrangement and loading path.

Why these functions were added:
- To meet the new requirement: anchor the line on each island with the special model, use the path model for the middle of the run, and finish with the anchor.

What changed for the user:
- Rails now reuse two glTF models: one for start/end anchors and one for the connecting track.
- Every time a new island appears, the MST rebuild keeps the anchor -> path -> anchor pattern on each rail.
- The debug API/e2e tests still report how many segments are present so you can confirm rails stay healthy.

### v0.4.0 (2026-02-26)

What was done:
- Added automatic rail generation between islands.
- Implemented MST topology so all islands become connected with minimal number of links.
- Added full rail network rebuild after each new island spawn.
- Added rail modules and tests (`railGraph`, `railBuilder`, `railKit`).
- Extended debug API and e2e smoke to verify rail segments appear after the second island.

Why these functions were added:
- To automatically connect generated islands into one navigable rail network.

What changed for the user:
- After islands spawn, rails now appear automatically between them.
- Rail lines are rebuilt dynamically when new islands are added.

### v0.3.3 (2026-02-26)

What was done:
- Added automatic randomization of all generation parameters on every canvas click.
- UI fields are now updated per click before spawning each island.
- Added unit tests for random parameter range correctness.

Why these functions were added:
- To guarantee each new island has a fresh configuration automatically.
- To keep randomness within practical limits and avoid extreme unstable values.

What changed for the user:
- You no longer need to edit fields manually for variation; each click randomizes all params and spawns a new island.

### v0.3.2 (2026-02-26)

What was done:
- Fixed island top rendering artifacts by forcing opaque double-sided island material.

Why these functions were added:
- To prevent the upper island surface from looking semi-transparent due to face culling artifacts.

What changed for the user:
- Top side of islands now renders visually solid.

### v0.3.1 (2026-02-26)

What was done:
- Added adaptive LOD for island mesh resolution.
- `N` now auto-reduces for newly spawned islands when island count grows.
- Added unit tests for adaptive resolution policy.

Why these functions were added:
- To keep FPS more stable when many islands are present.
- To preserve high detail for early islands while gradually reducing cost at scale.

What changed for the user:
- You still set `N` in UI, but at high island counts the actual resolution for new islands may be lower.
- Spawn status now shows `adaptiveN` when automatic reduction is applied.

### v0.3.0 (2026-02-26)

What was done:
- Removed the old train/rail runtime and related modules/tests.
- Rebuilt the app as an empty-space floating-islands scene.
- Added procedural island generation (main mask + mountain system + warp + cliffs + underside).
- Added click-to-spawn logic with non-overlapping placement.
- Added per-island parameter controls for `SEED`, `N`, `XY_SCALE`, `Z_SCALE`, `MOUNTAIN_AMP`, `CLIFF_AMP`.
- Added `OrbitControls` camera with mouse zoom.
- Replaced tests with island-focused unit tests and updated e2e smoke.

Why these functions were added:
- To generate distinct, controllable procedural islands directly in browser runtime.
- To prevent island intersections while allowing unlimited spawning until space is exhausted.
- To let users tune terrain behavior per island without rebuilding code.

What changed for the user:
- No train/rail scene anymore.
- Clicking the scene now creates floating islands.
- Camera can orbit/pan/zoom with mouse.
- Terrain parameters can be changed before each new island spawn.
