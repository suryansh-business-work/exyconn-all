import { describe, expect, it } from 'vitest';
import { ForegroundUsage } from '../../src/foreground-usage';

/** A real clock reading: the class treats 0 as "never observed", as `Date.now()` never is. */
const T = 1_700_000_000_000;

describe('ForegroundUsage', () => {
  it('credits each gap to what was in front at the start of it', () => {
    const usage = new ForegroundUsage();
    usage.observe(T + 0, 'Chrome', 'Docs');
    usage.observe(T + 3000, 'Slack', 'General');
    usage.observe(T + 4000, 'Chrome', 'Docs');

    expect(usage.drain(T + 6000, true)).toEqual([
      { appName: 'Chrome', windowTitle: 'Docs', durationMs: 5000 },
      { appName: 'Slack', windowTitle: 'General', durationMs: 1000 },
    ]);
  });

  it('drops window titles when the workspace does not record them', () => {
    const usage = new ForegroundUsage();
    usage.observe(T + 0, 'Chrome', 'Private tab');
    expect(usage.drain(T + 1000, false)).toEqual([
      { appName: 'Chrome', windowTitle: '', durationMs: 1000 },
    ]);
  });

  it('starts the next interval from the drain, so no time is counted twice', () => {
    const usage = new ForegroundUsage();
    usage.observe(T + 0, 'Maps', '');
    usage.drain(T + 1000, true);
    expect(usage.drain(T + 2500, true)).toEqual([
      { appName: 'Maps', windowTitle: '', durationMs: 1500 },
    ]);
  });

  it('has nothing to report before the first observation', () => {
    expect(new ForegroundUsage().drain(T + 1000, true)).toEqual([]);
  });
});
