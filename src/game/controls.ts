export type ControlsState = {
  throttle: number;
  steer: number;
  brake: boolean;
  reset: boolean;
};

const FORWARD_KEYS = new Set(["w", "arrowup"]);
const BACKWARD_KEYS = new Set(["s", "arrowdown"]);
const LEFT_KEYS = new Set(["a", "arrowleft"]);
const RIGHT_KEYS = new Set(["d", "arrowright"]);

function normalizeKey(key: string) {
  return key.toLowerCase();
}

export function createKeyboardControls(target: Window): ControlsState {
  const pressedKeys = new Set<string>();
  const state: ControlsState = {
    throttle: 0,
    steer: 0,
    brake: false,
    reset: false
  };

  const syncState = () => {
    const forwardPressed = [...FORWARD_KEYS].some((key) => pressedKeys.has(key));
    const backwardPressed = [...BACKWARD_KEYS].some((key) => pressedKeys.has(key));
    const leftPressed = [...LEFT_KEYS].some((key) => pressedKeys.has(key));
    const rightPressed = [...RIGHT_KEYS].some((key) => pressedKeys.has(key));

    state.throttle = forwardPressed === backwardPressed ? 0 : forwardPressed ? 1 : -1;
    state.steer = leftPressed === rightPressed ? 0 : leftPressed ? 1 : -1;
    state.brake = backwardPressed || pressedKeys.has(" ");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = normalizeKey(event.key);
    pressedKeys.add(key);

    if (key === "r") {
      state.reset = true;
    }

    syncState();
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const key = normalizeKey(event.key);
    pressedKeys.delete(key);

    if (key === "r") {
      state.reset = false;
    }

    syncState();
  };

  target.addEventListener("keydown", handleKeyDown);
  target.addEventListener("keyup", handleKeyUp);

  return state;
}
