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

Possible optimization idea:
- Add adaptive resolution policy (reduce `N` automatically when island count grows) to stabilize FPS at high counts.
