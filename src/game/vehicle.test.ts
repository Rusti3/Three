import { describe, expect, it } from "vitest";

import { createVehicle, type VehicleState } from "./vehicle";
import type { ControlsState } from "./controls";

const ZERO_INPUT: ControlsState = {
  throttle: 0,
  steer: 0,
  brake: false,
  reset: false
};

const INITIAL_STATE: VehicleState = {
  position: { x: 0, y: 0, z: 0 },
  heading: 0,
  speed: 0
};

function updateFor(vehicle: ReturnType<typeof createVehicle>, seconds: number, input: ControlsState) {
  const dt = 1 / 60;
  const steps = Math.ceil(seconds / dt);
  for (let i = 0; i < steps; i += 1) {
    vehicle.update(dt, input);
  }
}

describe("vehicle dynamics", () => {
  it("accelerates when throttle is pressed", () => {
    const vehicle = createVehicle(INITIAL_STATE);
    updateFor(vehicle, 1.0, { ...ZERO_INPUT, throttle: 1 });

    const state = vehicle.getState();
    expect(state.speed).toBeGreaterThan(0);
    expect(state.position.z).toBeGreaterThan(0);
  });

  it("slows down from drag when there is no input", () => {
    const vehicle = createVehicle(INITIAL_STATE);
    updateFor(vehicle, 1.0, { ...ZERO_INPUT, throttle: 1 });
    const movingSpeed = vehicle.getState().speed;

    updateFor(vehicle, 1.0, ZERO_INPUT);
    const slowedSpeed = vehicle.getState().speed;
    expect(slowedSpeed).toBeLessThan(movingSpeed);
  });

  it("changes heading only when speed is above minimum steering speed", () => {
    const stoppedVehicle = createVehicle(INITIAL_STATE);
    stoppedVehicle.update(1 / 60, { ...ZERO_INPUT, steer: 1 });
    expect(stoppedVehicle.getState().heading).toBeCloseTo(0, 6);

    const movingVehicle = createVehicle(INITIAL_STATE);
    updateFor(movingVehicle, 0.8, { ...ZERO_INPUT, throttle: 1 });
    const headingBefore = movingVehicle.getState().heading;
    updateFor(movingVehicle, 0.4, { ...ZERO_INPUT, steer: 1 });
    expect(Math.abs(movingVehicle.getState().heading - headingBefore)).toBeGreaterThan(0);
  });

  it("brakes faster than passive drag", () => {
    const withBrake = createVehicle(INITIAL_STATE);
    const withDragOnly = createVehicle(INITIAL_STATE);
    updateFor(withBrake, 1.2, { ...ZERO_INPUT, throttle: 1 });
    updateFor(withDragOnly, 1.2, { ...ZERO_INPUT, throttle: 1 });
    const speedBeforeBrake = withBrake.getState().speed;

    updateFor(withBrake, 0.4, { ...ZERO_INPUT, brake: true });
    updateFor(withDragOnly, 0.4, ZERO_INPUT);

    const brakeDelta = speedBeforeBrake - withBrake.getState().speed;
    const dragDelta = speedBeforeBrake - withDragOnly.getState().speed;
    expect(brakeDelta).toBeGreaterThan(dragDelta);
  });

  it("resets to initial state", () => {
    const vehicle = createVehicle(INITIAL_STATE);
    updateFor(vehicle, 1.0, { ...ZERO_INPUT, throttle: 1, steer: 1 });
    vehicle.update(1 / 60, { ...ZERO_INPUT, reset: true });

    expect(vehicle.getState()).toEqual(INITIAL_STATE);
  });
});
