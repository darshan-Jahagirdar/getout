export const enum Action {
  Left,
  Right,
  Up,
  Down,
  RollLeft,
  RollRight,
  Interact,
  Count,
}

const KEY_TO_ACTION: Readonly<Record<string, Action>> = {
  KeyA: Action.Left,
  ArrowLeft: Action.Left,
  KeyD: Action.Right,
  ArrowRight: Action.Right,
  KeyW: Action.Up,
  ArrowUp: Action.Up,
  KeyS: Action.Down,
  ArrowDown: Action.Down,
  KeyQ: Action.RollLeft,
  KeyE: Action.RollRight,
  Space: Action.Interact,
};

export class InputSystem {
  private readonly down = new Uint8Array(Action.Count);
  private readonly pressed = new Uint8Array(Action.Count);
  private readonly virtual = new Uint8Array(Action.Count);
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const action = KEY_TO_ACTION[event.code];
    if (action === undefined) return;
    if (this.down[action] === 0) this.pressed[action] = 1;
    this.down[action] = 1;
    event.preventDefault();
  };
  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const action = KEY_TO_ACTION[event.code];
    if (action === undefined) return;
    this.down[action] = 0;
    event.preventDefault();
  };
  private readonly onBlur = (): void => {
    this.down.fill(0);
    this.pressed.fill(0);
  };

  public constructor() {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp, { passive: false });
    window.addEventListener('blur', this.onBlur);
  }

  public isDown(action: Action): boolean {
    return this.down[action] === 1 || this.virtual[action] === 1;
  }

  public setVirtual(action: Action, active: boolean): void {
    this.virtual[action] = active ? 1 : 0;
  }

  public wasPressed(action: Action): boolean {
    return this.pressed[action] === 1;
  }

  public endFixedStep(): void {
    this.pressed.fill(0);
  }

  public dispose(): void {
    this.virtual.fill(0);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
