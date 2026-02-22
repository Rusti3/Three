import type { ControlsState } from "./controls";

export type Vector3Like = {
  x: number;
  y: number;
  z: number;
};

export type VehicleState = {
  position: Vector3Like;
  heading: number;
  speed: number;
};

export type VehicleParams = {
  maxSpeed: number;
  maxReverseSpeed: number;
  accel: number;
  reverseAccel: number;
  brakeDecel: number;
  drag: number;
  steerRate: number;
  minSteerSpeed: number;
};

export type VehicleController = {
  update: (dt: number, input: ControlsState) => VehicleState;
  reset: () => void;
  getState: () => VehicleState;
};

const DEFAULT_PARAMS: VehicleParams = {
  maxSpeed: 24,
  maxReverseSpeed: 9,
  accel: 18,
  reverseAccel: 10,
  brakeDecel: 26,
  drag: 5.2,
  steerRate: 1.8,
  minSteerSpeed: 0.25
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cloneState(state: VehicleState): VehicleState {
  return {
    position: { ...state.position },
    heading: state.heading,
    speed: state.speed
  };
}

export function createVehicle(initialState: VehicleState, overrides: Partial<VehicleParams> = {}): VehicleController {
  const params: VehicleParams = { ...DEFAULT_PARAMS, ...overrides };
  const initial = cloneState(initialState);
  let state = cloneState(initialState);

  const reset = () => {
    state = cloneState(initial);
  };

  const update = (dt: number, input: ControlsState) => {
    if (input.reset) {
      reset();
      return cloneState(state);
    }

    if (dt <= 0) {
      return cloneState(state);
    }

    if (input.brake && state.speed > 0) {
      state.speed -= params.brakeDecel * dt;
    } else if (input.throttle > 0) {
      state.speed += params.accel * input.throttle * dt;
    } else if (input.throttle < 0) {
      if (state.speed > 0) {
        state.speed -= params.brakeDecel * dt;
      } else {
        state.speed += params.reverseAccel * input.throttle * dt;
      }
    }

    if (state.speed > 0) {
      state.speed = Math.max(0, state.speed - params.drag * dt);
    } else if (state.speed < 0) {
      state.speed = Math.min(0, state.speed + params.drag * dt);
    }

    state.speed = clamp(state.speed, -params.maxReverseSpeed, params.maxSpeed);

    const absSpeed = Math.abs(state.speed);
    if (absSpeed > params.minSteerSpeed && input.steer !== 0) {
      const steerStrength = clamp(absSpeed / params.maxSpeed, 0.2, 1);
      state.heading += input.steer * params.steerRate * steerStrength * Math.sign(state.speed) * dt;
    }

    state.position.x += Math.sin(state.heading) * state.speed * dt;
    state.position.z += Math.cos(state.heading) * state.speed * dt;

    return cloneState(state);
  };

  const getState = () => cloneState(state);

  return {
    update,
    reset,
    getState
  };
}
