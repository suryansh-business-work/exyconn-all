import { uIOhook } from 'uiohook-napi';

/**
 * Counts global key presses and mouse clicks — COUNTS ONLY.
 *
 * The uiohook events carry a keycode, but this class never reads it: the listeners take no
 * argument and simply increment a counter. That is the whole point — the app measures how
 * much the employee is typing, never what. Do not change these handlers to inspect the
 * event. (See the privacy contract in the portal's tracker.constants.ts.)
 */
export class InputCounter {
  private keys = 0;
  private clicks = 0;
  private running = false;

  start(): void {
    if (this.running) {
      return;
    }
    // Deliberately no event parameter: the keycode is never observed.
    uIOhook.on('keydown', this.onKey);
    uIOhook.on('mousedown', this.onClick);
    uIOhook.start();
    this.running = true;
  }

  stop(): void {
    if (!this.running) {
      return;
    }
    uIOhook.off('keydown', this.onKey);
    uIOhook.off('mousedown', this.onClick);
    uIOhook.stop();
    this.running = false;
  }

  private readonly onKey = (): void => {
    this.keys += 1;
  };

  private readonly onClick = (): void => {
    this.clicks += 1;
  };

  /** Current counts since the last {@link drain}. */
  peek(): { keys: number; clicks: number } {
    return { keys: this.keys, clicks: this.clicks };
  }

  /** Returns the accumulated counts and resets them to zero. */
  drain(): { keys: number; clicks: number } {
    const result = { keys: this.keys, clicks: this.clicks };
    this.keys = 0;
    this.clicks = 0;
    return result;
  }
}
