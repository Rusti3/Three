export type Vector3Like = {
  x: number;
  y: number;
  z: number;
};

export type TrainState = {
  position: Vector3Like;
  speed: number;
  loopCount: number;
  heading: number;
};

export type TrainMotionConfig = {
  startZ: number;
  endZ: number;
  speed: number;
  x?: number;
  y?: number;
  heading?: number;
};

export type TrainMotionController = {
  update: (dt: number) => TrainState;
  getState: () => TrainState;
  setBounds: (startZ: number, endZ: number) => void;
  setBasePosition: (x: number, y: number) => void;
};

function normalizeBounds(startZ: number, endZ: number) {
  if (!Number.isFinite(startZ) || !Number.isFinite(endZ) || endZ <= startZ) {
    return { startZ: -50, endZ: 50 };
  }

  return { startZ, endZ };
}

function cloneState(state: TrainState): TrainState {
  return {
    position: { ...state.position },
    speed: state.speed,
    loopCount: state.loopCount,
    heading: state.heading
  };
}

export function createTrainMotion(config: TrainMotionConfig): TrainMotionController {
  let bounds = normalizeBounds(config.startZ, config.endZ);
  const state: TrainState = {
    position: {
      x: config.x ?? 0,
      y: config.y ?? 0,
      z: bounds.startZ
    },
    speed: config.speed,
    loopCount: 0,
    heading: config.heading ?? 0
  };

  const update = (dt: number) => {
    if (dt <= 0) {
      return cloneState(state);
    }

    state.position.z += state.speed * dt;
    const distance = bounds.endZ - bounds.startZ;

    if (distance > 0 && state.position.z > bounds.endZ) {
      const passed = state.position.z - bounds.endZ;
      const loops = Math.floor(passed / distance) + 1;
      state.position.z = bounds.startZ + (passed % distance);
      state.loopCount += loops;
    }

    return cloneState(state);
  };

  const setBounds = (startZ: number, endZ: number) => {
    bounds = normalizeBounds(startZ, endZ);
    if (state.position.z < bounds.startZ || state.position.z > bounds.endZ) {
      state.position.z = bounds.startZ;
    }
  };

  const setBasePosition = (x: number, y: number) => {
    state.position.x = x;
    state.position.y = y;
  };

  const getState = () => cloneState(state);

  return {
    update,
    getState,
    setBounds,
    setBasePosition
  };
}
