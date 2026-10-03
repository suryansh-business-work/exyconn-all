// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UpdateState } from '@shared/types';
import UpdateBanner from './UpdateBanner';
import {
  button,
  click,
  deferred,
  flush,
  render,
  stubTracker,
  unmountAll,
} from '../a11y/component-harness';

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

function state(stage: UpdateState['stage'], version = '9.9.9'): UpdateState {
  return { stage, version, percent: 40, lastCheckedAt: null };
}

describe('UpdateBanner', () => {
  it.each([
    ['available', 'Update'],
    ['failed', 'Retry'],
  ] as const)('spins on %s’s button until the download is asked for', async (stage, label) => {
    const asked = deferred<undefined>();
    stubTracker({ downloadUpdate: () => asked.promise });
    await render(<UpdateBanner update={state(stage)} />);
    await click(button(label));
    expect(button(label).className).toContain('MuiButton-loading');
    asked.resolve(undefined);
    await flush();
    expect(button(label).className).not.toContain('MuiButton-loading');
  });

  it('logs a download that could not be asked for and offers the button again', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubTracker({ downloadUpdate: () => Promise.reject(new Error('gone')) });
    await render(<UpdateBanner update={state('available')} />);
    await click(button('Update'));
    expect(log).toHaveBeenCalled();
    expect(button('Update').disabled).toBe(false);
  });

  it('draws the download’s progress', async () => {
    await render(<UpdateBanner update={state('downloading')} />);
    expect(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe(
      '40',
    );
  });

  it('spins on Restart, and lets it be pressed again if the restart fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const install = deferred<undefined>();
    stubTracker({ installUpdate: () => install.promise });
    await render(<UpdateBanner update={state('ready')} />);
    await click(button('Restart'));
    expect(button('Restart').className).toContain('MuiButton-loading');
    install.reject(new Error('locked'));
    await flush();
    expect(button('Restart').className).not.toContain('MuiButton-loading');
  });

  it('says nothing while idle, or after a failed check that found no version', async () => {
    await render(<UpdateBanner update={state('failed', '')} />);
    expect(document.body.textContent).toBe('');
  });
});
